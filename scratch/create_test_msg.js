const prisma = require('../config/db');

async function main() {
  const userId = 13;
  
  // Create conversation if it doesn't exist
  let conv = await prisma.conversation.findFirst({
    where: { user1_id: userId, user2_id: 0 }
  });
  
  if (!conv) {
    conv = await prisma.conversation.create({
      data: { user1_id: userId, user2_id: 0 }
    });
  }
  
  // Create a message
  await prisma.message.create({
    data: {
      conversation_id: conv.id,
      sender_id: 0, // Admin
      message: 'Hello! This is a test message from support.',
      sender_type: 'admin'
    }
  });
  
  console.log('Test message created for user 13');
}

main().catch(console.error).finally(() => prisma.$disconnect());
