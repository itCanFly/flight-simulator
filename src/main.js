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
    mainMenu.style.display = 'none';
    levelSelection.style.display = 'flex';
});

backToMenu.addEventListener('click', () => {
    levelSelection.style.display = 'none';
    mainMenu.style.display = 'flex';
});

// -----------------
// Level Selection
// -----------------
const selectLevel = document.querySelectorAll('.level-card');
selectLevel.forEach(card => {
    card.addEventListener('click', () => {
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
    document.getElementById('speedValue').textContent = `${game.speed} km/h`;
    document.getElementById('fuelValue').textContent = `${game.fuel}%`;
    document.getElementById('fuelBar').style.width = `${game.fuel}%`;
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
// Exit Popup
// -----------------
const exit = document.getElementById('exit');
const exitQuitButton = document.querySelector('#exit #quitButton');
const exitRestartButton = document.querySelector('#exit #restartButton');
const resumeButton = document.querySelector('#exit #resumeButton');
// -----------------
// Functions
// -----------------
function showGamePause() {
    myGame.state = 'PAUSED';
    exit.style.display = 'flex';
}

function showGameOverPopup() {
    myGame.state = 'PAUSED';
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
    else if (game.state === 'PAUSED'){
        showGamePause();
    }
});

// -----------------
// Button Handlers
// -----------------
backToLevel.addEventListener('click', () => {
    showGamePause();
});

quitButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    myGame.gameOver();
    mainMenu.style.display = 'flex';
});

restartButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    myGame.start();
});

nextLevelButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    myGame.start();
});

// Exit popup actions
exitQuitButton.addEventListener('click', () => {
    // Hide exit popup
    document.getElementById('exit').style.display = 'none';

    // Stop the game
    myGame.isAnimating = false;   // stop animation loop
    myGame.stopStats();           // stop stats interval
    myGame.resetPosition();       // reset plane to start
    myGame.state = 'MENU';        // set game state back to menu

    // Hide game screen and go back to main menu
    document.getElementById('gameScreen').style.display = 'none';
    levelSelection.style.display = 'flex';
});

exitRestartButton.addEventListener('click', () => {
    exit.style.display = 'none';
    myGame.start();
});

resumeButton.addEventListener('click',()=>{
    exit.style.display = 'none';
    myGame.resume();
})

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
    winPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    myGame.start();
});

restartWinButton.addEventListener('click', () => {
    winPopup.style.display = 'none';
    myGame.start();
});

quitWinButton.addEventListener('click', () => {
    winPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
});

restartLoseButton.addEventListener('click', () => {
    losePopup.style.display = 'none';
    myGame.start();
});

quitLoseButton.addEventListener('click', () => {
    losePopup.style.display = 'none';
    gameScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
});