const prisma = require('../config/db');

/**
 * GET /api/v1/userbalance/:userId/balance/:coinId
 */
const getUserBalance = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const wallet = await prisma.wallet.findFirst({
            where: {
                user_id: userId,
                coin_id: req.params.coinId
            }
        });

        if (!wallet) {
            return res.status(404).json({ status: 'error', message: 'Wallet not found' });
        }

        res.json({ status: 'success', wallet });
    } catch (error) {
        console.error('getUserBalance error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * PUT /api/v1/userbalance/:userId/balance/:coinId
 * Expects { coinAmount } in body.
 */
const updateUserBalance = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const coinId = req.params.coinId;
        const { coinAmount } = req.body;
        const formattedAmount = parseFloat(coinAmount).toFixed(7);

        // 1. Find the wallet
        const wallet = await prisma.wallet.findFirst({
            where: {
                user_id: userId,
                coin_id: coinId
            }
        });

        if (!wallet) {
            return res.status(404).json({ status: 'error', message: 'Wallet not found' });
        }

        // 2. Update the wallet
        const updatedWallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: { coin_amount: formattedAmount }
        });

        // 3. Update the User's main balance (Total USD equivalent or primary balance)
        // Since we are manually editing a specific coin, we should also update the User's main balance 
        // to reflect the new state. 
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (user) {
            // Note: In a complex system we'd sum all wallets, but for now we'll sync the main balance field
            await prisma.user.update({
                where: { id: userId },
                data: { balance: formattedAmount }
            });
        }

        res.json({ status: 'success', message: 'Balance updated', wallet: updatedWallet });
    } catch (error) {
        console.error('updateUserBalance error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = {
    getUserBalance,
    updateUserBalance
};
