const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

exports.getEvents = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY event_date ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.createEvent = async (req, res) => {
    const { title, description, event_date } = req.body;
    const authorId = req.userId; // From authMiddleware

    try {
        await pool.query('BEGIN');

        // Create the global notice
        const noticeTitle = `Upcoming Event: ${title}`;
        const noticeContent = description || `Event scheduled on ${event_date}`;

        const noticeResult = await pool.query(
            `INSERT INTO notices (title, content, audience, created_by) 
             VALUES ($1, $2, 'GLOBAL', $3) RETURNING id`,
            [noticeTitle, noticeContent, authorId]
        );
        const noticeId = noticeResult.rows[0].id;

        // Create the event
        const eventResult = await pool.query(
            `INSERT INTO events (title, description, event_date, notice_id, created_by) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, description, event_date, noticeId, authorId]
        );

        await pool.query('COMMIT');
        res.status(201).json(eventResult.rows[0]);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error creating event:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, description, event_date } = req.body;

    try {
        await pool.query('BEGIN');

        // Update the event
        const eventResult = await pool.query(
            `UPDATE events 
             SET title = $1, description = $2, event_date = $3 
             WHERE id = $4 RETURNING *`,
            [title, description, event_date, id]
        );

        if (eventResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Event not found' });
        }

        const updatedEvent = eventResult.rows[0];

        // Update corresponding notice if it exists
        if (updatedEvent.notice_id) {
            const noticeTitle = `Upcoming Event: ${title} (Updated)`;
            const noticeContent = description || `Event scheduled on ${event_date}`;

            await pool.query(
                `UPDATE notices 
                 SET title = $1, content = $2 
                 WHERE id = $3`,
                [noticeTitle, noticeContent, updatedEvent.notice_id]
            );
        }

        await pool.query('COMMIT');
        res.json(updatedEvent);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error updating event:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteEvent = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('BEGIN');

        // First find the event to get its linked notice_id
        const eventResult = await pool.query('SELECT notice_id FROM events WHERE id = $1', [id]);

        if (eventResult.rowCount === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Event not found' });
        }

        const noticeId = eventResult.rows[0].notice_id;

        // Delete the event
        await pool.query('DELETE FROM events WHERE id = $1', [id]);

        // Delete the linked notice
        if (noticeId) {
            await pool.query('DELETE FROM notices WHERE id = $1', [noticeId]);
        }

        await pool.query('COMMIT');
        res.json({ message: 'Event and related notice deleted successfully' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error deleting event:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
