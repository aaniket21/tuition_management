const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const {
    createClass,
    getAllClasses,
    getClassById,
    updateClass,
    deleteClass,
    enrollStudent,
    addStudentToClass,
    removeStudentFromClass,
    bulkMoveStudents
} = require('../controllers/adminClassController');

router.use(verifyToken, isAdmin); // Protect all routes in this file

router.post('/', createClass);
router.get('/', getAllClasses);
router.get('/:id', getClassById);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

// Student Management within Classes
router.post('/enroll', enrollStudent); // Legacy support
router.post('/:id/students', addStudentToClass);
router.delete('/:id/students/:studentId', removeStudentFromClass);
router.post('/bulk/move', bulkMoveStudents);

module.exports = router;
