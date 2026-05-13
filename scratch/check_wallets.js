const prisma = require('../config/db');

async function check() {
    console.log('--- SYSTEM WALLETS (user_id: 1) ---');
    const systemWallets = await prisma.wallet.findMany({
        where: { user_id: 1 }
    });
    systemWallets.forEach(w => {
        console.log(`Coin: ${w.coin_symbol}, ID: ${w.coin_id}, Address: ${w.wallet_address}, QR: ${w.wallet_qr ? w.wallet_qr.substring(0, 50) + '...' : 'NONE'}`);
    });

    console.log('\n--- USER 13 WALLETS ---');
    const userWallets = await prisma.wallet.findMany({
        where: { user_id: 13 }
    });
    userWallets.forEach(w => {
        console.log(`Coin: ${w.coin_symbol}, ID: ${w.coin_id}, Address: ${w.wallet_address}, QR: ${w.wallet_qr ? w.wallet_qr.substring(0, 50) + '...' : 'NONE'}`);
    });
    
    await prisma.$disconnect();
}

check();
