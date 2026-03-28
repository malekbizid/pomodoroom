let timeLeft = 25 * 60;
let pauseLeft = 5 * 60;
let timerId = null;
let isWorkSession = true;

const workDisplay = document.getElementById('work-time');
const pauseDisplay = document.getElementById('pause-time');
const modeLabel = document.getElementById('mode-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const timerCard = document.getElementById('timer-card');
const timerToggleBtn = document.getElementById('timer-toggle-btn');

const btn = document.getElementById('fullscreen-btn');
const expandIcon = document.getElementById('expand-icon');
const shrinkIcon = document.getElementById('shrink-icon');

function toggleFullScreen() {
    console.log('Toggling fullscreen mode');
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
    } else {
        document.exitFullscreen();
    }
}

function updateIconState() {
    if (document.fullscreenElement) {
        expandIcon.style.display = 'none';
        shrinkIcon.style.display = 'block';
    } else {
        expandIcon.style.display = 'block';
        shrinkIcon.style.display = 'none';
    }
}


btn.addEventListener('click', toggleFullScreen);
document.addEventListener('fullscreenchange', updateIconState);

document.addEventListener('keydown', (e) => {
    console.log(`Key pressed: ${e.key}`);
    if (e.key === 'F11') {
        console.log('F11 pressed, toggling fullscreen');
        e.preventDefault();
        toggleFullScreen();
    }
});


// Login
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('auth-message');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentUser = "Anonyme";
// On ne connecte pas le chat tout de suite
const socket = io({ autoConnect: false }); 

// Vérifier si l'utilisateur est déjà connecté en arrivant sur la page
fetch('/api/me')
    .then(res => res.json())
    .then(data => {
        if (!data.loggedIn) {
            authModal.classList.remove('hidden');
        } else {
            currentUser = data.username;
            authModal.classList.add('hidden');
            socket.connect();
        }
    });

// Fonction utilitaire pour les messages
function showMessage(text, isError = false) {
    authMessage.textContent = text;
    authMessage.style.color = isError ? '#ff6b6b' : '#51cf66';
}

// Se connecter
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            showMessage("Connexion réussie !", false);
            setTimeout(() => {
                authModal.classList.add('hidden'); 
                currentUser = username;
                socket.connect(); 
            }, 800);
        } else {
            const errorText = await response.text();
            showMessage(errorText, true);
        }
    } catch (err) {
        showMessage("Erreur serveur.", true);
    }
});

// S'inscrire
registerBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) return showMessage("Remplissez tous les champs.", true);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            showMessage("Inscription réussie ! Cliquez sur Se connecter.", false);
        } else {
            const errorText = await response.text();
            showMessage(errorText, true);
        }
    } catch (err) {
        showMessage("Erreur lors de l'inscription.", true);
    }
});

// Se déconnecter
logoutBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (response.ok) {
            window.location.reload(); 
        }
    } catch (err) {
        console.error("Erreur de déconnexion", err);
    }
});

// Chat
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value.trim() !== "") {
        socket.emit('chat message', chatInput.value);
        chatInput.value = '';
    }
});

// Fonction pour ajouter un message à l'écran
function appendMessage(user, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    // Style différent si c'est NOTRE message
    if(user === currentUser) {
        messageElement.style.background = "rgba(255, 255, 255, 0.25)"; 
        messageElement.style.alignSelf = "flex-end"; 
    }

    // Protection XSS
    const strongPseudo = document.createElement('strong');
    strongPseudo.textContent = user + " : ";
    
    messageElement.appendChild(strongPseudo);
    messageElement.appendChild(document.createTextNode(text));

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 1. Écouter l'historique des messages à la connexion
socket.on('chat history', (messages) => {
    chatMessages.innerHTML = ''; // On vide le chat pour éviter les doublons
    messages.forEach(msg => {
        appendMessage(msg.username, msg.text); // On affiche chaque ancien message
    });
});

// 2. Écouter les nouveaux messages en direct
socket.on('chat message', (data) => {
    appendMessage(data.user, data.text);
});


// Timer

function formatTime(secs) {
    let m = Math.floor(secs / 60);
    let s = secs % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function updateDisplay() {
    workDisplay.textContent = formatTime(timeLeft);
    pauseDisplay.textContent = formatTime(pauseLeft);
}

function startTimer() {
    if (timerId !== null) return;
    startBtn.style.display = 'none';
    pauseBtn.textContent = 'Pause';
    pauseBtn.style.display = 'block';

    timerId = setInterval(() => {
        if (isWorkSession) {
            timeLeft--;
            if (timeLeft <= 0) { isWorkSession = false; modeLabel.textContent = 'BREAK'; }
        } else {
            pauseLeft--;
            if (pauseLeft <= 0) {
                clearInterval(timerId); timerId = null;
                isWorkSession = true;
                timeLeft = 25 * 60;
                pauseLeft = 5 * 60;
                modeLabel.textContent = 'WORK';
                startBtn.style.display = '';
                pauseBtn.style.display = 'none';
            }
        }
        updateDisplay();
    }, 1000);
}

function pauseTimer() {
    if (timerId === null) return;
    clearInterval(timerId);
    timerId = null;
    pauseBtn.textContent = 'Continue';
    pauseBtn.onclick = resumeTimer;
}

function resumeTimer() {
    pauseBtn.textContent = 'Pause';
    pauseBtn.onclick = pauseTimer;
    startTimer();
}

function resetTimer() {
    clearInterval(timerId); timerId = null;
    isWorkSession = true;
    timeLeft = 25 * 60;
    pauseLeft = 5 * 60;
    modeLabel.textContent = 'WORK';
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
    pauseBtn.textContent = 'Pause';
    pauseBtn.onclick = pauseTimer;
    updateDisplay();
}

timerToggleBtn.addEventListener('click', () => {
    timerCard.style.display = timerCard.style.display === 'none' ? 'block' : 'none';
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

pauseBtn.style.display = 'none';
updateDisplay();

// Galerie 
const galleryItems = document.querySelectorAll('.gallery-item');
const body = document.body;
const uploadImage = document.getElementById('upload-image');
const backgroundFileInput = document.getElementById('backgroundFileInput');

if (galleryItems.length > 0) {
    galleryItems[0].classList.add('active');
}

galleryItems.forEach(item => {
    if (item !== uploadImage) {
        item.addEventListener('click', () => {
            const imageUrl = item.getAttribute('data-image');
            
            body.style.backgroundImage = `url('${imageUrl}')`;
            
            galleryItems.forEach(gItem => gItem.classList.remove('active'));
            item.classList.add('active');
        });
    }
});

// background upload
if(uploadImage && backgroundFileInput) {
    uploadImage.addEventListener('click', () => {
        backgroundFileInput.click();
    });

    backgroundFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                body.style.backgroundImage = `url('${event.target.result}')`;
                
                galleryItems.forEach(gItem => gItem.classList.remove('active'));
                uploadImage.classList.add('active');
            };
            reader.readAsDataURL(file);
        }
    });
}

// Player
const audio = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause-btn');

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸';
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶';
    }
});

// prev/next can be wired to a playlist array later
document.getElementById('prev-btn').addEventListener('click', () => {
    audio.currentTime = 0;
});
document.getElementById('next-btn').addEventListener('click', () => {
    audio.currentTime = 0;
    audio.play();
    playPauseBtn.textContent = '⏸';
});