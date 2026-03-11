const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Indique à Express de servir les fichiers statiques (HTML, CSS, JS) du dossier 'public'
app.use(express.static(path.join(__dirname, '../public')));

// Démarre le serveur et écoute sur le port 3000
app.listen(PORT, () => {
    console.log(`🚀 Serveur Lofi Pomodoro démarré sur http://localhost:${PORT}`);
});