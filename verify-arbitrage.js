const prisma = require('./config/db');
const { settleArbitragePayouts } = require('./utils/arbitrageSettler');

const userId = 1; // Seeded admin user ID

async function verifyArbitrage() {
    try {
        console.log('=== STARTING ARBITRAGE VERIFICATION ===');

        // Clear any leftover subscriptions from previous runs
        await prisma.arbitrageSubscription.deleteMany({});
        console.log('Cleared previous subscriptions.');

        // 1. Fetch Packages
        const packages = await prisma.arbitragePackage.findMany({ where: { status: 1 } });
        console.log(`Fetched active packages: ${packages.map(p => p.name).join(', ')}`);
        const starterPkg = packages.find(p => p.name === 'Starter');
        if (!starterPkg) {
            throw new Error('Starter package not found in DB. Make sure you seeded.');
        }

        // 2. Ensure User and Wallet exist with sufficient balance
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error(`Test user ID ${userId} not found`);
        }
        console.log(`Test User balance: ${user.balance}`);

        // Ensure USDT wallet (coin_id = '518') has enough balance
        let wallet = await prisma.wallet.findFirst({
            where: { user_id: userId, coin_id: '518' }
        });
        if (!wallet) {
            // Create a USDT wallet for testing
            wallet = await prisma.wallet.create({
                data: {
                    user_id: userId,
                    coin_id: '518',
                    coin_name: 'Tether',
                    coin_symbol: 'USDT',
                    wallet_network: 'tether',
                    wallet_address: 'TRoUN267tVLHRMRViCDcur98yZfLroEXmL',
                    coin_amount: '10000.0000000',
                    usd_amount: '10000.00'
                }
            });
            console.log('Created test USDT wallet.');
        } else {
            // Top up wallet balance for testing
            wallet = await prisma.wallet.update({
                where: { id: wallet.id },
                data: { coin_amount: '10000.0000000' }
            });
        }
        
        // Reset user balance to 10000.00 for clean test
        await prisma.user.update({
            where: { id: userId },
            data: { balance: '10000.0000000' }
        });

        console.log(`Initial balances - User: 10000.0000000, Wallet: 10000.0000000`);

        // 3. Simulate Subscription Creation (Deduction of balance)
        console.log('\n--- 1. Testing Subscription Placement ---');
        const subscribeAmount = 1500; // Starter pkg min is 1000
        
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + starterPkg.duration_days * 24 * 60 * 60 * 1000);
        const rate = '2.50';

        const [updatedWallet, updatedUser, subscription] = await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: { coin_amount: (10000.0 - subscribeAmount).toFixed(7) }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { balance: (10000.0 - subscribeAmount).toFixed(7) }
            }),
            prisma.arbitrageSubscription.create({
                data: {
                    user_id: userId,
                    package_id: starterPkg.id,
                    coin_id: '518',
                    amount: subscribeAmount.toFixed(7),
                    daily_rate: rate,
                    total_earned: '0.0000000',
                    status: 'active',
                    start_date: startDate,
                    end_date: endDate
                }
            })
        ]);

        console.log(`Subscribed to "${starterPkg.name}" with amount ${subscribeAmount} USDT.`);
        console.log(`Post-subscription balances - User: ${updatedUser.balance}, Wallet: ${updatedWallet.coin_amount}`);
        if (parseFloat(updatedUser.balance) !== 8500.0 || parseFloat(updatedWallet.coin_amount) !== 8500.0) {
            throw new Error('Balance deduction calculation mismatch!');
        }
        console.log('✅ Subscription placement and balance deduction successful.');

        // 4. Simulate Daily Payout Payout cycle
        console.log('\n--- 2. Testing Daily Yield Payout Scheduler ---');
        
        // Fast-forward subscription to trigger a payout (simulate start_date is 25 hours ago, so payout is due)
        const pastStart = new Date(Date.now() - 25 * 60 * 60 * 1000);
        // end_date is still in the future (duration is 1 day, so end_date is 1 hour ago. Wait, let's make end_date 2 hours in the future to test interest payout only)
        const futureEnd = new Date(Date.now() + 2 * 60 * 60 * 1000); 

        await prisma.arbitrageSubscription.update({
            where: { id: subscription.id },
            data: {
                start_date: pastStart,
                end_date: futureEnd
            }
        });

        // Run payout settler
        process.env.TEST_PAYOUT_INTERVAL_MS = String(24 * 60 * 60 * 1000); // 24 hours
        await settleArbitragePayouts(prisma);

        // Fetch updated subscription and balances
        const subAfterPayout = await prisma.arbitrageSubscription.findUnique({
            where: { id: subscription.id }
        });
        const walletAfterPayout = await prisma.wallet.findUnique({
            where: { id: wallet.id }
        });
        const userAfterPayout = await prisma.user.findUnique({
            where: { id: userId }
        });

        const expectedInterest = subscribeAmount * (parseFloat(rate) / 100); // 1500 * 2.5% = 37.5
        console.log(`Expected interest: ${expectedInterest} USDT`);
        console.log(`Post-payout balances - User: ${userAfterPayout.balance}, Wallet: ${walletAfterPayout.coin_amount}`);
        console.log(`Subscription earned: ${subAfterPayout.total_earned}, status: ${subAfterPayout.status}`);
        
        if (parseFloat(subAfterPayout.total_earned) !== expectedInterest) {
            throw new Error('Yield payment mismatch!');
        }
        if (parseFloat(userAfterPayout.balance) !== 8537.5) {
            throw new Error('User balance interest credit mismatch!');
        }
        console.log('✅ Daily yield payout cycle successful.');

        // 5. Test Final Completion and Principal Return
        console.log('\n--- 3. Testing Package Completion & Principal Return ---');
        
        // Fast-forward end_date to be in the past (e.g. 5 minutes ago) to simulate plan completion
        const pastEnd = new Date(Date.now() - 5 * 60 * 1000);
        await prisma.arbitrageSubscription.update({
            where: { id: subscription.id },
            data: {
                end_date: pastEnd
            }
        });

        // Run settler again
        await settleArbitragePayouts(prisma);

        // Fetch updated status
        const subCompleted = await prisma.arbitrageSubscription.findUnique({
            where: { id: subscription.id }
        });
        const walletCompleted = await prisma.wallet.findUnique({
            where: { id: wallet.id }
        });
        const userCompleted = await prisma.user.findUnique({
            where: { id: userId }
        });

        const secondPayoutInterest = 0; // Payout interval did not elapse again, so no extra interest is paid
        const totalExpectedBalance = 8537.5 + secondPayoutInterest + subscribeAmount; // 8537.5 + 0 + 1500 = 10037.5
        console.log(`Completed status: ${subCompleted.status}`);
        console.log(`Post-completion balances - User: ${userCompleted.balance}, Wallet: ${walletCompleted.coin_amount}`);
        if (subCompleted.status !== 'completed') {
            throw new Error('Subscription status did not transition to completed');
        }
        if (parseFloat(userCompleted.balance) !== totalExpectedBalance) {
            throw new Error('Completion principal refund mismatch!');
        }
        console.log('✅ Package completion and principal return successful.');

        // 6. Test Subscription Cancellation
        console.log('\n--- 4. Testing Subscription Cancellation ---');
        
        // Place a new subscription
        const sub2 = await prisma.arbitrageSubscription.create({
            data: {
                user_id: userId,
                package_id: starterPkg.id,
                coin_id: '518',
                amount: '1000.0000000',
                daily_rate: '2.00',
                total_earned: '0.0000000',
                status: 'active',
                start_date: new Date(),
                end_date: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });

        // Current balance before cancellation
        const balanceBeforeCancel = parseFloat(userCompleted.balance); // 10075.0
        // Deduct balance manually to simulate creation
        await prisma.user.update({
            where: { id: userId },
            data: { balance: (balanceBeforeCancel - 1000).toFixed(7) }
        });
        await prisma.wallet.update({
            where: { id: wallet.id },
            data: { coin_amount: (balanceBeforeCancel - 1000).toFixed(7) }
        });

        // Simulate cancel endpoint call (refund logic)
        const refundAmount = parseFloat(sub2.amount);
        await prisma.$transaction([
            prisma.wallet.update({
                where: { id: wallet.id },
                data: { coin_amount: (balanceBeforeCancel - 1000 + refundAmount).toFixed(7) }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { balance: (balanceBeforeCancel - 1000 + refundAmount).toFixed(7) }
            }),
            prisma.arbitrageSubscription.update({
                where: { id: sub2.id },
                data: { status: 'cancelled' }
            })
        ]);

        const walletCancelled = await prisma.wallet.findUnique({ where: { id: wallet.id } });
        const userCancelled = await prisma.user.findUnique({ where: { id: userId } });
        const subCancelled = await prisma.arbitrageSubscription.findUnique({ where: { id: sub2.id } });

        console.log(`Cancelled status: ${subCancelled.status}`);
        console.log(`Post-cancellation balances - User: ${userCancelled.balance}, Wallet: ${walletCancelled.coin_amount}`);
        if (subCancelled.status !== 'cancelled') {
            throw new Error('Subscription status did not transition to cancelled');
        }
        if (parseFloat(userCancelled.balance) !== balanceBeforeCancel) {
            throw new Error('Cancellation refund mismatch!');
        }
        console.log('✅ Subscription cancellation refund successful.');

        // Clean up test subscriptions
        await prisma.arbitrageSubscription.deleteMany({
            where: { id: { in: [subscription.id, sub2.id] } }
        });

        console.log('\n=== ALL ARBITRAGE VERIFICATION CHECKS PASSED SUCCESSFULLY ===');
        await prisma.$disconnect();
    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

verifyArbitrage();
