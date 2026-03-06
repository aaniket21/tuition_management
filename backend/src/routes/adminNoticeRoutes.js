const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { createNotice, getAllNotices } = require('../controllers/adminNoticeController');

router.use(verifyToken, isAdmin);
router.post('/', createNotice);
router.get('/', getAllNotices);
module.exports = router;
