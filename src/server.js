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

// --- BASE DE DONNÉES MYSQL ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Ton utilisateur MySQL
    password: 'root', // Ton mot de passe MySQL
    database: 'pomodoroom'
});

db.connect((err) => {
    if (err) throw err;
    console.log('📦 Connecté à la base de données MySQL');
});

// --- ROUTES D'AUTHENTIFICATION ---
// Inscription
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Données manquantes');

    try {
        // Insertion directe du mot de passe en clair
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
            if (err) return res.status(400).send('Ce nom d\'utilisateur existe déjà.');
            res.send('Inscription réussie !');
        });
    } catch (error) {
        res.status(500).send('Erreur serveur');
    }
});

// Connexion
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) return res.status(401).send('Identifiants incorrects');

        const user = results[0];
        
        // Comparaison directe des mots de passe
        if (password === user.password) {
            req.session.userId = user.id;
            req.session.username = user.username; // On stocke le nom dans la session
            res.send({ message: 'Connecté', username: user.username });
        } else {
            res.status(401).send('Identifiants incorrects');
        }
    });
});

// Vérifier si l'utilisateur est connecté
app.get('/api/me', (req, res) => {
    if (req.session.username) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});
// Déconnexion
app.post('/api/logout', (req, res) => {
    // On détruit la session côté serveur
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.clearCookie('connect.sid'); // On efface le cookie du navigateur
        res.send({ message: 'Déconnecté avec succès' });
    });
});

// --- WEBSOCKETS (CHAT) ---
// --- WEBSOCKETS (CHAT) ---
io.on('connection', (socket) => {
    const req = socket.request;
    const username = req.session.username ? req.session.username : 'Anonyme';

    console.log(`🎧 ${username} a rejoint la chill room`);

    // 1. Récupérer et envoyer l'historique des messages (les 50 derniers)
    db.query('SELECT username, text FROM messages ORDER BY created_at ASC LIMIT 50', (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'historique :', err);
        } else {
            // On envoie l'historique uniquement à l'utilisateur qui vient de se connecter
            socket.emit('chat history', results);
        }
    });

    socket.on('chat message', (msg) => {
        // 2. Sauvegarder le nouveau message dans la base de données
        db.query('INSERT INTO messages (username, text) VALUES (?, ?)', [username, msg], (err) => {
            if (err) console.error('Erreur lors de la sauvegarde du message :', err);
        });

        // 3. Renvoyer le message en direct à tous les utilisateurs connectés
        io.emit('chat message', { user: username, text: msg });
    });

    socket.on('disconnect', () => {
        console.log(`👋 ${username} a quitté la room`);
    });
}
);
// --- DÉMARRAGE DU SERVEUR ---
server.listen(PORT, () => {
    console.log(`🚀 Serveur Lofi Pomodoro démarré sur http://localhost:${PORT}`);
});