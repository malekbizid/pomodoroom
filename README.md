#  Pomodoro Chill Room
https://canva.link/iscevacao8k52kx
Une application web de productivité avec ambiance lofi — minuteur Pomodoro, chat en temps réel, to-do list et galerie de fonds d'écran.

##  Fonctionnalités

- **Minuteur Pomodoro** — sessions de travail 25 min + pause 5 min, avec contrôles Start / Pause / Reset
- **Chat en temps réel** — messagerie partagée entre tous les utilisateurs via WebSockets (Socket.IO)
- **To-Do List** — ajout, suppression, complétion et réorganisation par drag & drop, synchronisée avec la BDD
- **Galerie de fonds d'écran** — sélection parmi des images lofi ou upload d'un fond personnalisé
- **Authentification** — inscription / connexion / déconnexion avec sessions persistantes
- **Musique lofi** — lecteur audio intégré avec lecture automatique

##  Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Temps réel | Socket.IO |
| Base de données | MySQL |
| Sessions | express-session |

##  Installation

### Prérequis

- Node.js (v18+)
- MySQL

### 1. Cloner le dépôt
```bash
git clone https://github.com/ton-user/pomodoroom.git
cd pomodoroom
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer la base de données

Crée une base de données MySQL nommée `pomodoroom` et exécute le SQL suivant :
```sql
CREATE DATABASE pomodoroom;
USE pomodoroom;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    text VARCHAR(255) NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    position INT DEFAULT 0
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Configurer le serveur

Dans `server.js`, mets à jour les identifiants MySQL si besoin :
```js
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'pomodoroom'
});
```

### 5. Lancer le serveur
```bash
node server.js
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000)

##  Structure du projet
```
pomodoroom/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── images/          # Fonds d'écran lofi
│   ├── icons/           # Icônes UI
│   └── audio/           # Musique lofi
└── server.js

