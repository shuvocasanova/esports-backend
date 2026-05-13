const prisma = require('../config/db');

async function main() {
  // Clear existing
  await prisma.chatFaq.deleteMany({});

  // Root FAQs
  const faq1 = await prisma.chatFaq.create({
    data: {
      question: "How do I deposit funds?",
      answer: "You can deposit funds by going to the Funds section and selecting your preferred cryptocurrency. Follow the instructions to complete the transfer.",
      order_num: 1,
      status: 1
    }
  });

  const faq2 = await prisma.chatFaq.create({
    data: {
      question: "What is the withdrawal limit?",
      answer: "The minimum withdrawal limit depends on your account level. Generally, it starts from 10 USDT.",
      order_num: 2,
      status: 1
    }
  });

  // Sub-questions for Deposit
  await prisma.chatFaq.createMany({
    data: [
      {
        question: "Is there a deposit fee?",
        answer: "No, we do not charge any fees for deposits. However, your wallet provider might charge a network fee.",
        parent_id: faq1.id,
        order_num: 1,
        status: 1
      },
      {
        question: "How long does it take?",
        answer: "Deposits are usually credited after 3 network confirmations, which typically takes 5-15 minutes.",
        parent_id: faq1.id,
        order_num: 2,
        status: 1
      }
    ]
  });

  console.log('Chat FAQs seeded successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
