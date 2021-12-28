const express = require("express")
const fs = require("fs")
const qrcode = require("qrcode")
const http = require("http")
const socketIO = require("socket.io")

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

module.exports = (client) => {
    try {
        app.get("/", (req, res) => res.sendFile("index.html", { root: __dirname }))
        
        io.on("connection", (socket) => {
            let qrkode = false 
            client.on("qr", (qr) => {
                qrcode.toDataURL(qr, (err, data) => {
                    qrkode = data 
                    socket.emit("qr", qrkode)
                })
            })
            client.on("connecting", () => socket.emit("conn", "Connecting..."))
            client.on("open", () => {
                socket.emit("conn", { jid: client.user.jid })
                qrkode = false
            })
            client.on("close", () => socket.emit("close", "IDLE"))
            
            if (qrkode) {
                socket.emit("qr", qrkode)
            } else {
                socket.emit("conn", { jid: client.user ? client.user.jid : false })
            }
        })
        server.listen(process.env.PORT || 5000, () => console.log("Connect!"))
    } catch (e) {
        throw e
    }
}