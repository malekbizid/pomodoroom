let timeLeft = 25 * 60;
let timerId = null;
let isWorkSession = true;

const timeDisplay = document.getElementById('time-display');
const modeLabel = document.getElementById('mode-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

// --- LOGIQUE D'AUTHENTIFICATION ---
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

// --- LOGIQUE DU CHAT ---
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
// Se déconnecter
logoutBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', { method: 'POST' });
        if (response.ok) {
            // L'astuce magique : on recharge la page ! 
            // Ça va vider le chat, remettre le timer à zéro et réafficher le pop-up de connexion
            window.location.reload(); 
        }
    } catch (err) {
        console.error("Erreur de déconnexion", err);
    }
});

// --- LOGIQUE DU MINUTEUR ---
function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    let formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
    
    timeDisplay.textContent = formattedMinutes + ':' + formattedSeconds;
}

function startTimer() {
    if (timerId !== null) return;

    timerId = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft === 0) {
            clearInterval(timerId);
            timerId = null;
            switchMode();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
}

function resetTimer() {
    clearInterval(timerId);
    timerId = null;
    isWorkSession = true;
    timeLeft = 25 * 60;
    modeLabel.textContent = "Work Session";
    updateDisplay();
}

function switchMode() {
    isWorkSession = !isWorkSession;
    
    if (isWorkSession) {
        timeLeft = 25 * 60;
        modeLabel.textContent = "Work Session";
    } else {
        timeLeft = 5 * 60;
        modeLabel.textContent = "Break Time";
    }
    
    updateDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

updateDisplay();

// --- LOGIQUE DE LA GALERIE ---
const galleryItems = document.querySelectorAll('.gallery-item');
const body = document.body;
const uploadImage = document.getElementById('upload-image');
const backgroundFileInput = document.getElementById('backgroundFileInput');

// CORRECTION : On vérifie que la galerie n'est pas vide pour éviter un crash
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

// file upload for background
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


// chat (socket.io)
const socket = io();
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Envoyer ou Entrée
chatForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    if (chatInput.value.trim() !== "") {
        // Envoie au serveur
        socket.emit('chat message', chatInput.value);
        chatInput.value = ''; 
    }
});

// reçoit un message du serveur
socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});