const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
    getAllConversations, 
    getMessagesByConversation, 
    sendMessage, 
    deleteConversation 
} = require('../controllers/messageController');

// Multer setup for message attachments (using memory storage for cloud uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Specific Routes First ---

// GET /api/v1/messages/:conversationId/user/0
router.get('/:conversationId/user/0', getMessagesByConversation);

// POST /api/v1/messages/send
router.post('/send', upload.single('documents'), sendMessage);

// DELETE /api/v1/conversation/:id
router.delete('/:id', deleteConversation);

// --- General Routes Last ---

// GET /api/v1/conversation/ OR /api/v1/messages/
router.get('/', (req, res) => {
    if (req.baseUrl.includes('conversation')) {
        return getAllConversations(req, res);
    }
    return getMessagesByConversation(req, res);
});

module.exports = router;
