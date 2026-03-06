const express = require('express');
const router = express.Router();
const adminEventController = require('../controllers/adminEventController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Need to make sure the user is Admin
router.use(verifyToken, isAdmin);

router.get('/', adminEventController.getEvents);
router.post('/', adminEventController.createEvent);
router.put('/:id', adminEventController.updateEvent);
router.delete('/:id', adminEventController.deleteEvent);

module.exports = router;
