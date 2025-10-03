// Music.js
export class Music {
    constructor() {
        this.menuAudio = new Audio('./assets/audio/menu.mp3');
        this.playingAudio = new Audio('./assets/audio/playing.mp3');
        this.gameOverAudio = new Audio('./assets/audio/gameover.mp3');
this.menuAudio.preload = 'auto';
this.playingAudio.preload = 'auto';
this.gameOverAudio.preload = 'auto';
        // loop background tracks if needed
        this.menuAudio.loop = true;
        this.playingAudio.loop = true;
        this.gameOverAudio.loop = false; 
        
        // Set lower volume (e.g., 20%)
        this.menuAudio.volume = 0.0002;
        this.playingAudio.volume = 0.0001;
        this.gameOverAudio.volume = 0.0001;
    }

    stopAll() {
        this.menuAudio.pause();
        this.playingAudio.pause();
        this.gameOverAudio.pause();

        // reset to start so it plays from beginning next time
        this.menuAudio.currentTime = 0;
        this.playingAudio.currentTime = 0;
        this.gameOverAudio.currentTime = 0;
    }

        playMenu() {
            this.stopAll();
            this.menuAudio.play().catch(err => {
                console.warn("Menu audio playback failed:", err);
            });
        }

    playPlaying() {
        this.stopAll();
        this.playingAudio.play();
    }

    playGameOver() {
        this.stopAll();
        this.gameOverAudio.play();
    }
}
