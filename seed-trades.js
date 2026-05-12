const prisma = require('./config/db');
require('dotenv').config();

async function seedTrades() {
    try {
        console.log('Seeding trade orders from live response data...');

        // Find or create the DApp user linked to these trade orders
        // (wallet address taken directly from the live response)
        const USER_WALLET = '0x7Fda2F08C69593Bd52DB6FCB3d3f67eEA75dF19a';

        let dappUser = await prisma.user.findUnique({
            where: { user_wallet: USER_WALLET }
        });

        if (!dappUser) {
            dappUser = await prisma.user.create({
                data: {
                    uuid: '723554',          // matches user_uuid in trade data
                    user_wallet: USER_WALLET,
                    name: 'Naz',
                    role: 'user',
                    status: 'active',
                    balance: '0.0000000',
                    employee: 'Naz'
                }
            });
            console.log('✅ DApp user created:', dappUser.uuid);
        } else {
            console.log('✅ DApp user already exists:', dappUser.uuid);
        }

        // Delete any previous seeded trade orders to keep idempotent
        await prisma.tradeOrder.deleteMany({
            where: { order_id: { in: ['125867', '602687'] } }
        });

        // Seed the two trade orders from the live response
        const orders = [
            {
                order_id:            '125867',
                order_type:          'crypto',
                order_position:      'buy',
                user_id:             dappUser.id,
                user_wallet:         USER_WALLET,
                wallet_coin_id:      '518',
                trade_coin_id:       '90',
                trade_coin_symbol:   'BTC',
                amount:              '1250.00',
                wallet_amount:       '0.0000000',
                profit_amount:       '125.00',
                purchase_price:      '95109.5000000',
                delivery_price:      '0.0000000',
                wallet_profit_amount:'3000.0000000',
                delivery_time:       '60S',
                profit_level:        '10',
                is_profit:           1,
                status:              'finished',
                user_uuid:           '723554',
                asigned_employee:    'Naz',
                wallet_coin_name:    'Tether',
                createdAt:           new Date('2025-04-30T11:50:00.000Z'),
                updatedAt:           new Date('2025-04-30T11:51:00.000Z'),
            },
            {
                order_id:            '602687',
                order_type:          'crypto',
                order_position:      'buy',
                user_id:             dappUser.id,
                user_wallet:         USER_WALLET,
                wallet_coin_id:      '518',
                trade_coin_id:       '90',
                trade_coin_symbol:   'BTC',
                amount:              '8650.00',
                wallet_amount:       '0.0000000',
                profit_amount:       '3027.50',
                purchase_price:      '96403.9900000',
                delivery_price:      '0.0000000',
                wallet_profit_amount:'10543.7500000',
                delivery_time:       '120S',
                profit_level:        '35',
                is_profit:           0,
                status:              'finished',
                user_uuid:           '723554',
                asigned_employee:    'Naz',
                wallet_coin_name:    'Tether',
                createdAt:           new Date('2025-05-01T23:37:39.000Z'),
                updatedAt:           new Date('2025-05-01T23:39:39.000Z'),
            }
        ];

        for (const order of orders) {
            await prisma.tradeOrder.create({ data: order });
            console.log(`✅ Trade order seeded: ${order.order_id}`);
        }

        console.log('\n🎉 Trade orders seeded successfully!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

seedTrades();
