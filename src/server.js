const express = require('express');
const http = require('http'); // Requis pour Socket.IO
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app); // On crée un serveur HTTP basé sur Express
const io = new Server(server); // On attache Socket.IO au serveur HTTP

const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));

// Gestion des connexions WebSocket
io.on('connection', (socket) => {
    console.log('Un utilisateur a rejoint la chill room 🎧');

    // Quand le serveur reçoit un message
    socket.on('chat message', (msg) => {
        // Il le renvoie à TOUS les utilisateurs connectés
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('Un utilisateur a quitté la room 👋');
    });
});

// Attention : on utilise server.listen() et plus app.listen()
server.listen(PORT, () => {
    console.log(`🚀 Serveur Lofi Pomodoro démarré sur http://localhost:${PORT}`);
});