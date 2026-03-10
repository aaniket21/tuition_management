const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { createNotice, getAllNotices, updateNotice, deleteNotice } = require('../controllers/adminNoticeController');

router.use(verifyToken, isAdmin);
router.post('/', createNotice);
router.get('/', getAllNotices);
router.put('/:id', updateNotice);
router.delete('/:id', deleteNotice);

module.exports = router;
