const express = require('express');
const router = express.Router();
const {
    getAllTimerProfits,
    createTimerProfit,
    updateTimerProfit,
    deleteTimerProfit,
} = require('../controllers/timerProfitController');

// GET    /api/v1/timerprofits        — list all
router.get('/', getAllTimerProfits);

// POST   /api/v1/timerprofits        — create new
router.post('/', createTimerProfit);

// PUT    /api/v1/timerprofits/:id    — edit (from UpdateTimer.jsx)
router.put('/:id', updateTimerProfit);

// DELETE /api/v1/timerprofits/:id    — delete
router.delete('/:id', deleteTimerProfit);

module.exports = router;
