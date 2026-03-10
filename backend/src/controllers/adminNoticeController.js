const { pool } = require('../config/db');

const createNotice = async (req, res) => {
    try {
        const { title, content, category, target_type, target_id, is_pinned, expiry_date, attachment_url } = req.body;
        const created_by = req.userId;

        if (!title || !content || !target_type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await pool.query(
            `INSERT INTO notices (title, content, category, target_type, target_id, is_pinned, expiry_date, attachment_url, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [title, content, category || 'GENERAL', target_type, target_id || null, is_pinned || false, expiry_date || null, attachment_url || null, created_by]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating notice:', err);
        res.status(500).json({ message: 'Internal server error while creating notice' });
    }
};

const getAllNotices = async (req, res) => {
    try {
        const { category, target_type, include_expired } = req.query;
        let query = `
            SELECT n.*, u.username as created_by_name
            FROM notices n
            LEFT JOIN users u ON n.created_by = u.id
            WHERE 1=1
        `;
        const params = [];

        if (category && category !== 'ALL') {
            params.push(category);
            query += ` AND n.category = $${params.length}`;
        }
        if (target_type && target_type !== 'ALL') {
            params.push(target_type);
            query += ` AND n.target_type = $${params.length}`;
        }

        if (include_expired !== 'true') {
            query += ` AND (n.expiry_date IS NULL OR n.expiry_date > NOW())`;
        }

        query += ` ORDER BY n.is_pinned DESC, n.created_at DESC`;

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ message: 'Internal server error while fetching notices' });
    }
};

const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category, target_type, target_id, is_pinned, expiry_date, attachment_url } = req.body;

        const check = await pool.query('SELECT * FROM notices WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        const result = await pool.query(
            `UPDATE notices 
             SET title = COALESCE($1, title), 
                 content = COALESCE($2, content), 
                 category = COALESCE($3, category), 
                 target_type = COALESCE($4, target_type), 
                 target_id = $5, 
                 is_pinned = COALESCE($6, is_pinned), 
                 expiry_date = $7, 
                 attachment_url = COALESCE($8, attachment_url)
             WHERE id = $9 RETURNING *`,
            [title, content, category, target_type, target_id, is_pinned, expiry_date, attachment_url, id]
        );
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('Error updating notice:', err);
        res.status(500).json({ message: 'Internal server error while updating notice' });
    }
};

const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM notices WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Notice not found' });
        }
        res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (err) {
        console.error('Error deleting notice:', err);
        res.status(500).json({ message: 'Internal server error while deleting notice' });
    }
};

module.exports = { createNotice, getAllNotices, updateNotice, deleteNotice };
