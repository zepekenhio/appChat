var express = require('express');
var messageController = require("../controller/messageController");
var authMiddleware = require("../middleware/authMiddleware");
var messageRouter = express.Router();

// Protected routes - require authentication
messageRouter.post("/send-message", authMiddleware, messageController.sendMessage);
messageRouter.get("/messages/:userId", authMiddleware, messageController.getMessages);
messageRouter.get("/conversation/:userId1/:userId2", authMiddleware, messageController.getConversation);

module.exports = messageRouter;
