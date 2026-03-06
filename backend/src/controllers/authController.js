const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Please provide both username and password.' });
        }

        // Query user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const user = result.rows[0];

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
        }

        // Check password (Bcrypt)
        const passwordIsValid = await bcrypt.compare(password, user.password_hash);

        if (!passwordIsValid) {
            return res.status(401).json({ message: 'Invalid Password.' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            accessToken: token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
};

module.exports = { login };
