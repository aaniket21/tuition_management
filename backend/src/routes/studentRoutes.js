const express = require('express');
const router = express.Router();
const { verifyToken, isStudent } = require('../middlewares/authMiddleware');
const { getProfile, getAttendance, getFees, getNotices } = require('../controllers/studentController');

router.use(verifyToken, isStudent);

router.get('/profile', getProfile);
router.get('/attendance', getAttendance);
router.get('/fees', getFees);
router.get('/notices', getNotices);
router.get('/timetable', getProfile); // Sending profile which has class enrolments for now

module.exports = router;
