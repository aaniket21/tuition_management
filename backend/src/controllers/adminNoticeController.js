const { pool } = require('../config/db');

const createNotice = async (req, res) => {
    try {
        const { title, content, audience, target_class_id } = req.body;
        const created_by = req.userId;

        if (!title || !content || !audience) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO notices (title, content, audience, target_class_id, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, content, audience, target_class_id || null, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating notice:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllNotices = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM notices ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { createNotice, getAllNotices };
