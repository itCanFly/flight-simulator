
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
        startStatsSimulation();
    });
});

// Stats simulation
let speed = 10;
let fuel = 100;
let mySeconds = 0;
let statsInterval = null;

function updateStats(speed = 0, fuel = 100) {
    document.getElementById('speedValue').textContent = `${speed} km/h`;
    document.getElementById('fuelValue').textContent = `${fuel}%`;
    document.getElementById('fuelBar').style.width = `${fuel}%`;
}

function startStatsSimulation() {
    if (statsInterval) clearInterval(statsInterval);
    statsInterval = setInterval(() => {
        if (fuel <= 0) {
            clearInterval(statsInterval);
            myGame.gameOver();
            showGameOverPopup();
            return;
        }
        speed = Math.min(speed, 500);
        fuel = Math.max(fuel - 6, 0);
        mySeconds++;
        const minutes = Math.floor(mySeconds / 60);
        const seconds = mySeconds % 60;
        updateStats(speed, fuel, `${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
}

// Pause/Resume
document.body.addEventListener('keydown', (e) => {
    if(e.key === "p"){
        if(myGame.state === 'PLAYING' || myGame.state === 'PAUSED'){
            myGame.changeState();
            if(myGame.state === 'PAUSED') clearInterval(statsInterval);
            else if(myGame.state === 'PLAYING') startStatsSimulation();
        }
    }
});

// Game Over Popup
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScore = document.getElementById('finalScore');
const quitButton = document.getElementById('quitButton');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');

function showGameOverPopup() {
    finalScore.textContent = `Score: ${myGame.score}`;
    gameOverPopup.style.display = 'flex';
}

quitButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    myGame.gameOver();
    mainMenu.style.display = 'flex';
    fuel=100; speed=0;
});

restartButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    fuel=100; speed=0;
    myGame.start();
    startStatsSimulation();
});

nextLevelButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    speed=0; fuel=100;
    myGame.start();
    startStatsSimulation();
});
