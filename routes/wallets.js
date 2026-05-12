const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getUserWallets, getAllWallets, createWallet, updateWallet, deleteWallet } = require('../controllers/walletController');

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save files to backend/uploads
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Multer middleware for expected file fields
const walletUploads = upload.fields([
    { name: 'coin_logo', maxCount: 1 },
    { name: 'documents', maxCount: 1 } // frontend uses 'documents' for the QR code
]);

// Admin routes for managing platform wallets
router.get('/', getAllWallets);
router.post('/', walletUploads, createWallet);
router.put('/:id', walletUploads, updateWallet);
router.delete('/:id', deleteWallet);

// GET /api/v1/wallets/user/:userId
router.get('/user/:userId', getUserWallets);

module.exports = router;
