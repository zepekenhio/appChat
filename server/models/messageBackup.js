var mongoose = require('mongoose');
var db = require("../config/db");

var messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    ],
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date, default: Date.now
    }
});

var Message = mongoose.model("Message", messageSchema);
module.exports = Message;

