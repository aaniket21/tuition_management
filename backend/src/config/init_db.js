const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const setupDatabase = async () => {
    // 1. Connect to default postgres to create the DB
    const adminPool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', // default DB
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    let dbCreated = false;

    try {
        const res = await adminPool.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = '${process.env.DB_NAME}'`);
        if (res.rowCount === 0) {
            console.log(`${process.env.DB_NAME} database not found, creating it...`);
            await adminPool.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            console.log(`Created database ${process.env.DB_NAME}`);
            dbCreated = true;
        } else {
            console.log(`${process.env.DB_NAME} database already exists.`);
        }
    } catch (err) {
        console.error('Error ensuring database exists:', err.message);
        console.log('You might need to create it manually or check your PostgreSQL credentials.');
    } finally {
        await adminPool.end();
    }

    // 2. Connect to the new DB to run schema
    const pool = new Pool({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT,
    });

    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('Database schema successfully initialized.');

        // Let's create a default admin user if none exist
        const adminCheck = await pool.query(`SELECT * FROM users WHERE role = 'ADMIN' LIMIT 1`);
        if (adminCheck.rowCount === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPwd = await bcrypt.hash('admin123', 10);
            await pool.query(`INSERT INTO users (username, password_hash, role) VALUES ('admin', $1, 'ADMIN')`, [hashedPwd]);
            console.log('Default ADMIN user created (username: admin, password: admin123)');
        }

    } catch (err) {
        console.error('Error running schema:', err);
    } finally {
        await pool.end();
    }
};

setupDatabase();
