const express = require('express');
const router = express.Router();
const { verifyToken, isParent } = require('../middlewares/authMiddleware');
const { getChildrenProfile, getChildFees, getNotices } = require('../controllers/parentController');

router.use(verifyToken, isParent);

router.get('/children', getChildrenProfile);
router.get('/fees', getChildFees);
router.get('/notices', getNotices);

module.exports = router;
