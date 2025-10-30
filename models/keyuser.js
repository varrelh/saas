const mongoose = require("mongoose")
const Schema = mongoose.Schema
const autoincrement = require("mongoose-sequence")

const keyuser = new Schema({

    NPM:{
        type: String,
        require: true
    },
    publicKey: String,
    privateKey: String
}
)

keyuser.plugin(autoincrement(mongoose), {inc_field: "KeyID"})

module.exports = mongoose.model("keyuser", keyuser)