require('dotenv').config();
const { pool } = require('./config/db');
const fs = require('fs');
const path = require('path');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Dropping old fee tables and types...');
        // Drop the new ones in case we re-run
        await client.query('DROP TABLE IF EXISTS payments CASCADE');
        await client.query('DROP TABLE IF EXISTS student_fees CASCADE');
        await client.query('DROP TABLE IF EXISTS fee_structures CASCADE');

        // Drop old tables
        await client.query('DROP TABLE IF EXISTS offline_payments CASCADE');
        await client.query('DROP TABLE IF EXISTS fee_plans CASCADE');

        console.log('Dropping old ENUMs...');
        await client.query('DROP TYPE IF EXISTS fee_status CASCADE');
        await client.query('DROP TYPE IF EXISTS payment_cycle CASCADE');

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema.sql...');
        await client.query(schemaSql);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
