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
        const { student_fee_id, amount_paid, payment_mode, date } = req.body;
        const recorded_by = req.userId;

        if (!student_fee_id || amount_paid == null || amount_paid <= 0) {
            return res.status(400).json({ message: 'Invalid payment payload.' });
        }

        await client.query('BEGIN');

        // Fetch current fee details
        const feeRes = await client.query(`
            SELECT sf.amount, sf.discount, sf.status,
                   (SELECT COALESCE(SUM(p.amount_paid), 0) FROM payments p WHERE p.student_fee_id = sf.id) as previously_paid
            FROM student_fees sf WHERE id = $1
        `, [student_fee_id]);

        if (feeRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Student fee record not found.' });
        }

        const feeData = feeRes.rows[0];
        const totalPayable = parseFloat(feeData.amount) - parseFloat(feeData.discount);
        const newlyPaid = parseFloat(feeData.previously_paid) + parseFloat(amount_paid);

        let newStatus = 'PARTIALLY_PAID';
        if (newlyPaid >= totalPayable) {
            newStatus = 'PAID';
        }

        // Insert Payment Record
        const paymentRes = await client.query(`
            INSERT INTO payments (student_fee_id, amount_paid, payment_mode, date, recorded_by)
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `, [student_fee_id, amount_paid, payment_mode || 'CASH', date || new Date(), recorded_by]);

        // Update Student Fee Status
        await client.query(`UPDATE student_fees SET status = $1 WHERE id = $2`, [newStatus, student_fee_id]);

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Payment recorded successfully',
            payment: paymentRes.rows[0],
            new_status: newStatus
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error collecting payment:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
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
            WHERE sf.status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')
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

module.exports = {
    createFeeStructure, getFeeStructures, updateFeeStructure, deleteFeeStructure,
    getStudentFees, getFeePaymentHistory, updateStudentFee, collectPayment, getReports
};
