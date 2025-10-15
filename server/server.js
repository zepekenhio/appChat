const express = require('express');
const app = express();
const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");
const chatRoomRouter = require("./routes/chatRoomRouter");
const authMiddleware = require("./middleware/authMiddleware");
const Message = require("./models/messageModel");
const ChatRoom = require("./models/chatRoom");
const User = require("./models/userModel");
const jwt = require('jsonwebtoken');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.static("../public"));

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/chatrooms", chatRoomRouter);

io.on('connection', socket => {
    console.log('a user connected:', socket.id);
    
    // Authentication middleware for socket
    socket.on('authenticate', async (token) => {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ABC123DEF456');
            const user = await User.findById(decoded.id);
            if (user) {
                socket.userId = decoded.id;
                socket.username = user.username;
                socket.emit('authenticated', { success: true, user: { id: user._id, username: user.username } });
                console.log(`User ${user.username} authenticated with socket ${socket.id}`);
            } else {
                socket.emit('authentication_error', { message: 'User not found' });
            }
        } catch (error) {
            socket.emit('authentication_error', { message: 'Invalid token' });
        }
    });

    // Joint event - join a specific chat room
    socket.on('join_room', async (data) => {
        try {
            const { chatRoomId } = data;
            
            // Check if user is authenticated
            if (!socket.userId) {
                socket.emit('error', { message: 'Authentication required' });
                return;
            }
            
            // Validate chatRoomId
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                socket.emit('error', { message: 'Invalid chat room ID' });
                return;
            }
            
            // Check if chat room exists
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                socket.emit('error', { message: 'Chat room not found' });
                return;
            }
            
            // Check if user is a participant
            const isParticipant = chatRoom.participants.some(
                p => p.userId.toString() === socket.userId
            );
            
            if (!isParticipant) {
                socket.emit('error', { message: 'You are not a participant in this chat room' });
                return;
            }
            
            // Join the room
            socket.join(chatRoomId);
            socket.currentChatRoom = chatRoomId;
            console.log(`User ${socket.username} joined chat room ${chatRoomId}`);
            socket.emit('room_joined', { 
                message: 'Successfully joined the chat room',
                chatRoomId: chatRoomId,
                chatRoom: chatRoom
            });
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', { message: 'Failed to join chat room' });
        }
    });

    // Send message event
    socket.on('send_message', async (data) => {
        try {
            const { chatRoomId, content } = data;
            
            // Check if user is authenticated
            if (!socket.userId) {
                socket.emit('error', { message: 'Authentication required to send messages' });
                return;
            }

            // Validate required fields
            if (!chatRoomId || !content) {
                socket.emit('error', { message: 'Chat room ID and content are required' });
                return;
            }

            // Validate chatRoomId
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(chatRoomId)) {
                socket.emit('error', { message: 'Invalid chat room ID format' });
                return;
            }
            
            // Check if chat room exists
            const chatRoom = await ChatRoom.findById(chatRoomId);
            if (!chatRoom) {
                socket.emit('error', { message: 'Chat room not found' });
                return;
            }
            
            // Check if sender is a participant
            const isParticipant = chatRoom.participants.some(
                p => p.userId.toString() === socket.userId
            );
            
            if (!isParticipant) {
                socket.emit('error', { message: 'You are not a participant in this chat room' });
                return;
            }

            // Create and save the message
            const message = new Message({ 
                chatRoom: chatRoomId,
                sender: socket.userId, 
                content,
                createdAt: new Date()
            });
            
            const savedMessage = await message.save();
            
            // Populate sender information
            await savedMessage.populate('sender', 'username');

            // Emit to all users in the chat room
            io.to(chatRoomId).emit('new_message', savedMessage);
            
            // Send success confirmation to sender
            socket.emit('message_sent', { 
                success: true, 
                message: 'Message sent successfully',
                messageData: savedMessage 
            });

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });


    // Disconnect event
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

server.listen(3000, () => console.log('server is running on port 3000'));