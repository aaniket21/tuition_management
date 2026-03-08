const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { getFeesReport } = require('../controllers/adminReportController');

router.use(verifyToken, isAdmin);
router.get('/fees', getFeesReport);
module.exports = router;
