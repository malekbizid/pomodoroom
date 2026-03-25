const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log('Un utilisateur a rejoint la chill room');

    // Quand le serveur reçoit un msg
    socket.on('chat message', (msg) => {
        // renvoie à tt les utilisateurs connectés
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur a quitté la room');
    });
});

server.listen(PORT, () => {
    console.log(`Serveur Lofi Pomodoro démarré sur http://localhost:${PORT}`);
});