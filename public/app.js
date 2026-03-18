let timeLeft = 25*60;
let timerId = null;
let isWorkSession = true;

const timeDisplay = document.getElementById('time-display');
const modeLabel = document.getElementById('mode-label');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

function updateDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    let formattedMinutes = minutes;
    let formattedSeconds = seconds;
    if(minutes < 10) {
        formattedMinutes = '0' + minutes;
    }
    if(seconds < 10) {
        formattedSeconds = '0' + seconds;
    }
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

const galleryItems = document.querySelectorAll('.gallery-item');
const body = document.body;

galleryItems[0].classList.add('active');

galleryItems.forEach(item => {
    item.addEventListener('click', () => {
        const imageUrl = item.getAttribute('data-image');
        
        body.style.backgroundImage = `url('${imageUrl}')`;
        
        galleryItems.forEach(gItem => gItem.classList.remove('active'));
        item.classList.add('active');
    });
});
// --- LOGIQUE DU CHAT AVEC SOCKET.IO ---
const socket = io(); // Se connecte automatiquement au serveur
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Quand on soumet le formulaire (clic sur "Envoyer" ou touche Entrée)
chatForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    if (chatInput.value.trim() !== "") {
        // Envoie le message au serveur
        socket.emit('chat message', chatInput.value);
        chatInput.value = ''; // Vide l'input
    }
});

// Quand on reçoit un message du serveur
socket.on('chat message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = msg;
    chatMessages.appendChild(messageElement);
    
    // Scrolle automatiquement vers le bas pour voir le dernier message
    chatMessages.scrollTop = chatMessages.scrollHeight;
});