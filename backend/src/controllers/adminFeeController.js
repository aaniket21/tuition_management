const { pool } = require('../config/db');

// --- FEE STRUCTURES ---

const createFeeStructure = async (req, res) => {
    try {
        const { class_id, monthly_fee, admission_fee, registration_fee, exam_fee, discount_option, late_fine_amount, payment_cycle } = req.body;

        if (!class_id) {
            return res.status(400).json({ message: 'Class ID is required.' });
        }

        const query = `
            INSERT INTO fee_structures (class_id, monthly_fee, admission_fee, registration_fee, exam_fee, discount_option, late_fine_amount, payment_cycle)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        const values = [class_id, monthly_fee || 0, admission_fee || 0, registration_fee || 0, exam_fee || 0, discount_option || 0, late_fine_amount || 0, payment_cycle || 'MONTHLY'];

        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating fee structure:', err);
        res.status(500).json({ message: 'Internal server error while creating fee structure.' });
    }
};

const getFeeStructures = async (req, res) => {
    try {
        const query = `
            SELECT fs.*, c.class_name, c.subject, c.batch_name 
            FROM fee_structures fs
            JOIN classes c ON fs.class_id = c.id
            ORDER BY fs.created_at DESC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching fee structures:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const { monthly_fee, admission_fee, registration_fee, exam_fee, discount_option, late_fine_amount, payment_cycle } = req.body;

        const query = `
            UPDATE fee_structures
            SET monthly_fee = $1, admission_fee = $2, registration_fee = $3, exam_fee = $4, discount_option = $5, late_fine_amount = $6, payment_cycle = $7
            WHERE id = $8
            RETURNING *
        `;
        const values = [monthly_fee, admission_fee, registration_fee, exam_fee, discount_option, late_fine_amount, payment_cycle, id];

        const result = await pool.query(query, values);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Fee structure not found' });

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating fee structure:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteFeeStructure = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM fee_structures WHERE id = $1 RETURNING *', [id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Fee structure not found' });

        res.status(200).json({ message: 'Fee structure deleted successfully' });
    } catch (err) {
        console.error('Error deleting fee structure:', err);
        res.status(500).json({ message: 'Cannot delete fee structure; it may be in use by students.' });
    }
};

// --- STUDENT FEES & PAYMENTS ---

const getStudentFees = async (req, res) => {
    try {
        const query = `
            SELECT sf.*, 
                   s.first_name, s.last_name, s.student_code, 
                   c.class_name, c.batch_name,
                   (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_fee_id = sf.id) as total_paid
            FROM student_fees sf
            JOIN students s ON sf.student_id = s.id
            LEFT JOIN fee_structures fs ON sf.fee_structure_id = fs.id
            LEFT JOIN classes c ON fs.class_id = c.id
            ORDER BY sf.created_at DESC
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching student fees:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getFeePaymentHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM payments WHERE student_fee_id = $1 ORDER BY date DESC';
        const result = await pool.query(query, [id]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateStudentFee = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, discount, status } = req.body;

        const query = `
            UPDATE student_fees
            SET amount = COALESCE($1, amount),
                discount = COALESCE($2, discount),
                status = COALESCE($3, status)
            WHERE id = $4
            RETURNING *
        `;
        const result = await pool.query(query, [amount, discount, status, id]);

        if (result.rowCount === 0) return res.status(404).json({ message: 'Student fee not found' });
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating student fee:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const collectPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { student_id, amount_paid, payment_mode, date } = req.body;
        const recorded_by = req.userId;

        // If they send student_fee_id, we can find the student_id from it, 
        // but for advance/multiple month payments we need the student_id
        let target_student_id = student_id;
        if (!target_student_id && req.body.student_fee_id) {
            const feeCheck = await client.query('SELECT student_id FROM student_fees WHERE id = $1', [req.body.student_fee_id]);
            if (feeCheck.rows.length > 0) {
                target_student_id = feeCheck.rows[0].student_id;
            }
        }

        if (!target_student_id || amount_paid == null || amount_paid <= 0) {
            return res.status(400).json({ message: 'Invalid payment payload. Provide student_id and amount_paid.' });
        }

        await client.query('BEGIN');

        // Fetch all UNPAID or PARTIALLY_PAID fee records sorted by month_date ASC (oldest first)
        const feesRes = await client.query(`
            SELECT sf.id, sf.amount, sf.discount, sf.status,
                   (SELECT COALESCE(SUM(p.amount_paid), 0) FROM payments p WHERE p.student_fee_id = sf.id) as previously_paid
            FROM student_fees sf 
            WHERE student_id = $1 AND status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
            ORDER BY COALESCE(sf.month_date, sf.created_at) ASC
        `, [target_student_id]);

        let remainingAmount = parseFloat(amount_paid);
        const receipt_id = 'REC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        const paymentsRecorded = [];

        // Distribute payment across pending months
        for (const fee of feesRes.rows) {
            if (remainingAmount <= 0) break;

            const totalPayable = parseFloat(fee.amount) - parseFloat(fee.discount || 0);
            const amtPendingForThisFee = totalPayable - parseFloat(fee.previously_paid);

            if (amtPendingForThisFee <= 0) continue; // Should not happen due to status filter but safe check

            const amountToApplyToThisFee = Math.min(remainingAmount, amtPendingForThisFee);

            // Insert Payment Record
            const paymentRes = await client.query(`
                INSERT INTO payments (student_fee_id, amount_paid, payment_mode, date, recorded_by, receipt_id)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [fee.id, amountToApplyToThisFee, payment_mode || 'CASH', date || new Date(), recorded_by, receipt_id]);

            paymentsRecorded.push(paymentRes.rows[0]);

            // Update Status
            const newTotalPaid = parseFloat(fee.previously_paid) + amountToApplyToThisFee;
            const newStatus = newTotalPaid >= totalPayable ? 'PAID' : 'PARTIALLY_PAID';

            await client.query(`UPDATE student_fees SET status = $1 WHERE id = $2`, [newStatus, fee.id]);

            remainingAmount -= amountToApplyToThisFee;
        }

        // What if remainingAmount > 0? (Advance payment)
        if (remainingAmount > 0) {
            // Find the latest fee record to park the advance
            const latestFeeRes = await client.query(`
                SELECT id FROM student_fees WHERE student_id = $1 ORDER BY COALESCE(month_date, created_at) DESC LIMIT 1
            `, [target_student_id]);

            let latestFeeId;
            if (latestFeeRes.rows.length > 0) {
                latestFeeId = latestFeeRes.rows[0].id;
            } else {
                // If the student has no fee records yet, we generate a placeholder one for the current month
                const now = new Date();
                const currentMonthString = now.toLocaleString('default', { month: 'long', year: 'numeric' });
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const studentInfo = await client.query(`
                   SELECT s.discount, e.class_id, c.monthly_fee as class_fee, fs.id as structure_id, fs.monthly_fee as structure_monthly_fee
                   FROM students s
                   LEFT JOIN enrollments e ON s.id = e.student_id
                   LEFT JOIN classes c ON e.class_id = c.id
                   LEFT JOIN fee_structures fs ON c.id = fs.class_id
                   WHERE s.id = $1
                `, [target_student_id]);

                const info = studentInfo.rows[0] || {};
                const base_fee = info.structure_monthly_fee || info.class_fee || 0;

                const newFeeRes = await client.query(`
                    INSERT INTO student_fees (student_id, fee_structure_id, month, month_date, amount, discount, status) 
                    VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID')
                    RETURNING id
                `, [target_student_id, info.structure_id || null, currentMonthString, startOfMonth, base_fee, info.discount || 0]);

                latestFeeId = newFeeRes.rows[0].id;
            }

            const paymentRes = await client.query(`
                INSERT INTO payments (student_fee_id, amount_paid, payment_mode, date, recorded_by, receipt_id)
                VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
            `, [latestFeeId, remainingAmount, payment_mode || 'CASH', date || new Date(), recorded_by, receipt_id]);
            paymentsRecorded.push(paymentRes.rows[0]);

            // Re-evaluate status of the parked fee
            const feeCheckRes = await client.query(`
                SELECT amount, discount, (SELECT SUM(amount_paid) FROM payments WHERE student_fee_id = $1) as total_paid
                FROM student_fees WHERE id = $1
            `, [latestFeeId]);

            const feeInfo = feeCheckRes.rows[0];
            const feeAmount = parseFloat(feeInfo.amount) - parseFloat(feeInfo.discount || 0);
            const totalPaid = parseFloat(feeInfo.total_paid || 0);
            const statusToSet = totalPaid >= feeAmount ? 'PAID' : 'PARTIALLY_PAID';

            await client.query(`UPDATE student_fees SET status = $1 WHERE id = $2`, [statusToSet, latestFeeId]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Payment recorded successfully',
            receipt_id: receipt_id,
            payments: paymentsRecorded
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error collecting payment:', err);
        res.status(500).json({ message: 'Internal server error while collecting payment' });
    } finally {
        client.release();
    }
};

const processMonthlyFees = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthString = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        // Get all ACTIVE students who have an enrollment
        const studentsRes = await client.query(`
            SELECT s.id as student_id, s.discount, s.admission_date, e.class_id,
                   c.monthly_fee as class_fee, fs.id as structure_id, fs.monthly_fee as structure_monthly_fee
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN enrollments e ON s.id = e.student_id
            JOIN classes c ON e.class_id = c.id
            LEFT JOIN fee_structures fs ON c.id = fs.class_id
            WHERE u.status = 'ACTIVE'
        `);

        let generatedCount = 0;

        for (const student of studentsRes.rows) {
            // Check if student joined after this month
            if (student.admission_date) {
                const admissionDate = new Date(student.admission_date);
                // Set to start of admission month to compare
                const startOfAdmissionMonth = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);
                if (startOfMonth < startOfAdmissionMonth) {
                    continue; // Skip, they didn't join yet
                }
            }

            const fee_structure_id = student.structure_id;
            const base_fee = student.structure_monthly_fee != null ? student.structure_monthly_fee : (student.class_fee || 0);

            // Check if fee record already exists for this month
            const existingFee = await client.query(`
                SELECT id FROM student_fees 
                WHERE student_id = $1 AND month = $2
            `, [student.student_id, currentMonthString]);

            if (existingFee.rows.length === 0) {
                // Insert new fee
                await client.query(`
                    INSERT INTO student_fees (student_id, fee_structure_id, month, month_date, amount, discount, status) 
                    VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID')
                `, [student.student_id, fee_structure_id, currentMonthString, startOfMonth, base_fee, student.discount || 0]);

                // If the student has an advance 'parked' fee or partial payment logic requires it,
                // we'll need to re-assess the entire student ledger. But typically, an advance parked fee 
                // is ALREADY in the DB under the CURRENT month. So generateMonthlyFees running on the 1st
                // will see existingFee.rows.length > 0 if an advance was made in that same month,
                // avoiding a duplicate placeholder! Advance payments for future months are handled by
                // creating a placeholder when they pay, so they're solid.

                generatedCount++;
            }
        }

        await client.query('COMMIT');
        return { success: true, count: generatedCount, month: currentMonthString };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Core Error generating monthly fees:', err);
        return { success: false, error: err };
    } finally {
        client.release();
    }
};

const generateMonthlyFees = async (req, res) => {
    try {
        const result = await processMonthlyFees();
        if (result.success) {
            res.status(200).json({ message: `Successfully generated ${result.count} fee records for ${result.month}.` });
        } else {
            res.status(500).json({ message: 'Internal server error while generating fees' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error while generating fees' });
    }
};

const getReports = async (req, res) => {
    try {
        // Summary: Total Received this month, Total Pending, etc.
        const receivedRes = await pool.query(`
            SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
                `);
        const totalReceivedMonth = parseFloat(receivedRes.rows[0].total);

        // Calculate pending directly from student_fees minus payments for those fees
        const pendingRes = await pool.query(`
            SELECT COALESCE(SUM(sf.amount - sf.discount - (
                    SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_fee_id = sf.id
                )), 0) as total
            FROM student_fees sf
            WHERE sf.status IN('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
                `);
        const totalPending = parseFloat(pendingRes.rows[0].total);

        res.json({
            totalReceivedMonth,
            totalPending
        });
    } catch (err) {
        console.error('Error fetching fee reports:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updatePayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { amount_paid, payment_mode, date } = req.body;

        if (amount_paid == null || amount_paid <= 0) {
            return res.status(400).json({ message: 'Invalid payment amount.' });
        }

        await client.query('BEGIN');

        const existingRes = await client.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        const payment = existingRes.rows[0];

        const updateRes = await client.query(`
            UPDATE payments 
            SET amount_paid = $1, payment_mode = $2, date = $3 
            WHERE id = $4 RETURNING *
                `, [amount_paid, payment_mode || payment.payment_mode, date || payment.date, id]);

        const feeId = payment.student_fee_id;

        const feeRes = await client.query(`
            SELECT amount, discount, (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_fee_id = student_fees.id) as total_paid
            FROM student_fees WHERE id = $1
                `, [feeId]);

        const fee = feeRes.rows[0];
        const payable = parseFloat(fee.amount) - parseFloat(fee.discount || 0);
        const totalPaid = parseFloat(fee.total_paid);

        let status = 'UNPAID';
        if (totalPaid >= payable && payable > 0) {
            status = 'PAID';
        } else if (totalPaid > 0) {
            status = 'PARTIALLY_PAID';
        }

        await client.query('UPDATE student_fees SET status = $1 WHERE id = $2', [status, feeId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Payment updated', payment: updateRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating payment:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

const deletePayment = async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const { id } = req.params;

        await client.query('BEGIN');

        const existingRes = await client.query('SELECT * FROM payments WHERE id = $1', [id]);
        if (existingRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Payment not found' });
        }
        const payment = existingRes.rows[0];
        const feeId = payment.student_fee_id;

        await client.query('DELETE FROM payments WHERE id = $1', [id]);

        const feeRes = await client.query(`
            SELECT amount, discount, (SELECT COALESCE(SUM(amount_paid), 0) FROM payments WHERE student_fee_id = student_fees.id) as total_paid
            FROM student_fees WHERE id = $1
                `, [feeId]);

        const fee = feeRes.rows[0];
        const payable = parseFloat(fee.amount) - parseFloat(fee.discount || 0);
        const totalPaid = parseFloat(fee.total_paid);

        let status = 'UNPAID';
        if (totalPaid >= payable && payable > 0) {
            status = 'PAID';
        } else if (totalPaid > 0) {
            status = 'PARTIALLY_PAID';
        }

        await client.query('UPDATE student_fees SET status = $1 WHERE id = $2', [status, feeId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Payment deleted' });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('Error deleting payment:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (client) client.release();
    }
};

module.exports = {
    createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
    getStudentFees, getFeePaymentHistory, updateStudentFee, collectPayment, getReports, generateMonthlyFees, updatePayment, deletePayment, processMonthlyFees
};
