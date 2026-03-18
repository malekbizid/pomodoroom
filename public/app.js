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