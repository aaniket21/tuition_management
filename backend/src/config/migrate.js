const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log('Running Phase 2 migration...');

        // Add new columns to students
        await pool.query(`
            ALTER TABLE students 
            ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255), 
            ADD COLUMN IF NOT EXISTS admission_date DATE, 
            ADD COLUMN IF NOT EXISTS class_name VARCHAR(100), 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        `);

        // Add new ENUM values for user_status (Safe approach using DO block)
        await pool.query(`
            DO $$ BEGIN
                ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'DROPPED';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            
            DO $$ BEGIN
                ALTER TYPE user_status ADD VALUE IF NOT EXISTS 'COMPLETED';
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // Add 'events' table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS events (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(255) NOT NULL,
                description TEXT,
                event_date DATE NOT NULL,
                notice_id UUID REFERENCES notices(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by UUID REFERENCES users(id)
            );
        `);

        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
