// test.js
import { Game } from "../game.js";
import { Music } from "../audio/Music.js";

// Create instances
const myGame = new Game();
const myMusic = new Music();
console.log("Initial Game state:", myGame.state);

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
}, 30);

// -----------------
// Handle Music Autoplay Restriction
// -----------------
document.body.addEventListener('click', () => {
    myMusic.playMenu(); // play menu music after first user interaction
}, { once: true });

// -----------------
// Navigation Buttons
// -----------------
document.getElementById('playButton').addEventListener('click', () => {
    mainMenu.style.display = 'none';
    levelSelection.style.display = 'flex';
});

document.getElementById('backToMenuButton').addEventListener('click', () => {
    levelSelection.style.display = 'none';
    mainMenu.style.display = 'flex';
    myMusic.playMenu(); // switch back to menu music
});

document.getElementById('backToLevelsButton').addEventListener('click', () => {
    gameScreen.style.display = 'none';
    levelSelection.style.display = 'flex';
    myMusic.playMenu(); // go back to menu music or level selection music
});

// -----------------
// Level Selection
// -----------------
document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', () => {
        myGame.start(); // start game
        myMusic.playPlaying(); // play in-game music
        console.log("Game state:", myGame.state);

        const level = card.dataset.level;
        document.getElementById('levelInfo').textContent = `Level: ${level}`;
        levelSelection.style.display = 'none';
        gameScreen.style.display = 'block';
    });
});

// -----------------
// Example: Update Game Stats Dynamically
// -----------------
function updateStats(speed = 0, fuel = 100, time = '0:00') {
    document.getElementById('speedValue').textContent = `${speed} km/h`;
    document.getElementById('fuelValue').textContent = `${fuel}%`;
    document.getElementById('fuelBar').style.width = `${fuel}%`;
    //document.getElementById('timeValue').textContent = time;
}

// Example: Simulate stats updates every second
let exampleSpeed = 0;
let exampleFuel = 100;
let exampleSeconds = 0;
let statsInterval = null;

function startStatsSimulation() {
    if (statsInterval) clearInterval(statsInterval);
    statsInterval = setInterval(() => {
    if (exampleFuel <= 0) {
        clearInterval(statsInterval);
        myGame.gameOver();
        myMusic.playGameOver();
        console.log("Game Over! State:", myGame.state);
        showGameOverPopup();
        return;
    }
        exampleSpeed = Math.min(exampleSpeed + 10, 500); // increase speed
        exampleFuel = Math.max(exampleFuel - 2, 0); // decrease fuel
        exampleSeconds++;
        const minutes = Math.floor(exampleSeconds / 60);
        const seconds = exampleSeconds % 60;
        updateStats(exampleSpeed, exampleFuel, `${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 100);
}

// Start stats simulation when game starts
document.querySelectorAll('.level-card').forEach(card => {
    card.addEventListener('click', startStatsSimulation);
});


// -----------------
// Pause/Resume Toggle
// -----------------
document.body.addEventListener('click', () => {
    if(myGame.state === 'PLAYING' || myGame.state === 'PAUSED'){
        myGame.changeState();
        console.log("Game state changed to:", myGame.state);

        if(myGame.state === 'PAUSED'){
            clearInterval(statsInterval); // stop stats updates
            myMusic.pause(); // optional: pause music if your Music class supports it
        } else if(myGame.state === 'PLAYING'){
            startStatsSimulation(); // resume stats updates
            myMusic.playPlaying();  // optional: resume in-game music
        }
    }
});

// Popup elements
const gameOverPopup = document.getElementById('gameOverPopup');
const finalScore = document.getElementById('finalScore');
const quitButton = document.getElementById('quitButton');
const restartButton = document.getElementById('restartButton');
const nextLevelButton = document.getElementById('nextLevelButton');

// Show popup on game over
function showGameOverPopup() {
    finalScore.textContent = `Score: ${myGame.score}`;
    gameOverPopup.style.display = 'flex';
}

// Handle buttons
quitButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    mainMenu.style.display = 'flex';
    exampleFuel=100;
    exampleSpeed=0;
    myMusic.playMenu();
});

restartButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    exampleFuel=100;
    exampleSpeed=0;
    myGame.start();
    myMusic.playPlaying();
    startStatsSimulation();
});

nextLevelButton.addEventListener('click', () => {
    gameOverPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    exampleSpeed = 0;
    exampleFuel = 100;
    myGame.start();
    myMusic.playPlaying();
    startStatsSimulation();
});
