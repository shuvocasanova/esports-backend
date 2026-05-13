const prisma = require('../config/db');

/**
 * --- ADMIN CONTROLLERS ---
 */

// GET /api/v1/chat-faqs/admin/all
const getAllFaqsAdmin = async (req, res) => {
    try {
        const faqs = await prisma.chatFaq.findMany({
            orderBy: [
                { parent_id: 'asc' },
                { order_num: 'asc' }
            ]
        });
        res.json(faqs);
    } catch (error) {
        console.error('getAllFaqsAdmin error:', error);
        res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
};

// POST /api/v1/chat-faqs/admin
const createFaqAdmin = async (req, res) => {
    try {
        const { question, answer, parent_id, order_num, status } = req.body;
        const faq = await prisma.chatFaq.create({
            data: {
                question,
                answer,
                parent_id: parent_id ? parseInt(parent_id) : null,
                order_num: parseInt(order_num) || 0,
                status: parseInt(status) || 1
            }
        });
        res.status(201).json(faq);
    } catch (error) {
        console.error('createFaqAdmin error:', error);
        res.status(500).json({ message: 'Failed to create FAQ' });
    }
};

// PUT /api/v1/chat-faqs/admin/:id
const updateFaqAdmin = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { question, answer, parent_id, order_num, status } = req.body;
        
        const faq = await prisma.chatFaq.update({
            where: { id },
            data: {
                question,
                answer,
                parent_id: parent_id ? parseInt(parent_id) : null,
                order_num: parseInt(order_num) || 0,
                status: parseInt(status) || 1
            }
        });
        res.json(faq);
    } catch (error) {
        console.error('updateFaqAdmin error:', error);
        res.status(500).json({ message: 'Failed to update FAQ' });
    }
};

// DELETE /api/v1/chat-faqs/admin/:id
const deleteFaqAdmin = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        // Also delete children to avoid orphaned records
        await prisma.chatFaq.deleteMany({
            where: { parent_id: id }
        });
        
        await prisma.chatFaq.delete({
            where: { id }
        });
        
        res.json({ message: 'FAQ deleted' });
    } catch (error) {
        console.error('deleteFaqAdmin error:', error);
        res.status(500).json({ message: 'Failed to delete FAQ' });
    }
};

/**
 * --- USER/FRONTEND CONTROLLERS ---
 */

// GET /api/v1/chat-faqs/root
const getRootFaqs = async (req, res) => {
    try {
        const faqs = await prisma.chatFaq.findMany({
            where: { 
                parent_id: null,
                status: 1
            },
            orderBy: { order_num: 'asc' }
        });
        res.json(faqs);
    } catch (error) {
        console.error('getRootFaqs error:', error);
        res.status(500).json({ message: 'Failed to fetch root FAQs' });
    }
};

// GET /api/v1/chat-faqs/:id/children
const getFaqChildren = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        const parent = await prisma.chatFaq.findUnique({
            where: { id }
        });
        
        if (!parent) return res.status(404).json({ message: 'FAQ not found' });

        const children = await prisma.chatFaq.findMany({
            where: { 
                parent_id: id,
                status: 1
            },
            orderBy: { order_num: 'asc' }
        });
        
        res.json({ parent, children });
    } catch (error) {
        console.error('getFaqChildren error:', error);
        res.status(500).json({ message: 'Failed to fetch FAQ children' });
    }
};

module.exports = {
    getAllFaqsAdmin,
    createFaqAdmin,
    updateFaqAdmin,
    deleteFaqAdmin,
    getRootFaqs,
    getFaqChildren
};
