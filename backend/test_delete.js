const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './.env' });
const axios = require('axios');

async function testDelete() {
    try {
        const { Pool } = require('pg');
        const pool = new Pool({
            user: process.env.DB_USER,
            password: String(process.env.DB_PASSWORD),
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME
        });

        const adminRes = await pool.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
        const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;

        const paymentRes = await pool.query("SELECT id FROM payments LIMIT 1");
        if (paymentRes.rows.length === 0) {
            console.log("No payments to delete.");
            return pool.end();
        }
        const paymentId = paymentRes.rows[0].id;
        pool.end();

        const token = jwt.sign(
            { id: adminId || '00000000-0000-0000-0000-000000000000', role: 'ADMIN', username: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log("Attempting to delete payment ID:", paymentId);
        const response = await axios.delete(`http://127.0.0.1:5000/api/admin/fees/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Success!", response.data);
    } catch (e) {
        if (e.response) {
            console.log('HTTP ERROR:', e.response.status, e.response.data);
        } else {
            console.error('Request Error:', e);
        }
    }
}
testDelete();
