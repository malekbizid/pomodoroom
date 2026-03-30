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
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware = session({
    secret: 'secret-lofi-key-super-secure', 
    resave: false,
    saveUninitialized: false
});
app.use(sessionMiddleware);
io.engine.use(sessionMiddleware);

app.use(express.static(path.join(__dirname, '../public')));

// --- BASE DE DONNÉES MYSQL ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', 
    database: 'pomodoroom'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erreur de connexion à MySQL :', err.message);
        return;
    }
    console.log('📦 Connecté à la base de données MySQL');
});

// --- ROUTES D'AUTHENTIFICATION ---
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Données manquantes');

    try {
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err, result) => {
            if (err) return res.status(400).send('Ce nom d\'utilisateur existe déjà.');
            res.send('Inscription réussie !');
        });
    } catch (error) {
        res.status(500).send('Erreur serveur');
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err || results.length === 0) return res.status(401).send('Identifiants incorrects');

        const user = results[0];
        
        if (password === user.password) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.send({ message: 'Connecté', username: user.username });
        } else {
            res.status(401).send('Identifiants incorrects');
        }
    });
});

app.get('/api/me', (req, res) => {
    if (req.session.username) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erreur lors de la déconnexion');
        }
        res.clearCookie('connect.sid');
        res.send({ message: 'Déconnecté avec succès' });
    });
});

// --- ROUTES TO-DO LIST ---

app.get('/api/todos', (req, res) => {
    if (!req.session.username) return res.status(401).send('Non autorisé');
    
    db.query('SELECT * FROM todos WHERE username = ? ORDER BY position ASC, id ASC', [req.session.username], (err, results) => {
        if (err) return res.status(500).send('Erreur BDD');
        res.json(results);
    });
});

app.post('/api/todos', (req, res) => {
    if (!req.session.username) return res.status(401).send('Non autorisé');
    const { text, position } = req.body;
    
    db.query('INSERT INTO todos (username, text, position) VALUES (?, ?, ?)', [req.session.username, text, position || 0], (err, result) => {
        if (err) return res.status(500).send('Erreur BDD');
        res.json({ id: result.insertId, text: text, completed: 0, position: position || 0 }); 
    });
});

// CORRECTION ICI : La route spécifique /reorder doit ABSOLUMENT être avant la route joker /:id
app.put('/api/todos/reorder', (req, res) => {
    if (!req.session.username) return res.status(401).send('Non autorisé');
    
    const { orderedTasks } = req.body;

    if (!orderedTasks || !Array.isArray(orderedTasks)) {
        return res.status(400).send('Données invalides');
    }

    orderedTasks.forEach(task => {
        db.query(
            'UPDATE todos SET position = ? WHERE id = ? AND username = ?', 
            [task.position, task.id, req.session.username],
            (err) => {
                if (err) console.error("Erreur réorganisation MySQL:", err);
            }
        );
    });

    res.send('Ordre mis à jour');
});

// Route joker (/:id) placée APRES /reorder
app.put('/api/todos/:id', (req, res) => {
    if (!req.session.username) return res.status(401).send('Non autorisé');
    const { completed } = req.body;
    
    db.query('UPDATE todos SET completed = ? WHERE id = ? AND username = ?', [completed, req.params.id, req.session.username], (err) => {
        if (err) return res.status(500).send('Erreur BDD');
        res.send('Tâche mise à jour');
    });
});

app.delete('/api/todos/:id', (req, res) => {
    if (!req.session.username) return res.status(401).send('Non autorisé');
    
    db.query('DELETE FROM todos WHERE id = ? AND username = ?', [req.params.id, req.session.username], (err) => {
        if (err) return res.status(500).send('Erreur BDD');
        res.send('Tâche supprimée');
    });
});

// --- WEBSOCKETS (CHAT) ---
let connectedUsers = 0;

io.on('connection', (socket) => {
    const req = socket.request;
    const username = req.session.username ? req.session.username : 'Anonyme';

    connectedUsers++;
    io.emit('user count', connectedUsers);

    console.log(`🎧 ${username} a rejoint la chill room`);

    db.query('SELECT username, text FROM messages ORDER BY created_at ASC LIMIT 50', (err, results) => {
        if (err) {
            console.error('Erreur lors de la récupération de l\'historique :', err);
        } else {
            socket.emit('chat history', results);
        }
    });

    socket.on('chat message', (msg) => {
        db.query('INSERT INTO messages (username, text) VALUES (?, ?)', [username, msg], (err) => {
            if (err) console.error('Erreur lors de la sauvegarde du message :', err);
        });

        io.emit('chat message', { user: username, text: msg });
    });

    socket.on('disconnect', () => {
        connectedUsers--;
        io.emit('user count', connectedUsers);
        console.log(`👋 ${username} a quitté la room`);
    });
});

// --- DÉMARRAGE DU SERVEUR ---
server.listen(PORT, () => {
    console.log(`🚀 Serveur Lofi Pomodoro démarré sur http://localhost:${PORT}`);
});