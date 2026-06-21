const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getStats } = require('../controllers/settingController');

const adminAuth = require('../utils/adminAuth');

// GET  /api/v1/settings        — flat settings object
router.get('/', getSettings);

// PUT  /api/v1/settings        — update settings
router.put('/', adminAuth, updateSettings);

// GET  /api/v1/settings/stats  — sidebar badge counts
router.get('/stats', adminAuth, getStats);

module.exports = router;
