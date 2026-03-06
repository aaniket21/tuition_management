const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle pg client', err);
    process.exit(-1);
});

const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log(`PostgreSQL Connected: ${client.host}`);
        client.release();
    } catch (error) {
        console.error(`Error connecting to PostgreSQL: ${error.message}`);
        console.log('Please ensure PostgreSQL is running and the database is created.');
    }
};

module.exports = { pool, connectDB };
