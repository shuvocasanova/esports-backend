const prisma = require('../config/db');
const { verifyPassword } = require('../utils/passwordHelper');

async function testAdminLoginLoop() {
    try {
        const userId = 1;
        const plainPassword = 'adminpassword';

        console.log('--- Step 1: Setting password directly in DB to plain text ---');
        let user = await prisma.user.update({
            where: { id: userId },
            data: { password: plainPassword }
        });
        console.log('Database password initialized to:', user.password);

        console.log('\n--- Step 2: First Login Verification (using plaintext password) ---');
        // This is like the user typing 'adminpassword' on `/login`
        let isValid1 = await verifyPassword(plainPassword, user.password, user, prisma);
        console.log('First login valid?', isValid1);

        // Fetch user from DB again to see the password state
        user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('Database password after first login (migrated to hash):', user.password);
        const storedHash = user.password;

        console.log('\n--- Step 3: Call an admin API endpoint (using stored hash as password in headers) ---');
        // This is what the frontend axios/fetch interceptor does: X-Admin-Auth header decodes to email:storedHash
        let isAuthorized = await verifyPassword(storedHash, user.password, user, prisma);
        console.log('Admin API request authorized?', isAuthorized);

        // Fetch user from DB again to ensure no double-hashing happened
        user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('Database password after admin API request:', user.password);

        if (user.password !== storedHash) {
            console.error('❌ BUG TRIGGERED: Database password was double-hashed!');
        } else {
            console.log('✅ SUCCESS: Database password did not change.');
        }

        console.log('\n--- Step 4: Second Login Verification (using plaintext password) ---');
        // This is the user trying to log in again after logging out
        let isValid2 = await verifyPassword(plainPassword, user.password, user, prisma);
        console.log('Second login valid?', isValid2);

        if (isValid2) {
            console.log('🎉 ALL PASSED! The login-loop issue is fully resolved.');
        } else {
            console.error('❌ FAILED: Second login is invalid!');
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Test failed with error:', error);
        await prisma.$disconnect();
    }
}

testAdminLoginLoop();
