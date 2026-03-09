const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const axios = require('axios');

async function test() {
    try {
        // Mint an admin token
        const token = jwt.sign(
            { id: '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'testadmin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Fetch a real student ID to use
        const { Pool } = require('pg');
        const pool = new Pool({
            user: process.env.DB_USER,
            password: String(process.env.DB_PASSWORD),
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        const r = await pool.query("SELECT id FROM students LIMIT 1");
        if (r.rows.length === 0) {
            console.log("No students found.");
            return pool.end();
        }
        const student_id = r.rows[0].id;

        // Find existing users to act as recorded_by
        const adminRes = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
        const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;
        pool.end();

        // Get token with valid user ID if needed, but the mocked DB just uses what's in token
        const validToken = jwt.sign(
            { id: adminId || '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const response = await axios.post('http://localhost:5000/api/admin/fees/collect', {
            student_id: student_id,
            amount_paid: 5000,
            payment_mode: 'Cash'
        }, {
            headers: { Authorization: `Bearer ${validToken}` }
        });
        console.log(response.data);
    } catch (e) {
        if (e.response) {
            console.log('HTTP ERROR:', e.response.status, e.response.data);
        } else {
            console.error('Request Error:', e);
        }
    }
}
test();
