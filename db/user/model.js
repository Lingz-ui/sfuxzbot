const mongoose = require("mongoose")

const Skema = new mongoose.Schema({
    username: { type: String },
    password: { type: String },
    email: { type: String },
    numberWa : { type: Number },
    numberBot: mongoose.Schema.Types.Mixed,
    txtMenu: { type: String }
}, { versionkey: false })

const Users = mongoose.model("user", Skema)

module.exports.User = Users