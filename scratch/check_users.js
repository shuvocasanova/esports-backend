const prisma = require('../config/db');

async function main() {
  const users = await prisma.user.findMany({
      select: { id: true, uuid: true, email: true, user_wallet: true }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
