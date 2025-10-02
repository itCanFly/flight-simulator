export class Game{
    constructor(){
        this.state = 'MENU';
        this.level = 1;
        this.score = 0;
    }

    start(){
        this.state = 'PLAYING';
        this.score = 0;
        this.level = 1;
    }

    update(){
        this.score+=1;
    }

    changeState(){
        if(this.state === 'PLAYING'){
            this.state = 'PAUSED';
        }
        else if(this.state === 'PAUSED'){   // fixed here
            this.state = 'PLAYING';
        }
    }

    gameOver(){
        this.state = 'GAME_OVER';
    }
}