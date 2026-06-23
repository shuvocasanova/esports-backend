const prisma = require('../config/db');
const { hashPassword } = require('../utils/passwordHelper');
const { updateUser } = require('../controllers/userController');

async function testDoubleHash() {
    try {
        console.log('=== STARTING DOUBLE-HASH TEST ===');

        const userId = 1;
        const testPassword = 'adminpassword123';
        const expectedHash = hashPassword(testPassword);

        // 1. Manually set password hash in database
        await prisma.user.update({
            where: { id: userId },
            data: { 
                password: expectedHash,
                name: 'Original Admin'
            }
        });
        console.log('Set user 1 password to expected hash:', expectedHash);

        // Mock express req, res
        const req = {
            params: { id: String(userId) },
            body: {
                name: 'Updated Admin Name',
                password: expectedHash // Frontend sends the password hash currently stored
            }
        };

        let jsonResponse = null;
        const res = {
            json: (data) => {
                jsonResponse = data;
            },
            status: (code) => {
                return {
                    json: (data) => {
                        jsonResponse = { code, ...data };
                    }
                };
            }
        };

        // 2. Call updateUser
        await updateUser(req, res);
        console.log('UpdateUser response:', jsonResponse);

        // 3. Fetch user from DB and check password
        const updatedUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        console.log('Database password after metadata update:', updatedUser.password);

        if (updatedUser.password === expectedHash) {
            console.log('✅ SUCCESS: Password hash remained unchanged (no double-hashing)!');
        } else {
            console.error('❌ FAILURE: Password hash was modified/re-hashed!', updatedUser.password);
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('Test error:', error);
        await prisma.$disconnect();
    }
}

testDoubleHash();
