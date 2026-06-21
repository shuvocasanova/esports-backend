const prisma = require('./config/db');

async function seedArbitrage() {
    try {
        console.log('Seeding Arbitrage packages...');

        // Clear existing packages
        await prisma.arbitragePackage.deleteMany({});
        console.log('Cleared existing Arbitrage packages.');

        const packages = [
            {
                name: 'Starter',
                duration_days: 1,
                daily_rate_min: '1.00',
                daily_rate_max: '3.00',
                min_amount: '1000.0000000',
                max_amount: '50000.0000000',
                status: 1
            },
            {
                name: 'Standard',
                duration_days: 7,
                daily_rate_min: '1.50',
                daily_rate_max: '3.50',
                min_amount: '5000.0000000',
                max_amount: '200000.0000000',
                status: 1
            },
            {
                name: 'Premium',
                duration_days: 30,
                daily_rate_min: '2.00',
                daily_rate_max: '4.00',
                min_amount: '10000.0000000',
                max_amount: '500000.0000000',
                status: 1
            },
            {
                name: 'Enterprise',
                duration_days: 90,
                daily_rate_min: '2.50',
                daily_rate_max: '5.00',
                min_amount: '50000.0000000',
                max_amount: '1000000.0000000',
                status: 1
            }
        ];

        for (const pkg of packages) {
            const created = await prisma.arbitragePackage.create({ data: pkg });
            console.log(`✅ Seeded package: ${created.name} (${created.duration_days} days)`);
        }

        console.log('\n🎉 Arbitrage packages seeded successfully!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

seedArbitrage();
