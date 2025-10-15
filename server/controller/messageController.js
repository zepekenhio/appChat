var Message = require("../models/messageModel");
var ChatRoom = require("../models/chatRoom");
var mongoose = require("mongoose");

var messageController = {
    sendMessage: async (req, res) => {
        try {
            const { chatRoomId, content } = req.body;
            const senderId = req.user.id; // From auth middleware
            
            // Validate required fields
            if (!chatRoomId || !content) {
                return res.status(400).json({ error: "Chat room ID and content are required" });
            }
            
            // Validate chatRoomId format
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                return res.status(400).json({ error: "Invalid chat room ID format" });
            }
            
            // Check if chat room exists
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({ error: "Chat room not found" });
            }
            
            // Check if sender is a participant in the chat room
            const isParticipant = chatRoom.participants.some(
                p => p.userId.toString() === senderId
            );
            
            if (!isParticipant) {
                return res.status(403).json({ error: "You are not a participant in this chat room" });
            }
            
            // Create and save the message
            const newMessage = new Message({ 
                chatRoom: chatRoomId,
                sender: senderId, 
                content,
                createdAt: new Date()
            });
            
            const savedMessage = await newMessage.save();
            
            // Populate sender information
            await savedMessage.populate('sender', 'username');
            await savedMessage.populate('chatRoom');
            
            res.status(201).json({ 
                message: "Message sent successfully",
                data: savedMessage
            });
        } catch (error) {
            console.log("Error saving message:", error);
            res.status(500).json({ error: "Error sending message" });
        }
    },
    
    getMessages: async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id; // From auth middleware
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                return res.status(400).json({ error: "Invalid chat room ID format" });
            }
            
            // Check if chat room exists
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                return res.status(404).json({ error: "Chat room not found" });
            }
            
            // Check if user is a participant
            const isParticipant = chatRoom.participants.some(
                p => p.userId.toString() === userId
            );
            
            if (!isParticipant) {
                return res.status(403).json({ error: "You are not a participant in this chat room" });
            }
            
            // Get all messages for this chat room
            const messages = await Message.find({ chatRoom: chatRoomId })
                .populate('sender', 'username')
                .sort({ createdAt: 1 }); // Sort by creation time (oldest first)
            
            res.status(200).json({
                message: "Messages retrieved successfully",
                data: messages
            });
        } catch (error) {
            console.error("Error fetching messages:", error);
            res.status(500).json({ error: "Error fetching messages" });
        }
    },
    
    
    // Get all user messages across all chat rooms (optional - for backward compatibility)
    getAllUserMessages: async (req, res) => {
        try {
            const userId = req.user.id; // From auth middleware
            
            // Find all chat rooms where user is a participant
            const chatRooms = await ChatRoom.find({
                'participants.userId': userId
            });
            
            const chatRoomIds = chatRooms.map(room => room._id);
            
            // Get all messages from those chat rooms
            const messages = await Message.find({
                chatRoom: { $in: chatRoomIds }
            })
            .populate('sender', 'username')
            .populate('chatRoom')
            .sort({ createdAt: 1 });
            
            res.status(200).json({
                message: "All messages retrieved successfully",
                data: messages
            });
        } catch (error) {
            console.error("Error fetching all messages:", error);
            res.status(500).json({ error: "Error fetching messages" });
        }
    }
};

module.exports = messageController;
