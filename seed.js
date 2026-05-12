const prisma = require('./config/db');
const crypto = require('crypto');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('PostgreSQL connected via Prisma for seeding...');

        // Clear existing data
        await prisma.timerProfit.deleteMany({});
        await prisma.wallet.deleteMany({});
        await prisma.transaction.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.tradeOrder.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.settings.deleteMany({});

        // Create Admin User
        const adminUser = await prisma.user.create({
            data: {
                uuid: crypto.randomUUID(),
                name: 'Admin User',
                email: 'admin@tradespot.app',
                mobile: '+1234567890',
                password: 'admin123', // TODO: Hash this in production!
                role: 'superadmin',
                status: 'active',
                permissions: ['Dashboard', 'Users', 'Settings', 'Deposits', 'Withdrawals', 'Messages'],
                balance: '1440.0000000',
                is_profit: 0,
                trade_limit: 10000,
                is_referral: 0,
                employee: 'admin'
            }
        });
        console.log('✅ Admin user created:', adminUser.email);

        // Create Default Settings
        await prisma.settings.create({
            data: {
                referral_registration_status: 'enabled',
                referral_registration_bonus: '10.00',
                referral_deposit_bonus_status: 'enabled',
                referral_deposit_bonus: '5',
                trade_amount_limit: '10000',
                deposit_limit: '50',
                withdrawal_limit: '20',
                notice: 'Welcome to Tradespot! Start trading now.',
                hero_bg_color: '#1a1a2e',
                hero_text_color: '#ffffff',
                btn_bg_color: '#2000F0',
                btn_text_color: '#ffffff'
            }
        });
        console.log('✅ Default settings created');

        // Create Timer Profits
        const timerProfits = [
            { timer: '60S', profit: '10', mini_usdt: '25' },
            { timer: '120S', profit: '35', mini_usdt: '1200' },
            { timer: '12H', profit: '87', mini_usdt: '3200' },
            { timer: '24H', profit: '85', mini_usdt: '6000' },
            { timer: '3D', profit: '95', mini_usdt: '7500' },
            { timer: '7D', profit: '115', mini_usdt: '17200' }
        ];

        for (const tp of timerProfits) {
            await prisma.timerProfit.create({ data: tp });
        }
        console.log('✅ Timer profits created');

        // Create Sample Wallets
        const wallets = [
            {
                coin_id: '80',
                coin_name: 'Ethereum',
                coin_symbol: 'ETH',
                wallet_network: 'ethereum',
                wallet_address: '0xE7040C4fF8477C2fAcC07901b81630b83f701EbA',
                coin_amount: '0.0000000',
                usd_amount: '0.00',
                status: 'active'
            },
            {
                coin_id: '518',
                coin_name: 'Tether',
                coin_symbol: 'USDT',
                wallet_network: 'tether',
                wallet_address: 'TRoUN267tVLHRMRViCDcur98yZfLroEXmL',
                coin_amount: '0.0000000',
                usd_amount: '0.00',
                status: 'active'
            }
        ];

        for (const w of wallets) {
            await prisma.wallet.create({
                data: {
                    ...w,
                    user_id: adminUser.id
                }
            });
        }
        console.log('✅ Sample wallets created');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📝 Admin Credentials:');
        console.log('Email/Mobile: admin@tradespot.app');
        console.log('Password: admin123');

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

seedDatabase();
