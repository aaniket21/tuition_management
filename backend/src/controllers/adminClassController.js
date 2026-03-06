const { pool } = require('../config/db');

const createClass = async (req, res) => {
    try {
        const { subject_name, schedule_details } = req.body;
        if (!subject_name) {
            return res.status(400).json({ message: 'Subject name is required.' });
        }

        const result = await pool.query(
            `INSERT INTO classes (subject_name, schedule_details) VALUES ($1, $2) RETURNING *`,
            [subject_name, schedule_details || {}]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating class:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getAllClasses = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM classes ORDER BY created_at DESC');
        res.status(200).json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
};

const enrollStudent = async (req, res) => {
    try {
        const { student_id, class_id } = req.body;
        if (!student_id || !class_id) return res.status(400).json({ message: 'student_id and class_id required' });

        const result = await pool.query(
            `INSERT INTO enrollments (student_id, class_id) VALUES ($1, $2) RETURNING *`,
            [student_id, class_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.constraint === 'enrollments_student_id_class_id_key') {
            return res.status(400).json({ message: 'Student is already enrolled in this class.' });
        }
        console.error('Error enrolling student:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createClass, getAllClasses, enrollStudent };
