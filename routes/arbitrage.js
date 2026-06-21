const express = require('express');
const router = express.Router();
const {
    getPackages,
    getPackagesAdmin,
    createPackage,
    updatePackage,
    deletePackage,
    subscribePackage,
    getUserSubscriptions,
    getSubscriptionsAdmin,
    cancelSubscription
} = require('../controllers/arbitrageController');

const adminAuth = require('../utils/adminAuth');

// ── User routes ──────────────────────────────────────────────────

// GET /api/v1/arbitrage/packages
router.get('/packages', getPackages);

// POST /api/v1/arbitrage/subscribe
router.post('/subscribe', subscribePackage);

// GET /api/v1/arbitrage/subscriptions/:userId
router.get('/subscriptions/:userId', getUserSubscriptions);

// POST /api/v1/arbitrage/cancel
router.post('/cancel', cancelSubscription);

// ── Admin routes (protected) ──────────────────────────────────────

// GET /api/v1/arbitrage/admin/packages
router.get('/admin/packages', adminAuth, getPackagesAdmin);

// POST /api/v1/arbitrage/admin/packages
router.post('/admin/packages', adminAuth, createPackage);

// PUT /api/v1/arbitrage/admin/packages/:id
router.put('/admin/packages/:id', adminAuth, updatePackage);

// DELETE /api/v1/arbitrage/admin/packages/:id
router.delete('/admin/packages/:id', adminAuth, deletePackage);

// GET /api/v1/arbitrage/admin/subscriptions
router.get('/admin/subscriptions', adminAuth, getSubscriptionsAdmin);

module.exports = router;
