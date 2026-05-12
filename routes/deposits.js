const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { getDeposits, updateDeposit, deleteDeposit } = require('../controllers/depositController');
const multer = require('multer');
const upload = multer();

// Admin Routes
router.get('/', getDeposits);
router.put('/:id', updateDeposit);
router.delete('/:id', deleteDeposit);

// User/DApp Routes
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const deposits = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                type: 'deposit'
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ status: 'success', deposits });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

router.get('/latest/:userId/coin/:coinId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const deposit = await prisma.transaction.findFirst({
            where: {
                user_id: userId,
                type: 'deposit',
                coin_id: req.params.coinId
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!deposit) {
            return res.status(404).json({ status: 'error', message: 'No deposit found' });
        }

        res.json({ status: 'success', deposit });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Create deposit (used by DApp)
router.post('/', upload.none(), async (req, res) => {
    try {
        const { user_id, amount, coin_id, coin_symbol, coin_name, wallet_from, wallet_to, trans_hash, documents } = req.body;
        
        if (!user_id) {
            return res.status(400).json({ status: 'error', message: 'user_id is required' });
        }

        const deposit = await prisma.transaction.create({
            data: {
                user_id: parseInt(user_id),
                type: 'deposit',
                amount: amount ? amount.toString() : '0',
                coin_id: coin_id?.toString(),
                coin_symbol,
                coin_name,
                wallet_from,
                wallet_to,
                trans_hash,
                documents: documents || '',
                status: 'pending'
            }
        });
        res.status(201).json({ status: 'success', message: 'Deposit request created', deposit });
    } catch (error) {
        console.error('POST /api/v1/deposits error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
