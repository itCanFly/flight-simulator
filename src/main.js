import {Game} from './game.js'
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

// Loading Simulation
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

// Navigation Buttons
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

backToLevel.addEventListener('click', () => {
    gameScreen.style.display = 'none';
    levelSelection.style.display = 'flex';
});

// Level Selection
const selectLevel = document.querySelectorAll('.level-card')
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
    // document.getElementById('timeValue').textContent = game.getFormattedTime();
}

// Subscribe to game state updates
myGame.onChange((game) => updateStats(game));

// -----------------
// Pause/Resume
// -----------------
document.body.addEventListener('keydown', (e) => {
    if (e.key === "p") {
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
const quitButton = document.getElementById('quitButton');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');

function showGameOverPopup() {
    finalScore.textContent = `Score: ${myGame.score}`;
    gameOverPopup.style.display = 'flex';
}

// Hook into game over
myGame.onChange((game) => {
    if (game.state === 'GAME_OVER') {
        showGameOverPopup();
    }
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
