const express = require('express');
const router = express.Router();
const { getAllTradeOrders, deleteTradeOrder, updateTradeOrder, createTradeOrder, getUserTradeOrders } = require('../controllers/tradeController');

// GET  /api/v1/tradeorder
router.get('/', getAllTradeOrders);

// GET  /api/v1/tradeorder/user/:userId
router.get('/user/:userId', getUserTradeOrders);

// POST /api/v1/tradeorder
router.post('/', createTradeOrder);

// PUT  /api/v1/tradeorder/:id  (toggle is_profit / update status)
router.put('/:id', updateTradeOrder);

// DELETE /api/v1/tradeorder/:id
router.delete('/:id', deleteTradeOrder);

module.exports = router;
