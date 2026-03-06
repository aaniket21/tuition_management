const { Pool } = require('pg');
require('dotenv').config({ path: __dirname + '/../../.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrateClasses() {
    try {
        console.log('Running Phase 3 Class Management migration...');

        // Step 1: Add new columns to classes table
        await pool.query(`
            ALTER TABLE classes 
            ADD COLUMN IF NOT EXISTS class_name VARCHAR(100), 
            ADD COLUMN IF NOT EXISTS batch_name VARCHAR(100), 
            ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES users(id) ON DELETE SET NULL, 
            ADD COLUMN IF NOT EXISTS max_students INT DEFAULT 40,
            ADD COLUMN IF NOT EXISTS start_date DATE,
            ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE',
            ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS admission_fee DECIMAL(10, 2) DEFAULT 0.00,
            ADD COLUMN IF NOT EXISTS late_fee_penalty DECIMAL(10, 2) DEFAULT 0.00;
        `);

        // Step 2: Rename subject_name to subject if it exists and subject doesn't
        // We do this by checking if subject_name exists. We can use a DO block.
        await pool.query(`
            DO $$ 
            BEGIN
                IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='classes' and column_name='subject_name') THEN
                    ALTER TABLE classes RENAME COLUMN subject_name TO subject;
                END IF;
            END $$;
        `);

        // Since subject was historically NOT NULL, and class_name is a new NOT NULL column, 
        // existing rows will have class_name as null which violates constraints if we added NOT NULL directly.
        // That's why class_name in Step 1 was added without NOT NULL, or if it was, it would fail for existing rows.
        // Wait, ALTER TABLE with NOT NULL fails if table has rows. 
        // Let's set a default class_name for existing rows then make it NOT NULL.
        await pool.query(`
            UPDATE classes SET class_name = 'Legacy Class' WHERE class_name IS NULL;
            ALTER TABLE classes ALTER COLUMN class_name SET NOT NULL;
        `);

        console.log('Class Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrateClasses();
