/* Schema for users */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: String,
    phone: String,
    address: String,
    sign: String,
    admin: Boolean
});

module.exports = mongoose.model("Users", userSchema);