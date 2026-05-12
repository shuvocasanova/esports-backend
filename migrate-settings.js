const prisma = require('./config/db');
require('dotenv').config();

async function migrate() {
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "Settings"
            ADD COLUMN IF NOT EXISTS btn_bg_color TEXT DEFAULT '#000000',
            ADD COLUMN IF NOT EXISTS btn_text_color TEXT DEFAULT '#ffffff',
            ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
            ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT ''
        `);
        console.log('✅ btn_bg_color, btn_text_color, email, whatsapp columns added to Settings table');
        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

migrate();
