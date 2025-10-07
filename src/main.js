import { Game } from './game.js';

// -----------------
// UI & Game Logic
// -----------------
const myGame = new Game("gameScreen");


// Screen elements
const loadingScreen = document.getElementById('loadingScreen');
const mainMenu = document.getElementById('mainMenu');
const levelSelection = document.getElementById('levelSelection');
const gameScreen = document.getElementById('gameScreen');
const progressFill = document.querySelector('.progress-fill');

// -----------------
// Loading Simulation
// -----------------
let progress = 0;
const loadInterval = setInterval(() => {
    progress += 2;
    progressFill.style.width = progress + '%';
    if (progress >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainMenu.style.display = 'flex';
        }, 500);
    }
}, 95);

// -----------------
// Navigation Buttons
// -----------------
const playButton = document.getElementById('playButton');
const backToMenu = document.getElementById('backToMenuButton');
const backToLevel = document.getElementById('backToLevelsButton');

playButton.addEventListener('click', () => {
    myGame.music.playButton();
    mainMenu.style.display = 'none';
    levelSelection.style.display = 'flex';
});

backToMenu.addEventListener('click', () => {
    myGame.music.playButton();
    levelSelection.style.display = 'none';
    mainMenu.style.display = 'flex';
});

// -----------------
// Level Selection
// -----------------
const selectLevel = document.querySelectorAll('.level-card');
selectLevel.forEach(card => {
    card.addEventListener('click', () => {
        myGame.music.playButton();
        myGame.start();
        const level = card.dataset.level;
        document.getElementById('levelInfo').textContent = `Level: ${level}`;
        levelSelection.style.display = 'none';
        gameScreen.style.display = 'block';
    });
});

// -----------------
// Stats Display
// -----------------
function updateStats(game) {
    const { speed, fuel } = game.stats;
    
    document.getElementById('speedValue').textContent = `${speed} km/h`;
    document.getElementById('fuelValue').textContent = `${fuel}%`;
    document.getElementById('fuelBar').style.width = `${fuel}%`;
}

myGame.onChange(game => updateStats(game));

// -----------------
// Pause/Resume
// -----------------
document.body.addEventListener('keydown', (e) => {
    if (e.code === "Space") {  
        if (myGame.state === 'PLAYING' || myGame.state === 'PAUSED') {
            myGame.changeState();
        }
    }
});

// -----------------
// Game Over Popup
// -----------------
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScore = document.getElementById('finalScore');
const quitButton = document.querySelector('#gameOverPopup #quitButton');
const restartButton = document.querySelector('#gameOverPopup #restartButton');
const nextLevelButton = document.querySelector('#nextLevelButton');

// -----------------
// -----------------
// Functions
// -----------------

function showGameOverPopup() {
    // Don't change the game state - keep it as 'GAME_OVER'
    finalScore.textContent = `Score: ${myGame.score}`;
    gameOverPopup.style.display = 'flex';
}

// -----------------
// Hook into game over
// -----------------
myGame.onChange(game => {
    if (game.state === 'GAME_OVER') {
        showGameOverPopup();
    }
});

// -----------------
// Button Handlers
// -----------------
backToLevel.addEventListener('click', () => {
    myGame.music.playButton();
    // Show pause popup instead of directly going to levels
    myGame.changeState(); // Pause the game
    document.getElementById('pausePopup').style.display = 'flex';
});

quitButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state properly without calling gameOver() again
    myGame.isAnimating = false;
    myGame.stopStats();
    myGame.resetPosition();
    myGame.state = 'MENU';
    // Go to levels instead of main menu
    levelSelection.style.display = 'flex';
});

restartButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    myGame.start();
});

nextLevelButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    myGame.start();
});

// -----------------
// Pause Popup Handlers
// -----------------
const pausePopup = document.getElementById('pausePopup');
const resumeButton = document.getElementById('resumeButton');
const restartPauseButton = document.getElementById('restartPauseButton');
const quitPauseButton = document.getElementById('quitPauseButton');

resumeButton.addEventListener('click', () => {
    myGame.music.playButton();
    pausePopup.style.display = 'none';
    myGame.resume(); // Resume the game
});

restartPauseButton.addEventListener('click', () => {
    myGame.music.playButton();
    pausePopup.style.display = 'none';
    myGame.start(); // Restart the current level
});

quitPauseButton.addEventListener('click', () => {
    myGame.music.playButton();
    pausePopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state
    myGame.isAnimating = false;
    myGame.stopStats();
    myGame.resetPosition();
    myGame.state = 'MENU';
    // Go to level selection
    levelSelection.style.display = 'flex';
});

// Removed exit popup - using only Game Over popup now

const winPopup = document.getElementById('winPopup');
const losePopup = document.getElementById('losePopup');

// Win popup buttons
const nextWinLevelButton = document.getElementById('nextWinLevelButton');
const restartWinButton = document.getElementById('restartWinButton');
const quitWinButton = document.getElementById('quitWinButton');

// Lose popup buttons
const restartLoseButton = document.getElementById('restartLoseButton');
const quitLoseButton = document.getElementById('quitLoseButton');

// Show win popup
function showWinPopup() {
    myGame.state = 'PAUSE';
    winPopup.style.display = 'flex';
}

// Show lose popup
function showLosePopup() {
    myGame.state = 'PAUSE';
    losePopup.style.display = 'flex';
}

// Hook into game states (example)
myGame.onChange((game) => {
    if (game.state === 'WIN') {
        showWinPopup();
    } else if (game.state === 'LOSE') {
        showLosePopup();
    }
});

// Button events
nextWinLevelButton.addEventListener('click', () => {
    myGame.music.playButton();
    winPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    myGame.start();
});

restartWinButton.addEventListener('click', () => {
    myGame.music.playButton();
    winPopup.style.display = 'none';
    myGame.start();
});

quitWinButton.addEventListener('click', () => {
    myGame.music.playButton();
    winPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    levelSelection.style.display = 'flex';
});

restartLoseButton.addEventListener('click', () => {
    myGame.music.playButton();
    losePopup.style.display = 'none';
    myGame.start();
});

quitLoseButton.addEventListener('click', () => {
    myGame.music.playButton();
    losePopup.style.display = 'none';
    gameScreen.style.display = 'none';
    levelSelection.style.display = 'flex';
});