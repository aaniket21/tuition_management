require('dotenv').config();
const { pool } = require('./config/db');

const runMigration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Adding discount to students table...');
        await client.query(`
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) DEFAULT 0.00;
        `);

        console.log('Adding month_date to student_fees...');
        await client.query(`
            ALTER TABLE student_fees
            ADD COLUMN IF NOT EXISTS month_date DATE;
        `);

        // Populate month_date for existing rows (approximate, 1st of the month)
        // We will try to parse 'March 2026' into a date.
        console.log('Updating existing month_date in student_fees...');
        await client.query(`
            UPDATE student_fees
            SET month_date = TO_DATE(month, 'Month YYYY')
            WHERE month_date IS NULL AND month ~ '[a-zA-Z]+ \\d{4}';
        `);

        console.log('Adding receipt_id to payments table...');
        await client.query(`
            ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS receipt_id VARCHAR(50) UNIQUE;
        `);

        await client.query('COMMIT');
        console.log('Migration to Fee V2 completed successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
