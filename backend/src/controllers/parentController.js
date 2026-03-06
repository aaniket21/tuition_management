const { pool } = require('../config/db');

// Helper to get child student ids for a parent user
const getChildIds = async (userId) => {
    const parentRes = await pool.query('SELECT id FROM parents WHERE user_id = $1', [userId]);
    if (parentRes.rowCount === 0) return [];

    const stuRes = await pool.query('SELECT id FROM students WHERE parent_id = $1', [parentRes.rows[0].id]);
    return stuRes.rows.map(r => r.id);
};

const getChildrenProfile = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.*
            FROM students s
            JOIN parents p ON s.parent_id = p.id
            WHERE p.user_id = $1
        `, [req.userId]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching profile' });
    }
};

const getChildAttendance = async (req, res) => {
    try {
        const childIds = await getChildIds(req.userId);
        if (childIds.length === 0) return res.status(200).json([]);

        const result = await pool.query(`
            SELECT a.date, a.status, c.subject_name, s.first_name as student_name
            FROM attendances a
            JOIN classes c ON a.class_id = c.id
            JOIN students s ON a.student_id = s.id
            WHERE a.student_id = ANY($1)
            ORDER BY a.date DESC
        `, [childIds]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching attendance' });
    }
};

const getChildFees = async (req, res) => {
    try {
        const childIds = await getChildIds(req.userId);
        if (childIds.length === 0) return res.status(200).json([]);

        const result = await pool.query(`
            SELECT fp.plan_name, fp.monthly_amount, fp.status, op.amount_paid, op.payment_date, s.first_name as student_name
            FROM fee_plans fp
            JOIN students s ON fp.student_id = s.id
            LEFT JOIN offline_payments op ON fp.id = op.fee_plan_id
            WHERE fp.student_id = ANY($1)
            ORDER BY op.payment_date DESC
        `, [childIds]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching fees' });
    }
};

const getNotices = async (req, res) => {
    try {
        // Parents see GLOBAL and CLASS notices for all classes their children are enrolled in
        const childIds = await getChildIds(req.userId);

        let query = `SELECT * FROM notices WHERE audience = 'GLOBAL' ORDER BY created_at DESC`;
        let params = [];

        if (childIds.length > 0) {
            query = `
                SELECT DISTINCT n.* 
                FROM notices n
                LEFT JOIN enrollments e ON n.target_class_id = e.class_id
                WHERE n.audience = 'GLOBAL' OR e.student_id = ANY($1)
                ORDER BY n.created_at DESC
            `;
            params = [childIds];
        }

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching parent notices', err);
        res.status(500).json({ message: 'Error fetching notices' });
    }
};

module.exports = { getChildrenProfile, getChildAttendance, getChildFees, getNotices };
