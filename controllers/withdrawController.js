const prisma = require('../config/db');

/**
 * Format withdrawal for frontend exactly as the live API does
 */
const formatWithdrawal = (w) => ({
    id: w.id,
    user_id: w.user_id,
    wallet_from: w.wallet_from,
    wallet_to: w.wallet_to,
    trans_hash: w.trans_hash,
    coin_id: w.coin_id,
    amount: w.amount,
    documents: w.documents,
    status: w.status,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
    user_uuid: w.user?.uuid,
    user_employee: w.user?.employee,
    coin_name: w.coin_name
});

/**
 * GET /api/v1/withdraws
 */
const getWithdrawals = async (req, res) => {
    try {
        const withdrawals = await prisma.transaction.findMany({
            where: { type: 'withdrawal' },
            include: { user: true },
            orderBy: { id: 'desc' }
        });
        res.json(withdrawals.map(formatWithdrawal));
    } catch (error) {
        console.error('getWithdrawals error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/withdraws/:id
 */
const updateWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, status, trans_hash } = req.body;

        // Fetch current withdrawal to check old status
        const currentWithdrawal = await prisma.transaction.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentWithdrawal) {
            return res.status(404).json({ message: 'Withdrawal not found' });
        }

        // Update the withdrawal record
        await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: { 
                amount: amount ? amount.toString() : undefined,
                status: status,
                trans_hash: trans_hash
            }
        });

        // Refund Logic: If status is changing to rejected, return funds to user and decrease total_withdrawals
        if (status === 'rejected' && currentWithdrawal.status !== 'rejected' && currentWithdrawal.status !== 'approved') {
            const refundAmountRaw = parseFloat(amount || currentWithdrawal.amount);
            const coinId = currentWithdrawal.coin_id;

            // Convert raw coin amount to USDT equivalent for the coin_amount field
            const { convertCoinToUSDT } = require('../utils/converter');
            const usdtEquivalent = await convertCoinToUSDT(refundAmountRaw, coinId);
            
            // 1. Update the specific coin wallet
            const wallet = await prisma.wallet.findFirst({
                where: { 
                    user_id: currentWithdrawal.user_id,
                    coin_id: coinId
                }
            });

            if (wallet) {
                const newCoinAmount = (parseFloat(wallet.coin_amount) + usdtEquivalent).toFixed(7);
                const newTotalWithdrawals = Math.max(0, (parseFloat(wallet.total_withdrawals || 0) - refundAmountRaw)).toFixed(7);
                
                await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { 
                        coin_amount: newCoinAmount.toString(),
                        total_withdrawals: newTotalWithdrawals.toString()
                    }
                });
            }

            // 2. Update the User's main balance
            const user = await prisma.user.findUnique({
                where: { id: currentWithdrawal.user_id }
            });

            if (user) {
                const newBalance = (parseFloat(user.balance || 0) + usdtEquivalent).toFixed(7);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { balance: newBalance.toString() }
                });
            }
        }

        res.json({ message: 'Withdrawal updated successfully' });
    } catch (error) {
        console.error('updateWithdrawal error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/withdraws/:id
 */
const deleteWithdrawal = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.transaction.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Withdrawal deleted successfully' });
    } catch (error) {
        console.error('deleteWithdrawal error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getWithdrawals,
    updateWithdrawal,
    deleteWithdrawal
};
