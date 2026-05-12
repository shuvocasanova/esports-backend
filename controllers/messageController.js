const prisma = require('../config/db');
const path = require('path');
const fs = require('fs'); // Keep for potential local debugging or other tasks

/**
 * Helper to upload image to ImgBB
 */
const sharp = require('sharp');

const compressImage = async (file) => {
    try {
        // Compress image to JPEG with 60% quality to save space
        const compressedBuffer = await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 60 })
            .toBuffer();
        
        const base64Data = compressedBuffer.toString('base64');
        return `data:image/jpeg;base64,${base64Data}`;
    } catch (error) {
        console.error('Compression Error:', error.message);
        return null;
    }
};

/**
 * GET /api/v1/conversation/
 * Lists all conversations formatted for the frontend sidebar.
 */
const getAllConversations = async (req, res) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: { user2_id: 0 },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        // Use a Map to deduplicate by user1_id (the end user)
        const uniqueMap = new Map();

        for (const c of conversations) {
            if (!uniqueMap.has(c.user1_id)) {
                uniqueMap.set(c.user1_id, c);
            }
        }

        const uniqueConvs = Array.from(uniqueMap.values());

        // Join with User data
        const formatted = await Promise.all(uniqueConvs.map(async (c) => {
            const user1 = await prisma.user.findUnique({
                where: { id: c.user1_id },
                select: { uuid: true, name: true, message_status: true }
            });

            const lastMsg = c.messages[0];

            return {
                conversation_id: c.id,
                user1_id: c.user1_id,
                user2_id: c.user2_id,
                anonymous_user_id: c.anonymous_user_id,
                user1_uuid: user1?.uuid || 'Anonymous',
                user1_name: user1?.name || 'Anonymous',
                user2_uuid: 'Anonymous',
                user2_name: 'Anonymous',
                message_status: user1?.message_status || 1,
                last_message: lastMsg?.message || '',
                last_message_time: lastMsg?.createdAt || c.updatedAt,
                unread_count: 0
            };
        }));

        console.log(`[SupportInbox] Returning ${formatted.length} unique conversations.`);
        res.json({ 
            conversations: formatted,
            unreadConversationsCount: 0
        });
    } catch (error) {
        console.error('getAllConversations error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /api/v1/messages/
 * Fetches messages for a specific conversation.
 */
const getMessagesByConversation = async (req, res) => {
    try {
        const conversationId = req.query.conversationId || req.params.conversationId;
        if (!conversationId) return res.status(400).json({ error: 'conversationId required' });

        const messages = await prisma.message.findMany({
            where: { conversation_id: parseInt(conversationId) },
            orderBy: { createdAt: 'asc' }
        });

        // Format to match live response
        const formatted = messages.map(m => ({
            id: m.id,
            conversation_id: m.conversation_id,
            sender_id: m.sender_id,
            anonymous_sender_id: null,
            message_text: m.message,
            message_image: m.attachments[0] || null,
            seen: m.is_read ? 1 : 0,
            sender_type: m.sender_type,
            created_at: m.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        console.error('getMessagesByConversation error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/v1/messages/send
 * Sends a message and creates conversation if needed.
 */
const sendMessage = async (req, res) => {
    try {
        const { userId, recipientId, messageText, senderType } = req.body;
        const file = req.file;

        const uid = parseInt(userId);
        const rid = parseInt(recipientId);

        // Normalize IDs: In support chat, we always pair User with ID 0 (Support)
        // senderType can be 'admin' or 'user'
        const isUserSender = senderType !== 'admin';
        const endUserId = isUserSender ? uid : rid;

        // Find or Create Conversation
        let conversation = await prisma.conversation.findFirst({
            where: { user1_id: endUserId, user2_id: 0 }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    user1_id: endUserId,
                    user2_id: 0
                }
            });
        }

        // Handle attachment
        let attachmentUrl = null;
        if (file) {
            attachmentUrl = await compressImage(file);
        }

        const message = await prisma.message.create({
            data: {
                conversation_id: conversation.id,
                sender_id: uid,
                message: messageText || '',
                sender_type: senderType,
                attachments: attachmentUrl ? [attachmentUrl] : []
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        });

        const finalMsg = {
            id: message.id,
            conversation_id: conversation.id,
            sender_id: message.sender_id,
            anonymous_sender_id: null,
            message_text: message.message,
            message_image: message.attachments[0] || null,
            seen: 0,
            sender_type: message.sender_type,
            created_at: message.createdAt
        };

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.emit('newMessage', finalMsg);
        }

        // Response matches live API exactly
        res.status(201).json(finalMsg);
    } catch (error) {
        console.error('sendMessage error:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /api/v1/conversation/:id
 */
const deleteConversation = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Delete messages first due to relation
        await prisma.message.deleteMany({ where: { conversation_id: id } });
        await prisma.conversation.delete({ where: { id } });
        res.json({ success: true, message: 'Conversation deleted' });
    } catch (error) {
        console.error('deleteConversation error:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllConversations,
    getMessagesByConversation,
    sendMessage,
    deleteConversation
};
