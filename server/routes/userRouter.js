const express = require('express');
var userController = require("../controller/userController");
var authMiddleware = require("../middleware/authMiddleware");
var userRouter = express.Router();

// Public routes
userRouter.post("/register", userController.register);
userRouter.post("/login", userController.login);

// Protected routes
userRouter.get("/all", authMiddleware, userController.getAllUsers);
userRouter.get("/profile", authMiddleware, userController.getUserProfile);

module.exports = userRouter;
