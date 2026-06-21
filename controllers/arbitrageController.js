const prisma = require('../config/db');

// Map database record to frontend API response structure
const formatPackage = (p) => ({
    id: p.id,
    name: p.name,
    duration_days: p.duration_days,
    daily_rate_min: p.daily_rate_min,
    daily_rate_max: p.daily_rate_max,
    min_amount: p.min_amount,
    max_amount: p.max_amount,
    status: p.status,
    created_at: p.createdAt,
    updated_at: p.updatedAt
});

const formatSubscription = (sub) => ({
    id: sub.id,
    user_id: sub.user_id,
    package_id: sub.package_id,
    coin_id: sub.coin_id,
    amount: sub.amount,
    daily_rate: sub.daily_rate,
    total_earned: sub.total_earned,
    status: sub.status,
    start_date: sub.start_date,
    end_date: sub.end_date,
    last_paid_at: sub.last_paid_at,
    created_at: sub.createdAt,
    updated_at: sub.updatedAt,
    package_name: sub.package?.name || null,
    duration_days: sub.package?.duration_days || 0,
    user_name: sub.user?.name || null,
    user_uuid: sub.user?.uuid || null
});

// ── Packages Endpoints ──────────────────────────────────────────

const getPackages = async (req, res) => {
    try {
        const packages = await prisma.arbitragePackage.findMany({
            where: { status: 1 },
            orderBy: { id: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getPackages error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getPackagesAdmin = async (req, res) => {
    try {
        const packages = await prisma.arbitragePackage.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getPackagesAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createPackage = async (req, res) => {
    try {
        const { name, duration_days, daily_rate_min, daily_rate_max, min_amount, max_amount, status } = req.body;
        const created = await prisma.arbitragePackage.create({
            data: {
                name,
                duration_days: parseInt(duration_days),
                daily_rate_min: String(daily_rate_min),
                daily_rate_max: String(daily_rate_max),
                min_amount: min_amount ? String(min_amount) : '0.0000000',
                max_amount: max_amount ? String(max_amount) : '0.0000000',
                status: status !== undefined ? parseInt(status) : 1
            }
        });
        res.status(201).json(formatPackage(created));
    } catch (error) {
        console.error('createPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updatePackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, duration_days, daily_rate_min, daily_rate_max, min_amount, max_amount, status } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (duration_days !== undefined) updateData.duration_days = parseInt(duration_days);
        if (daily_rate_min !== undefined) updateData.daily_rate_min = String(daily_rate_min);
        if (daily_rate_max !== undefined) updateData.daily_rate_max = String(daily_rate_max);
        if (min_amount !== undefined) updateData.min_amount = String(min_amount);
        if (max_amount !== undefined) updateData.max_amount = String(max_amount);
        if (status !== undefined) updateData.status = parseInt(status);

        await prisma.arbitragePackage.update({
            where: { id },
            data: updateData
        });
        
        res.json({ message: 'Package updated successfully' });
    } catch (error) {
        console.error('updatePackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deletePackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.arbitragePackage.delete({
            where: { id }
        });
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('deletePackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Subscriptions Endpoints ──────────────────────────────────────

const subscribePackage = async (req, res) => {
    try {
        const { userId, packageId, coinId, amount } = req.body;
        const amountFloat = parseFloat(amount);

        if (isNaN(amountFloat) || amountFloat <= 0) {
            return res.status(400).json({ error: 'Please enter a valid amount' });
        }

        const pkg = await prisma.arbitragePackage.findUnique({
            where: { id: parseInt(packageId) }
        });
        if (!pkg || pkg.status !== 1) {
            return res.status(400).json({ error: 'Selected package is not active' });
        }

        if (amountFloat < parseFloat(pkg.min_amount)) {
            return res.status(400).json({ error: `Minimum subscription amount is ${pkg.min_amount}` });
        }
        if (amountFloat > parseFloat(pkg.max_amount)) {
            return res.status(400).json({ error: `Maximum subscription amount is ${pkg.max_amount}` });
        }

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: parseInt(userId), coin_id: String(coinId) }
        });
        if (!wallet || parseFloat(wallet.coin_amount) < amountFloat) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!user || parseFloat(user.balance) < amountFloat) {
            return res.status(400).json({ error: 'Insufficient user balance' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);

        // Generate daily rate randomly between min and max
        const minRate = parseFloat(pkg.daily_rate_min);
        const maxRate = parseFloat(pkg.daily_rate_max);
        const rate = (minRate + Math.random() * (maxRate - minRate)).toFixed(2);

        const [updatedWallet, updatedUser, subscription] = await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    coin_amount: (parseFloat(wallet.coin_amount) - amountFloat).toFixed(7)
                }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balance: (parseFloat(user.balance) - amountFloat).toFixed(7)
                }
            }),
            prisma.arbitrageSubscription.create({
                data: {
                    user_id: user.id,
                    package_id: pkg.id,
                    coin_id: String(coinId),
                    amount: amountFloat.toFixed(7),
                    daily_rate: rate,
                    total_earned: '0.0000000',
                    status: 'active',
                    start_date: startDate,
                    end_date: endDate
                },
                include: {
                    package: true,
                    user: true
                }
            })
        ]);

        res.status(201).json({
            message: 'Subscribed successfully',
            subscription: formatSubscription(subscription)
        });
    } catch (error) {
        console.error('subscribePackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getUserSubscriptions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const subscriptions = await prisma.arbitrageSubscription.findMany({
            where: { user_id: userId },
            include: { package: true, user: true },
            orderBy: { id: 'desc' }
        });
        res.json(subscriptions.map(formatSubscription));
    } catch (error) {
        console.error('getUserSubscriptions error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getSubscriptionsAdmin = async (req, res) => {
    try {
        const subscriptions = await prisma.arbitrageSubscription.findMany({
            include: { package: true, user: true },
            orderBy: { id: 'desc' }
        });
        res.json(subscriptions.map(formatSubscription));
    } catch (error) {
        console.error('getSubscriptionsAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const cancelSubscription = async (req, res) => {
    try {
        const { subscriptionId, userId } = req.body;

        const sub = await prisma.arbitrageSubscription.findUnique({
            where: { id: parseInt(subscriptionId) },
            include: { package: true }
        });

        if (!sub || sub.user_id !== parseInt(userId)) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        if (sub.status !== 'active') {
            return res.status(400).json({ error: 'Subscription is not active' });
        }

        const amountFloat = parseFloat(sub.amount);

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: sub.user_id, coin_id: sub.coin_id }
        });
        if (!wallet) {
            return res.status(404).json({ error: 'User wallet not found' });
        }

        const user = await prisma.user.findUnique({
            where: { id: sub.user_id }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Refund principal in transaction
        await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    coin_amount: (parseFloat(wallet.coin_amount) + amountFloat).toFixed(7)
                }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balance: (parseFloat(user.balance) + amountFloat).toFixed(7)
                }
            }),
            prisma.arbitrageSubscription.update({
                where: { id: sub.id },
                data: {
                    status: 'cancelled'
                }
            })
        ]);

        res.json({ message: 'Subscription cancelled and principal returned to balance' });
    } catch (error) {
        console.error('cancelSubscription error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPackages,
    getPackagesAdmin,
    createPackage,
    updatePackage,
    deletePackage,
    subscribePackage,
    getUserSubscriptions,
    getSubscriptionsAdmin,
    cancelSubscription
};
