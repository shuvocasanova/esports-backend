const crypto = require('crypto');

/**
 * Generates a SHA256 hex hash of a plain text password.
 */
const hashPassword = (password) => {
    if (!password) return '';
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Verifies a password attempt against a stored hash.
 * Automatically hashes and migrates legacy plain text passwords on first successful login.
 */
const verifyPassword = async (plainPassword, hashedPassword, user, prisma) => {
    if (!plainPassword || !hashedPassword) return false;

    const hashedAttempt = hashPassword(plainPassword);

    // 1. Standard SHA256 check
    if (hashedAttempt === hashedPassword) {
        return true;
    }

    // 2. Legacy Plain Text Fallback
    if (plainPassword === hashedPassword) {
        // Auto-migrate user password to secure hash in DB
        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedAttempt }
            });
            console.log(`[passwordHelper] Successfully auto-migrated legacy plain-text password for user ID ${user.id} to SHA256.`);
        } catch (error) {
            console.error(`[passwordHelper] Failed to auto-migrate legacy password for user ID ${user.id}:`, error);
        }
        return true;
    }

    return false;
};

module.exports = {
    hashPassword,
    verifyPassword
};
