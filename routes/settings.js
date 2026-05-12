const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getStats } = require('../controllers/settingController');

// GET  /api/v1/settings        — flat settings object
router.get('/', getSettings);

// PUT  /api/v1/settings        — update settings
router.put('/', updateSettings);

// GET  /api/v1/settings/stats  — sidebar badge counts
router.get('/stats', getStats);

module.exports = router;
