const express = require('express');
const router = express.Router();
const { getUserBalance, updateUserBalance } = require('../controllers/userbalanceController');

// GET /api/v1/userbalance/:userId/balance/:coinId
router.get('/:userId/balance/:coinId', getUserBalance);

// PUT /api/v1/userbalance/:userId/balance/:coinId
router.put('/:userId/balance/:coinId', updateUserBalance);

module.exports = router;
