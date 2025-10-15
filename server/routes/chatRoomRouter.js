const express = require('express');
const chatRoomController = require("../controller/chatRoomController");
const authMiddleware = require("../middleware/authMiddleware");
const chatRoomRouter = express.Router();

// All routes require authentication
chatRoomRouter.post("/create", authMiddleware, chatRoomController.createChatRoom);
chatRoomRouter.get("/my-rooms", authMiddleware, chatRoomController.getUserChatRooms);
chatRoomRouter.get("/:chatRoomId", authMiddleware, chatRoomController.getChatRoom);
chatRoomRouter.post("/:chatRoomId/add-participant", authMiddleware, chatRoomController.addParticipant);
chatRoomRouter.delete("/:chatRoomId", authMiddleware, chatRoomController.deleteChatRoom);

module.exports = chatRoomRouter;
