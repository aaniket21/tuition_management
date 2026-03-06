const express = require('express');
const router = express.Router();
const { getDashboardMetrics } = require('../controllers/adminDashboardController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get(
    '/metrics',
    verifyToken,
    isAdmin,
    getDashboardMetrics
);

module.exports = router;
