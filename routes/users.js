const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, createUser } = require('../controllers/userController');

// GET /api/v1/users (with optional ?role=user query)
router.get('/', getUsers);

// POST /api/v1/users/signup
router.post('/signup', createUser);

// GET /api/v1/users/:id
router.get('/:id', getUserById);

// PUT /api/v1/users/:id
router.put('/:id', updateUser);

module.exports = router;
