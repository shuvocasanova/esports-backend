const prisma = require('../config/db');
const { settleMiningPayouts } = require('../utils/miningSettler');

const formatPackage = (p) => ({
    id: p.id,
    name: p.name,
    duration_days: p.duration_days,
    daily_rate: p.daily_rate,
    rent_amount: p.rent_amount,
    computing: p.computing,
    power: p.power,
    color: p.color,
    stars: p.stars,
    status: p.status,
    created_at: p.createdAt,
    updated_at: p.updatedAt
});

const formatSubscription = (sub) => ({
    id: sub.id,
    user_id: sub.user_id,
    package_id: sub.package_id,
    quantity: sub.quantity,
    rent_amount: sub.rent_amount,
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

// ── Package Endpoints ──────────────────────────────────────────

const getMiningPackages = async (req, res) => {
    try {
        const packages = await prisma.miningPackage.findMany({
            where: { status: 1 },
            orderBy: { id: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getMiningPackages error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMiningPackagesAdmin = async (req, res) => {
    try {
        const packages = await prisma.miningPackage.findMany({
            orderBy: { id: 'asc' }
        });
        res.json(packages.map(formatPackage));
    } catch (error) {
        console.error('getMiningPackagesAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const createMiningPackage = async (req, res) => {
    try {
        const { name, duration_days, daily_rate, rent_amount, computing, power, color, stars, status } = req.body;
        const created = await prisma.miningPackage.create({
            data: {
                name,
                duration_days: parseInt(duration_days),
                daily_rate: String(daily_rate),
                rent_amount: String(rent_amount),
                computing: String(computing),
                power: String(power),
                color: String(color),
                stars: stars !== undefined ? parseInt(stars) : 5,
                status: status !== undefined ? parseInt(status) : 1
            }
        });
        res.status(201).json(formatPackage(created));
    } catch (error) {
        console.error('createMiningPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const updateMiningPackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, duration_days, daily_rate, rent_amount, computing, power, color, stars, status } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (duration_days !== undefined) updateData.duration_days = parseInt(duration_days);
        if (daily_rate !== undefined) updateData.daily_rate = String(daily_rate);
        if (rent_amount !== undefined) updateData.rent_amount = String(rent_amount);
        if (computing !== undefined) updateData.computing = String(computing);
        if (power !== undefined) updateData.power = String(power);
        if (color !== undefined) updateData.color = String(color);
        if (stars !== undefined) updateData.stars = parseInt(stars);
        if (status !== undefined) updateData.status = parseInt(status);

        await prisma.miningPackage.update({
            where: { id },
            data: updateData
        });

        res.json({ message: 'Package updated' });
    } catch (error) {
        console.error('updateMiningPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

const deleteMiningPackage = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.miningPackage.delete({
            where: { id }
        });
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('deleteMiningPackage error:', error);
        res.status(500).json({ error: error.message });
    }
};

// ── Subscription Endpoints ────────────────────────────────────────

const subscribeMining = async (req, res) => {
    try {
        const { userId, packageId, quantity } = req.body;
        const qty = parseInt(quantity);

        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Please enter a valid quantity' });
        }

        const pkg = await prisma.miningPackage.findUnique({
            where: { id: parseInt(packageId) }
        });
        if (!pkg || pkg.status !== 1) {
            return res.status(400).json({ error: 'Selected mining package is not active' });
        }

        const totalCost = parseFloat(pkg.rent_amount) * qty;

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: parseInt(userId), coin_id: '518' } // USDT is 518
        });
        if (!wallet || parseFloat(wallet.coin_amount) < totalCost) {
            return res.status(400).json({ error: 'Insufficient wallet balance' });
        }

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        if (!user || parseFloat(user.balance) < totalCost) {
            return res.status(400).json({ error: 'Insufficient user balance' });
        }

        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + pkg.duration_days * 24 * 60 * 60 * 1000);

        const [updatedWallet, updatedUser, subscription] = await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    coin_amount: (parseFloat(wallet.coin_amount) - totalCost).toFixed(7)
                }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balance: (parseFloat(user.balance) - totalCost).toFixed(7)
                }
            }),
            prisma.miningSubscription.create({
                data: {
                    user_id: user.id,
                    package_id: pkg.id,
                    quantity: qty,
                    rent_amount: totalCost.toFixed(7),
                    daily_rate: pkg.daily_rate,
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
            message: 'Mining subscription started successfully',
            subscription: formatSubscription(subscription)
        });
    } catch (error) {
        console.error('subscribeMining error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getUserMiningSubscriptions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const subscriptions = await prisma.miningSubscription.findMany({
            where: { user_id: userId },
            include: { package: true, user: true },
            orderBy: { id: 'desc' }
        });
        res.json(subscriptions.map(formatSubscription));
    } catch (error) {
        console.error('getUserMiningSubscriptions error:', error);
        res.status(500).json({ error: error.message });
    }
};

const getMiningSubscriptionsAdmin = async (req, res) => {
    try {
        const subscriptions = await prisma.miningSubscription.findMany({
            include: { package: true, user: true },
            orderBy: { id: 'desc' }
        });
        res.json(subscriptions.map(formatSubscription));
    } catch (error) {
        console.error('getMiningSubscriptionsAdmin error:', error);
        res.status(500).json({ error: error.message });
    }
};

const cancelMiningSubscription = async (req, res) => {
    try {
        const { subscriptionId, userId } = req.body;

        const sub = await prisma.miningSubscription.findUnique({
            where: { id: parseInt(subscriptionId) }
        });

        if (!sub || sub.user_id !== parseInt(userId)) {
            return res.status(404).json({ error: 'Subscription not found' });
        }
        if (sub.status !== 'active') {
            return res.status(400).json({ error: 'Subscription is not active' });
        }

        const refundAmount = parseFloat(sub.rent_amount);

        const wallet = await prisma.wallet.findFirst({
            where: { user_id: sub.user_id, coin_id: '518' }
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

        await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: {
                    coin_amount: (parseFloat(wallet.coin_amount) + refundAmount).toFixed(7)
                }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    balance: (parseFloat(user.balance) + refundAmount).toFixed(7)
                }
            }),
            prisma.miningSubscription.update({
                where: { id: sub.id },
                data: {
                    status: 'cancelled'
                }
            })
        ]);

        res.json({ message: 'Subscription cancelled and rent refunded' });
    } catch (error) {
        console.error('cancelMiningSubscription error:', error);
        res.status(500).json({ error: error.message });
    }
};

const runMiningPayout = async (req, res) => {
    try {
        const io = req.app.get('io');
        await settleMiningPayouts(prisma, io);
        res.json({ message: 'Payout settlement executed successfully' });
    } catch (error) {
        console.error('runMiningPayout error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getMiningPackages,
    getMiningPackagesAdmin,
    createMiningPackage,
    updateMiningPackage,
    deleteMiningPackage,
    subscribeMining,
    getUserMiningSubscriptions,
    getMiningSubscriptionsAdmin,
    cancelMiningSubscription,
    runMiningPayout
};
