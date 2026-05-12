const prisma = require('../config/db');

async function main() {
  try {
    await prisma.user.delete({ where: { id: 5 } });
    console.log('User 5 deleted');
  } catch (err) {
    if (err.code === 'P2025') {
      console.log('User 5 not found or already deleted');
    } else {
      throw err;
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
