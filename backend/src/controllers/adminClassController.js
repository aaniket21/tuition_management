const { pool } = require('../config/db');

const classController = {
    // Get all classes with filters and basic stats
    getAllClasses: async (req, res) => {
        try {
            const { search, subject, status, teacher_id } = req.query;
            let query = `
                SELECT c.*, 
                       u.first_name || ' ' || u.last_name as teacher_name,
                       (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) as current_students
                FROM classes c
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (search) {
                query += ` AND (c.class_name ILIKE $${paramCount} OR c.subject ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
                params.push(`%${search}%`);
                paramCount++;
            }
            if (subject) {
                query += ` AND c.subject = $${paramCount}`;
                params.push(subject);
                paramCount++;
            }
            if (status) {
                query += ` AND c.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }
            if (teacher_id) {
                query += ` AND c.teacher_id = $${paramCount}`;
                params.push(teacher_id);
                paramCount++;
            }

            query += ` ORDER BY c.created_at DESC`;

            const result = await pool.query(query, params);
            res.json(result.rows);
        } catch (error) {
            console.error('Error fetching classes:', error);
            res.status(500).json({ message: 'Server error fetching classes' });
        }
    },

    // Get a single class with deep stats (students, attendance, fees)
    getClassById: async (req, res) => {
        try {
            const { id } = req.params;

            // 1. Get Class Info
            const classQuery = `
                SELECT c.*, u.username as teacher_name, u.first_name || ' ' || u.last_name as teacher_full_name
                FROM classes c
                LEFT JOIN users u ON c.teacher_id = u.id
                WHERE c.id = $1
            `;
            const classResult = await pool.query(classQuery, [id]);
            if (classResult.rows.length === 0) {
                return res.status(404).json({ message: 'Class not found' });
            }
            const classData = classResult.rows[0];

            // 2. Get Enrolled Students
            const studentsQuery = `
                SELECT s.id, s.student_code, s.first_name, s.last_name, s.phone,
                       u.username as email, p.first_name as parent_first, p.last_name as parent_last, p.phone as parent_phone
                FROM enrollments e
                JOIN students s ON e.student_id = s.id
                LEFT JOIN users u ON s.user_id = u.id
                LEFT JOIN parents p ON s.parent_id = p.id
                WHERE e.class_id = $1
            `;
            const studentsResult = await pool.query(studentsQuery, [id]);
            const students = studentsResult.rows;

            // 3. Analytics: Attendance Rate
            const attendanceQuery = `
                SELECT 
                    COUNT(*) as total_records,
                    SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present_count
                FROM attendances 
                WHERE class_id = $1
            `;
            const attResult = await pool.query(attendanceQuery, [id]);
            const totalRecords = parseInt(attResult.rows[0].total_records || 0);
            const presentCount = parseInt(attResult.rows[0].present_count || 0);
            const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

            // 4. Analytics: Fees Collected
            const feesQuery = `
                SELECT COALESCE(SUM(op.amount_paid), 0) as total_fees
                FROM offline_payments op
                JOIN fee_plans fp ON op.fee_plan_id = fp.id
                JOIN enrollments e ON fp.student_id = e.student_id
                WHERE e.class_id = $1
            `;
            const feesResult = await pool.query(feesQuery, [id]);
            const totalFeesCollected = parseFloat(feesResult.rows[0].total_fees || 0);

            res.json({
                ...classData,
                students,
                analytics: {
                    attendanceRate,
                    totalFeesCollected,
                    totalStudents: students.length
                }
            });
        } catch (error) {
            console.error('Error fetching class details:', error);
            res.status(500).json({ message: 'Server error fetching class details' });
        }
    },

    // Create a new class
    createClass: async (req, res) => {
        try {
            const { class_name, subject, batch_name, teacher_id, max_students, start_date, status, monthly_fee, admission_fee, late_fee_penalty, schedule_details } = req.body;

            if (!class_name || !subject) {
                return res.status(400).json({ message: 'Class name and subject are required.' });
            }

            const insertQuery = `
                INSERT INTO classes (class_name, subject, batch_name, teacher_id, max_students, start_date, status, monthly_fee, admission_fee, late_fee_penalty, schedule_details)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `;
            const result = await pool.query(insertQuery, [
                class_name, subject, batch_name || null, teacher_id || null, max_students || 40, start_date || null, status || 'ACTIVE',
                monthly_fee || 0, admission_fee || 0, late_fee_penalty || 0, schedule_details || {}
            ]);

            res.status(201).json(result.rows[0]);
        } catch (error) {
            console.error('Error creating class:', error);
            res.status(500).json({ message: 'Server error creating class' });
        }
    },

    // Update class details
    updateClass: async (req, res) => {
        try {
            const { id } = req.params;
            const { class_name, subject, batch_name, teacher_id, max_students, start_date, status, monthly_fee, admission_fee, late_fee_penalty, schedule_details } = req.body;

            const updateQuery = `
                UPDATE classes 
                SET class_name = $1, subject = $2, batch_name = $3, teacher_id = $4, max_students = $5, start_date = $6, status = $7, 
                    monthly_fee = $8, admission_fee = $9, late_fee_penalty = $10, schedule_details = $11
                WHERE id = $12
                RETURNING *
            `;
            const result = await pool.query(updateQuery, [
                class_name, subject, batch_name || null, teacher_id || null, max_students || 40, start_date || null, status || 'ACTIVE',
                monthly_fee || 0, admission_fee || 0, late_fee_penalty || 0, schedule_details || {}, id
            ]);

            if (result.rows.length === 0) return res.status(404).json({ message: 'Class not found' });
            res.json(result.rows[0]);
        } catch (error) {
            console.error('Error updating class:', error);
            res.status(500).json({ message: 'Server error updating class' });
        }
    },

    // Delete a class
    deleteClass: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) return res.status(404).json({ message: 'Class not found' });
            res.json({ message: 'Class deleted successfully' });
        } catch (error) {
            console.error('Error deleting class:', error);
            res.status(500).json({ message: 'Server error deleting class. It might be linked to other critical records.' });
        }
    },

    // Enroll a single student (was in original, keeping similar signature)
    enrollStudent: async (req, res) => {
        try {
            const { class_id, student_id } = req.body;
            if (!student_id || !class_id) return res.status(400).json({ message: 'student_id and class_id required' });

            // Check capacity
            const capacityQuery = `SELECT max_students, (SELECT COUNT(*) FROM enrollments WHERE class_id = $1) as current_students FROM classes WHERE id = $1`;
            const capacityResult = await pool.query(capacityQuery, [class_id]);
            if (capacityResult.rows.length > 0) {
                const max = capacityResult.rows[0].max_students;
                const current = parseInt(capacityResult.rows[0].current_students);
                if (current >= max) {
                    return res.status(400).json({ message: 'Class has reached maximum capacity.' });
                }
            }

            const insertQuery = `
                INSERT INTO enrollments (class_id, student_id) 
                VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *
            `;
            const result = await pool.query(insertQuery, [class_id, student_id]);
            if (result.rows.length === 0) {
                return res.status(400).json({ message: 'Student is already enrolled in this class.' });
            }
            res.status(201).json({ message: 'Student enrolled successfully', enrollment: result.rows[0] });
        } catch (error) {
            console.error('Error enrolling student to class:', error);
            res.status(500).json({ message: 'Server error enrolling student' });
        }
    },

    addStudentToClass: async (req, res) => {
        try {
            const { id } = req.params;
            const { student_id } = req.body;

            // Check capacity
            const capacityQuery = `SELECT max_students, (SELECT COUNT(*) FROM enrollments WHERE class_id = $1) as current_students FROM classes WHERE id = $1`;
            const capacityResult = await pool.query(capacityQuery, [id]);
            if (capacityResult.rows.length > 0) {
                const max = capacityResult.rows[0].max_students;
                const current = parseInt(capacityResult.rows[0].current_students);
                if (current >= max) {
                    return res.status(400).json({ message: 'Class has reached maximum capacity.' });
                }
            }

            const insertQuery = `
                INSERT INTO enrollments (class_id, student_id) 
                VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *
            `;
            const result = await pool.query(insertQuery, [id, student_id]);
            res.json({ message: 'Student added successfully', enrollment: result.rows[0] });
        } catch (error) {
            console.error('Error adding student to class:', error);
            res.status(500).json({ message: 'Server error adding student' });
        }
    },

    removeStudentFromClass: async (req, res) => {
        try {
            const { id, studentId } = req.params;
            await pool.query(`DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2`, [id, studentId]);
            res.json({ message: 'Student removed from class' });
        } catch (error) {
            console.error('Error removing student from class:', error);
            res.status(500).json({ message: 'Server error removing student' });
        }
    },

    bulkMoveStudents: async (req, res) => {
        try {
            const { studentIds, targetClassId, sourceClassId } = req.body;

            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                return res.status(400).json({ message: 'No students selected for move' });
            }

            await pool.query('BEGIN');

            // Remove from source
            const deleteParams = [...studentIds, sourceClassId];
            const deletePlaceholders = studentIds.map((_, i) => `$${i + 1}`).join(',');
            await pool.query(`DELETE FROM enrollments WHERE student_id IN (${deletePlaceholders}) AND class_id = $${studentIds.length + 1}`, deleteParams);

            // Add to target
            const insertValues = studentIds.map(sid => `('${targetClassId}', '${sid}')`).join(',');
            await pool.query(`INSERT INTO enrollments (class_id, student_id) VALUES ${insertValues} ON CONFLICT DO NOTHING`);

            await pool.query('COMMIT');
            res.json({ message: `Successfully moved ${studentIds.length} students` });
        } catch (error) {
            await pool.query('ROLLBACK');
            console.error('Error in bulk move:', error);
            res.status(500).json({ message: 'Server error during bulk move' });
        }
    }
};

module.exports = classController;
