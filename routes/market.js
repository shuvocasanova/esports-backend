const express = require('express');
const router = express.Router();

// Mock market data - in production, this would fetch from a real API
const mockForexData = [
    { id: 'eurusd', name: 'EUR/USD', symbol: 'EURUSD', price: '1.0850', change: '+0.25%', high: '1.0875', low: '1.0820' },
    { id: 'gbpusd', name: 'GBP/USD', symbol: 'GBPUSD', price: '1.2650', change: '-0.15%', high: '1.2680', low: '1.2620' },
    { id: 'usdjpy', name: 'USD/JPY', symbol: 'USDJPY', price: '148.50', change: '+0.42%', high: '149.00', low: '147.80' }
];

const mockMetalData = [
    { id: 'gold', name: 'Gold', symbol: 'XAU', price: '2045.50', change: '+1.25%', high: '2055.00', low: '2030.00' },
    { id: 'silver', name: 'Silver', symbol: 'XAG', price: '23.85', change: '+0.85%', high: '24.10', low: '23.50' },
    { id: 'platinum', name: 'Platinum', symbol: 'XPT', price: '915.20', change: '-0.35%', high: '920.00', low: '910.00' }
];

// GET /api/v1/market/forex
router.get('/forex', (req, res) => {
    res.json({ status: 'success', data: mockForexData });
});

// GET /api/v1/market/metal
router.get('/metal', (req, res) => {
    res.json({ status: 'success', data: mockMetalData });
});

// GET /api/v1/market/forex/:coin
router.get('/forex/:coin', (req, res) => {
    const coin = mockForexData.find(c => c.id === req.params.coin || c.symbol === req.params.coin.toUpperCase());
    if (!coin) {
        return res.status(404).json({ status: 'error', message: 'Coin not found' });
    }
    res.json({ status: 'success', data: coin });
});

module.exports = router;
