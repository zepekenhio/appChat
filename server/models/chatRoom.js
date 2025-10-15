var mongoose = require('mongoose');
var db = require("../config/db");

var chatRoomSchema = new mongoose.Schema({
    participants: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);