const express = require('express');
const router = express.Router();
const {
    getAllFaqsAdmin,
    createFaqAdmin,
    updateFaqAdmin,
    deleteFaqAdmin,
    getRootFaqs,
    getFaqChildren
} = require('../controllers/faqController');

// --- User Routes ---
router.get('/root', getRootFaqs);
router.get('/:id/children', getFaqChildren);

// --- Admin Routes ---
router.get('/admin/all', getAllFaqsAdmin);
router.post('/admin', createFaqAdmin);
router.put('/admin/:id', updateFaqAdmin);
router.delete('/admin/:id', deleteFaqAdmin);

module.exports = router;
