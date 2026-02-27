const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const path = require('path');

const DB_PATH = './database.json';
let db = { users: {}, messages: [] };

// Database Load/Save Logic
if (fs.existsSync(DB_PATH)) { db = JSON.parse(fs.readFileSync(DB_PATH)); }
const saveDB = () => fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// --- RANK CONFIGURATION (All 50 Categories) ---
const rankLevels = [
    {n: 'Rookie', p: 100}, {n: 'Guest', p: 200}, {n: 'Member', p: 300}, {n: 'Active', p: 400}, {n: 'Talker', p: 500},
    {n: 'Chatter', p: 600}, {n: 'Regular', p: 700}, {n: 'Friend', p: 800}, {n: 'Trusted', p: 900}, {n: 'Verified', p: 1000},
    {n: 'Fighter', p: 1500}, {n: 'Soldier', p: 1800}, {n: 'Warrior', p: 2100}, {n: 'Knight', p: 2400}, {n: 'Gladiator', p: 2700},
    {n: 'Spartan', p: 3000}, {n: 'Slayer', p: 3500}, {n: 'Commander', p: 4000}, {n: 'General', p: 4500}, {n: 'Warlord', p: 5000},
    {n: 'Spy', p: 6000}, {n: 'Ghost', p: 6500}, {n: 'Phantom', p: 7000}, {n: 'Coded', p: 8000}, {n: 'Linux', p: 9000},
    {n: 'Terminal', p: 10000}, {n: 'Root', p: 11000}, {n: 'System-Error', p: 12000}, {n: 'Mainframe', p: 13500}, {n: 'Hacker', p: 15000},
    {n: 'Elite', p: 20000}, {n: 'Master', p: 25000}, {n: 'Alpha', p: 28000}, {n: 'Viper', p: 32000}, {n: 'Cobra', p: 35000},
    {n: 'Dragon', p: 38000}, {n: 'Phoenix', p: 40000}, {n: 'Storm', p: 42000}, {n: 'Thunder', p: 45000}, {n: 'Shadow', p: 50000},
    {n: 'Alien', p: 75000}, {n: 'Astronaut', p: 90000}, {n: 'Nebula', p: 100000}, {n: 'Dark-Web', p: 150000}, {n: 'Mythic', p: 200000},
    {n: 'Titan', p: 250000}, {n: 'God', p: 300000}, {n: 'Immortal', p: 350000}, {n: 'Legend', p: 400000}, {n: 'Overlord', p: 500000}
];

io.on('connection', (socket) => {
    let uId = null;

    socket.on('auth', (name) => {
        if (!db.users[name]) {
            db.users[name] = { name, pts: 0, currentRank: 'PLAYER', titles: ['PLAYER'], own: false, frz: false };
        }
        uId = name;
        socket.emit('load history', db.messages);
    });

    socket.on('chat message', (msg) => {
        if (!uId || db.users[uId].frz) return;
        let user = db.users[uId];

        if (msg.startsWith('/')) {
            const args = msg.split(' ');
            const cmd = args[0].toLowerCase();

            // --- COMMANDS ---
            if (cmd === '/login' && args[1] === "NEXUS_ADMIN_786") {
                user.own = true; user.currentRank = "OWNER";
                socket.emit('sys', "👑 Pranaam Overlord!");
            } else if (cmd === '/titles') {
                socket.emit('sys', "Your Titles: " + user.titles.join(', '));
            } else if (cmd === '/settitle' && args[1]) {
                if (user.titles.includes(args[1])) {
                    user.currentRank = args[1];
                    socket.emit('sys', "Active Rank changed to: " + args[1]);
                }
            } else if (cmd === '/bal') {
                socket.emit('sys', `💰 Balance: ${user.pts} Points`);
            }
            // Admin Commands
            if (user.own) {
                if (cmd === '/setbal' && args[1] && args[2]) {
                    if (db.users[args[1]]) {
                        db.users[args[1]].pts = parseInt(args[2]);
                        socket.emit('sys', `${args[1]}'s balance updated.`);
                    }
                }
            }
            saveDB();
        } else {
            // Point Earning
            let bonus = (user.pts >= 1500) ? 20 : 10;
            user.pts += bonus;

            // Auto Unlock Ranks
            rankLevels.forEach(r => {
                if (user.pts >= r.p && !user.titles.includes(r.n)) {
                    user.titles.push(r.n);
                    socket.emit('sys', `✨ Unlocked: ${r.n}`);
                }
            });

            const mData = { u: user.name, m: msg, r: user.currentRank, t: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) };
            db.messages.push(mData);
            if (db.messages.length > 300) db.messages.shift();
            io.emit('chat message', mData);
            saveDB();
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => console.log('Nexus Ultra Live!'));
