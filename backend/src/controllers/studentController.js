const { pool } = require('../config/db');

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, c.subject_name 
             FROM students s
             LEFT JOIN enrollments e ON s.id = e.student_id
             LEFT JOIN classes c ON e.class_id = c.id
             WHERE s.user_id = $1`,
            [req.userId]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

const getAttendance = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.date, a.status, c.subject_name
            FROM attendances a
            JOIN classes c ON a.class_id = c.id
            JOIN students s ON a.student_id = s.id
            WHERE s.user_id = $1
            ORDER BY a.date DESC
        `, [req.userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
};

const getFees = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT fp.plan_name, fp.monthly_amount, fp.status, op.amount_paid, op.payment_date 
            FROM fee_plans fp
            JOIN students s ON fp.student_id = s.id
            LEFT JOIN offline_payments op ON fp.id = op.fee_plan_id
            WHERE s.user_id = $1
            ORDER BY op.payment_date DESC
        `, [req.userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fees' });
    }
};

const getNotices = async (req, res) => {
    try {
        // Students see GLOBAL and CLASS notices for their enrolled classes
        const result = await pool.query(`
            SELECT DISTINCT n.* 
            FROM notices n
            LEFT JOIN enrollments e ON n.target_class_id = e.class_id
            LEFT JOIN students s ON e.student_id = s.id
            WHERE n.audience = 'GLOBAL' OR s.user_id = $1
            ORDER BY n.created_at DESC
        `, [req.userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching notices' });
    }
};

module.exports = { getProfile, getAttendance, getFees, getNotices };
