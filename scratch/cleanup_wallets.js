const prisma = require('../config/db');

async function cleanup() {
    console.log('Starting wallet cleanup...');
    
    // Find all wallets
    const allWallets = await prisma.wallet.findMany({
        orderBy: { id: 'asc' }
    });
    
    const seen = new Set();
    const toDelete = [];
    
    for (const w of allWallets) {
        const key = `${w.user_id}-${w.coin_id}`;
        if (seen.has(key)) {
            toDelete.push(w.id);
        } else {
            seen.add(key);
        }
    }
    
    console.log(`Found ${toDelete.length} duplicate wallets to delete.`);
    
    if (toDelete.length > 0) {
        await prisma.wallet.deleteMany({
            where: {
                id: { in: toDelete }
            }
        });
        console.log('Cleanup complete.');
    } else {
        console.log('No duplicates found.');
    }
    
    await prisma.$disconnect();
}

cleanup().catch(e => {
    console.error(e);
    process.exit(1);
});
