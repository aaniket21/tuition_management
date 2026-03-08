const { pool } = require('../config/db');

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

module.exports = { getFeesReport };
