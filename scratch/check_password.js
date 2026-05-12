const prisma = require('../config/db');

async function main() {
  const user = await prisma.user.findUnique({ where: { id: 6 } });
  console.log('User 6 password in DB:', JSON.stringify(user.password));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
