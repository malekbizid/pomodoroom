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

const expandIcon = document.getElementById('expand-icon');
const shrinkIcon = document.getElementById('shrink-icon');

const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authMessage = document.getElementById('auth-message');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

const scene = document.getElementById('scene');
const bgVideo = document.getElementById('bg-video');
const galleryItems = document.querySelectorAll('.gallery-item');
const uploadImage = document.getElementById('upload-image');
const backgroundFileInput = document.getElementById('backgroundFileInput');

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

const audio = document.getElementById('audio-element');
const playPauseBtn = document.getElementById('play-pause-btn');
const volumeViz = document.getElementById('volume-viz');
const volumeSlider = document.getElementById('volume-slider');

let currentUser = "Anonyme";
let tasks = [];

const socket = io({ autoConnect: false });


//AUTH

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
            startAudio();
        }
    });

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        authMessage.style.color = '#51cf66';
        authMessage.textContent = 'Connected!';
        setTimeout(() => {
            authModal.classList.add('hidden');
            currentUser = username;
            socket.connect();
            fetchTasks();
            startAudio();
        }, 800);
    } else {
        authMessage.style.color = '#ff6b6b';
        authMessage.textContent = await response.text();
    }
});

registerBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
        authMessage.style.color = '#ff6b6b';
        authMessage.textContent = 'Fill all fields.';
        return;
    }
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if (response.ok) {
        authMessage.style.color = '#51cf66';
        authMessage.textContent = 'Registered! You can now login.';
    } else {
        authMessage.style.color = '#ff6b6b';
        authMessage.textContent = await response.text();
    }
});

logoutBtn.addEventListener('click', async () => {
    const response = await fetch('/api/logout', { method: 'POST' });
    if (response.ok) window.location.reload();
});


//SOCKET

socket.on('user count', (count) => {
    document.getElementById('listening-now').innerHTML = `listening now ${count} <span class="dot">•</span>`;
});

socket.on('chat history', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(msg => appendMessage(msg.username, msg.text));
});

socket.on('chat message', (data) => {
    appendMessage(data.user, data.text);
});

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (chatInput.value.trim()) {
        socket.emit('chat message', chatInput.value);
        chatInput.value = '';
    }
});

function appendMessage(user, text) {
    const div = document.createElement('div');
    div.classList.add('message');
    if (user === currentUser) {
        div.style.background = 'rgba(255,255,255,0.2)';
        div.style.alignSelf = 'flex-end';
    }
    const strong = document.createElement('strong');
    strong.textContent = user + ': ';
    div.appendChild(strong);
    div.appendChild(document.createTextNode(text));
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


// TO-DO

async function fetchTasks() {
    const response = await fetch('/api/todos', { cache: 'no-store' });
    if (response.ok) {
        tasks = await response.json();
        renderTasks();
    }
}

function renderTasks() {
    todoList.innerHTML = '';
    tasks.sort((a, b) => a.position - b.position);
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.classList.add('todo-item');
        li.draggable = true;
        li.dataset.id = task.id;
        if (task.completed) li.classList.add('completed');

        const span = document.createElement('span');
        span.textContent = task.text;
        span.addEventListener('click', async () => {
            await fetch(`/api/todos/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !task.completed })
            });
            task.completed = !task.completed;
            renderTasks();
        });

        const del = document.createElement('button');
        del.innerHTML = '&times;';
        del.classList.add('delete-btn');
        del.addEventListener('click', async () => {
            await fetch(`/api/todos/${task.id}`, { method: 'DELETE' });
            tasks = tasks.filter(t => t.id !== task.id);
            renderTasks();
        });

        li.addEventListener('dragstart', () => li.classList.add('dragging'));
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging');
            setTimeout(saveNewOrder, 50);
        });

        li.appendChild(span);
        li.appendChild(del);
        todoList.appendChild(li);
    });
}

todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;
    const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, position: tasks.length })
    });
    if (response.ok) {
        tasks.push(await response.json());
        todoInput.value = '';
        renderTasks();
    }
});

todoList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragging = document.querySelector('.dragging');
    if (!dragging) return;
    const after = [...todoList.querySelectorAll('.todo-item:not(.dragging)')].reduce((closest, child) => {
        const offset = e.clientY - child.getBoundingClientRect().top - child.getBoundingClientRect().height / 2;
        return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
    after ? todoList.insertBefore(dragging, after) : todoList.appendChild(dragging);
});

async function saveNewOrder() {
    const orderedTasks = [...todoList.querySelectorAll('.todo-item')].map((item, index) => {
        const id = parseInt(item.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (task) task.position = index;
        return { id, position: index };
    }).filter(t => !isNaN(t.id));
    await fetch('/api/todos/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedTasks })
    });
}


// TIMER 

function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
}

function updateDisplay() {
    workDisplay.textContent = formatTime(timeLeft);
    pauseDisplay.textContent = '+' + formatTime(pauseLeft);
}

function startTimer() {
    if (timerId !== null) return;
    startBtn.style.display = 'none';
    pauseBtn.textContent = 'pause';
    pauseBtn.style.display = 'inline';
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
                startBtn.style.display = 'inline';
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
    pauseBtn.textContent = 'continue';
    pauseBtn.onclick = resumeTimer;
}

function resumeTimer() {
    pauseBtn.textContent = 'pause';
    pauseBtn.onclick = pauseTimer;
    startTimer();
}

function resetTimer() {
    clearInterval(timerId); timerId = null;
    isWorkSession = true;
    timeLeft = 25 * 60;
    pauseLeft = 5 * 60;
    modeLabel.textContent = 'WORK';
    startBtn.style.display = 'inline';
    pauseBtn.style.display = 'none';
    pauseBtn.textContent = 'pause';
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


//FULLSCREEN 

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {
    expandIcon.style.display = document.fullscreenElement ? 'none' : 'block';
    shrinkIcon.style.display = document.fullscreenElement ? 'block' : 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
        e.preventDefault();
        document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    }
});


//GALLERY

function setImageBackground(url) {
    bgVideo.pause();
    bgVideo.style.display = 'none';
    scene.style.backgroundImage = `url('${url}')`;
}

function setVideoBackground(url) {
    scene.style.backgroundImage = 'none';
    bgVideo.src = url;
    bgVideo.style.display = 'block';
    bgVideo.play();
}

galleryItems.forEach(item => {
    if (item === uploadImage) return;
    item.addEventListener('click', () => {
        galleryItems.forEach(g => g.classList.remove('active'));
        item.classList.add('active');
        const videoSrc = item.getAttribute('data-video');
        const imageSrc = item.getAttribute('data-image');
        if (videoSrc) {
            setVideoBackground(videoSrc);
        } else {
            setImageBackground(imageSrc);
        }
    });
});

uploadImage.addEventListener('click', () => backgroundFileInput.click());

backgroundFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        setImageBackground(ev.target.result);
        galleryItems.forEach(g => g.classList.remove('active'));
        uploadImage.classList.add('active');
    };
    reader.readAsDataURL(file);
});


// COLLAPSE PANELS 

document.getElementById('todo-header').addEventListener('click', () => {
    document.querySelector('.todo-container').classList.toggle('collapsed');
});

document.getElementById('chat-header').addEventListener('click', () => {
    document.querySelector('.chat-container').classList.toggle('collapsed');
});


// PLAYER 

const playlist = [
    { src: '/audio/watermello-lofi-girl-chill.mp3', title: 'lofi hip hop radio — beats to study / chill / relax' },
    { src: '/audio/rain-sound.mp3', title: 'rain sounds' },
    { src: '/audio/bird-sound.mp3', title: 'bird sounds' },
];
let currentTrackIndex = 0;

function playTrack(index) {
    currentTrackIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[currentTrackIndex];
    audio.src = track.src;
    audio.volume = parseFloat(volumeSlider.value);
    audio.play();
    playPauseBtn.textContent = '⏸';
    volumeViz.classList.remove('paused');
    document.getElementById('track-title').textContent = track.title;
}

audio.src = playlist[0].src;
audio.volume = parseFloat(volumeSlider.value);
document.getElementById('track-title').textContent = playlist[0].title;
volumeViz.classList.add('paused');

function startAudio() {
    audio.play().then(() => {
        playPauseBtn.textContent = '⏸';
        volumeViz.classList.remove('paused');
    }).catch(() => {
        const startOnInteraction = () => {
            audio.play().then(() => {
                playPauseBtn.textContent = '⏸';
                volumeViz.classList.remove('paused');
            }).catch(() => {});
            document.removeEventListener('click', startOnInteraction);
            document.removeEventListener('keydown', startOnInteraction);
        };
        document.addEventListener('click', startOnInteraction);
        document.addEventListener('keydown', startOnInteraction);
    });
}

audio.loop = true;

playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
        if (!audio.src) playTrack(0);
        else audio.play();
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
    playTrack(currentTrackIndex - 1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    playTrack(currentTrackIndex + 1);
});
