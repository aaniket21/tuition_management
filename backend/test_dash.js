const { pool } = require('./src/config/db');
const { getDashboardMetrics } = require('./src/controllers/adminDashboardController');

const req = {};
const res = {
    json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
    status: (code) => ({ json: (data) => console.log('Status', code, data) })
};

getDashboardMetrics(req, res).then(() => {
    pool.end();
    console.log("Done");
});
