const mongoose = require("mongoose")
const Schema = mongoose.Schema

const user = new Schema({

    NPM: {
        require: true,
        type: Number,
        unique: true
    },
    Nama: {
        require: true,
        type: String
    },
    Password:{
        require: true,
        type: String
    } 
}
)

module.exports = mongoose.model("user", user)