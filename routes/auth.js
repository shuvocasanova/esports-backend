const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const crypto = require('crypto');

/**
 * @route   POST /api/v1/users/create
 * @desc    Create/Retrieve DApp user by wallet address
 * @access  Public
 */
router.post('/create', async (req, res) => {
    try {
        const { user_wallet, referral_uuid } = req.body;

        if (!user_wallet) {
            return res.status(400).json({ status: 'error', message: 'Wallet address is required' });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { user_wallet },
            include: { wallets: true }
        });

        if (user) {
            return res.status(200).json(user);
        }

        // Create new user
        user = await prisma.user.create({
            data: {
                uuid: Math.floor(100000 + Math.random() * 900000).toString(), // Numeric string UUID as seen in logs
                user_wallet,
                referral_uuid,
                role: 'user',
                status: 'active',
                balance: '0.0000000'
            }
        });

        res.status(201).json(user);
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * @route   POST /api/v1/users/login
 * @desc    Login for Admin/User using Email or Mobile
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { emailOrMobile, password } = req.body;

        if (!emailOrMobile || !password) {
            return res.status(400).json({ status: 'error', message: 'Credentials are required' });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: emailOrMobile },
                    { mobile: emailOrMobile }
                ]
            }
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ status: 'error', message: 'Account is inactive' });
        }

        // Return the full user object as expected by AdminLogin.jsx
        res.json(user);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * @route   GET /api/v1/users/wallet/:wallet
 * @desc    Get user by wallet address
 * @access  Public
 */
router.get('/wallet/:wallet', async (req, res) => {
    try {
        const { wallet } = req.params;
        const user = await prisma.user.findUnique({
            where: { user_wallet: wallet },
            include: { wallets: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
