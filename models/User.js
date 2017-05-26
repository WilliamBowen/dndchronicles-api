var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    hash: String,
    firstName: String,
    lastName: String
});
mongoose.model('User', UserSchema);

module.exports = mongoose.model('User');