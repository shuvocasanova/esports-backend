const prisma = require('../config/db');

/**
 * Format user exactly as the live API does
 */
const formatUser = (u) => ({
    id: u.id,
    uuid: u.uuid,
    name: u.name,
    email: u.email,
    mobile: u.mobile,
    user_wallet: u.user_wallet || '-',
    password: u.password,
    referral_uuid: u.referral_uuid,
    is_referral: u.is_referral,
    balance: u.balance,
    is_profit: u.is_profit,
    referral_bonus: u.referral_bonus,
    trade_limit: u.trade_limit,
    status: u.status,
    message_status: u.message_status,
    note: u.note,
    employee: u.employee,
    role: u.role,
    passcode: u.passcode,
    has_passcode: u.has_passcode,
    passcode_set: u.has_passcode,
    balance_visible: u.balance_visible,
    profile_image: u.profile_image,
    face_image: u.face_image,
    user_registered: u.user_registered,
});

/**
 * GET /api/v1/users
 * Optional query param: ?role=user
 */
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        const whereClause = {};
        
        if (role) {
            whereClause.role = role;
        } else {
            // Default behavior for the "All Admins" page: show only staff
            whereClause.role = { in: ['admin', 'superadmin'] };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            orderBy: { id: 'desc' }
        });

        res.json(users.map(formatUser));
    } catch (error) {
        console.error('getUsers error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/users/:id
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        let user;

        if (!isNaN(id)) {
            user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        } else {
            user = await prisma.user.findUnique({ where: { uuid: id } });
        }

        if (!user) return res.status(404).json({ message: 'User not found' });
        
        res.json(formatUser(user));
    } catch (error) {
        console.error('getUserById error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /api/v1/users/:id
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Remove un-editable fields
        delete updateData.id;
        delete updateData.uuid;
        delete updateData.user_registered;
        delete updateData.createdAt;
        delete updateData.updatedAt;

        // Safely parse numeric fields if they are provided
        if (updateData.is_profit !== undefined) {
            const val = parseInt(updateData.is_profit);
            updateData.is_profit = isNaN(val) ? 0 : val;
        }
        if (updateData.is_referral !== undefined) {
            const val = parseInt(updateData.is_referral);
            updateData.is_referral = isNaN(val) ? 0 : val;
        }
        if (updateData.trade_limit !== undefined) {
            const val = parseInt(updateData.trade_limit);
            updateData.trade_limit = isNaN(val) ? 0 : val;
        }

        // Skip updating password if it's empty string (meaning no change requested)
        if (updateData.password === "") {
            delete updateData.password;
        } else if (updateData.password) {
            const { hashPassword } = require('../utils/passwordHelper');
            updateData.password = hashPassword(updateData.password);
        }

        let user;
        if (!isNaN(id)) {
            user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: updateData
            });
        } else {
            user = await prisma.user.update({
                where: { uuid: id },
                data: updateData
            });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('updateUser error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/users/signup
 */
const createUser = async (req, res) => {
    try {
        const { name, email, mobile, password, user_wallet, role } = req.body;
        
        const uuid = Math.floor(100000 + Math.random() * 900000).toString();
        
        const { hashPassword } = require('../utils/passwordHelper');
        const hashedPassword = hashPassword(password);

        const user = await prisma.user.create({
            data: {
                uuid,
                name,
                email,
                mobile,
                password: hashedPassword,
                user_wallet: (user_wallet === '-' || !user_wallet) ? `temp_${uuid}` : user_wallet,
                role: role || 'user',
                status: 'active',
                balance: '0.0000000'
            }
        });
        
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('createUser error detail:', {
            code: error.code,
            meta: error.meta,
            message: error.message
        });
        res.status(500).json({ 
            error: error.message,
            target: error.meta?.target 
        });
    }
};

/**
 * POST /api/v1/users/upload-profile-image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id || isNaN(parseInt(user_id))) {
            return res.status(400).json({ error: 'Valid user_id is required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { compressImage } = require('../utils/imageHelper');
        const base64Image = await compressImage(req.file);

        const user = await prisma.user.update({
            where: { id: parseInt(user_id) },
            data: { profile_image: base64Image }
        });

        res.json({ message: 'Profile image uploaded successfully', user: formatUser(user) });
    } catch (error) {
        console.error('uploadProfileImage error:', error.message); // Log only the message
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/users/face-verify
 */
const faceVerify = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id || isNaN(parseInt(user_id))) {
            return res.status(400).json({ error: 'Valid user_id is required' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const { compressImage } = require('../utils/imageHelper');
        const base64Image = await compressImage(req.file);

        const user = await prisma.user.update({
            where: { id: parseInt(user_id) },
            data: { face_image: base64Image }
        });

        res.json({ message: 'Face verification submitted successfully', user: formatUser(user) });
    } catch (error) {
        console.error('faceVerify error:', error.message); // Log only the message
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    createUser,
    uploadProfileImage,
    faceVerify
};
