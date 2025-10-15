// Migration Script for Converting Old Messages to Chat Room Architecture
// Run this script once after deploying the refactored code

const mongoose = require('mongoose');
const Message = require('./models/messageModel');
const MessageBackup = require('./models/messageBackup'); // Your old message model
const ChatRoom = require('./models/chatRoom');
const User = require('./models/userModel');

async function migrateMessages() {
    try {
        console.log('Starting migration...');
        
        // 1. Get all old messages (if you have any)
        const oldMessages = await MessageBackup.find({})
            .populate('sender')
            .populate('receiver');
        
        if (oldMessages.length === 0) {
            console.log('No old messages to migrate.');
            return;
        }
        
        console.log(`Found ${oldMessages.length} old messages to migrate`);
        
        // 2. Group messages by conversation participants
        const conversationMap = new Map();
        
        for (const msg of oldMessages) {
            // Create a unique key for the conversation
            const participants = [msg.sender._id.toString()];
            if (Array.isArray(msg.receiver)) {
                participants.push(...msg.receiver.map(r => r._id.toString()));
            } else {
                participants.push(msg.receiver._id.toString());
            }
            participants.sort(); // Sort to ensure consistency
            const conversationKey = participants.join('-');
            
            if (!conversationMap.has(conversationKey)) {
                conversationMap.set(conversationKey, {
                    participants: participants,
                    messages: []
                });
            }
            
            conversationMap.get(conversationKey).messages.push(msg);
        }
        
        console.log(`Found ${conversationMap.size} unique conversations`);
        
        // 3. Create chat rooms for each conversation
        let migratedCount = 0;
        
        for (const [key, conversation] of conversationMap) {
            // Get user details for participants
            const users = await User.find({
                _id: { $in: conversation.participants }
            });
            
            // Create chat room
            const participantObjects = users.map(user => ({
                userId: user._id,
                username: user.username
            }));
            
            const chatRoom = new ChatRoom({
                participants: participantObjects,
                createdAt: conversation.messages[0].createdAt || new Date()
            });
            
            await chatRoom.save();
            console.log(`Created chat room ${chatRoom._id} for ${users.map(u => u.username).join(', ')}`);
            
            // 4. Migrate messages to new format
            for (const oldMsg of conversation.messages) {
                const newMessage = new Message({
                    chatRoom: chatRoom._id,
                    sender: oldMsg.sender._id,
                    content: oldMsg.content,
                    createdAt: oldMsg.createdAt || new Date()
                });
                
                await newMessage.save();
                migratedCount++;
            }
        }
        
        console.log(`Migration complete! Migrated ${migratedCount} messages to ${conversationMap.size} chat rooms.`);
        console.log('You can now safely remove old messages if desired.');
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Uncomment to run migration
// migrateMessages().then(() => {
//     console.log('Migration finished');
//     process.exit(0);
// });

module.exports = { migrateMessages };
