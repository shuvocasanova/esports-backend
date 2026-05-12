require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
    console.log('Cleaning up duplicate conversations...');
    
    // Delete all messages and conversations where user2_id is not 0
    // These were the duplicates created before the fix
    const convs = await prisma.conversation.findMany({
        where: { user2_id: { not: 0 } }
    });

    for (const c of convs) {
        await prisma.message.deleteMany({ where: { conversation_id: c.id } });
        await prisma.conversation.delete({ where: { id: c.id } });
    }

    console.log(`Cleaned up ${convs.length} duplicate conversations.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
