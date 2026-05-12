const express = require('express');
const router = express.Router();
const { getPermissions, getUserPermissions, togglePermission } = require('../controllers/permissionsController');

// GET /api/v1/permissions
router.get('/', getPermissions);

// GET /api/v1/permissions/user/:userId
router.get('/user/:userId', getUserPermissions);

// POST /api/v1/permissions/toggle
router.post('/toggle', togglePermission);

module.exports = router;
