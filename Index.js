const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// --- 👑 OWNER CONFIGURATION ---
const ADMIN_KEY = "NEXUS_ADMIN_786"; // Aapka secret password
let serverLocked = false;

// --- 📊 AUTOMATIC RANK SYSTEM (50 Levels Logic) ---
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
    // Default User Stats
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

        // Restriction Checks
        if (u.frz) return socket.emit('sys', "Owner has FROZEN you!");
        if (serverLocked && !u.own) return socket.emit('sys', "Portal is LOCKED by Owner.");

        if (msg.startsWith('/')) {
            const args = msg.split(' ');
            const cmd = args[0].toLowerCase();

            // --- 👑 OWNER LOGIN ---
            if (cmd === '/login' && args[1] === ADMIN_KEY) {
                u.own = true; 
                u.tag = "OWNER"; 
                u.col = "#ff0000";
                return socket.emit('sys', "👑 Pranaam Malik! Owner Powers Activated.");
            }

            // --- 🛠️ OWNER ONLY COMMANDS ---
            if (u.own) {
                if (cmd === '/lock') { serverLocked = true; io.emit('sys', "🚨 Server Locked by Owner!"); }
                if (cmd === '/unlock') { serverLocked = false; io.emit('sys', "🔓 Server Unlocked!"); }
                if (cmd === '/setbal' && args[1] && args[2]) {
                    // Note: Basic version handles self-bal for now
                    u.pts = parseInt(args[1]);
                    socket.emit('sys', "Points updated to: " + u.pts);
                }
                if (cmd === '/nuke') { io.emit('sys', "☢️ NUKE: Chat history cleared & everyone alerted!"); }
                if (cmd === '/maintenance') { serverLocked = true; io.emit('sys', "🛠 Maintenance Mode: ON"); }
            }

            // --- 🌍 GLOBAL COMMANDS ---
            if (cmd === '/bal') socket.emit('sys', `Balance: ${u.pts} Points`);
            if (cmd === '/nick' && args[1]) {
                u.name = args.slice(1).join(' ');
                socket.emit('sys', "Name updated to: " + u.name);
            }
            if (cmd === '/shop') socket.emit('sys', "Earn points by chatting! Warrior (10k), Hacker (100k), God (400k).");
            if (cmd === '/help') socket.emit('sys', "Commands: /bal, /nick, /shop, /login [key]");

        } else {
            // --- 💰 EARNING LOGIC ---
            // Warrior levels (Rank Power 1+) get double points
            let earn = (u.pts >= 10000) ? 20 : 10;
            u.pts += earn;
            
            // --- 📈 AUTO RANK UPDATE ---
            if (!u.own) {
                let r = getRank(u.pts);
                u.tag = r.tag; 
                u.col = r.col;
            }

            // Broadcast message to everyone
            io.emit('chat message', { 
                n: u.name, 
                t: u.tag, 
                c: u.col, 
                m: msg, 
                o: u.own 
            });
        }
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log('Nexus Engine is Live on Port ' + PORT);
});
