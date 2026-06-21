const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { getDeposits, updateDeposit, deleteDeposit, markSeen, getUnseenCount } = require('../controllers/depositController');
const multer = require('multer');
const sharp = require('sharp');
const storage = multer.memoryStorage();
const upload = multer({ storage });

const adminAuth = require('../utils/adminAuth');

// Admin Routes
router.get('/', adminAuth, getDeposits);
router.get('/unseen-count', adminAuth, getUnseenCount);
router.put('/mark-seen', adminAuth, markSeen);
router.put('/:id', adminAuth, updateDeposit);
router.delete('/:id', adminAuth, deleteDeposit);

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

        const formatted = deposits.map(d => ({
            id: d.id,
            user_id: d.user_id,
            wallet_from: d.wallet_from,
            wallet_to: d.wallet_to,
            trans_hash: d.trans_hash,
            coin_id: d.coin_id,
            coin_symbol: d.coin_symbol,
            amount: d.amount,
            documents: d.documents,
            status: d.status,
            created_at: d.createdAt,
            updated_at: d.updatedAt,
            coin_name: d.coin_name
        }));

        res.json(formatted);
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
router.post('/', upload.single('documents'), async (req, res) => {
    try {
        const { user_id, amount, coin_id, coin_symbol, coin_name, wallet_from, wallet_to, trans_hash } = req.body;
        const file = req.file;

        if (!user_id) {
            return res.status(400).json({ status: 'error', message: 'user_id is required' });
        }

        let documentBase64 = '';
        if (file) {
            try {
                const compressedBuffer = await sharp(file.buffer)
                    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 60 })
                    .toBuffer();
                documentBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
            } catch (sharpError) {
                console.error('Image compression error:', sharpError);
            }
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
                documents: documentBase64,
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
