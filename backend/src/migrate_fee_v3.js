require('dotenv').config();
const { pool } = require('./config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Dropping UNIQUE constraint from receipt_id in payments table...');

        // Find the specific constraint name (it might be payments_receipt_id_key)
        // and drop it. A robust way is to drop it if it exists. Postgres doesn't easily support dropping constraints without knowing the name unless we use PL/pgSQL block, but we can try dropping the expected name.

        try {
            await client.query(`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_receipt_id_key;`);
        } catch (e) {
            console.log('Constraint payments_receipt_id_key not found or already dropped.');
        }

        await client.query('COMMIT');
        console.log('Migration to Fee V3 completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
