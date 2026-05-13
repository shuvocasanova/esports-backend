require('dotenv').config();

/**
 * Parses delivery_time strings like "60S", "1H", "2D", "1W", "1M" into milliseconds.
 */
const parseDuration = (str) => {
    if (!str) return 0;
    const match = str.match(/^(\d+)([SHDWMY])$/i);
    if (!match) return 0;
    const value = parseInt(match[1]);
    const unit = match[2].toUpperCase();
    const map = {
        S: 1000,
        H: 3600000,
        D: 86400000,
        W: 604800000,
        M: 2592000000,
        Y: 31536000000,
    };
    return value * (map[unit] || 0);
};

/**
 * Core settlement function — called by the cron interval.
 * Finds all running orders whose timer has expired and settles them.
 */
const settleExpiredOrders = async (prisma, io) => {
    try {
        const runningOrders = await prisma.tradeOrder.findMany({
            where: { status: 'running' },
        });

        if (runningOrders.length === 0) return;

        const now = Date.now();

        for (const order of runningOrders) {
            const duration = parseDuration(order.delivery_time);
            if (duration === 0) continue;

            const expiry = new Date(order.createdAt).getTime() + duration;
            if (now < expiry) continue; // Not expired yet

            console.log(`[Settler] Settling order #${order.id} (${order.delivery_time}, is_profit=${order.is_profit})`);

            let actualPayout = '0';

            if (order.is_profit === 1) {
                // Profit formula: amount + (amount × profit_level%) − (amount × 0.1% fee)
                const amount = parseFloat(order.amount || '0');
                const profitLevel = parseFloat(order.profit_level || '0');
                const profit = amount * (profitLevel / 100);
                const fee = amount * 0.001;
                const payout = amount + profit - fee;
                actualPayout = payout.toFixed(7);

                // Credit the user's wallet
                const wallet = await prisma.wallet.findFirst({
                    where: {
                        user_id: order.user_id,
                        coin_id: order.wallet_coin_id,
                    },
                });

                if (wallet) {
                    const newBalance = (parseFloat(wallet.coin_amount || '0') + payout).toFixed(7);
                    await prisma.wallet.update({
                        where: { id: wallet.id },
                        data: { coin_amount: newBalance },
                    });
                    console.log(`[Settler] Credited ${actualPayout} to wallet #${wallet.id} (user ${order.user_id})`);
                } else {
                    console.warn(`[Settler] Wallet not found for user ${order.user_id}, coin ${order.wallet_coin_id}`);
                }
            } else {
                // Loss — balance already deducted on placement, nothing to credit
                console.log(`[Settler] Loss outcome for order #${order.id} — no balance change`);
            }

            // Mark the order as finished
            const updatedOrder = await prisma.tradeOrder.update({
                where: { id: order.id },
                data: {
                    status: 'finished',
                    profit_amount: actualPayout,
                    delivery_price: order.purchase_price, // Use purchase price as fallback
                },
            });

            // Emit real-time update to frontend
            if (io) {
                io.emit('updateTradeStatus', {
                    ...updatedOrder,
                    created_at: updatedOrder.createdAt,
                    updated_at: updatedOrder.updatedAt,
                });
            }
        }
    } catch (error) {
        console.error('[Settler] Error settling orders:', error.message);
    }
};

module.exports = { settleExpiredOrders, parseDuration };
