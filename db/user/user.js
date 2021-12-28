const { User } = require("./model.js")

const addUser = (username, password, email, numberWa ) => {
    const obj = { username, password, email, numberWa, numberBot: false }
    new User(obj)
}

const findUser = (username) => {
    User.findOne({ username: username })
    .then((user) => {
        if (user !== null) {
            return user
        } else {
            return false
        }
    })
}

module.exports = {
    addUser,
    findUser
}