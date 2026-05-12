const express = require('express');
const router = express.Router();
const { resetAllData } = require('../controllers/resetController');

// POST /api/v1/reset  — Danger Zone: wipe all user data
router.post('/', resetAllData);

module.exports = router;
