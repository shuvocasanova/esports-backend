const prisma = require('../config/db');

// Hardcoded available permissions
// The frontend iterates over these to show the toggle list.
// Hardcoded available permissions matching Sidebar.jsx expectations
const AVAILABLE_PERMISSIONS = [
    { id: 1, label: 'Dashboard' },
    { id: 2, label: 'Edit Feature' },
    { id: 3, label: 'Contact' },
    { id: 4, label: 'Inbox' },
    { id: 5, label: 'Wallets' },
    { id: 6, label: 'Users' },
    { id: 7, label: 'Admin Users' },
    { id: 8, label: 'Deposits' },
    { id: 9, label: 'Withdraws' },
];

/**
 * GET /api/v1/permissions
 */
const getPermissions = async (req, res) => {
    try {
        res.json(AVAILABLE_PERMISSIONS);
    } catch (error) {
        console.error('getPermissions error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/permissions/user/:userId
 */
const getUserPermissions = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });
        
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Frontend expects: { permissions: [{ permissionId: 1 }, { permissionId: 2 }] }
        // We store labels, so we map them back to IDs
        const permsFormatted = (user.permissions || []).map(label => {
            const found = AVAILABLE_PERMISSIONS.find(p => p.label === label);
            return found ? { permissionId: found.id } : null;
        }).filter(p => p !== null);
        
        res.json({ permissions: permsFormatted });
    } catch (error) {
        console.error('getUserPermissions error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/permissions/toggle
 * Expects body: { userId, permissionId }
 */
const togglePermission = async (req, res) => {
    try {
        const { userId, permissionId } = req.body;
        const uid = parseInt(userId);
        
        // Find the label for this ID
        const permObj = AVAILABLE_PERMISSIONS.find(p => p.id === parseInt(permissionId));
        if (!permObj) return res.status(400).json({ error: 'Invalid permission ID' });
        
        const label = permObj.label;

        const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { permissions: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        let currentPerms = user.permissions || [];
        
        if (currentPerms.includes(label)) {
            currentPerms = currentPerms.filter(p => p !== label);
        } else {
            currentPerms.push(label);
        }

        await prisma.user.update({
            where: { id: uid },
            data: { permissions: currentPerms }
        });

        res.json({ message: 'Permission toggled successfully' });
    } catch (error) {
        console.error('togglePermission error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPermissions,
    getUserPermissions,
    togglePermission
};
