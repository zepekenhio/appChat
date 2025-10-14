const express = require('express');
const app = express();
const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");
const authMiddleware = require("./middleware/authMiddleware");
const Message = require("./models/messageModel");
const User = require("./models/userModel");
const jwt = require('jsonwebtoken');

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(userRouter);
app.use(messageRouter);

const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.static("../public"));

app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);

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

    // Joint event
    socket.on('join', (data) => {
        const { userId, username } = data;
        socket.userId = userId;
        socket.username = username;
        console.log(`Socket ${socket.id} joined the chat as ${username}`);
        socket.emit('joined', { message: 'Successfully joined the chat' });
    });

    // Send message event
    socket.on('send_message', async (data) => {
        try {
            const { receiver, content } = data;
            
            // Check if user is authenticated
            if (!socket.userId) {
                socket.emit('error', { message: 'Authentication required to send messages' });
                return;
            }

            // Validate required fields
            if (!receiver || !content) {
                socket.emit('error', { message: 'Receiver and content are required' });
                return;
            }

            // Validate ObjectId format
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(receiver)) {
                socket.emit('error', { message: 'Invalid receiver ID format' });
                return;
            }
            
            // Check if receiver exists
            const receiverUser = await User.findById(receiver);
            if (!receiverUser) {
                socket.emit('error', { message: 'Receiver not found' });
                return;
            }

            // Check if sender and receiver are different
            if (socket.userId === receiver) {
                socket.emit('error', { message: 'Cannot send message to yourself' });
                return;
            }

            // Create and save the message
            const message = new Message({ 
                sender: socket.userId, 
                receiver, 
                content,
                createdAt: new Date()
            });
            
            const savedMessage = await message.save();
            
            // Populate sender and receiver information for the response
            await savedMessage.populate('sender', 'username');
            await savedMessage.populate('receiver', 'username');

            // Emit to all connected clients (you can modify this to emit only to specific users)
            io.emit('new_message', savedMessage);
            
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