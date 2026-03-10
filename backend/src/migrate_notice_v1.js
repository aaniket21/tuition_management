require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

async function runMigration() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("1. Adding new columns: category, expiry_date, is_pinned, target_type...");
        await client.query(`
            ALTER TABLE notices 
            ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'GENERAL',
            ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'ALL_STUDENTS';
        `);

        console.log("2. Renaming target_class_id to target_id (and dropping FK constraint)...");
        // Drop the foreign key constraint if it exists. Assume standard naming 'notices_target_class_id_fkey'
        await client.query(`ALTER TABLE notices DROP CONSTRAINT IF EXISTS notices_target_class_id_fkey;`);

        // Check if column exists before renaming (idempotent)
        const colCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notices' AND column_name='target_class_id';
        `);
        if (colCheck.rows.length > 0) {
            await client.query(`ALTER TABLE notices RENAME COLUMN target_class_id TO target_id;`);
        }

        console.log("3. Mapping old audience data to target_type and dropping audience column...");
        // If audience column still exists, drop it to migrate fully to target_type
        const audCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='notices' AND column_name='audience';
        `);
        if (audCheck.rows.length > 0) {
            await client.query(`
                UPDATE notices SET target_type = 'ALL_STUDENTS' WHERE audience::text = 'GLOBAL';
                UPDATE notices SET target_type = 'CLASS' WHERE audience::text = 'CLASS';
                ALTER TABLE notices DROP COLUMN audience;
            `);
        }

        console.log("4. Updating schema.sql file implicitly by keeping track of these changes...");

        await client.query('COMMIT');
        console.log("Migration completed successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
