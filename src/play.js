import { Game } from './game.js';
import { start, resume,changeState,resetPosition } from './items/gameflow.js';
import { stopStats } from './items/gameflow.js';
// -----------------
// UI & Game Logic
// -----------------
const gameScreen = document.getElementById('gameScreen');
gameScreen.style.display = 'block';const myGame = new Game("gameScreen");
myGame.isAnimating = false;
// Screen elements
myGame.music.playButton();
start(myGame);
myGame.level = localStorage.getItem('selectedLevel');
var dialogues = [
            {
                character: "Mr Ingram",
                avatar: "",
                text: "Hello there! You must be Json right?"
            },
            {
                character: "Jason",
                avatar: "",
                text: "Uh... it's actually Jason, sir."
            },
            {
                character: "Mr Ingram",
                avatar: "",
                text: "Json... Jason... JavaScript... who can keep track these days? Listen, I need you to transport cargo from OR Tambo to Cape Town!"
            },
            {
                character: "Jason",
                avatar: "",
                text: "What kind of cargo?"
            },
            {
                character: "Mr Ingram",
                avatar: "",
                text: "47 boxes of wigs, hot sauce, and one VERY precious disco ball. If that disco ball gets scratched, you're fired, Json!"
            },
            {
                character: "Jason",
                avatar: "",
                text: "My name is JASON! But fine, I'll do it."
            },
            {
                character: "Mr Ingram",
                avatar: "",
                text: "Perfect! Now get to that plane before my hot sauce expires. GO GO GO!"
            }
        ];

let currentDialogue = 0;
const dialogueText = document.getElementById('dialogueText');
const characterName = document.getElementById('characterName');
const characterAvatar = document.getElementById('characterAvatar');
const nextButton = document.getElementById('nextButton');
const skipButton = document.getElementById('skipButton');

skipButton.addEventListener('click', () => {
    // Hide the dialogue popup
    document.getElementById('dialogue-popup').style.display = 'none';
    
    // Start the countdown and game
    startCountdown(() => {
        start(myGame);
    });
});
window.addEventListener('load', () => {
    // Default to level 1 if no saved level is found
    if (myGame.level) {
        document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;

        // If level is 2, change the first dialogue message
        if (myGame.level === "2") {
             dialogues = [
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Jason! JASON! You're back! The disco ball survived! I'm honestly shocked."
    },
    {
        character: "Jason",
        avatar: "",
        text: "Of course it survived. I'm a professional pilot, Mr. Ingram."
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Professional? You took 3 hours for a 2-hour flight! But whatever... I have ANOTHER mission for you."
    },
    {
        character: "Jason",
        avatar: "",
        text: "Already? I just landed! Can I at least get some coffee first?"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Coffee is for WINNERS, Json! This time you're flying to Durban. Same cargo but DOUBLE the boxes and THREE disco balls!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "*sighs* It's Jason... and THREE disco balls? Are you running a mobile nightclub or something?"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Don't ask questions! Just FLY! And this time, try to avoid those storm clouds. They're bad for the wigs!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "Wait, what storm clouds? You didn't mention—"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "No time for chitchat! The disco balls are waiting! GO GO GO!"
    }
            ];
        }
        else if(myGame.level == "3"){
             dialogues = [
    {
        character: "Mr Ingram",
        avatar: "",
        text: "JASON! My boy! You've done the impossible! Those three disco balls are GLEAMING!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "Thank you, Mr. Ingram. Finally, you got my name right!"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Don't get emotional on me, Json. We have ONE FINAL MISSION. The BIG ONE!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "You literally just said my name correctly... *sighs* What's the mission?"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "International flight to Madagascar! 100 boxes, FIVE disco balls, and get this... a live flamingo named Gerald!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "A LIVE FLAMINGO?! Mr. Ingram, I'm a cargo pilot, not a zoo keeper!"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Gerald is VERY important to me. He's the star of my new disco-themed wildlife sanctuary! Don't let me down!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "This is absolutely insane. What if Gerald doesn't like flying?"
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Then play him some disco music! Now GET GOING! This is your final test, Json! Make me proud!"
    },
    {
        character: "Jason",
        avatar: "",
        text: "For the last time, it's JASON! ...but fine. Let's do this."
    },
    {
        character: "Mr Ingram",
        avatar: "",
        text: "That's the spirit! Fly safe, watch the cargo, and remember... Gerald is counting on you! GO GO GO!"
    }
            ];
        }
    } else {
        document.getElementById('levelInfo').textContent = 'Level: 1';
    }

    const current = dialogues[currentDialogue];
    characterName.textContent = current.character;
    characterAvatar.textContent = current.avatar;
    dialogueText.textContent = current.text;
});
nextButton.addEventListener('click', () => {
    currentDialogue++;
    
    if (currentDialogue < dialogues.length) {
        const current = dialogues[currentDialogue];
        characterName.textContent = current.character;
        characterAvatar.textContent = current.avatar;
        dialogueText.textContent = current.text;
    } else {
        dialogueText.textContent = "Ready to fly? Good luck with that disco ball, Json... I mean Jason!";
        characterName.textContent = "Mission Briefing";
        characterAvatar.textContent = "";
        nextButton.textContent = "Start Takeoff!";
        nextButton.classList.add('start-button');

        nextButton.onclick = () => {
          document.getElementById('dialogue-popup').style.display = 'none';
            startCountdown(() => {
                start(myGame);
            });
            start(myGame);
        };
        
    }
});

// -----------
// ------
// Countdown Animation Function
// -----------------
function startCountdown(callback) {
    
    const overlay = document.getElementById('countdownOverlay');
    const numberEl = document.getElementById('countdownNumber');
    const sequence = ['3', '2', '1', 'GO!'];
    let index = 0;

    overlay.classList.add('active');

    function showNext() {
      
        if (index >= sequence.length) {
            myGame.targetForwardSpeed = 1.5;
            overlay.classList.remove('active');
       
            if (callback) {
               
                callback();
            }
            return;
        }

        const text = sequence[index];
        numberEl.textContent = text;
        numberEl.classList.remove('animate', 'go');
        
        if (text === 'GO!') {
            numberEl.classList.add('go');
        }

        // Trigger animation
        setTimeout(() => {
            numberEl.classList.add('animate');
        }, 10);

        index++;
        const delay = text === 'GO!' ? 1500 : 1000;
        setTimeout(showNext, delay);
    }

    showNext();
}

// -----------------
// Navigation Buttons
// // -----------------

const backToLevel = document.getElementById('backToLevelsButton');

// -----------------
// Stats Display
// -----------------
function updateStats(game) {
    // console.log(game.stats);
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
            
            changeState(myGame);
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
if(myGame.level ==3){
    nextLevelButton.style.display = 'none';
}
// -----------------
// Functions
// -----------------
function showGamePause() {
    myGame.state = 'PAUSED';
    exit.style.display = 'flex';
}

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
    changeState(myGame); // Pause the game
    document.getElementById('pausePopup').style.display = 'flex';
});

quitButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state properly without calling gameOver() again
    myGame.isAnimating = false;
    stopStats(myGame);
    resetPosition(myGame);
    myGame.state = 'MENU';
    // Go to levels instead of main menu
    localStorage.setItem('showLevelSelection', 'true');
    window.location.href = '/menu.html';
});

restartButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    startCountdown(() => {
        start(myGame);
    });
    start(myGame);

});

nextLevelButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    myGame.level++;
    // savedLevel++;
    console.log(myGame.level)
    localStorage.setItem('selectedLevel', myGame.level);
    // Redirect to the gameplay page
    window.location.href = '/gameplay.html';
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
    // Hide exit popup
    myGame.isAnimating = true;
    stopStats(myGame);
    // resetPosition(myGame);

    pausePopup.style.display = 'none';
    resume(myGame);
});

restartPauseButton.addEventListener('click', () => {
    myGame.music.playButton();
    pausePopup.style.display = 'none';
    startCountdown(() => {
        start(myGame); // Restart the current level
    });
  start(myGame); 
});

quitPauseButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state properly without calling gameOver() again
    myGame.isAnimating = false;
    stopStats(myGame);
    resetPosition(myGame);
    myGame.state = 'MENU';
    // Go to levels instead of main menu
    localStorage.setItem('showLevelSelection', 'true');
    window.location.href = '/menu.html';
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

// Hook into game states
myGame.onChange((game) => {
    if (game.state === 'WIN') {
        showWinPopup();
    } else if (game.state === 'LOSE') {
        showLosePopup();
    }
});

// Win popup button events
nextWinLevelButton.addEventListener('click', () => {
    myGame.music.playButton();
    winPopup.style.display = 'none';
    myGame.level++;
    document.getElementById('levelInfo').textContent = `Level: ${myGame.level}`;
    startCountdown(() => {
        start(myGame);
    });
});

restartWinButton.addEventListener('click', () => {
    myGame.music.playButton();
    winPopup.style.display = 'none';

});

quitWinButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state properly without calling gameOver() again
    myGame.isAnimating = false;
    stopStats(myGame);
    resetPosition(myGame);
    myGame.state = 'MENU';
    // Go to levels instead of main menu
    localStorage.setItem('showLevelSelection', 'true');
    window.location.href = '/menu.html';
});

// Lose popup button events
restartLoseButton.addEventListener('click', () => {
    myGame.music.playButton();
    losePopup.style.display = 'none';
    // startCountdown(() => {
    //     start(myGame);
    // });
});

quitLoseButton.addEventListener('click', () => {
    myGame.music.playButton();
    gameOverPopup.style.display = 'none';
    gameScreen.style.display = 'none';
    // Reset game state properly without calling gameOver() again
    myGame.isAnimating = false;
    stopStats(myGame);
    resetPosition(myGame);
    myGame.state = 'MENU';
    // Go to levels instead of main menu
    localStorage.setItem('showLevelSelection', 'true');
    window.location.href = '/menu.html';
});
