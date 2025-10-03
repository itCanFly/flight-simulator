export class Game {
    constructor() {
        this.state = 'MENU';
        this.level = 1;
        this.score = 0;

        // keep track of listeners
        this.listeners = [];
    }

    // allow other files to subscribe to game changes
    onChange(callback) {
        this.listeners.push(callback);
    }

    // internal helper to notify all listeners
    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.level = 1;
        this.notify();
    }

    update() {
        this.score += 1;
        this.notify();
    }

    changeState() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
        }
        this.notify();
    }

    gameOver() {
        this.state = 'GAME_OVER';
        this.notify();
    }
}
