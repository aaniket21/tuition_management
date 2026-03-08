const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

// Create Student and Parent
const createStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            first_name, last_name, phone, dob, gender, address, email, admission_date, class_name, // Student details
            parent_first_name, parent_last_name, parent_phone, // Parent details
        } = req.body;

        if (!first_name || !last_name || !parent_first_name || !parent_last_name || !parent_phone) {
            return res.status(400).json({ message: 'Missing required fields for student or parent.' });
        }

        await client.query('BEGIN');

        // --- Auto-generate student_code ---
        const currentYear = new Date().getFullYear().toString().slice(-2); // e.g., '26'
        const prefix = currentYear;

        // Find the latest student code for this year
        const codeQuery = await client.query(
            `SELECT student_code FROM students WHERE student_code LIKE $1 ORDER BY student_code DESC LIMIT 1`,
            [`${prefix}%`]
        );

        let sequence = 1;
        if (codeQuery.rowCount > 0) {
            const lastCode = codeQuery.rows[0].student_code;
            // Extract the sequence part (e.g., '2601' -> '01' -> 1 -> +1 -> 2)
            const lastSequence = parseInt(lastCode.substring(2), 10);
            if (!isNaN(lastSequence)) {
                sequence = lastSequence + 1;
            }
        }

        // Format sequence to be at least 2 digits (e.g., '01', '02', '10')
        const paddedSequence = sequence.toString().padStart(2, '0');
        const student_code = `${prefix}${paddedSequence}`;
        // ----------------------------------

        // 1. Create Parent User (Username: p{student_code}, Password: parent_phone)
        const parentUsername = `p${student_code}`;
        const parentPasswordHash = await bcrypt.hash(parent_phone, 10);

        const parentUserRes = await client.query(
            `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'PARENT') RETURNING id`,
            [parentUsername, parentPasswordHash]
        );
        const parentUserId = parentUserRes.rows[0].id;

        // 2. Create Parent Record
        const parentRes = await client.query(
            `INSERT INTO parents (user_id, first_name, last_name, phone) VALUES ($1, $2, $3, $4) RETURNING id`,
            [parentUserId, parent_first_name, parent_last_name, parent_phone]
        );
        const parentId = parentRes.rows[0].id;

        // 3. Create Student User (Username: {student_code}, Password: default)
        const stuPassword = 'student123';
        const stuPasswordHash = await bcrypt.hash(stuPassword, 10);

        const studentUserRes = await client.query(
            `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'STUDENT') RETURNING id`,
            [student_code, stuPasswordHash]
        );
        const studentUserId = studentUserRes.rows[0].id;

        // 4. Create Student Record
        const studentRes = await client.query(
            `INSERT INTO students (user_id, parent_id, student_code, first_name, last_name, phone, dob, gender, address, email, admission_date, class_name) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [studentUserId, parentId, student_code, first_name, last_name, phone || null, dob || null, gender || null, address || null, email || null, admission_date || null, class_name || null]
        );
        const newStudentId = studentRes.rows[0].id;

        // 5. Link Enrollment and Auto-generate Fees
        if (class_name) {
            const classRes = await client.query('SELECT id FROM classes WHERE class_name = $1 LIMIT 1', [class_name]);
            if (classRes.rows.length > 0) {
                const class_id = classRes.rows[0].id;

                await client.query('INSERT INTO enrollments (class_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [class_id, newStudentId]);

                let fs_id = null;
                let amt = 0;
                const fsResult = await client.query(`SELECT id, monthly_fee FROM fee_structures WHERE class_id = $1 LIMIT 1`, [class_id]);
                if (fsResult.rows.length > 0) {
                    fs_id = fsResult.rows[0].id;
                    amt = fsResult.rows[0].monthly_fee;
                } else {
                    const cData = await client.query('SELECT monthly_fee FROM classes WHERE id = $1', [class_id]);
                    if (cData.rows.length > 0) {
                        amt = cData.rows[0].monthly_fee || 0;
                        const newFs = await client.query(`INSERT INTO fee_structures (class_id, monthly_fee) VALUES ($1, $2) RETURNING id`, [class_id, amt]);
                        fs_id = newFs.rows[0].id;
                    }
                }

                if (fs_id) {
                    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
                    const existingFee = await client.query(`SELECT id FROM student_fees WHERE student_id = $1 AND fee_structure_id = $2 AND month = $3`, [newStudentId, fs_id, currentMonth]);
                    if (existingFee.rows.length === 0) {
                        await client.query(`INSERT INTO student_fees (student_id, fee_structure_id, month, amount, status) VALUES ($1, $2, $3, $4, 'UNPAID')`, [newStudentId, fs_id, currentMonth, amt]);
                    }
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Student and Parent created successfully',
            student: studentRes.rows[0],
            parent_credentials: {
                username: parentUsername,
                password: parent_phone
            },
            student_credentials: {
                username: student_code,
                password: stuPassword
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating student:', err);
        if (err.constraint) {
            return res.status(400).json({ message: `Database error: ${err.constraint}` });
        }
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

const getAllStudents = async (req, res) => {
    try {
        const query = `
            SELECT s.*, p.first_name as parent_first, p.last_name as parent_last, p.phone as parent_phone,
                   u.status as account_status 
            FROM students s
            JOIN parents p ON s.parent_id = p.id
            JOIN users u ON s.user_id = u.id
            ORDER BY s.student_code ASC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { first_name, last_name, phone, dob, gender, address, email, admission_date, class_name, parent_first_name, parent_last_name, parent_phone } = req.body;

        await client.query('BEGIN');

        // Update Student
        const studentUpdateRes = await client.query(
            `UPDATE students SET first_name = $1, last_name = $2, phone = $3, dob = $4, gender = $5, address = $6, email = $7, admission_date = $8, class_name = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10 RETURNING parent_id`,
            [first_name, last_name, phone || null, dob || null, gender || null, address || null, email || null, admission_date || null, class_name || null, id]
        );

        if (studentUpdateRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found.' });
        }

        const parentId = studentUpdateRes.rows[0].parent_id;

        // Update Parent
        if (parentId) {
            // Fetch current parent details to check if phone changed
            const currentParentRes = await client.query(`SELECT phone, user_id FROM parents WHERE id = $1`, [parentId]);

            // Update the parent's profile record
            await client.query(
                `UPDATE parents SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4`,
                [parent_first_name, parent_last_name, parent_phone, parentId]
            );

            // If the phone changed, sync the new phone number as their password
            if (currentParentRes.rowCount > 0) {
                const oldPhone = currentParentRes.rows[0].phone;
                const parentUserId = currentParentRes.rows[0].user_id;

                if (oldPhone !== parent_phone && parentUserId) {
                    const newPasswordHash = await bcrypt.hash(parent_phone, 10);
                    await client.query(
                        `UPDATE users SET password_hash = $1 WHERE id = $2`,
                        [newPasswordHash, parentUserId]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Student updated successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating student:', err);
        res.status(500).json({ message: 'Internal server error while updating.' });
    } finally {
        client.release();
    }
};

const deleteStudent = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // Note: Due to ON DELETE CASCADE on user_id, deleting the user will cascade delete the student/parent records.
        // We first need to get the user_id of the student, and the user_id of the parent to clean both up.

        const getIdsRes = await client.query(`SELECT user_id, parent_id FROM students WHERE id = $1`, [id]);
        if (getIdsRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found.' });
        }

        const studentUserId = getIdsRes.rows[0].user_id;
        const parentId = getIdsRes.rows[0].parent_id;

        let parentUserId = null;
        if (parentId) {
            const parentRes = await client.query(`SELECT user_id FROM parents WHERE id = $1`, [parentId]);
            if (parentRes.rowCount > 0) {
                parentUserId = parentRes.rows[0].user_id;
            }
        }

        // Delete the student user (cascades to student record)
        await client.query(`DELETE FROM users WHERE id = $1`, [studentUserId]);

        // Delete the parent user (cascades to parent record)
        if (parentUserId) {
            await client.query(`DELETE FROM users WHERE id = $1`, [parentUserId]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Student deleted successfully' });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting student:', err);
        res.status(500).json({ message: 'Internal server error while deleting.' });
    } finally {
        client.release();
    }
};

const updateStudentStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACTIVE' or 'INACTIVE'

        if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        await client.query('BEGIN');

        const getIdsRes = await client.query(`SELECT user_id, parent_id FROM students WHERE id = $1`, [id]);
        if (getIdsRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found.' });
        }

        const studentUserId = getIdsRes.rows[0].user_id;
        const parentId = getIdsRes.rows[0].parent_id;

        // Update Student User Status
        await client.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, studentUserId]);

        // Update Parent User Status
        if (parentId) {
            const parentRes = await client.query(`SELECT user_id FROM parents WHERE id = $1`, [parentId]);
            if (parentRes.rowCount > 0 && parentRes.rows[0].user_id) {
                await client.query(`UPDATE users SET status = $1 WHERE id = $2`, [status, parentRes.rows[0].user_id]);
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Student and parent status updated to ${status}` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating status:', err);
        res.status(500).json({ message: 'Internal server error while updating status.' });
    } finally {
        client.release();
    }
};

const bulkDeleteStudents = async (req, res) => {
    const client = await pool.connect();
    try {
        const { student_ids } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'No students selected for deletion.' });
        }

        await client.query('BEGIN');

        // Fetch user IDs to delete (which cascades to students/parents)
        const getIdsRes = await client.query(`SELECT user_id, parent_id FROM students WHERE id = ANY($1::uuid[])`, [student_ids]);

        const userIdsToDelete = new Set();
        const parentIds = new Set();

        getIdsRes.rows.forEach(r => {
            if (r.user_id) userIdsToDelete.add(r.user_id);
            if (r.parent_id) parentIds.add(r.parent_id);
        });

        if (parentIds.size > 0) {
            const parentRes = await client.query(`SELECT user_id FROM parents WHERE id = ANY($1::uuid[])`, [Array.from(parentIds)]);
            parentRes.rows.forEach(r => {
                if (r.user_id) userIdsToDelete.add(r.user_id);
            });
        }

        if (userIdsToDelete.size > 0) {
            await client.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [Array.from(userIdsToDelete)]);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully deleted ${student_ids.length} students` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during bulk deletion:', err);
        res.status(500).json({ message: 'Internal server error during bulk deletion.' });
    } finally {
        client.release();
    }
};

const bulkUpdateStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { student_ids, status } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ message: 'No students selected.' });
        }
        if (!status || !['ACTIVE', 'INACTIVE', 'DROPPED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' });
        }

        await client.query('BEGIN');

        const getIdsRes = await client.query(`SELECT user_id, parent_id FROM students WHERE id = ANY($1::uuid[])`, [student_ids]);

        const userIdsToUpdate = new Set();
        const parentIds = new Set();

        getIdsRes.rows.forEach(r => {
            if (r.user_id) userIdsToUpdate.add(r.user_id);
            if (r.parent_id) parentIds.add(r.parent_id);
        });

        if (parentIds.size > 0) {
            const parentRes = await client.query(`SELECT user_id FROM parents WHERE id = ANY($1::uuid[])`, [Array.from(parentIds)]);
            parentRes.rows.forEach(r => {
                if (r.user_id) userIdsToUpdate.add(r.user_id);
            });
        }

        if (userIdsToUpdate.size > 0) {
            await client.query(`UPDATE users SET status = $1 WHERE id = ANY($2::uuid[])`, [status, Array.from(userIdsToUpdate)]);
        }

        // Also update the updated_at timestamp in students table
        await client.query(`UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[])`, [student_ids]);

        await client.query('COMMIT');
        res.status(200).json({ message: `Successfully updated status to ${status} for ${student_ids.length} students.` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during bulk status update:', err);
        res.status(500).json({ message: 'Internal server error during bulk status update.' });
    } finally {
        client.release();
    }
};

module.exports = { createStudent, getAllStudents, updateStudent, deleteStudent, updateStudentStatus, bulkDeleteStudents, bulkUpdateStatus };
