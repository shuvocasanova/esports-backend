const prisma = require('../config/db');

async function checkTriggers() {
    try {
        console.log('Querying triggers on the User table...');
        
        const triggers = await prisma.$queryRaw`
            SELECT 
                tgname AS trigger_name,
                proname AS function_name,
                prosrc AS function_source
            FROM pg_trigger
            JOIN pg_proc ON pg_proc.oid = tgfoid
            JOIN pg_class ON pg_class.oid = tgrelid
            WHERE relname = 'User';
        `;
        
        console.log('Found triggers:', JSON.stringify(triggers, null, 2));
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error querying triggers:', error);
        await prisma.$disconnect();
    }
}

checkTriggers();
