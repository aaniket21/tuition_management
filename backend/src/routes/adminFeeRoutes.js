const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const {
    createFeeStructure,
    getFeeStructures,
    updateFeeStructure,
    deleteFeeStructure,
    getStudentFees,
    getFeePaymentHistory,
    updateStudentFee,
    collectPayment,
    getReports,
    generateMonthlyFees,
    updatePayment,
    deletePayment
} = require('../controllers/adminFeeController');

router.use(verifyToken, isAdmin);

// Fee Structures
router.post('/structures', createFeeStructure);
router.get('/structures', getFeeStructures);
router.put('/structures/:id', updateFeeStructure);
router.delete('/structures/:id', deleteFeeStructure);

// Student Fees & Payments
router.get('/students', getStudentFees);
router.get('/students/:id/payments', getFeePaymentHistory);
router.put('/students/:id', updateStudentFee);
router.post('/collect', collectPayment);
router.put('/payments/:id', updatePayment);
router.delete('/payments/:id', deletePayment);

// Reports
router.get('/reports', getReports);
router.post('/generate-monthly', generateMonthlyFees);

module.exports = router;
