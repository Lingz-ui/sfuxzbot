const LocalStrategy = require("passport-local").Strategy

module.exports = (passport, getUserByEmail, getUserById) => {
    const authUser = async (email, password, done) => {
        console.log(password)
        const user = getUserByEmail(email)
        if (user === undefined) {
            return done(null, { message: "No User With That Email!" })
        }
        
        try {
            if (password == user.password) {
                return done(null, user)
            } else {
                return done(null, { message: "Password Incorrect!" })
            }
        } catch (e) {
            return done(e)
        }
    }
    
    passport.use(new LocalStrategy(authUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        console.log((id))
        return done(null, getUserById(id))
    })
}