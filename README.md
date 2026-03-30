# Pomodoroom

A real-time collaborative Pomodoro timer with lo-fi vibes. Work together, stay focused, chat live, and listen to chill music — all in one room.

## Features

- **Pomodoro Timer** — 25 min work / 5 min break cycle, togglable overlay
- **Live Chat** — Real-time messaging via WebSocket (Socket.io), with message history
- **Lo-fi Player** — Ambient music with play/pause controls
- **Background Gallery** — Switch between preset lo-fi scenes or upload your own
- **Auth System** — Register/login with session-based authentication
- **Fullscreen Mode** — Toggle via button or F11

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5, Socket.io |
| Database | MySQL (via mysql2) |
| Sessions | express-session |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Google Fonts — Pixelify Sans |

## Getting Started

### Prerequisites

- Node.js (v18+)
- MySQL server running locally

### Database Setup

```sql
CREATE DATABASE pomodoroom;
USE pomodoroom;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Installation

```bash
git clone https://github.com/your-username/pomodoroom.git
cd pomodoroom
npm install
```

### Configuration

Update the database credentials in `src/server.js` (or migrate to `.env`):

```js
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'your_password',
    database: 'pomodoroom'
});
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
pomodoroom/
├── src/
│   └── server.js        # Express + Socket.io + MySQL backend
├── public/
│   ├── index.html       # App shell
│   ├── app.js           # Frontend logic (timer, chat, player, gallery)
│   ├── styles.css       # Glassmorphism UI styles
│   ├── audio/           # Lo-fi music tracks
│   ├── icons/           # UI icons
│   └── images/          # Background images
├── package.json
└── README.md
```

## Known Limitations

- Passwords are stored in plain text — hashing (bcrypt) not yet implemented
- Database credentials are hardcoded — `.env` support not yet added
- Audio player only has one track — playlist support planned
- Image uploads are client-side only — no server persistence
- No rate limiting on chat messages or API endpoints
