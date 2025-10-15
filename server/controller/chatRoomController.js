const ChatRoom = require("../models/chatRoom");
const User = require("../models/userModel");
const mongoose = require("mongoose");

const chatRoomController = {
    // Create a new chat room
    createChatRoom: async (req, res) => {
        try {
            const { participantIds } = req.body;
            const creatorId = req.user.id; // From auth middleware
            
            // Validate required fields
            if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
                return res.status(400).json({ error: "At least one participant is required" });
            }
            
            // Add creator to participants if not already included
            const allParticipantIds = [...new Set([creatorId, ...participantIds])];
            
            // Validate all participant IDs
            for (let id of allParticipantIds) {
                if (!mongoose.Types.ObjectId.isValid(id)) {
                    return res.status(400).json({ error: "Invalid participant ID format" });
                }
            }
            
            // Check if all participants exist
            const participants = await User.find({ _id: { $in: allParticipantIds } });
            if (participants.length !== allParticipantIds.length) {
                return res.status(404).json({ error: "One or more participants not found" });
            }
            
            // Check if a chat room with the same participants already exists
            // Find rooms that contain all the participant IDs
            const existingChatRooms = await ChatRoom.find({
                'participants.userId': { $all: allParticipantIds }
            });
            
            // Check if any room has exactly the same participants (no more, no less)
            const exactMatch = existingChatRooms.find(room => 
                room.participants.length === allParticipantIds.length
            );
            
            if (exactMatch) {
                return res.status(200).json({
                    message: "Chat room already exists",
                    data: exactMatch
                });
            }
            
            // Create participant objects with userId and username
            const participantObjects = participants.map(user => ({
                userId: user._id,
                username: user.username
            }));
            
            // Create new chat room
            const newChatRoom = new ChatRoom({
                participants: participantObjects
            });
            
            const savedChatRoom = await newChatRoom.save();
            
            res.status(201).json({
                message: "Chat room created successfully",
                data: savedChatRoom
            });
        } catch (error) {
            console.error("Error creating chat room:", error);
            res.status(500).json({ error: "Error creating chat room" });
        }
    },
    
    // Get all chat rooms for a user
    getUserChatRooms: async (req, res) => {
        try {
            const userId = req.user.id; // From auth middleware
            
            const chatRooms = await ChatRoom.find({
                'participants.userId': userId
            }).sort({ createdAt: -1 });
            
            res.status(200).json({
                message: "Chat rooms retrieved successfully",
                data: chatRooms
            });
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
            res.status(500).json({ error: "Error fetching chat rooms" });
        }
    },
    
    // Get a specific chat room by ID
    getChatRoom: async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id; // From auth middleware
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                return res.status(400).json({ error: "Invalid chat room ID format" });
            }
            
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
            
            res.status(200).json({
                message: "Chat room retrieved successfully",
                data: chatRoom
            });
        } catch (error) {
            console.error("Error fetching chat room:", error);
            res.status(500).json({ error: "Error fetching chat room" });
        }
    },
    
    // Add participant to chat room
    addParticipant: async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const { participantId } = req.body;
            const userId = req.user.id; // From auth middleware
            
            // Validate ObjectId formats
            if (!mongoose.Types.ObjectId.isValid(chatRoomId) || 
                !mongoose.Types.ObjectId.isValid(participantId)) {
                return res.status(400).json({ error: "Invalid ID format" });
            }
            
            const chatRoom = await ChatRoom.findById(chatRoomId);
            
            if (!chatRoom) {
                return res.status(404).json({ error: "Chat room not found" });
            }
            
            // Check if user is a participant (only participants can add others)
            const isParticipant = chatRoom.participants.some(
                p => p.userId.toString() === userId
            );
            
            if (!isParticipant) {
                return res.status(403).json({ error: "You are not a participant in this chat room" });
            }
            
            // Check if participant already exists in chat room
            const alreadyParticipant = chatRoom.participants.some(
                p => p.userId.toString() === participantId
            );
            
            if (alreadyParticipant) {
                return res.status(400).json({ error: "User is already a participant" });
            }
            
            // Get participant user details
            const newParticipant = await User.findById(participantId);
            
            if (!newParticipant) {
                return res.status(404).json({ error: "User not found" });
            }
            
            // Add participant
            chatRoom.participants.push({
                userId: newParticipant._id,
                username: newParticipant.username
            });
            
            await chatRoom.save();
            
            res.status(200).json({
                message: "Participant added successfully",
                data: chatRoom
            });
        } catch (error) {
            console.error("Error adding participant:", error);
            res.status(500).json({ error: "Error adding participant" });
        }
    },
    
    // Delete a chat room
    deleteChatRoom: async (req, res) => {
        try {
            const { chatRoomId } = req.params;
            const userId = req.user.id;
            
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                return res.status(400).json({ error: "Invalid chat room ID format" });
            }
            
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
            
            await ChatRoom.findByIdAndDelete(chatRoomId);
            
            res.status(200).json({
                message: "Chat room deleted successfully"
            });
        } catch (error) {
            console.error("Error deleting chat room:", error);
            res.status(500).json({ error: "Error deleting chat room" });
        }
    }
};

module.exports = chatRoomController;
