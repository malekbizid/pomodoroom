// -- Minuteur
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

// -- Fullscreen
const btn = document.getElementById('fullscreen-btn');
const expandIcon = document.getElementById('expand-icon');
const shrinkIcon = document.getElementById('shrink-icon');

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
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
    if (e.key === 'F11') {
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

// -- Chat
const socket = io({ autoConnect: false }); 
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// -- To-Do List
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
let tasks = [];

// -- Plein écran
const fullscreenBtn = document.getElementById('fullscreen-btn');


// -- Galerie
const galleryItems = document.querySelectorAll('.gallery-item');
const scene = document.getElementById('scene');
const uploadImage = document.getElementById('upload-image');
const backgroundFileInput = document.getElementById('backgroundFileInput');




// Vérifier si l'utilisateur est déjà connecté
fetch('/api/me')
    .then(res => res.json())
    .then(data => {
        if (!data.loggedIn) {
            authModal.classList.remove('hidden');
        } else {
            currentUser = data.username;
            authModal.classList.add('hidden');
            socket.connect();
            fetchTasks(); 
        }
    });

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
                fetchTasks(); 
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
        console.error("Logout error", err);
    }
});

// -- Listening now counter
socket.on('user count', (count) => {
    const el = document.getElementById('listening-now');
    if (el) el.innerHTML = `listening now ${count} <span class="dot">•</span>`;
});




async function fetchTasks() {
    try {
        const response = await fetch('/api/todos', { cache: 'no-store' }); 
        if (response.ok) {
            tasks = await response.json();
            renderTasks();
        }
    } catch (err) { console.error("Erreur récupération", err); }
}

function renderTasks() {
    todoList.innerHTML = ''; 
    tasks.sort((a, b) => a.position - b.position);

    tasks.forEach((task) => {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        li.draggable = true; 
        li.dataset.id = task.id; 
        
        if (task.completed) li.classList.add('completed');

        const textSpan = document.createElement('span');
        textSpan.textContent = task.text;
        
        textSpan.addEventListener('click', async () => {
            const newStatus = !task.completed;
            try {
                await fetch(`/api/todos/${task.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ completed: newStatus })
                });
                task.completed = newStatus;
                renderTasks();
            } catch(err) { console.error(err); }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', async () => {
            try {
                await fetch(`/api/todos/${task.id}`, { method: 'DELETE' });
                tasks = tasks.filter(t => t.id !== task.id);
                renderTasks();
            } catch(err) { console.error(err); }
        });

        // Événements Drag & Drop
        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            setTimeout(() => {
                saveNewOrder(); 
            }, 50);        
        });

        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
}

if (todoForm) {
    todoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        
        if (text !== '') {
            try {
                const response = await fetch('/api/todos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, position: tasks.length }) 
                });
                if (response.ok) {
                    const newTask = await response.json();
                    tasks.push(newTask);
                    todoInput.value = '';
                    renderTasks();
                }
            } catch(err) { console.error(err); }
        }
    });
}

// Gestion du déplacement visuel
todoList.addEventListener('dragover', (e) => {
    e.preventDefault(); 
    const afterElement = getDragAfterElement(todoList, e.clientY);
    const draggable = document.querySelector('.dragging');
    if (draggable) {
        if (afterElement == null) {
            todoList.appendChild(draggable);
        } else {
            todoList.insertBefore(draggable, afterElement);
        }
    }
});

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Envoyer le nouvel ordre à MySQL
async function saveNewOrder() {
    const items = [...todoList.querySelectorAll('.todo-item')];
    const orderedTasks = [];

    items.forEach((item, index) => {
        const taskId = parseInt(item.dataset.id);
        if (!isNaN(taskId)) {
            orderedTasks.push({ id: taskId, position: index });
            const task = tasks.find(t => t.id === taskId);
            if (task) task.position = index;
        }
    });

    try {
        await fetch('/api/todos/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderedTasks })
        });
    } catch(err) { console.error('Erreur réorganisation', err); }
}



chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value.trim() !== "") {
        socket.emit('chat message', chatInput.value);
        chatInput.value = '';
    }
});

function appendMessage(user, text) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if(user === currentUser) {
        messageElement.style.background = "rgba(255, 255, 255, 0.25)"; 
        messageElement.style.alignSelf = "flex-end"; 
    }

    const strongPseudo = document.createElement('strong');
    strongPseudo.textContent = user + " : ";
    
    messageElement.appendChild(strongPseudo);
    messageElement.appendChild(document.createTextNode(text));

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

socket.on('chat history', (messages) => {
    chatMessages.innerHTML = ''; 
    messages.forEach(msg => {
        appendMessage(msg.username, msg.text);
    });
});

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
    timerCard.style.display = timerCard.style.display === 'none' ? 'flex' : 'none';
    timerCard.style.flexDirection = 'column';
});

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

pauseBtn.style.display = 'none';
updateDisplay();

// Galerie 


if (galleryItems.length > 0) {
    galleryItems[0].classList.add('active');
}

galleryItems.forEach(item => {
    if (item !== uploadImage) {
        item.addEventListener('click', () => {
            const imageUrl = item.getAttribute('data-image');
            scene.style.backgroundImage = `url('${imageUrl}')`;

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
                scene.style.backgroundImage = `url('${event.target.result}')`;
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
const volumeViz = document.getElementById('volume-viz');
const volumeSlider = document.getElementById('volume-slider');

audio.volume = parseFloat(volumeSlider.value);
volumeViz.classList.add('paused');

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸';
        volumeViz.classList.remove('paused');
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶';
        volumeViz.classList.add('paused');
    }
});

volumeSlider.addEventListener('input', () => {
    audio.volume = parseFloat(volumeSlider.value);
});

document.getElementById('prev-btn').addEventListener('click', () => {
    audio.currentTime = 0;
});

document.getElementById('next-btn').addEventListener('click', () => {
    audio.currentTime = 0;
    audio.play();
    playPauseBtn.textContent = '⏸';
    volumeViz.classList.remove('paused');
});