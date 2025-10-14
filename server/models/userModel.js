var mongoose = require("mongoose");
var db = require("../config/db");

var userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

var User = mongoose.model("User", userSchema);
module.exports = User;
