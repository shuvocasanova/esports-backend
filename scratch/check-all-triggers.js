const prisma = require('../config/db');

async function checkAllTriggers() {
    try {
        console.log('Querying all triggers...');
        
        const triggers = await prisma.$queryRaw`
            SELECT 
                tgname AS trigger_name,
                relname AS table_name,
                proname AS function_name,
                prosrc AS function_source
            FROM pg_trigger
            JOIN pg_proc ON pg_proc.oid = tgfoid
            JOIN pg_class ON pg_class.oid = tgrelid
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            WHERE nspname = 'public' AND tgname NOT LIKE 'RI_ConstraintTrigger%';
        `;
        
        console.log('Found triggers:', JSON.stringify(triggers, null, 2));
        await prisma.$disconnect();
    } catch (error) {
        console.error('Error querying triggers:', error);
        await prisma.$disconnect();
    }
}

checkAllTriggers();
