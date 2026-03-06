const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { createClass, getAllClasses, enrollStudent } = require('../controllers/adminClassController');

router.use(verifyToken, isAdmin); // Protect all routes in this file

router.post('/', createClass);
router.get('/', getAllClasses);
router.post('/enroll', enrollStudent);

module.exports = router;
