var express = require('express');
var messageController = require("../controller/messageController");
var authMiddleware = require("../middleware/authMiddleware");
var messageRouter = express.Router();

// Protected routes - require authentication
messageRouter.post("/send", authMiddleware, messageController.sendMessage);
messageRouter.get("/chatroom/:chatRoomId", authMiddleware, messageController.getMessages);
messageRouter.get("/all", authMiddleware, messageController.getAllUserMessages);

module.exports = messageRouter;
