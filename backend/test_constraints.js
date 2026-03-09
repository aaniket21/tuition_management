const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });
const fs = require('fs');

const pool = new Pool({
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

pool.query(`SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'payments'`)
    .then(res => {
        fs.writeFileSync('constraints.json', JSON.stringify(res.rows, null, 2));
        console.log('Constraints saved to constraints.json');
        pool.end();
    })
    .catch(console.error);
