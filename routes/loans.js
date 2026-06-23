const express = require('express');
const router = express.Router();
const multer = require('multer');
const adminAuth = require('../utils/adminAuth');

const {
    getLoanPackages,
    getLoanPackagesAdmin,
    createLoanPackage,
    updateLoanPackage,
    deleteLoanPackage,
    submitLoan,
    getMyLoans,
    getAllLoans,
    getLoanById,
    approveLoan,
    rejectLoan,
    deleteLoan
} = require('../controllers/loanController');

// Multer memory storage configuration for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// ── User Endpoints ─────────────────────────────────────────────

// GET /api/v1/loans/packages (List active packages)
router.get('/packages', getLoanPackages);

// POST /api/v1/loans (Submit a loan application)
router.post(
    '/',
    upload.fields([
        { name: 'credit_front', maxCount: 1 },
        { name: 'credit_back', maxCount: 1 },
        { name: 'id_card', maxCount: 1 }
    ]),
    submitLoan
);

// GET /api/v1/loans (Get user loans)
router.get('/', getMyLoans);

// ── Admin Endpoints ────────────────────────────────────────────

// GET /api/v1/loans/admin/packages (Get all packages)
router.get('/admin/packages', adminAuth, getLoanPackagesAdmin);

// POST /api/v1/loans/admin/packages (Create new package)
router.post('/admin/packages', adminAuth, createLoanPackage);

// PUT /api/v1/loans/admin/packages/:id (Update package)
router.put('/admin/packages/:id', adminAuth, updateLoanPackage);

// DELETE /api/v1/loans/admin/packages/:id (Delete package)
router.delete('/admin/packages/:id', adminAuth, deleteLoanPackage);

// GET /api/v1/loans/admin/loans (Get all loan applications)
router.get('/admin/loans', adminAuth, getAllLoans);

// GET /api/v1/loans/admin/loans/:id (Get loan details by ID)
router.get('/admin/loans/:id', adminAuth, getLoanById);

// PUT /api/v1/loans/admin/loans/:id/approve (Approve loan)
router.put('/admin/loans/:id/approve', adminAuth, approveLoan);

// PUT /api/v1/loans/admin/loans/:id/reject (Reject loan)
router.put('/admin/loans/:id/reject', adminAuth, rejectLoan);

// DELETE /api/v1/loans/admin/loans/:id (Delete loan application record)
router.delete('/admin/loans/:id', adminAuth, deleteLoan);

module.exports = router;
