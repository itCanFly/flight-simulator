import { gameOver } from "../items/gameflow";

export function handleAltitude(game) {
            // Altitude warning system
    const ALTITUDE_WARNING_THRESHOLD = 700; // Warning when getting too high

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
    if (game.stats.fuel <= game.FUEL_WARNING_THRESHOLD && !game.hasPlayedFuelWarning) {
        game.music.playFuelWarning();
        game.hasPlayedFuelWarning = true;
    }
    else if (game.stats.fuel> game.FUEL_WARNING_THRESHOLD) {
            // Reset the flag when fuel goes back above threshold
            game.hasPlayedFuelWarning = false;
    }
    
}

export function handleGroundCollision(game) {
    if (game.hasTakenOff && game.plane.position.y <= game.CRASH_THRESHOLD) {
        game.music.playCrash();
        gameOver(game);
    }
}

export function checkGroundCollision(game) {
        const planeY = game.plane.position.y;

        // Check if plane has taken off (reached sufficient height)
        if (!game.hasTakenOff && planeY > game.TAKEOFF_HEIGHT_THRESHOLD) {
            game.hasTakenOff = true;
            
        }

        // Check for ground collision after takeoff (use crash threshold for more realistic detection)
        if (game.hasTakenOff && planeY <= game.CRASH_THRESHOLD) {
            
            // Play crash sound immediately
            game.music.playCrash();
            gameOver(game);
            return true; // Collision detected
        }

        return false; // No collision
    }