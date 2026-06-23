const prisma = require('./config/db');

async function seedMining() {
    try {
        console.log('Seeding Mining packages...');

        // Clear existing packages
        await prisma.miningPackage.deleteMany({});
        console.log('Cleared existing Mining packages.');

        const packages = [
            {
                name: '1 days ',
                duration_days: 1,
                daily_rate: '1.0000',
                rent_amount: '1000.0000000',
                computing: '15000 TH/s',
                power: '150000W',
                color: '#4e7a27',
                stars: 5,
                status: 1
            },
            {
                name: '7 Days',
                duration_days: 7,
                daily_rate: '1.5000',
                rent_amount: '3000.0000000',
                computing: '25000 TH/s',
                power: '200000W',
                color: '#a855f7',
                stars: 5,
                status: 1
            },
            {
                name: '30 Days',
                duration_days: 30,
                daily_rate: '2.0000',
                rent_amount: '10000.0000000',
                computing: '50000 TH/s',
                power: '350000W',
                color: '#ec4899',
                stars: 5,
                status: 1
            }
        ];

        for (const pkg of packages) {
            const created = await prisma.miningPackage.create({ data: pkg });
            console.log(`✅ Seeded mining package: ${created.name} (${created.duration_days} days)`);
        }

        console.log('\n🎉 Mining packages seeded successfully!');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Seeding error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

seedMining();
