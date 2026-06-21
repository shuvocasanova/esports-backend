const prisma = require('../config/db');

/**
 * Background runner to settle arbitrage yields and return principal on end_date.
 */
const settleArbitragePayouts = async (prismaInstance, io) => {
    try {
        const activeSubscriptions = await prismaInstance.arbitrageSubscription.findMany({
            where: { status: 'active' },
            include: { user: true, package: true }
        });

        if (activeSubscriptions.length === 0) return;

        const now = new Date();
        const DAY_IN_MS = 24 * 60 * 60 * 1000;
        
        // Custom check interval (e.g. for testing)
        const testIntervalMs = process.env.TEST_PAYOUT_INTERVAL_MS 
            ? parseInt(process.env.TEST_PAYOUT_INTERVAL_MS) 
            : null;

        for (const sub of activeSubscriptions) {
            const start = new Date(sub.start_date);
            const end = new Date(sub.end_date);
            const lastPaid = sub.last_paid_at ? new Date(sub.last_paid_at) : start;

            let isPayoutDue = false;
            let isFinalDay = false;

            if (testIntervalMs) {
                // Testing/Interval-based mode
                isFinalDay = now >= end;
                const nextPayoutDue = new Date(lastPaid.getTime() + testIntervalMs);
                isPayoutDue = now >= nextPayoutDue;
            } else {
                // Production midnight cron mode (calendar-based)
                const todayStr = now.toDateString();
                const lastPaidStr = sub.last_paid_at ? new Date(sub.last_paid_at).toDateString() : null;
                const startStr = start.toDateString();

                // Payout is due if it has not been paid today, and was not started today
                isPayoutDue = lastPaidStr !== todayStr && (sub.last_paid_at !== null || startStr !== todayStr);

                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
                isFinalDay = todayMidnight >= endMidnight;
            }

            if (!isPayoutDue && !isFinalDay) {
                continue; // Neither daily payout nor final completion is due
            }

            console.log(`[ArbitrageSettler] Processing sub #${sub.id} (user #${sub.user_id}, pkg: ${sub.package?.name}, isPayoutDue: ${isPayoutDue}, isFinalDay: ${isFinalDay})`);

            const amountFloat = parseFloat(sub.amount);
            const dailyRateFloat = parseFloat(sub.daily_rate);
            
            // Only pay interest if payout is due
            const interest = isPayoutDue ? amountFloat * (dailyRateFloat / 100) : 0;

            let totalCredit = interest;
            let nextStatus = 'active';

            if (isFinalDay) {
                totalCredit += amountFloat; // Return the principal
                nextStatus = 'completed';
                console.log(`[ArbitrageSettler] final payout for sub #${sub.id}. Returning principal ${amountFloat}`);
            }

            // Find user wallet & user record
            const wallet = await prismaInstance.wallet.findFirst({
                where: { user_id: sub.user_id, coin_id: sub.coin_id }
            });

            const user = await prismaInstance.user.findUnique({
                where: { id: sub.user_id }
            });

            if (wallet && user) {
                const newCoinAmount = (parseFloat(wallet.coin_amount) + totalCredit).toFixed(7);
                const newBalance = (parseFloat(user.balance) + totalCredit).toFixed(7);
                const newTotalEarned = (parseFloat(sub.total_earned) + interest).toFixed(7);

                await prismaInstance.$transaction([
                    prismaInstance.wallet.update({
                        where: { id: wallet.id },
                        data: { coin_amount: newCoinAmount }
                    }),
                    prismaInstance.user.update({
                        where: { id: user.id },
                        data: { balance: newBalance }
                    }),
                    prismaInstance.arbitrageSubscription.update({
                        where: { id: sub.id },
                        data: {
                            total_earned: newTotalEarned,
                            last_paid_at: now,
                            status: nextStatus
                        }
                    })
                ]);

                console.log(`[ArbitrageSettler] Credited ${totalCredit.toFixed(7)} to wallet #${wallet.id} (USDT value)`);

                // Emit live Socket.IO update if frontend is listening
                if (io) {
                    io.emit('updateArbitrageSubscription', {
                        id: sub.id,
                        user_id: sub.user_id,
                        status: nextStatus,
                        total_earned: newTotalEarned,
                        last_paid_at: now
                    });
                }
            } else {
                console.warn(`[ArbitrageSettler] Skipping sub #${sub.id}: wallet or user not found`);
            }
        }
    } catch (error) {
        console.error('[ArbitrageSettler] Error during payout settlement:', error.message);
    }
};

module.exports = { settleArbitragePayouts };
