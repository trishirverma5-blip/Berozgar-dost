const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// Static files serve karne ke liye
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Real-time Chat Connection
io.on('connection', (socket) => {
    socket.on('chat message', (data) => {
        // Sabhi ko message bhejna (User, Message, Rank, aur Time)
        io.emit('chat message', {
            u: data.u,
            m: data.m,
            r: data.r,
            t: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Nexus Engine is Running on Port: ' + PORT);
});
