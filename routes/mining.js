const express = require('express');
const router = express.Router();
const {
    getMiningPackages,
    getMiningPackagesAdmin,
    createMiningPackage,
    updateMiningPackage,
    deleteMiningPackage,
    subscribeMining,
    getUserMiningSubscriptions,
    getMiningSubscriptionsAdmin,
    cancelMiningSubscription,
    runMiningPayout
} = require('../controllers/miningController');

const adminAuth = require('../utils/adminAuth');

// ── User routes ──────────────────────────────────────────────────

// GET /api/v1/mining/packages
router.get('/packages', getMiningPackages);

// POST /api/v1/mining/subscribe
router.post('/subscribe', subscribeMining);

// GET /api/v1/mining/subscriptions/:userId
router.get('/subscriptions/:userId', getUserMiningSubscriptions);

// POST /api/v1/mining/cancel
router.post('/cancel', cancelMiningSubscription);

// ── Admin routes (protected) ──────────────────────────────────────

// GET /api/v1/mining/admin/packages
router.get('/admin/packages', adminAuth, getMiningPackagesAdmin);

// POST /api/v1/mining/admin/packages
router.post('/admin/packages', adminAuth, createMiningPackage);

// PUT /api/v1/mining/admin/packages/:id
router.put('/admin/packages/:id', adminAuth, updateMiningPackage);

// DELETE /api/v1/mining/admin/packages/:id
router.delete('/admin/packages/:id', adminAuth, deleteMiningPackage);

// GET /api/v1/mining/admin/subscriptions
router.get('/admin/subscriptions', adminAuth, getMiningSubscriptionsAdmin);

// POST /api/v1/mining/admin/run-payout
router.post('/admin/run-payout', adminAuth, runMiningPayout);

module.exports = router;
