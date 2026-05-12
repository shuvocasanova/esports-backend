const prisma = require('./config/db');

async function getWallets() {
    const wallets = await prisma.wallet.findMany();
    console.log(JSON.stringify(wallets.map(w => ({ id: w.id, user_id: w.user_id, coin: w.coin_id, balance: w.coin_amount })), null, 2));
    await prisma.$disconnect();
}

getWallets();
