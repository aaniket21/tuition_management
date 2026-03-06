const { pool } = require('../config/db');

const setFeePlan = async (req, res) => {
    try {
        const { student_id, plan_name, monthly_amount } = req.body;
        if (!student_id || !plan_name || monthly_amount == null) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO fee_plans (student_id, plan_name, monthly_amount) VALUES ($1, $2, $3) RETURNING *`,
            [student_id, plan_name, monthly_amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error setting fee plan:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const recordPayment = async (req, res) => {
    try {
        const { fee_plan_id, amount_paid } = req.body;
        const recorded_by = req.userId;
        if (!fee_plan_id || amount_paid == null) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO offline_payments (fee_plan_id, amount_paid, recorded_by) VALUES ($1, $2, $3) RETURNING *`,
            [fee_plan_id, amount_paid, recorded_by]
        );
        res.status(201).json({ message: 'Payment recorded', payment: result.rows[0] });
    } catch (err) {
        console.error('Error recording payment:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { setFeePlan, recordPayment };
