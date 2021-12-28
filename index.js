const { WAConnection, MessageType, ReconnectMode } = require("@adiwajshing/baileys")
const express = require("express")
const flash = require("express-flash")
const session = require("express-session")
const passport = require("passport")
const fs = require("fs")
const mongoose = require("mongoose")
const qrcode = require("qrcode")
const http = require("http")
const socketIO = require("socket.io")
const { User } = require("./db/user/user.js")

const file = fs.readdirSync("./db/session")
const defaultMenu = () => {
    return `This Is Default Menu`
}

require("./passport.js")(
    passport,
    email => users.find(x => x.email == email),
    id => users.find(x => x.id == id)
)
const connect = async () => {
  await mongoose
    .connect("mongodb://localhost/sfuxz", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("connected,,"))
    .catch((err) => console.log(err));
};
connect();

const port = process.env.PORT || 8000
const app = express()
app.set("view engine", "ejs")
app.set("port", port)
app.set("trust proxy", 1)
app.use(express.urlencoded({ extended: true }))
app.use(flash())
app.use(session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true
    }
}))
app.use(passport.initialize())
app.use(passport.session())
const server = http.createServer(app)
const io = socketIO(server)
const client = new WAConnection()
client.version = [2, 2143, 3]
client.logger.level = "warn"
client.connectOptions.waitForChats = true
client.autoReconnect = ReconnectMode.onConnectionLost

function startSesi() {
    file.forEach(sesi => {
        console.log(sesi)
        fs.existsSync(`./db/session/${sesi}`) && client.loadAuthInfo(`./db/session/${sesi}`)
        client.on("connecting", (res) => console.log(`Connecting To Session ${sesi}`, res))
        client.on("open", (res) => console.log(`Opened To Session ${sesi}`, res))
    })
}

startSesi()

// Main 
app.get("/", checkAuthenticated, (req, res) => {
    console.log(req.user)
    res.render("index.ejs", {
        username: req.user.username,
        email: req.user.email,
        numberBot: req.user.numberBot ? req.user.numberBot : "-",
        user: req.user.username
    })
})
app.get("/scan-qr", checkAuthenticated, (req, res) => {
    res.render("scan-qr.ejs", {
        id: req.user.id
    })
    user = req.user
})
app.get("/custom-menu", (req, res) => {
    res.render("custom-menu.ejs")
})
app.post("/custom-menu", (req, res) => {
    users[users.findIndex(x => x.email == req.user.email)].txtMenu = req.body.menu
    fs.writeFileSync(`./db/user/user.json`, JSON.stringify(users))
})
app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})
app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}))
app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})
app.post("/register", checkNotAuthenticated, (req, res) => {
    try {
        users.push({
            id: Date.now().toString(),
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            numberBot: false,
            txtMenu: "default"
        })
        fs.writeFileSync("./db/user/user.json", JSON.stringify(users))
        res.redirect("/login")
        console.log(users)
    } catch (e) {
        res.redirect("/register")
    }
})
app.post("/logout", (req, res) => {
    req.logOut(),
    res.redirect("/login")
})

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/')
  }
  next()
}

// IO
io.on("connection", (socket) => {
    socket.emit("conn", "Menghubungkan...")
    //console.log(user)
    socket.on("id", (id) => {
        client.on("qr", (qr) => {
            qrcode.toDataURL(qr, (err, data) => {
                socket.emit("conn", "Pindai Kode QR Ini Di WhatsApp Web Kamu!")
                socket.emit("qr", data)
            })
        })
        fs.existsSync(`./db/session/${users[users.findIndex(x => x.id == id)].numberBot}.json`) && client.loadAuthInfo(`./db/session/${users[users.findIndex(x => x.id == id)].numberBot}.json`)
        client.on("connecting", () => {
            socket.emit("conn", "Sedang Menghubungkan Ke WhatsApp Web")
        })
        client.on("open", () => {
            socket.emit("conn", "Berhasil Terhubung Ke WhatsApp Web!")
            socket.emit("open", "Berhasil Terhubung Ke WhatsApp Web!")
        })
        client.connect({ timeoutMs: 30 * 1000 })
        .then((response) => {
            console.log(users[users.findIndex(x => x.id == id)])
            users[users.findIndex(x => x.id == id)].numberBot = response.user.jid.split("@")[0]
            fs.writeFileSync(`./db/user/user.json`, JSON.stringify(users))
            socket.emit("bot", response.user.jid)
            fs.writeFileSync(`./db/session/${response.user.jid.split("@")[0]}.json`, JSON.stringify(client.base64EncodedAuthInfo(), null, "\t"))
        })
        
        client.on("ws-close", () => console.log("Retrying To Connecting..."))
        client.on("close", (res) => console.log(res))
    })
})

// Bot
client.on("chat-update", (msg) => {
    if (!msg.hasNewMessage) return 
    const m = msg.messages.all()[0]
    if (!m.message) return 
    if (m.key && m.key.remoteJid == "status@broadcast") return 
    if (m.key.fromMe) return 
    if (m.message.conversation == "#menu") {
        if (users[users.findIndex(x => x.numberBot)].txtMenu == "default") {
            return client.sendMessage(m.key.remoteJid, defaultMenu(), MessageType.text, { quoted: m })
        } else {
            return client.sendMessage(m.key.remoteJid, users[users.findIndex(x => x.numberBot)].txtMenu, MessageType.text, { quoted: m })
        }
    }
})

server.listen(port)