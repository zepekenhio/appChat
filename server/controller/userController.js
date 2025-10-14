var User = require("../models/userModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

var userController = {
   register: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ username, password: hashedPassword });
            await newUser.save();

            const token = jwt.sign({ id: newUser._id, username: newUser.username }, process.env.JWT_SECRET || 'ABC123DEF456', { expiresIn: '24h' });
            res.status(201).json({ token });
        } catch (err) {
            if (err.code === 11000) {
                res.status(400).json({ error: 'Username already exists.' });
            } else {
                res.status(400).json({ error: err.message });
            }
        }
    },

    login: async (req, res) => {
        try {
            const { username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password are required.' });
            }

            const user = await User.findOne({ username });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid credentials.' });
            }

            const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || 'ABC123DEF456', { expiresIn: '24h' });
            res.status(200).json({ token });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await User.find({}, 'username _id'); // Only return username and _id
            res.status(200).json(users);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching users' });
        }
    },

    getUserProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id, 'username _id');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json(user);
        } catch (err) {
            res.status(500).json({ error: 'Error fetching user profile' });
        }
    }
};

module.exports = userController;
