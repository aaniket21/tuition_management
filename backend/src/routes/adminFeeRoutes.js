const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { setFeePlan, recordPayment } = require('../controllers/adminFeeController');

router.use(verifyToken, isAdmin);
router.post('/set-plan', setFeePlan);
router.post('/record-payment', recordPayment);
module.exports = router;
