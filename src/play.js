import { Game } from './game.js';
import { HUD } from './ui/hud.js';
import { start, resume,changeState,resetPosition } from './items/gameflow.js';
import { stopStats } from './items/gameflow.js';
// Defensive shim: guard Range methods against detached nodes to avoid
// InvalidNodeTypeError thrown by third-party scripts/extensions that
// attempt to manipulate Ranges on nodes which no longer have a parent.
// This is a temporary runtime safeguard for testing; it logs a single
// warning the first time it intercepts a call.
(function(){
    try {
        if (typeof Range === 'undefined' || !Range.prototype) return;
        let _warned = false;
        const _maybeWarn = (msg, e) => { if (!_warned) { try { console.warn(msg, e || ''); } catch (err) {} _warned = true; } };

        const _origSetStartBefore = Range.prototype.setStartBefore;
        Range.prototype.setStartBefore = function(node) {
            try {
                if (!node || !node.parentNode) { _maybeWarn('[shim] blocked Range.setStartBefore on detached node'); return; }
                return _origSetStartBefore.call(this, node);
            } catch (err) { _maybeWarn('[shim] Range.setStartBefore threw', err); }
        };

        const _origSetEndAfter = Range.prototype.setEndAfter;
        Range.prototype.setEndAfter = function(node) {
            try {
                if (!node || !node.parentNode) { _maybeWarn('[shim] blocked Range.setEndAfter on detached node'); return; }
                return _origSetEndAfter.call(this, node);
            } catch (err) { _maybeWarn('[shim] Range.setEndAfter threw', err); }
        };
    } catch (e) { try { console.warn('[shim] failed to install Range guards', e); } catch (err) {} }
})();
// -----------------
// UI & Game Logic
// -----------------
const gameScreen = document.getElementById('gameScreen');
if (gameScreen) gameScreen.style.display = 'block';
const myGame = new Game("gameScreen");
myGame.isAnimating = false;
// Initialize HUD and screen elements
try { HUD.init(myGame); } catch (e) {}
// Temporary global handlers to capture unexpected errors and unhandled promise rejections.
// These help diagnose extension/channel issues and other runtime problems during testing.
try {
    window.addEventListener('unhandledrejection', (e) => {
        try { console.error('[unhandledrejection]', e && e.reason ? e.reason : e); } catch (err) {}
    });
    window.addEventListener('error', (e) => {
        try { console.error('[window.error]', e && e.message ? e.message : e); } catch (err) {}
    });
} catch (err) {}
// Setup touch control event delegation so mobile users can play using on-screen buttons.
function _dispatchKeyEvent(type, code) {
    try {
        const ev = new KeyboardEvent(type, { code, key: code, bubbles: true, cancelable: true });
        window.dispatchEvent(ev);
    } catch (e) {}
}

function _bindTouchControls() {
    try {
        const container = document.getElementById('touchControls');
        if (!container) return;
        // Use pointer events for unified handling (mouse/touch)
        container.addEventListener('pointerdown', (ev) => {
            const btn = ev.target.closest && ev.target.closest('.touch-button');
            if (!btn) return;
            ev.preventDefault();
            const code = btn.getAttribute('data-key');
            if (code) _dispatchKeyEvent('keydown', code);
        });
        container.addEventListener('pointerup', (ev) => {
            const btn = ev.target.closest && ev.target.closest('.touch-button');
            if (!btn) return;
            ev.preventDefault();
            const code = btn.getAttribute('data-key');
            if (code) _dispatchKeyEvent('keyup', code);
        });
        // also handle pointerleave/cancel to release buttons if finger slides away
        container.addEventListener('pointercancel', (ev) => {
            const btn = ev.target.closest && ev.target.closest('.touch-button');
            if (!btn) return;
            const code = btn.getAttribute('data-key');
            if (code) _dispatchKeyEvent('keyup', code);
        });
    } catch (e) {}
}

// Bind after DOM ready
try { window.addEventListener('load', _bindTouchControls); } catch (e) {}
// Screen elements
myGame.music.playButton();
start(myGame);
// Ensure on-screen gauges are visible when gameplay begins (fade-in)
try { const gaugesEl = document.getElementById('gauges'); if (gaugesEl) { gaugesEl.style.display = 'flex'; gaugesEl.classList.add('visible'); } } catch (e) {}
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

if (skipButton) {
    skipButton.addEventListener('click', () => {
        // Hide the dialogue popup
        const dlg = document.getElementById('dialogue-popup'); if (dlg) dlg.style.display = 'none';
        const gauges = document.getElementById('gauges'); if (gauges) gauges.style.display = 'flex';

        // Start the game immediately (HUD ascend sequence will handle ascend prompts)
        start(myGame);
    });
}
window.addEventListener('load', () => {
    // Default to level 1 if no saved level is found
    if (myGame.level) {
        const lvlEl = document.getElementById('levelInfo'); if (lvlEl) lvlEl.textContent = `Level: ${myGame.level}`;

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
    /* Mr Ingram line removed (Json joke)
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Coffee is for WINNERS, Json! This time you're flying to Durban. Same cargo but DOUBLE the boxes and THREE disco balls!"
    },
    */
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
    /* Mr Ingram line removed (Json joke)
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Don't get emotional on me, Json. We have ONE FINAL MISSION. The BIG ONE!"
    },
    */
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
    /* Mr Ingram line removed (Json joke)
    {
        character: "Mr Ingram",
        avatar: "",
        text: "Then play him some disco music! Now GET GOING! This is your final test, Json! Make me proud!"
    },
    */
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
        const lvlEl = document.getElementById('levelInfo'); if (lvlEl) lvlEl.textContent = 'Level: 1';
    }

    const current = dialogues[currentDialogue];
    if (characterName) characterName.textContent = current.character;
    if (characterAvatar) characterAvatar.textContent = current.avatar;
    if (dialogueText) dialogueText.textContent = current.text;
});
if (nextButton) nextButton.addEventListener('click', () => {
    currentDialogue++;
    
    if (currentDialogue < dialogues.length) {
        const current = dialogues[currentDialogue];
        if (characterName) characterName.textContent = current.character;
        if (characterAvatar) characterAvatar.textContent = current.avatar;
        if (dialogueText) dialogueText.textContent = current.text;
    } else {
        if (dialogueText) dialogueText.textContent = "Ready to fly? Good luck with that disco ball, Jason!";
        if (characterName) characterName.textContent = "Mission Briefing";
        if (characterAvatar) characterAvatar.textContent = "";
        try {
            nextButton.textContent = "Start Takeoff!";
            nextButton.classList.add('start-button');
            nextButton.onclick = () => {
                const dlg = document.getElementById('dialogue-popup'); if (dlg) dlg.style.display = 'none';
                const gauges = document.getElementById('gauges'); if (gauges) gauges.style.display = 'flex';
                // Start immediately; ascend prompts come from HUD.startAscendSequence
                start(myGame);
            };
        } catch (e) {}
        
    }
});

// -----------
// ------
// Countdown Animation Function
// -----------------
// countdown overlay removed — HUD handles ascend prompts now

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
    const speedEl = document.getElementById('speedValue'); if (speedEl) speedEl.textContent = `${speed} km/h`;
    const fuelEl = document.getElementById('fuelValue'); if (fuelEl) {
        // Hide the initial 100% placeholder so the HUD doesn't show '100%' at startup.
        // Only display the numeric fuel value once it drops below 100%.
        fuelEl.textContent = (typeof fuel === 'number' && fuel < 100) ? `${fuel}%` : '';
    }
    const fuelBar = document.getElementById('fuelBar'); if (fuelBar) fuelBar.style.width = `${fuel}%`;
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
if (nextLevelButton && myGame.level == 3) {
    nextLevelButton.style.display = 'none';
}
// Delay showing the Game Over panel so it doesn't appear prematurely.
let _gameOverTimeout = null;
// Show the Game Over popup immediately after crash — set to 0 for instant display.
const GAME_OVER_POPUP_DELAY = 0; // ms

function scheduleShowGameOver(game) {
    // clear any existing
    if (_gameOverTimeout) clearTimeout(_gameOverTimeout);
    if (GAME_OVER_POPUP_DELAY <= 0) {
        // Immediate show
        if (game && game.state === 'GAME_OVER') showGameOverPopup();
        _gameOverTimeout = null;
        return;
    }
    _gameOverTimeout = setTimeout(() => {
        // Only show if still in GAME_OVER state
        if (game && game.state === 'GAME_OVER') showGameOverPopup();
        _gameOverTimeout = null;
    }, GAME_OVER_POPUP_DELAY);
}

function cancelScheduledGameOver() {
    if (_gameOverTimeout) {
        clearTimeout(_gameOverTimeout);
        _gameOverTimeout = null;
    }
    try { if (gameOverPopup) gameOverPopup.style.display = 'none'; } catch (e) {}
}
// -----------------
// Functions
// -----------------
function showGamePause() {
    myGame.state = 'PAUSED';
    try { const exitEl = document.getElementById('exit'); if (exitEl) exitEl.style.display = 'flex'; } catch (e) {}
}

function showGameOverPopup() {
    // Safety: only show when game is actually over
    if (!myGame || myGame.state !== 'GAME_OVER') return;
    // Don't change the game state - keep it as 'GAME_OVER'
    if (finalScore) finalScore.textContent = `Score: ${myGame.score}`;
    try {
        // Only show generic failure details here (no instruments)
        const timeEl = document.getElementById('go-time');
        const crashEl = document.getElementById('go-crash-alt');
        if (timeEl) {
            const secs = Math.floor((myGame.clock && myGame.clock.getElapsedTime) ? myGame.clock.getElapsedTime() : 0);
            timeEl.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
        }
        if (crashEl) crashEl.textContent = `${Math.max(0, Math.round(myGame.plane.position.y))}`;
    } catch (e) {}

    if (gameOverPopup) gameOverPopup.style.display = 'flex';
}

// -----------------
// Hook into game over
// -----------------
myGame.onChange(game => {
    if (game.state === 'GAME_OVER') {
        scheduleShowGameOver(game);
    } else {
        // Cancel any pending show in case state changed back
        cancelScheduledGameOver();
    }
});

// -----------------
// Button Handlers
// -----------------
if (backToLevel) {
    backToLevel.addEventListener('click', () => {
        myGame.music.playButton();
        // Show pause popup instead of directly going to levels
        changeState(myGame); // Pause the game
        const p = document.getElementById('pausePopup'); if (p) p.style.display = 'flex';
    });
}

if (quitButton) {
    quitButton.addEventListener('click', () => {
        myGame.music.playButton();
        cancelScheduledGameOver();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'none';
        // Reset game state properly without calling gameOver() again
        myGame.isAnimating = false;
        stopStats(myGame);
        resetPosition(myGame);
        myGame.state = 'MENU';
        // Go to levels instead of main menu
        localStorage.setItem('showLevelSelection', 'true');
        window.location.href = '/menu.html';
    });
}

if (restartButton) {
    restartButton.addEventListener('click', () => {
        myGame.music.playButton();
        cancelScheduledGameOver();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        // Restart immediately; HUD will manage ascend prompts
        start(myGame);
    });
}

if (nextLevelButton) {
    nextLevelButton.addEventListener('click', () => {
        myGame.music.playButton();
        cancelScheduledGameOver();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        myGame.level++;
        // savedLevel++;
        console.log(myGame.level)
        localStorage.setItem('selectedLevel', myGame.level);
        // Redirect to the gameplay page
        window.location.href = '/gameplay.html';
    });
}

// -----------------
// Pause Popup Handlers
// -----------------
const pausePopup = document.getElementById('pausePopup');
const resumeButton = document.getElementById('resumeButton');
const restartPauseButton = document.getElementById('restartPauseButton');
const quitPauseButton = document.getElementById('quitPauseButton');

if (resumeButton) {
    resumeButton.addEventListener('click', () => {
        myGame.music.playButton();
        // Hide exit popup
        myGame.isAnimating = true;
        stopStats(myGame);
        // resetPosition(myGame);
        if (pausePopup) pausePopup.style.display = 'none';
        resume(myGame);
    });
}

if (restartPauseButton) {
    restartPauseButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (pausePopup) pausePopup.style.display = 'none';
        start(myGame);
    });
}

if (quitPauseButton) {
    quitPauseButton.addEventListener('click', () => {
        myGame.music.playButton();
        cancelScheduledGameOver();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'none';
        // Reset game state properly without calling gameOver() again
        myGame.isAnimating = false;
        stopStats(myGame);
        resetPosition(myGame);
        myGame.state = 'MENU';
        // Go to levels instead of main menu
        localStorage.setItem('showLevelSelection', 'true');
        window.location.href = '/menu.html';
    });
}

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
    // Populate instruments for successful mission
    try {
        if (!myGame) throw new Error('no game');
        const alt = Math.max(0, Math.round(myGame.plane.position.y));
        const sp = Math.round((myGame.stats && myGame.stats.speed) ? myGame.stats.speed : (myGame.forwardSpeed || 0));
        const fu = Math.max(0, Math.round(myGame.stats && myGame.stats.fuel ? myGame.stats.fuel : 0));
        const winAlt = document.getElementById('win-alt'); if (winAlt) winAlt.textContent = `${alt}`;
        const winSp = document.getElementById('win-speed'); if (winSp) winSp.textContent = `${sp}`;
        const winFu = document.getElementById('win-fuel'); if (winFu) winFu.textContent = `${fu}%`;
    } catch (e) {}
    if (winPopup) winPopup.style.display = 'flex';
}

// Show lose popup
function showLosePopup() {
    myGame.state = 'PAUSE';
    if (losePopup) losePopup.style.display = 'flex';
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
if (nextWinLevelButton) {
    nextWinLevelButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (winPopup) winPopup.style.display = 'none';
        myGame.level++;
        const lvlInfo = document.getElementById('levelInfo'); if (lvlInfo) lvlInfo.textContent = `Level: ${myGame.level}`;
        start(myGame);
    });
}

if (restartWinButton) {
    restartWinButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (winPopup) winPopup.style.display = 'none';
    });
}

if (quitWinButton) {
    quitWinButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'none';
        // Reset game state properly without calling gameOver() again
        myGame.isAnimating = false;
        stopStats(myGame);
        resetPosition(myGame);
        myGame.state = 'MENU';
        // Go to levels instead of main menu
        localStorage.setItem('showLevelSelection', 'true');
        window.location.href = '/menu.html';
    });
}

// Lose popup button events
if (restartLoseButton) {
    restartLoseButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (losePopup) losePopup.style.display = 'none';
        // startCountdown(() => {
        //     start(myGame);
        // });
    });
}

if (quitLoseButton) {
    quitLoseButton.addEventListener('click', () => {
        myGame.music.playButton();
        if (gameOverPopup) gameOverPopup.style.display = 'none';
        if (gameScreen) gameScreen.style.display = 'none';
        // Reset game state properly without calling gameOver() again
        myGame.isAnimating = false;
        stopStats(myGame);
        resetPosition(myGame);
        myGame.state = 'MENU';
        // Go to levels instead of main menu
        localStorage.setItem('showLevelSelection', 'true');
        window.location.href = '/menu.html';
    });
}

// Racing Gauges Drawing Function
// per-gauge displayed values for smoothing (needle damping)
const _gaugeState = {};
// throttled debug logging to help diagnose needle movement (ms)
let _lastGaugeLog = 0;
function drawGauge(canvasId, value, maxValue, color, label) {
const canvas = document.getElementById(canvasId);
if (!canvas) return;
// handle high-DPI scaling for crisp gauges
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
// ensure canvas drawing buffer matches displayed size * DPR
const displayedWidth = canvas.clientWidth || canvas.width || 120;
const displayedHeight = canvas.clientHeight || canvas.height || 120;
if (canvas.width !== Math.round(displayedWidth * dpr) || canvas.height !== Math.round(displayedHeight * dpr)) {
    canvas.width = Math.round(displayedWidth * dpr);
    canvas.height = Math.round(displayedHeight * dpr);
    canvas.style.width = `${displayedWidth}px`;
    canvas.style.height = `${displayedHeight}px`;
}
ctx.setTransform(1,0,0,1,0,0); // reset transform
ctx.scale(dpr, dpr);
const centerX = displayedWidth / 2;
const centerY = displayedHeight / 2;
const radius = Math.min(centerX, centerY) - 20;
const startAngle = -225;
const endAngle = 45;

// clear using CSS pixel sizes (we already scaled the context by dpr)
ctx.clearRect(0, 0, displayedWidth, displayedHeight);

// Background circle
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(40, 39, 49, 0.95)';
ctx.fill();
ctx.strokeStyle = 'rgba(6, 14, 133, 0.15)';
ctx.lineWidth = 2;
ctx.stroke();

    // Tick marks
    const totalAngle = endAngle - startAngle;
    const numTicks = 10;

    // scale font based on radius so small gauges have smaller numbers
    // use a slightly smaller factor and clamp to keep digits readable but not oversized
    let baseFontSize = Math.round(radius * 0.095);
    if (displayedWidth <= 140) baseFontSize = Math.max(7, Math.round(radius * 0.08));
    baseFontSize = Math.min(18, Math.max(7, baseFontSize));

    for (let i = 0; i <= numTicks; i++) {
        const angle = (startAngle + (totalAngle * i / numTicks)) * Math.PI / 180;
        const startRadius = radius - 12;
        const endRadius = radius - 5;
        
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * startRadius,centerY + Math.sin(angle) * startRadius);
        ctx.lineTo(centerX + Math.cos(angle) * endRadius,centerY + Math.sin(angle) * endRadius);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Numbers (only on every other tick) — skip the zero label for a cleaner UI
        if (i % 2 === 0) {
            const numberRadius = radius - 25;
            const tickValue = Math.round((maxValue * i / numTicks));
            if (tickValue === 0) continue; // omit zero for clarity

            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = `bold ${baseFontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                tickValue,
                centerX + Math.cos(angle) * numberRadius,
                centerY + Math.sin(angle) * numberRadius
            );
        }
    }

// Smooth displayed value (simple lerp) so the needle animates instead of snapping
let displayed = (typeof _gaugeState[canvasId] === 'number') ? _gaugeState[canvasId] : value;
const lerpFactor = 0.14; // adjust for snappier (higher) or smoother (lower)
displayed += (value - displayed) * lerpFactor;
if (Math.abs(value - displayed) < 0.01) displayed = value;
_gaugeState[canvasId] = displayed;

// Colored arc (use displayed value)
const valueAngle = startAngle + (totalAngle * Math.min(displayed, maxValue) / maxValue);
ctx.beginPath();
ctx.arc(
    centerX, 
    centerY, 
    radius - 8,
    startAngle * Math.PI / 180,
    valueAngle * Math.PI / 180
);
ctx.strokeStyle = color;
ctx.lineWidth = 6;
ctx.stroke();

// Needle
const needleAngle = valueAngle * Math.PI / 180;
ctx.beginPath();
ctx.moveTo(centerX, centerY);
ctx.lineTo(
    centerX + Math.cos(needleAngle) * (radius - 15),
    centerY + Math.sin(needleAngle) * (radius - 15)
);
ctx.strokeStyle = '#fff';
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.stroke();

// Center cap
ctx.beginPath();
ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
ctx.fillStyle = '#fff';
ctx.fill();
}

// Update gauges based on game stats
function updateRacingGauges() {
const speedElement = document.getElementById('speedValue');
const fuelElement = document.getElementById('fuelValue');

if (speedElement && fuelElement) {
    const speedText = speedElement.textContent;
    const fuelText = fuelElement.textContent;
    
    // Prefer authoritative values from game state when available
        const speedFromGame = (myGame && typeof myGame.forwardSpeed === 'number') ? Math.round(myGame.forwardSpeed * 100) : null;
    const fuelFromGame = (myGame && myGame.stats && typeof myGame.stats.fuel === 'number') ? Math.round(myGame.stats.fuel) : null;
    const altitudeFromGame = (myGame && myGame.plane && myGame.plane.position && typeof myGame.plane.position.y === 'number') ? Math.max(0, Math.round(myGame.plane.position.y)) : null;

    const speed = (speedFromGame !== null) ? speedFromGame : (parseInt(speedText) || 0);
    const fuel = (fuelFromGame !== null) ? fuelFromGame : (parseInt(fuelText) || 0);
    const altitudeRaw = (altitudeFromGame !== null) ? altitudeFromGame : Math.round(speed * 0.8);

    // Debug: throttle logs to once per second to avoid spamming the console
    try {
        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        if (now - _lastGaugeLog > 1000) {
            console.debug('[gauges] speedFromGame:', speedFromGame, 'speed:', speed, 'fuelFromGame:', fuelFromGame, 'fuel:', fuel, 'altitudeFromGame:', altitudeFromGame, 'altitudeRaw:', altitudeRaw, '_gaugeState.speedGauge:', _gaugeState['speedGauge']);
            _lastGaugeLog = now;
        }
    } catch (e) {}

    // Map altitude (meters) to gauge 0-250 range (adjust scale as needed)
    const altitudeMapped = Math.round(Math.min(250, (altitudeRaw / 1000) * 250));

    // Draw gauges (altitude uses the mapped value)
    drawGauge('speedGauge', speed, 300, '#00ff88', 'Speed');
    drawGauge('altitudeGauge', altitudeMapped, 250, '#4a9eff', 'Altitude');
    drawGauge('fuelGaugeCanvas', fuel, 100, '#ffaa00', 'Fuel');
    
    // Update digital speed display
    // Update center numeric (speedLarge) and gear overlay
    const speedLargeEl = document.getElementById('speedLarge');
    const gearLargeEl = document.getElementById('gearLarge');
    if (speedLargeEl) {
            const disp = (typeof _gaugeState['speedGauge'] === 'number') ? Math.round(_gaugeState['speedGauge']) : Math.round(speed);
            if (disp === 0) speedLargeEl.textContent = '';
            else speedLargeEl.textContent = disp;
    }
    if (gearLargeEl) {
            const gs = (typeof _gaugeState['speedGauge'] === 'number') ? Math.round(_gaugeState['speedGauge']) : speed;
            if (gs === 0) {
                gearLargeEl.textContent = '';
            } else if (gs < 50) gearLargeEl.textContent = '1';
            else if (gs < 100) gearLargeEl.textContent = '2';
            else if (gs < 150) gearLargeEl.textContent = '3';
            else if (gs < 200) gearLargeEl.textContent = '4';
            else if (gs < 250) gearLargeEl.textContent = '5';
            else gearLargeEl.textContent = '6';
    }
}
}

// Initialize gauges
drawGauge('speedGauge', 0, 300, '#00ff88', 'Speed');
drawGauge('altitudeGauge', 0, 250, '#4a9eff', 'Altitude');
drawGauge('fuelGaugeCanvas', 100, 100, '#5a0b0bff', 'Fuel');

// Update gauges periodically
setInterval(updateRacingGauges, 100);

// Observer to detect changes in speed/fuel elements
const observer = new MutationObserver(updateRacingGauges);
const speedValue = document.getElementById('speedValue');
const fuelValue = document.getElementById('fuelValue');

if (speedValue) observer.observe(speedValue, { childList: true, characterData: true, subtree: true });
if (fuelValue) observer.observe(fuelValue, { childList: true, characterData: true, subtree: true });

// Expose update function globally so the main game loop can call it each frame
try { if (typeof window !== 'undefined') window.updateRacingGauges = updateRacingGauges; } catch (e) {}

// --- Gauge settings (persisted) ---
const _defaultGaugeSettings = {
    speedSize: 1,
    altSize: 1,
    fuelSize: 1,
    showSpeed: true,
    showAlt: true,
    showFuel: true
};

function loadGaugeSettings() {
    try {
        const json = localStorage.getItem('gaugeSettings');
        if (!json) return Object.assign({}, _defaultGaugeSettings);
        const parsed = JSON.parse(json);
        return Object.assign({}, _defaultGaugeSettings, parsed);
    } catch (e) { return Object.assign({}, _defaultGaugeSettings); }
}

function saveGaugeSettings(s) {
    try { localStorage.setItem('gaugeSettings', JSON.stringify(s)); } catch (e) {}
}

function applyGaugeSettings(s) {
    try {
        const speedWrap = document.getElementById('speedGaugeWrapper');
        const altWrap = document.getElementById('altitudeGaugeWrapper');
        const fuelWrap = document.getElementById('fuelGaugeWrapper');
        if (speedWrap) {
            speedWrap.style.transform = `scale(${s.speedSize})`;
            speedWrap.style.display = s.showSpeed ? '' : 'none';
            speedWrap.style.transformOrigin = 'center center';
        }
        if (altWrap) {
            altWrap.style.transform = `scale(${s.altSize})`;
            altWrap.style.display = s.showAlt ? '' : 'none';
            altWrap.style.transformOrigin = 'center center';
        }
        if (fuelWrap) {
            fuelWrap.style.transform = `scale(${s.fuelSize})`;
            fuelWrap.style.display = s.showFuel ? '' : 'none';
            fuelWrap.style.transformOrigin = 'center center';
        }
    } catch (e) {}
}

function bindGaugeSettingsUI() {
    try {
        const toggle = document.getElementById('gaugeSettingsToggle');
        const panel = document.getElementById('gaugeSettings');
        const speedEl = document.getElementById('speedSize');
        const altEl = document.getElementById('altSize');
        const fuelEl = document.getElementById('fuelSize');
        const showSpeed = document.getElementById('showSpeed');
        const showAlt = document.getElementById('showAlt');
        const showFuel = document.getElementById('showFuel');
        const resetBtn = document.getElementById('gaugeReset');
        if (!panel || !toggle) return;
        toggle.addEventListener('click', () => { panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; });
        const settings = loadGaugeSettings();
        if (speedEl) { speedEl.value = settings.speedSize; speedEl.addEventListener('input', (e)=>{ settings.speedSize = parseFloat(e.target.value); applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (altEl) { altEl.value = settings.altSize; altEl.addEventListener('input', (e)=>{ settings.altSize = parseFloat(e.target.value); applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (fuelEl) { fuelEl.value = settings.fuelSize; fuelEl.addEventListener('input', (e)=>{ settings.fuelSize = parseFloat(e.target.value); applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (showSpeed) { showSpeed.checked = settings.showSpeed; showSpeed.addEventListener('change',(e)=>{ settings.showSpeed = !!e.target.checked; applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (showAlt) { showAlt.checked = settings.showAlt; showAlt.addEventListener('change',(e)=>{ settings.showAlt = !!e.target.checked; applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (showFuel) { showFuel.checked = settings.showFuel; showFuel.addEventListener('change',(e)=>{ settings.showFuel = !!e.target.checked; applyGaugeSettings(settings); saveGaugeSettings(settings); }); }
        if (resetBtn) resetBtn.addEventListener('click', ()=>{ const s = Object.assign({}, _defaultGaugeSettings); saveGaugeSettings(s); applyGaugeSettings(s); if (speedEl) speedEl.value = s.speedSize; if (altEl) altEl.value = s.altSize; if (fuelEl) fuelEl.value = s.fuelSize; if (showSpeed) showSpeed.checked = s.showSpeed; if (showAlt) showAlt.checked = s.showAlt; if (showFuel) showFuel.checked = s.showFuel; });
        // apply initial
        applyGaugeSettings(settings);
    } catch (e) {}
}

try { window.addEventListener('load', bindGaugeSettingsUI); } catch (e) {}
