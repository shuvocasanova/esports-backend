const prisma = require('../config/db');
const { verifyPassword } = require('./passwordHelper');

/**
 * Middleware to restrict route access strictly to authenticated Admin/Superadmin requests.
 */
const adminAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['x-admin-auth'];
        if (!authHeader) {
            return res.status(403).json({ status: 'error', message: 'Access denied: Admin authorization required' });
        }

        let decoded;
        try {
            decoded = Buffer.from(authHeader, 'base64').toString('ascii');
        } catch (e) {
            return res.status(400).json({ status: 'error', message: 'Malformed authorization header' });
        }

        const [email, password] = decoded.split(':');
        if (!email || !password) {
            return res.status(403).json({ status: 'error', message: 'Access denied: Missing admin credentials' });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: email,
                role: { in: ['admin', 'superadmin'] },
                status: 'active'
            }
        });

        if (!user) {
            return res.status(403).json({ status: 'error', message: 'Access denied: Unauthorized admin account' });
        }

        const isValid = await verifyPassword(password, user.password, user, prisma);
        if (!isValid) {
            return res.status(403).json({ status: 'error', message: 'Access denied: Invalid credentials' });
        }

        req.admin = user; // Attach admin user info to request
        next();
    } catch (error) {
        console.error('[adminAuth] error:', error);
        res.status(500).json({ status: 'error', message: 'Internal server authorization error' });
    }
};

module.exports = adminAuth;
