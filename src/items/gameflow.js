import { spawnFuelCans } from '../items/fuelSystem.js';
import { spawnExhausts } from '../items/exhaustSystem.js';
import { handleAltitude, handleFuelWarning, handleGroundCollision, hideAltitudeWarning, handleDescentWarnings, handleProximityWarnings } from '../systems/safety.js';
import { HUD } from '../ui/hud.js';
import { startStatsLoop, stopStatsLoop , resetStatsLoop,getFormatted } from '../scene/stats.js';
import { setupControls, updateControls } from '../controls/controls.js';
import { updateClouds } from '../clouds/clouds.js';
import { handleCheckpoints } from '../scene/checkpoints.js';
import { renderRadar } from '../scene/radarCamera.js';
import { updateExplosion, triggerExplosion, resetExplosion } from '../shaders/explosion.js';
import { createRain } from '../scene/setup.js';
function notify(game) {
        game.listeners.forEach(cb => cb(game));
    }

// Interactive tips for the player (Flying Metro Bos flavor)
const TIPS = [
    'Maintain heading — align with the checkpoints to stay on course.',
    'Check fuel regularly — grab fuel cans to top up.',
    'Smooth inputs save fuel — avoid abrupt pitch changes.',
    'Approach waypoints calmly — reduce roll when entering.',
    'Wind gusts may push you off course — correct heading early.',
    'Keep an eye on altitude during descent — pull up if necessary.',
    'To increase the speed : Press W - To decrease the speed : Press S',
    'Gravity is strong on this route — descend carefully.',
    'Do not wander too far away from the checkpoints - your fuel will be exhausted in no time'
];

export function startStats(game) {
    // startStatsLoop returns the interval id so we can clear it later
    const id = startStatsLoop(game.stats, game.statsInterval, () => notify(game), () => gameOver(game));
    game.statsInterval = id;
}

export function stopStats(game) {
    game.statsInterval = stopStatsLoop(game.statsInterval);
}

function resetStats(game) {
    resetStatsLoop(game.stats,game.forwardSpeed);
}
export function gameOver(game) {
    // Only trigger game over when the game is actively playing
    if (!game || game.state !== 'PLAYING') return;

    // Trigger explosion if plane has taken off (crash scenario) and not already crashing
    if (game.hasTakenOff && !game._isCrashing) {
        triggerExplosion(game.plane.position.clone());
        game._isCrashing = true;
    }

    game.state = 'GAME_OVER';
    game.isAnimating = false;
    stopStats(game);
    
    // Delay reset to allow full explosion to be visible (explosion lasts 6 seconds)
    setTimeout(() => {
        resetPosition(game);
        resetExplosion();
    }, 4000); // Increased from 1500ms to 4000ms (4 seconds)
    
    try { game.music.stopMovementAudio(); } catch (e) {}
    try { game.music.playGameOver(); } catch (e) {}
    notify(game);
}

export function start(game) {
    game.state = 'PLAYING';
    game.score = 0;
    game.verticalVelocity = 0;
    game.forwardSpeed = game.minForwardSpeed; 
    game.currentWaypointIndex = 0;

    // game.arrows = createArrows(game.scene, game.waypoints);

    // Initialize HUD early so pickups and prompts can immediately use it
    try { HUD.init(game); } catch (e) {}

    spawnFuelCans(game);
    spawnExhausts(game);

    resetPosition(game);
    resetStats(game);
    resetExplosion(); // Reset explosion system

    game.music.playGame();

    // Show subtle start message and init HUD
    try { HUD.init(game); HUD.showStartMessage('Engines on — Taxiing...', 2200); } catch (e) { /* ignore when not in DOM environment */ }

    // Start ascend countdown sequence: prompt player to manually ascend within 3s,
    // and continue prompting if they don't.
    try { HUD.startAscendSequence(game, { graceSeconds: 3, responseMs: 3000 }); } catch (e) {}
    // Show controls hint reminder (text-only) so players learn controls
    try { HUD.showControlsHint(6000); } catch (e) {}

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
    
    // Unlock next level
    const completedLevels = JSON.parse(localStorage.getItem('completedLevels') || '[1]');
    const nextLevel = game.level + 1;
    
    if (nextLevel <= 3 && !completedLevels.includes(nextLevel)) {
        completedLevels.push(nextLevel);
        localStorage.setItem('completedLevels', JSON.stringify(completedLevels));
        console.log(`🔓 Level ${nextLevel} unlocked!`);
    }
    
    notify(game);
}

export function lose(game) {
    game.state = 'LOSE';
    game.isAnimating = false;
    stopStats(game);
    resetPosition(game);
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
        // guard pause popup access (may be managed in play.js)
        try { const pauseEl = document.getElementById('pausePopup'); if (pauseEl) pauseEl.style.display = 'flex'; } catch (e) {}
        game.isAnimating = false;
        game.targetForwardSpeed = 0;
        // animate(game);
        stopStats(game);
        game.music.stopMovementAudio();

    } else if (game.state === 'PAUSED') {
        game.state = 'PLAYING';
        try { const pauseEl = document.getElementById('pausePopup'); if (pauseEl) pauseEl.style.display = 'none'; } catch (e) {}
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
    
    // Reset crash flag
    game._isCrashing = false;
}

export function animate(game) {
        // console.log(game.isAnimating)
        // console.log(game.state);
        // console.log(game.level);
        if (!game.isAnimating) return;
        requestAnimationFrame(() => animate(game));
            if (game.level === 3 && !game.rainEffect) {
            game.rainEffect = createRain(game.scene, {
                count: 15000,
                speed: 0.3,
                area: 1000,
                height: 500
            });
        }
                // Get delta time for smooth animations
        const deltaTime = game.clock.getDelta();

        for (const can of game.fuelCans) {
            can.update(deltaTime, game.plane.position);
        }
    
    // Update rain effect if it exists (for level 3)
    if (game.rainEffect && game.rainEffect.updateRain) {
        game.rainEffect.updateRain();
    }

    // Handle warnings and safety systems
    handleFuelWarning(game);
    handleAltitude(game);
    handleDescentWarnings(game);
    handleProximityWarnings(game);
        updateControls(game);
        handleGroundCollision(game);
        handleCheckpoints(game);

        // Off-course detection: compute distance from plane to current path segment
        try {
            const idx = game.currentWaypointIndex;
            if (typeof idx === 'number' && idx < waypoints.length - 1) {
                const a = waypoints[idx];
                const b = waypoints[idx + 1];
                const crossDist = distanceFromSegment(game.plane.position, a, b);
                const OFF_COURSE_THRESHOLD = 200; // meters
                if (crossDist > OFF_COURSE_THRESHOLD) {
                    HUD.showOffCourse();
                } else {
                    HUD.hideOffCourse();
                }
            } else {
                HUD.hideOffCourse();
            }
        } catch (e) {
            // ignore if HUD unavailable
        }

        // Update moving clouds with fade animations
        //updateClouds(game.cloudGroup, game.plane, game.camera, deltaTime);

        if (game.updateExhausts) game.updateExhausts();
        
        // Update explosion animation only if active
        if (game._isCrashing) {
            updateExplosion();
        }
        
        // Rotate the circle
        if (game.rotatingCircle) {
            game.rotatingCircle.rotation.z += 0.02;
        }

        // Update camera position based on mode (only if not crashing)
        if (!game._isCrashing) {
            if (game.cameraMode === "thirdPerson") {
                
                game.camera.position.x = game.plane.position.x - 10 * Math.sin(game.plane.rotation.y);
                game.camera.position.z = game.plane.position.z - 10 * Math.cos(game.plane.rotation.y);
                game.camera.position.y = game.plane.position.y + 6;
            }
            else if (game.cameraMode === "topView") {
                // Top-down view
                game.camera.position.x = game.plane.position.x - 3 * Math.sin(game.plane.rotation.z);
                game.camera.position.y = game.plane.position.y + 12.5; // height above
                game.camera.position.z = game.plane.position.z - 3 * Math.cos(game.plane.rotation.z);
            }

            game.camera.lookAt(game.plane.position);
        }

        game.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
        game.renderer.setScissorTest(false);
        game.renderer.setClearColor(0x87ceeb, 1); 
        game.renderer.clear(true, true, true);

        // shakeCamera(this.camera,0.25);
        game.renderer.render(game.scene, game.camera);
        
        // Render radar view
        renderRadar(game);

    // Update UI gauges periodically instead of every frame (performance optimization)
    if (!game._lastGaugeUpdate) game._lastGaugeUpdate = 0;
    if (game.clock.elapsedTime - game._lastGaugeUpdate > 0.05) { // Update every 50ms instead of every frame
        try { if (typeof window !== 'undefined' && typeof window.updateRacingGauges === 'function') window.updateRacingGauges(); } catch (e) {}
        game._lastGaugeUpdate = game.clock.elapsedTime;
    }

        if (game.state === "PLAYING") {
            const currentTime = game.clock.getElapsedTime();
            
            // Give 100 points every 10 seconds
            // if (currentTime - game.lastScoreTime >= game.scoreInterval) {
            //     game.score += 100;
            //     game.lastScoreTime = currentTime;
            //     //console.log(" +100 points | Total Score:", game.score);
            //     try { HUD.showPoints(100); } catch (e) {}
            // }
            // Periodic interactive tips
            try {
                if (!game.lastTipTime) game.lastTipTime = currentTime;
                if (currentTime - game.lastTipTime >= (game.tipInterval || 20)) {
                    const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
                    HUD.showTip(tip, 5000);
                    game.lastTipTime = currentTime;
                }
            } catch (e) {}
        }

        // Cache DOM elements for better performance (query once, not every frame)
        if (!game._cachedElements) {
            game._cachedElements = {
                finalScore: document.getElementById('finalScore'),
                gameScore: document.getElementById('gameScore'),
                speedValue: document.getElementById('speedValue')
            };
        }
        
        // Update score displays
        try {
            if (game._cachedElements.finalScore) game._cachedElements.finalScore.innerText = `Score: ${game.score}`;
        } catch (e) {}
        try {
            if (game._cachedElements.gameScore) game._cachedElements.gameScore.innerText = `${game.score}`;
        } catch (e) {}
        // Update speed display
        try {
            if (game._cachedElements.speedValue) game._cachedElements.speedValue.innerText = `${(game.forwardSpeed.toFixed(3) * 100).toFixed(0)} km/h`;
        } catch (e) {}


    }