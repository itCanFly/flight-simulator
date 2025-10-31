import { spawnFuelCans } from '../items/fuelSystem.js';
import { spawnExhausts } from '../items/exhaustSystem.js';
import { createRotatingCircle, createArrows } from '../scene/waypoints.js';
import { handleAltitude, handleFuelWarning, handleGroundCollision,hideAltitudeWarning } from '../systems/safety.js';
import { startStatsLoop, stopStatsLoop , resetStatsLoop,getFormatted } from '../scene/stats.js';
import { setupControls, updateControls } from '../controls/controls.js';
import { updateClouds } from '../clouds/clouds.js';
import { handleCheckpoints } from '../scene/checkpoints.js';

function notify(game) {
        game.listeners.forEach(cb => cb(game));
    }

export function startStats(game) {
    startStatsLoop(game.stats, game.statsInterval, () => notify(game),() => gameOver(game) );
}

export function stopStats(game) {
    stopStatsLoop(game.statsInterval);
}

function resetStats(game) {
    resetStatsLoop(game.stats,game.forwardSpeed);
}
export function gameOver(game) {
    game.state = 'GAME_OVER';
    game.isAnimating = false;
    stopStats(game);
    resetPosition(game);
    game.music.stopMovementAudio();
    game.music.playGameOver();
    notify(game);
}

export function start(game) {
    game.state = 'PLAYING';
    game.score = 0;
    game.verticalVelocity = 0;
    game.forwardSpeed = game.minForwardSpeed; 
    game.currentWaypointIndex = 0;

    game.arrows = createArrows(game.scene, game.waypoints);

    spawnFuelCans(game);
    spawnExhausts(game);

    resetPosition(game);
    resetStats(game);

    game.music.playGame();

    game.isAnimating = true;
    animate(game);
    startStats(game);

    notify(game);
}

export function win(game) {
    game.state = 'WIN';
    game.isAnimating = false;
    stopStats(game);
    resetPosition(game);
    game.music.stopMovementAudio();
    game.music.playAchieved();
    game.notify();
}

export function lose(game) {
    game.state = 'LOSE';
    game.isAnimating = false;
    stopStats(game);
    resetPosition();
    game.music.stopMovementAudio();
    game.music.playGameOver();
    notify(game);
}

export function resume(game) {
    if (game.state === 'PAUSED') {
        game.state = 'PLAYING';
        game.isAnimating = true;
        animate(game);     
        startStats(game);  
        notify(game);      
    }
}

export function changeState(game) {
    if (game.state === 'PLAYING') {
        game.state = 'PAUSED';
        pausePopup.style.display = 'flex';
        game.isAnimating = false;
        game.targetForwardSpeed = 0;
        // animate(game);
        stopStats(game);
        game.music.stopMovementAudio();

    } else if (game.state === 'PAUSED') {
        game.state = 'PLAYING';
        pausePopup.style.display = 'none';
        game.isAnimating = true;
        animate(game);
        startStats(game);
    }
    notify(game);
    }

export function resetPosition(game) {
    game.plane.position.set(1800, 1, -910);
    game.plane.rotation.set(0, 0, 0);
    game.verticalVelocity = 0;
    game.camera.position.set(0, 8, 8);
    game.camera.lookAt(game.plane.position);
    
    // Hide altitude warning when resetting
    hideAltitudeWarning(game);
    
    // Reset takeoff state
    game.hasTakenOff = false;
    
    // Reset audio warning flags
    game.hasPlayedFuelWarning = false;
    game.hasPlayedAltitudeWarning = false;
}

export function animate(game) {
        // console.log(game.isAnimating)
        // console.log(game.state);
        // console.log(game.level);
        if (!game.isAnimating) return;
        requestAnimationFrame(() => animate(game));

        // Get delta time for smooth animations
        const deltaTime = game.clock.getDelta();

        for (const can of game.fuelCans) {
            can.update(deltaTime, game.plane.position);
        }

        // handleAltitude(game);
        handleFuelWarning(game);
        handleAltitude(game);
        updateControls(game);
        handleGroundCollision(game);
        handleCheckpoints(game);

        // Update moving clouds with fade animations
        //updateClouds(game.cloudGroup, game.plane, game.camera, deltaTime);

        if (game.updateExhausts) game.updateExhausts();
        
        // Rotate the circle
        if (game.rotatingCircle) {
            game.rotatingCircle.rotation.z += 0.02;
        }

        game.camera.position.x = game.plane.position.x - 5 * Math.sin(game.plane.rotation.y);
        game.camera.position.z = game.plane.position.z - 5 * Math.cos(game.plane.rotation.y);
        game.camera.position.y = game.plane.position.y + 6;
        
        if (game.cameraMode === "thirdPerson") {
            game.camera.position.x = game.plane.position.x - 5 * Math.sin(game.plane.rotation.y);
            game.camera.position.z = game.plane.position.z - 5 * Math.cos(game.plane.rotation.y);
            game.camera.position.y = game.plane.position.y + 6;
            
        }
        else if (game.cameraMode === "topView") {
        // First-person (inside the plane)
            game.camera.position.x = game.plane.position.x - 3 * Math.sin(game.plane.rotation.z) ;
            game.camera.position.y = game.plane.position.y + 12.5; // height above
            game.camera.position.z = game.plane.position.z - 3 * Math.cos(game.plane.rotation.z);
            
        }

        game.camera.lookAt(game.plane.position);

        

        // shakeCamera(this.camera,0.25);
        game.renderer.render(game.scene, game.camera);

        if (game.state === "PLAYING") {
            const currentTime = game.clock.getElapsedTime();
            
            // Give 100 points every 10 seconds
            if (currentTime - game.lastScoreTime >= game.scoreInterval) {
                game.score += 100;
                game.lastScoreTime = currentTime;
                //console.log("🪙 +100 points | Total Score:", game.score);
            }
        }

        document.getElementById("finalScore").innerText = `Score: ${game.score}`;
        document.getElementById("gameScore").innerText = `${game.score}`;
        //document.getElementById("timeValue").innerText = `${this.currentTime}`;
        document.getElementById("speedValue").innerText = `${(game.forwardSpeed.toFixed(3)*100).toFixed(0)} km/h`;


    }