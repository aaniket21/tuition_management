const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { markAttendance } = require('../controllers/adminAttendanceController');

router.use(verifyToken, isAdmin);

router.post('/', markAttendance);

module.exports = router;
