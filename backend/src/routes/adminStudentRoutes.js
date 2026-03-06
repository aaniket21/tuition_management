const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const { createStudent, getAllStudents, updateStudent, deleteStudent, updateStudentStatus, bulkDeleteStudents, bulkUpdateStatus } = require('../controllers/adminStudentController');

router.use(verifyToken, isAdmin); // Protect all routes in this file

router.post('/', createStudent);
router.get('/', getAllStudents);
router.post('/bulk-delete', bulkDeleteStudents);
router.put('/bulk-status', bulkUpdateStatus);
router.put('/:id', updateStudent);
router.put('/:id/status', updateStudentStatus);
router.delete('/:id', deleteStudent);

module.exports = router;
