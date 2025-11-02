import { gameOver } from "../items/gameflow";
import { HUD } from '../ui/hud.js';
import { triggerExplosion } from '../shaders/explosion.js';

export function handleAltitude(game) {
            // Altitude warning system
    const ALTITUDE_WARNING_THRESHOLD = 2000; // Warning when getting too high
    const LOW_ALTITUDE_WARNING = 100; // warn when close to ground after takeoff

    const y = game.plane.position.y;
    if (y > game.ALTITUDE_GAME_OVER_THRESHOLD) {
        gameOver(game);
        return;
    }
            // Check for warning threshold
    if (y >  ALTITUDE_WARNING_THRESHOLD ) {
        if (!game.isAltitudeWarningActive) {
                game.isAltitudeWarningActive = true;
                if (game.altitudeWarningElement) {
                game.altitudeWarningElement.classList.remove('hidden');
            }
        
            // Play fuel warning audio for altitude warning (only once per warning)
            if (!game.hasPlayedAltitudeWarning) {
                game.music.playFuelWarning();
                game.hasPlayedAltitudeWarning = true;
            }
        }
    } else {
        if (game.isAltitudeWarningActive) {
            game.isAltitudeWarningActive = false;
            if (game.altitudeWarningElement) {
                game.altitudeWarningElement.classList.add('hidden');
            }
        
            game.hasPlayedAltitudeWarning = false;
                }
            }
    // Low altitude warning (close to ground after takeoff) — show HUD
    try {
        if (game.hasTakenOff && y <= LOW_ALTITUDE_WARNING && y > game.CRASH_THRESHOLD) {
            HUD.showLowAltitude();
            if (!game.hasPlayedAltitudeWarning) { game.music.playCrash(); game.hasPlayedAltitudeWarning = true; }
        } else {
            HUD.hideLowAltitude();
            // Reset flag so it can play again later
            game.hasPlayedAltitudeWarning = false;
        }
    } catch (e) {
        // ignore when HUD not available
    }
}
export function hideAltitudeWarning(game) {
       game.isAltitudeWarningActive = false;
        if (game.altitudeWarningElement) {
            game.altitudeWarningElement.classList.add('hidden');
        }
        // Reset altitude warning audio flag when warning disappears
        game.hasPlayedAltitudeWarning = false;
    }

export function handleFuelWarning(game) {
    // Low fuel audio at critical threshold
    if (game.stats.fuel <= game.FUEL_WARNING_THRESHOLD && !game.hasPlayedFuelWarning) {
        game.music.playFuelWarning();
        game.hasPlayedFuelWarning = true;
    } else if (game.stats.fuel> game.FUEL_WARNING_THRESHOLD) {
        game.hasPlayedFuelWarning = false;
    }

    // HUD fuel alert when below 30%
    try {
        if (game.stats.fuel <= 30) {
            HUD.showFuelAlert();
            const pctEl = document.getElementById('fuelPercent');
            if (pctEl) pctEl.textContent = `${Math.max(0, Math.round(game.stats.fuel))}%`;
            // update fuel bar color
            const bar = document.getElementById('fuelBar');
            if (bar) {
                bar.classList.remove('medium');
                bar.classList.add('low');
            }
        } else {
            HUD.hideFuelAlert();
            const bar = document.getElementById('fuelBar');
            if (bar) {
                bar.classList.remove('low');
                if (game.stats.fuel <= 60) bar.classList.add('medium');
                else bar.classList.remove('medium');
            }
        }
    } catch (e) {}
    
}

export function handleGroundCollision(game) {
    // Prevent multiple crash triggers
    if (game._isCrashing) return;
    
    if (game.hasTakenOff && game.plane.position.y <= game.CRASH_THRESHOLD) {
        game._isCrashing = true;
        
        // STOP the plane immediately - freeze position and physics
        game.plane.position.y = game.CRASH_THRESHOLD; // Lock plane at crash height
        game.verticalVelocity = 0; // Stop falling
        game.forwardSpeed = 0; // Stop forward movement
        
        // Trigger explosion at plane's position
        triggerExplosion(game.plane.position.clone());
        
        game.music.playCrash();
        
        // Delay game over to let explosion play (2 seconds to see explosion start clearly)
        setTimeout(() => {
            gameOver(game);
            game._isCrashing = false;
        }, 2000); // Increased from 500ms to 2000ms
    }
}

// Give graded warnings when the plane is descending quickly. Uses verticalVelocity and
// a short cooldown to avoid spamming messages every frame.
export function handleDescentWarnings(game) {
    try {
        const now = Date.now();
        if (!game._lastDescentWarningTime) game._lastDescentWarningTime = 0;

        // Only warn every 1200ms at most
        if (now - game._lastDescentWarningTime < 1200) return;

        const v = game.verticalVelocity || 0; // negative = descending
        const gravityStrength = Math.abs(game.gravity || 0);

        // Critical rapid descent
        if (v < -0.9) {
            HUD.showTip('CRITICAL: Rapid descent — PULL UP NOW!', 1800);
            // Also flash low-altitude HUD if close to ground
            if (game.plane.position.y < 50) HUD.showLowAltitude();
            game._lastDescentWarningTime = now;
            return;
        }

        // Heavy descent
        if (v < -0.45) {
            HUD.showTip('Heavy descent detected — descend carefully and trim up.', 1600);
            game._lastDescentWarningTime = now;
            return;
        }

        // Moderate descent — friendly reminder
        if (v < -0.18) {
            HUD.showTip('Descent rate increasing. Ease the nose up to stabilize.', 1400);
            game._lastDescentWarningTime = now;
            return;
        }

        // Optional gravity strength hint (only show once if gravity is unusually high)
        if (!game._gravityHintShown && gravityStrength > 0.02) {
            HUD.showTip('Gravity is strong on this route — descend carefully.', 2400);
            game._gravityHintShown = true;
            game._lastDescentWarningTime = now;
        }
    } catch (e) {
        // ignore when HUD not available
    }
}

// Show warnings as the plane gets physically close to the ground (proximity warnings).
export function handleProximityWarnings(game) {
    try {
        const now = Date.now();
        if (!game._lastProximityWarningTime) game._lastProximityWarningTime = 0;
        // throttle to once per 900ms
        if (now - game._lastProximityWarningTime < 900) return;

        const y = game.plane.position.y;
        if (!game.hasTakenOff) return; // only warn after takeoff

        // Critical: almost at crash threshold but not yet crashed
        if (y <= (game.CRASH_THRESHOLD + 1.5) && y > game.CRASH_THRESHOLD) {
            HUD.showTip('IMMINENT COLLISION — PULL UP NOW!', 1600);
            HUD.showLowAltitude();
            game._lastProximityWarningTime = now;
            return;
        }

        // Very low altitude
        if (y <= 5) {
            HUD.showTip('Too low! Pull up immediately or you will crash.', 1400);
            HUD.showLowAltitude();
            game._lastProximityWarningTime = now;
            return;
        }

        // Low altitude — warn the player
        if (y <= 20) {
            HUD.showTip('Warning: Low altitude. Ease off descent and gain lift.', 1200);
            game._lastProximityWarningTime = now;
            return;
        }

        // Cautionary reminder for early low altitudes
        if (y <= 50) {
            HUD.showTip('Altitude dropping — monitor your height.', 1000);
            game._lastProximityWarningTime = now;
            return;
        }
    } catch (e) {
        // ignore when HUD not available
    }
}

export function checkGroundCollision(game) {
        const planeY = game.plane.position.y;

        // Check if plane has taken off (reached sufficient height)
        if (!game.hasTakenOff && planeY > game.TAKEOFF_HEIGHT_THRESHOLD) {
            game.hasTakenOff = true;
            
        }

        // Prevent multiple crash triggers
        if (game._isCrashing) return false;

        // Check for ground collision after takeoff (use crash threshold for more realistic detection)
        if (game.hasTakenOff && planeY <= game.CRASH_THRESHOLD) {
            game._isCrashing = true;
            
            // STOP the plane immediately - freeze position and physics
            game.plane.position.y = game.CRASH_THRESHOLD; // Lock plane at crash height
            game.verticalVelocity = 0; // Stop falling
            game.forwardSpeed = 0; // Stop forward movement
            
            // Trigger explosion at plane's position
            triggerExplosion(game.plane.position.clone());
            
            // Play crash sound immediately
            game.music.playCrash();
            
            // Delay game over to let explosion play (2 seconds to see explosion start clearly)
            setTimeout(() => {
                gameOver(game);
                game._isCrashing = false;
            }, 2000); // Increased from 500ms to 2000ms
            
            return true; // Collision detected
        }

        return false; // No collision
    }