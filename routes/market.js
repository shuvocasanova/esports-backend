const express = require('express');
const router = express.Router();

// Mock market data - in production, this would fetch from a real API
const mockForexData = [
    { 
        symbol: 'BTC',
        response: [{
            meta: { symbol: 'BTC', name: 'Bitcoin', regularMarketPrice: 64500.50, previousClose: 63800.00, regularMarketDayHigh: 65000.00, regularMarketDayLow: 63800.00, currency: 'USD' }
        }]
    },
    { 
        symbol: 'ETH',
        response: [{
            meta: { symbol: 'ETH', name: 'Ethereum', regularMarketPrice: 3450.20, previousClose: 3400.00, regularMarketDayHigh: 3500.00, regularMarketDayLow: 3400.00, currency: 'USD' }
        }]
    },
    { 
        symbol: 'SOL',
        response: [{
            meta: { symbol: 'SOL', name: 'Solana', regularMarketPrice: 145.80, previousClose: 140.00, regularMarketDayHigh: 150.00, regularMarketDayLow: 140.00, currency: 'USD' }
        }]
    }
];

const mockMetalData = [
    { 
        symbol: 'DOGE',
        response: [{
            meta: { symbol: 'DOGE', name: 'Dogecoin', regularMarketPrice: 0.16, previousClose: 0.15, regularMarketDayHigh: 0.18, regularMarketDayLow: 0.15, currency: 'USD' }
        }]
    },
    { 
        symbol: 'DOT',
        response: [{
            meta: { symbol: 'DOT', name: 'Polkadot', regularMarketPrice: 7.20, previousClose: 7.00, regularMarketDayHigh: 7.50, regularMarketDayLow: 7.00, currency: 'USD' }
        }]
    }
];

// GET /api/v1/market/forex
router.get('/forex', (req, res) => {
    res.json(mockForexData);
});

// GET /api/v1/market/metal
router.get('/metal', (req, res) => {
    res.json(mockMetalData);
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
