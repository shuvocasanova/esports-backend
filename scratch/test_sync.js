const prisma = require('../config/db');

async function syncTest(userId) {
    console.log(`Testing sync for user ${userId}...`);
    
    // 1. Fetch system wallets (user_id = 1)
    const systemWallets = await prisma.wallet.findMany({
        where: { user_id: 1 }
    });

    // 2. Fetch user's existing wallets
    let userWallets = await prisma.wallet.findMany({
        where: { user_id: userId }
    });

    console.log(`Found ${userWallets.length} wallets for user ${userId}`);

    const systemWalletMap = new Map(systemWallets.map(sw => [sw.coin_id, sw]));
    
    for (const uw of userWallets) {
        const sw = systemWalletMap.get(uw.coin_id);
        if (sw) {
            console.log(`Checking coin ${uw.coin_symbol} (ID: ${uw.coin_id})...`);
            console.log(`  User Address: ${uw.wallet_address}`);
            console.log(`  Syst Address: ${sw.wallet_address}`);
            console.log(`  User QR: ${uw.wallet_qr ? 'YES' : 'NONE'}`);
            console.log(`  Syst QR: ${sw.wallet_qr ? 'YES' : 'NONE'}`);

            const needsUpdate = 
                uw.wallet_address !== sw.wallet_address || 
                uw.wallet_qr !== sw.wallet_qr || 
                uw.coin_logo !== sw.coin_logo ||
                uw.coin_name !== sw.coin_name ||
                uw.wallet_network !== sw.wallet_network;
            
            console.log(`  Needs update? ${needsUpdate}`);

            if (needsUpdate) {
                console.log(`  UPDATING wallet ${uw.id}...`);
                await prisma.wallet.update({
                    where: { id: uw.id },
                    data: {
                        wallet_address: sw.wallet_address,
                        wallet_qr: sw.wallet_qr,
                        coin_logo: sw.coin_logo,
                        coin_name: sw.coin_name,
                        wallet_network: sw.wallet_network
                    }
                });
                console.log(`  Updated successfully.`);
            }
        } else {
            console.log(`  No system wallet found for coin ID ${uw.coin_id}`);
        }
    }
    
    await prisma.$disconnect();
}

syncTest(13);
