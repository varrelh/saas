const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const autoincrement = require('mongoose-sequence')

const db = {};

db.mongoose = mongoose;

db.keyuser = require("./keyuser");
db.user = require("./user")

module.exports = db;