-- Remove messages from duplicate conversations
DELETE FROM "Message" WHERE conversation_id IN (SELECT id FROM "Conversation" WHERE user2_id != 0);

-- Remove the duplicate conversations themselves
DELETE FROM "Conversation" WHERE user2_id != 0;
