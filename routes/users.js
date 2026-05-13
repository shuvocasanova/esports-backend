const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { getUsers, getUserById, updateUser, createUser, uploadProfileImage, faceVerify } = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/v1/users (with optional ?role=user query)
router.get('/', getUsers);

// POST /api/v1/users/signup
router.post('/signup', createUser);

// GET /api/v1/users/:id
router.get('/:id', getUserById);

// PUT /api/v1/users/:id
router.put('/:id', updateUser);

// PUT /api/v1/users/:id/balance-visibility
router.put('/:id/balance-visibility', async (req, res) => {
    try {
        const { id } = req.params;
        const { balance_visible } = req.body;
        
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { balance_visible }
        });
        
        res.json({ status: 'success', message: 'Balance visibility updated', user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/v1/users/upload-profile-image
router.post('/upload-profile-image', upload.single('documents'), uploadProfileImage);

// POST /api/v1/users/face-verify
router.post('/face-verify', upload.single('documents'), faceVerify);

module.exports = router;
