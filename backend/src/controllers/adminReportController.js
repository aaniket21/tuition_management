const { pool } = require('../config/db');

const getAttendanceReport = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.subject_name, count(a.id) as total_records, 
                   sum(case when a.status = 'PRESENT' then 1 else 0 end) as present_count
            FROM classes c
            LEFT JOIN attendances a ON c.id = a.class_id
            GROUP BY c.subject_name
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching attendance report:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getFeesReport = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sum(amount_paid) as total_collected FROM offline_payments
        `);
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching fees report:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getAttendanceReport, getFeesReport };
