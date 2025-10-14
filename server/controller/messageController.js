var Message = require("../models/messageModel");
var mongoose = require("mongoose");

var messageController = {
    sendMessage: async (req, res) => {
        try {
            const { sender, receiver, content } = req.body;
            
            // Validate required fields
            if (!sender || !receiver || !content) {
                return res.status(400).json({ error: "Sender, receiver, and content are required" });
            }
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
                return res.status(400).json({ error: "Invalid sender or receiver ID" });
            }
            
            // Check if sender and receiver are different
            if (sender === receiver) {
                return res.status(400).json({ error: "Cannot send message to yourself" });
            }
            
            const newMessage = new Message({ 
                sender, 
                receiver, 
                content,
                createdAt: new Date()
            });
            
            const savedMessage = await newMessage.save();
            
            // Populate sender and receiver information
            await savedMessage.populate('sender', 'username');
            await savedMessage.populate('receiver', 'username');
            
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
            const { userId } = req.params;
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID" });
            }
            
            const messages = await Message.find({
                $or: [{ sender: userId }, { receiver: userId }]
            })
            .populate('sender', 'username')
            .populate('receiver', 'username')
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
    
    getConversation: async (req, res) => {
        try {
            const { userId1, userId2 } = req.params;
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId1) || !mongoose.Types.ObjectId.isValid(userId2)) {
                return res.status(400).json({ error: "Invalid user ID format" });
            }
            
            const messages = await Message.find({
                $or: [
                    { sender: userId1, receiver: userId2 },
                    { sender: userId2, receiver: userId1 }
                ]
            })
            .populate('sender', 'username')
            .populate('receiver', 'username')
            .sort({ createdAt: 1 }); // Sort by creation time (oldest first)
            
            res.status(200).json({
                message: "Conversation retrieved successfully",
                data: messages
            });
        } catch (error) {
            console.error("Error fetching conversation:", error);
            res.status(500).json({ error: "Error fetching conversation" });
        }
    }
};

module.exports = messageController;


