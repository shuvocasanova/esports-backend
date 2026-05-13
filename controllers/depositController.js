const prisma = require('../config/db');

/**
 * Format deposit for frontend exactly as the live API does
 */
const formatDeposit = (d) => ({
    id: d.id,
    user_id: d.user_id,
    wallet_from: d.wallet_from,
    wallet_to: d.wallet_to,
    trans_hash: d.trans_hash,
    coin_id: d.coin_id,
    amount: d.amount,
    documents: d.documents,
    status: d.status,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
    user_uuid: d.user?.uuid,
    user_employee: d.user?.employee,
    coin_name: d.coin_name
});

/**
 * GET /api/v1/deposits
 */
const getDeposits = async (req, res) => {
    try {
        const deposits = await prisma.transaction.findMany({
            where: { type: 'deposit' },
            include: { user: true },
            orderBy: { id: 'desc' }
        });
        res.json(deposits.map(formatDeposit));
    } catch (error) {
        console.error('getDeposits error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/deposits/:id
 */
const updateDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, status, wallet_from, wallet_to, trans_hash } = req.body;

        console.log(`[DepositUpdate] ID: ${id}, New Status: ${status}, New Amount: ${amount}`);

        // Fetch current deposit to check old status and get user/coin info
        const currentDeposit = await prisma.transaction.findUnique({
            where: { id: parseInt(id) }
        });

        if (!currentDeposit) {
            console.log(`[DepositUpdate] Error: Deposit ${id} not found`);
            return res.status(404).json({ message: 'Deposit not found' });
        }

        // Update the deposit record
        await prisma.transaction.update({
            where: { id: parseInt(id) },
            data: { 
                amount: amount ? amount.toString() : undefined,
                status: status,
                wallet_from: wallet_from,
                wallet_to: wallet_to,
                trans_hash: trans_hash
            }
        });

        // If status is changing to approved, increase user balance
        if (status === 'approved' && currentDeposit.status !== 'approved') {
            const depositAmount = parseFloat(amount || currentDeposit.amount);
            const coinId = currentDeposit.coin_id;
            
            console.log(`[DepositUpdate] Approving. Raw amount to add: ${depositAmount} for coin ${coinId}`);
            
            // Convert raw coin amount to USDT equivalent for the coin_amount field
            const { convertCoinToUSDT } = require('../utils/converter');
            const usdtEquivalent = await convertCoinToUSDT(depositAmount, coinId);
            console.log(`[DepositUpdate] USDT equivalent: ${usdtEquivalent}`);
            
            // 1. Update the specific coin wallet
            let wallet = await prisma.wallet.findFirst({
                where: { 
                    user_id: currentDeposit.user_id,
                    coin_id: coinId
                }
            });

            if (wallet) {
                console.log(`[DepositUpdate] Found wallet ${wallet.id}. Current balance (USDT): ${wallet.coin_amount}`);
                
                // coin_amount stores USDT value
                const newCoinAmount = (parseFloat(wallet.coin_amount) + usdtEquivalent).toFixed(7);
                // total_deposits stores RAW coin amount
                const newTotalDeposits = (parseFloat(wallet.total_deposits || 0) + depositAmount).toFixed(7);
                
                await prisma.wallet.update({
                    where: { id: wallet.id },
                    data: { 
                        coin_amount: newCoinAmount.toString(),
                        total_deposits: newTotalDeposits.toString()
                    }
                });
                console.log(`[DepositUpdate] Wallet updated. New USDT balance: ${newCoinAmount}`);
            }

            // 2. Update the User's main balance field (also in USDT)
            const user = await prisma.user.findUnique({
                where: { id: currentDeposit.user_id }
            });

            if (user) {
                const newBalance = (parseFloat(user.balance || 0) + usdtEquivalent).toFixed(7);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { balance: newBalance.toString() }
                });
                console.log(`[DepositUpdate] User main balance updated to: ${newBalance}`);
            }
        }

        res.json({ message: 'Deposit updated successfully' });
    } catch (error) {
        console.error('updateDeposit error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/deposits/:id
 */
const deleteDeposit = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.transaction.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Deposit deleted successfully' });
    } catch (error) {
        console.error('deleteDeposit error:', error);
        res.status(500).json({ error: error.message });
    }
};

const markSeen = async (req, res) => {
    try {
        await prisma.transaction.updateMany({
            where: {
                type: 'deposit',
                is_seen: false
            },
            data: { is_seen: true }
        });
        res.json({ message: 'All deposits marked as seen' });
    } catch (error) {
        console.error('markSeen error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getUnseenCount = async (req, res) => {
    try {
        const count = await prisma.transaction.count({
            where: {
                type: 'deposit',
                is_seen: false
            }
        });
        res.json({ count });
    } catch (error) {
        console.error('getUnseenCount error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getDeposits,
    updateDeposit,
    deleteDeposit,
    markSeen,
    getUnseenCount
};
