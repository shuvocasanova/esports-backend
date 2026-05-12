const prisma = require('../config/db');

const formatWallet = (w) => ({
    id: w.id,
    coin_id: w.coin_id,
    coin_name: w.coin_name,
    coin_logo: w.coin_logo,
    wallet_network: w.wallet_network,
    coin_symbol: w.coin_symbol,
    wallet_address: w.wallet_address,
    wallet_qr: w.wallet_qr,
    status: w.status,
    created_at: w.createdAt,
    updated_at: w.updatedAt,
    coin_amount: w.coin_amount,
    usd_amount: w.usd_amount,
    total_deposits: w.total_deposits,
    total_withdrawals: w.total_withdrawals,
});

/**
 * GET /api/v1/wallets/user/:userId
 */
const getUserWallets = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        // 1. Fetch system wallets (user_id = 1)
        const systemWallets = await prisma.wallet.findMany({
            where: { user_id: 1 }
        });

        // 2. Fetch user's existing wallets
        let userWallets = await prisma.wallet.findMany({
            where: { user_id: userId }
        });

        // 3. Find missing coins for the user
        const existingCoinIds = new Set(userWallets.map(w => w.coin_id));
        const missingWallets = systemWallets.filter(sw => !existingCoinIds.has(sw.coin_id));

        // 4. Auto-create missing wallets for the user
        if (missingWallets.length > 0) {
            const newWalletsData = missingWallets.map(sw => ({
                user_id: userId,
                coin_id: sw.coin_id,
                coin_name: sw.coin_name,
                coin_logo: sw.coin_logo,
                wallet_network: sw.wallet_network,
                coin_symbol: sw.coin_symbol,
                wallet_address: sw.wallet_address,
                wallet_qr: sw.wallet_qr,
                status: 'active',
                coin_amount: '0.0000000',
                usd_amount: '0.00',
                total_deposits: '0.0000000',
                total_withdrawals: '0.0000000',
            }));

            // Prisma requires creating them individually or using createMany
            await prisma.wallet.createMany({
                data: newWalletsData,
                skipDuplicates: true
            });

            // Refetch updated user wallets
            userWallets = await prisma.wallet.findMany({
                where: { user_id: userId },
                orderBy: { id: 'asc'}
            });
        }

        const formattedWallets = userWallets.map(formatWallet);

        // Calculate totals with precision
        const grandTotalDeposits = userWallets.reduce((sum, w) => sum + parseFloat(w.total_deposits || 0), 0).toFixed(7);
        const grandTotalWithdrawals = userWallets.reduce((sum, w) => sum + parseFloat(w.total_withdrawals || 0), 0).toFixed(7);
        const grandTotalBalance = userWallets.reduce((sum, w) => sum + parseFloat(w.coin_amount || 0), 0).toFixed(7);

        res.json({
            userBalances: formattedWallets,
            grandTotalDeposits,
            grandTotalWithdrawals,
            grandTotalBalance
        });
    } catch (error) {
        console.error('getUserWallets error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/wallets
 */
const getAllWallets = async (req, res) => {
    try {
        // Fetch Admin system wallets. Assuming `user_id = 1` holds system wallets. 
        // Can also add condition OR user.role="admin"
        const wallets = await prisma.wallet.findMany({
            where: { user_id: 1 }, 
            orderBy: { id: 'desc' }
        });
        
        res.json(wallets.map(formatWallet));
    } catch (error) {
        console.error('getAllWallets error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/wallets
 */
const createWallet = async (req, res) => {
    try {
        const { coin_id, coin_name, wallet_network, coin_symbol, wallet_address } = req.body;
        
        // Handle file uploads gracefully
        let coin_logo_path = null;
        let document_path = null;
        
        if (req.files) {
            if (req.files.coin_logo) {
                // normalize backslashes to forward slashes for URLs
                coin_logo_path = req.files.coin_logo[0].path.replace(/\\/g, '/');
            }
            if (req.files.documents) {
                document_path = req.files.documents[0].path.replace(/\\/g, '/');
            }
        }
        
        const wallet = await prisma.wallet.create({
            data: {
                user_id: 1, // Store as SuperAdmin
                coin_id: coin_id || '',
                coin_name: coin_name || '',
                wallet_network: wallet_network || '',
                coin_symbol: coin_symbol || '',
                wallet_address: wallet_address || '',
                coin_logo: coin_logo_path,
                wallet_qr: document_path,
                status: 'active',
                coin_amount: '0.0000000',
                usd_amount: '0.00',
                total_deposits: '0.0000000',
                total_withdrawals: '0.0000000'
            }
        });

        res.status(201).json(formatWallet(wallet));
    } catch (error) {
        console.error('createWallet error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/wallets/:id
 */
const updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const { coin_id, coin_name, wallet_network, coin_symbol, wallet_address, status } = req.body;
        
        const updateData = {};
        if (coin_id !== undefined) updateData.coin_id = coin_id;
        if (coin_name !== undefined) updateData.coin_name = coin_name;
        if (wallet_network !== undefined) updateData.wallet_network = wallet_network;
        if (coin_symbol !== undefined) updateData.coin_symbol = coin_symbol;
        if (wallet_address !== undefined) updateData.wallet_address = wallet_address;
        if (status !== undefined) updateData.status = status;
        
        if (req.files) {
            if (req.files.coin_logo) {
                updateData.coin_logo = req.files.coin_logo[0].path.replace(/\\/g, '/');
            }
            if (req.files.documents) {
                updateData.wallet_qr = req.files.documents[0].path.replace(/\\/g, '/');
            }
        }

        const wallet = await prisma.wallet.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({ message: 'Wallet updated', wallet: formatWallet(wallet) });
    } catch (error) {
        console.error('updateWallet error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/wallets/:id
 */
const deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.wallet.delete({
            where: { id: parseInt(id) }
        });
        
        res.json({ message: 'Wallet deleted' });
    } catch (error) {
        console.error('deleteWallet error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUserWallets,
    getAllWallets,
    createWallet,
    updateWallet,
    deleteWallet
};
