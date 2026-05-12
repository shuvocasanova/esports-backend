const prisma = require('../config/db');

async function main() {
  await prisma.user.update({
    where: { id: 6 },
    data: { password: 'adminpassword' }
  });
  console.log('Password reset to adminpassword');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
