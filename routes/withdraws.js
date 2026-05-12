const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { getWithdrawals, updateWithdrawal, deleteWithdrawal } = require('../controllers/withdrawController');

// Admin Routes
router.get('/', getWithdrawals);
router.put('/:id', updateWithdrawal);
router.delete('/:id', deleteWithdrawal);

// User/DApp Routes
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const withdrawals = await prisma.transaction.findMany({
            where: {
                user_id: userId,
                type: 'withdrawal'
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ status: 'success', withdrawals });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Create withdrawal (used by DApp)
router.post('/', async (req, res) => {
    try {
        const { user_id, amount, coin_id, coin_symbol, coin_name, wallet_to } = req.body;
        const userIdInt = parseInt(user_id);
        const amountFloat = parseFloat(amount);

        // 1. Check if user has enough balance in the specific wallet
        const wallet = await prisma.wallet.findFirst({
            where: { user_id: userIdInt, coin_id: coin_id }
        });

        if (!wallet || parseFloat(wallet.coin_amount) < amountFloat) {
            return res.status(400).json({ status: 'error', message: 'Insufficient balance' });
        }

        // 2. Deduct balance immediately and update total_withdrawals
        // Convert raw coin amount to USDT equivalent for the coin_amount field
        const { convertCoinToUSDT } = require('../utils/converter');
        const usdtEquivalent = await convertCoinToUSDT(amountFloat, coin_id);
        
        const newCoinAmount = (parseFloat(wallet.coin_amount) - usdtEquivalent).toFixed(7);
        const newTotalWithdrawals = (parseFloat(wallet.total_withdrawals || 0) + amountFloat).toFixed(7);
        
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { 
                coin_amount: newCoinAmount.toString(),
                total_withdrawals: newTotalWithdrawals.toString()
            }
        });

        // Also update User main balance field
        const user = await prisma.user.findUnique({ where: { id: userIdInt } });
        if (user) {
            const newBalance = (parseFloat(user.balance || 0) - usdtEquivalent).toFixed(7);
            await prisma.user.update({
                where: { id: user.id },
                data: { balance: newBalance.toString() }
            });
        }

        // 3. Create the withdrawal record
        const withdrawal = await prisma.transaction.create({
            data: {
                user_id: userIdInt,
                type: 'withdrawal',
                amount: amount.toString(),
                coin_id,
                coin_symbol,
                coin_name,
                wallet_to,
                status: 'pending'
            }
        });

        res.status(201).json({ status: 'success', message: 'Withdrawal request created', withdrawal });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
