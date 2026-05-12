const prisma = require('../config/db');

async function main() {
  const user_id = 2;
  const coin_id = "80";
  const amount = 37.0;
  
  const wallet = await prisma.wallet.findFirst({
      where: { user_id, coin_id }
  });
  
  console.log('Found wallet:', wallet.id, 'Balance:', wallet.coin_amount);
  
  const newCoinAmount = (parseFloat(wallet.coin_amount) - amount).toFixed(7);
  console.log('New amount calculated:', newCoinAmount);
  
  await prisma.wallet.update({
      where: { id: wallet.id },
      data: { coin_amount: newCoinAmount.toString() }
  });
  
  const updatedWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
  console.log('Updated Wallet Balance:', updatedWallet.coin_amount);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
