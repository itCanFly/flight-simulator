// -----------------
// UI & Game Logic
// -----------------

// const myGame = new Game("gameScreen");

// Screen elements
const loadingScreen = document.getElementById('loadingScreen');
const mainMenu = document.getElementById('mainMenu');
const progressFill = document.querySelector('.progress-fill');

// -----------------
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


const playButton = document.getElementById('playButton');
playButton.addEventListener('click', () => {
    window.location.href = "/menu.html";
});
