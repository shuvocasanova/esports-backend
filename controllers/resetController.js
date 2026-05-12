const prisma = require('../config/db');

/**
 * POST /api/v1/reset
 * "Danger Zone" — wipes all user-generated data (trade orders, transactions,
 * messages) but preserves admin users, settings, and timer profits.
 * Only callable by superadmin (frontend enforces this via role check).
 */
const resetAllData = async (req, res) => {
    try {
        // Delete in dependency order (FK constraints)
        await prisma.message.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.tradeOrder.deleteMany({});

        // Remove non-admin users and their wallets
        const adminUsers = await prisma.user.findMany({
            where: { role: { in: ['admin', 'superadmin'] } },
            select: { id: true },
        });
        const adminIds = adminUsers.map((u) => u.id);

        await prisma.wallet.deleteMany({
            where: { user_id: { notIn: adminIds } },
        });

        await prisma.user.deleteMany({
            where: { id: { notIn: adminIds } },
        });

        res.json({ message: 'Reset successful. All user data has been cleared.' });
    } catch (error) {
        console.error('resetAllData error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { resetAllData };
