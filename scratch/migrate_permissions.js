const prisma = require('../config/db');

const MAPPING = {
    '1': 'Dashboard',
    '2': 'Edit Feature',
    '3': 'Contact',
    '4': 'Inbox',
    '5': 'Wallets',
    '6': 'Users',
    '7': 'Admin Users',
    '8': 'Deposits',
    '9': 'Withdraws',
    'Settings': 'Edit Feature',
    'Withdrawals': 'Withdraws',
    'Messages': 'Inbox'
};

async function main() {
  const users = await prisma.user.findMany({
      where: { role: { in: ['admin', 'superadmin'] } }
  });
  
  for (const user of users) {
      let newPerms = (user.permissions || []).map(p => MAPPING[p] || p);
      // Remove duplicates and stale strings
      newPerms = [...new Set(newPerms)];
      
      await prisma.user.update({
          where: { id: user.id },
          data: { permissions: newPerms }
      });
      console.log(`Updated permissions for ${user.name}:`, newPerms);
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
