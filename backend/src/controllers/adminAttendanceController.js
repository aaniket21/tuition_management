const { pool } = require('../config/db');

const markAttendance = async (req, res) => {
    try {
        const { class_id, student_id, date, status } = req.body;
        const marked_by = req.userId; // From authMiddleware

        if (!class_id || !student_id || !date || !status) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const result = await pool.query(
            `INSERT INTO attendances (class_id, student_id, date, status, marked_by) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (class_id, student_id, date) 
             DO UPDATE SET status = EXCLUDED.status, marked_by = EXCLUDED.marked_by
             RETURNING *`,
            [class_id, student_id, date, status, marked_by]
        );

        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error marking attendance:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { markAttendance };
