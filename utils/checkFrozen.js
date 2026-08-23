const prisma = require('../config/db');

/**
 * Middleware to reject requests if the user is frozen.
 */
const checkFrozen = async (req, res, next) => {
    try {
        const userId = req.body?.user_id || req.body?.userId || req.params?.userId || req.query?.user_id || req.query?.userId;
        if (userId && !isNaN(parseInt(userId))) {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId) },
                select: { is_frozen: true }
            });
            if (user && user.is_frozen) {
                return res.status(403).json({
                    status: 'error',
                    error: 'Account Frozen',
                    message: 'Your account has been frozen. You cannot perform any transactions. Please contact support.'
                });
            }
        }
        next();
    } catch (err) {
        console.error('[checkFrozen Error]:', err.message);
        next();
    }
};

module.exports = checkFrozen;
