const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getUserWallets, getAllWallets, createWallet, updateWallet, deleteWallet } = require('../controllers/walletController');

// Configure Multer for file uploads in memory (to save as base64 in DB)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Multer middleware for expected file fields
const walletUploads = upload.fields([
    { name: 'coin_logo', maxCount: 1 },
    { name: 'wallet_qr', maxCount: 1 } 
]);


// Admin routes for managing platform wallets
router.get('/', getAllWallets);
router.post('/', walletUploads, createWallet);
router.put('/:id', walletUploads, updateWallet);
router.delete('/:id', deleteWallet);

// GET /api/v1/wallets/user/:userId
router.get('/user/:userId', getUserWallets);

module.exports = router;
