const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path'); // Error fix karne ke liye ye zaroori hai

// --- 🛠️ FRONTEND FIX (Ye lines "Cannot GET /" ko theek karengi) ---
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 👑 OWNER CONFIGURATION ---
const ADMIN_KEY = "NEXUS_ADMIN_786"; 
let serverLocked = false;

// --- 📊 AUTOMATIC RANK SYSTEM ---
const getRank = (pts) => {
    if (pts >= 1000000) return { tag: 'OVERLORD', col: '#ff0055' };
    if (pts >= 900000) return { tag: 'SUPREME', col: '#6200ea' };
    if (pts >= 800000) return { tag: 'LEGEND', col: '#ff00ff' };
    if (pts >= 700000) return { tag: 'TITAN', col: '#0055ff' };
    if (pts >= 600000) return { tag: 'MYTHIC', col: '#ff4444' };
    if (pts >= 500000) return { tag: 'IMMORTAL', col: '#00fbff' };
    if (pts >= 400000) return { tag: 'GOD', col: '#ffffff' };
    if (pts >= 300000) return { tag: 'DEMI-GOD', col: '#e0e0e0' };
    if (pts >= 200000) return { tag: 'ANCIENT', col: '#bb86fc' };
    if (pts >= 100000) return { tag: 'HACKER', col: '#39ff14' };
    if (pts >= 75000) return { tag: 'ELITE', col: '#03dac6' };
    if (pts >= 50000) return { tag: 'ALPHA', col: '#ffcc00' };
    if (pts >= 25000) return { tag: 'COMMANDER', col: '#cf6679' };
    if (pts >= 10000) return { tag: 'WARRIOR', col: '#ffd700' };
    if (pts >= 5000) return { tag: 'FIGHTER', col: '#ff8800' };
    if (pts >= 1000) return { tag: 'ACTIVE', col: '#00ff88' };
    return { tag: 'PLAYER', col: '#888' };
};

io.on('connection', (socket) => {
    socket.u = { 
        name: "Guest_" + Math.floor(Math.random()*999), 
        pts: 0, 
        tag: 'PLAYER', 
        col: '#888', 
        own: false, 
        frz: false 
    };

    socket.on('chat message', (msg) => {
        let u = socket.u;
        if (u.frz) return socket.emit('sys', "Owner has FROZEN you!");
        if (serverLocked && !u.own) return socket.emit('sys', "Portal is LOCKED by Owner.");

        if (msg.startsWith('/')) {
            const args = msg.split(' ');
            const cmd = args[0].toLowerCase();

            if (cmd === '/login' && args[1] === ADMIN_KEY) {
                u.own = true; 
                u.tag = "OWNER"; 
                u.col = "#ff0000";
                return socket.emit('sys', "👑 Pranaam Malik! Owner Powers Activated.");
            }

            if (u.own) {
                if (cmd === '/lock') { serverLocked = true; io.emit('sys', "🚨 Server Locked!"); }
                if (cmd === '/unlock') { serverLocked = false; io.emit('sys', "🔓 Server Unlocked!"); }
                if (cmd === '/setbal' && args[1]) {
                    u.pts = parseInt(args[1]);
                    socket.emit('sys', "Points updated to: " + u.pts);
                }
                if (cmd === '/nuke') { io.emit('sys', "☢️ NUKE: Chat history cleared!"); }
            }

            if (cmd === '/bal') socket.emit('sys', `Balance: ${u.pts} Points`);
            if (cmd === '/help') socket.emit('sys', "Commands: /bal, /nick, /shop, /login [key]");

        } else {
            let earn = (u.pts >= 10000) ? 20 : 10;
            u.pts += earn;
            if (!u.own) {
                let r = getRank(u.pts);
                u.tag = r.tag; 
                u.col = r.col;
            }
            io.emit('chat message', { n: u.name, t: u.tag, c: u.col, m: msg, o: u.own });
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Nexus Engine is Live!');
});
