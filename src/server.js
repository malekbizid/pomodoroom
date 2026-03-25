const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// --- CONFIGURATION ---
app.use(express.json()); // Pour lire le JSON envoyé par le front
app.use(express.urlencoded({ extended: true }));

// Configuration de la session
const sessionMiddleware = session({
    secret: 'secret-lofi-key-super-secure', // À changer en production
    resave: false,
    saveUninitialized: false
});
app.use(sessionMiddleware);

// Partager la session Express avec Socket.IO
io.engine.use(sessionMiddleware);

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