const mongoose = require("mongoose")

const connectDB = async () => {
    await mongoose.connect("mongodb://localhost/sfuxzbot", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected To DB!"))
    .catch((err) => console.log(err))
}

module.exports = connectDB