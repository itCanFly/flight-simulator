import { checkWaypointReached } from "../scene/waypoints";
import { checkGroundCollision } from "../systems/safety";
import { HUD } from '../ui/hud.js';

export function setupControls(game) {
    game.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyW: false,
            KeyS: false,
        };
    game.cameraMode = "thirdPerson";

    window.addEventListener("keydown", (e) => {
        if (e.code in game.keys) {
            game.keys[e.code] = true;
            // If the controls hint is visible, hide it on first relevant input
            try {
                if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","KeyW","KeyS"].includes(e.code)) {
                    HUD.hideControlsHint();
                }
            } catch (err) {}
        }
        if (e.code === "KeyC") toggleCamera(game);
    });

    window.addEventListener("keyup", (e) => {
        if (e.code in game.keys) {
            game.keys[e.code] = false;
            game.stats.fuel -= 2;
        }
    });
}

export function updateControls(game) {
    if (game.state !== 'PLAYING'){
        game.music.stopMovementAudio();
         return;
    }
    // game.targetForwardSpeed = 1.0;
    const { keys } = game;

    const isMoving = keys.ArrowUp || keys.ArrowLeft || keys.ArrowRight || game.forwardSpeed > 0;

    const maxSpeed = 3.0;
    if (keys.KeyW) {
        game.targetForwardSpeed = Math.min(game.targetForwardSpeed + 0.02, maxSpeed);
    }
    if (keys.KeyS) {
        game.targetForwardSpeed = Math.max(game.targetForwardSpeed - 0.02, game.minForwardSpeed);
    }

    if (keys.ArrowUp) game.verticalVelocity += game.liftStrength;

    if (keys.ArrowDown){
        game.verticalVelocity-=0.5*game.liftStrength;
    }
    if (keys.ArrowLeft) {
        game.plane.rotation.y += 0.009;
        if(game.plane.rotation.z>-0.12){
            game.plane.rotation.z -= 0.003;
        }
    }
    if (keys.ArrowRight) {
        game.plane.rotation.y -= 0.009;
        if(game.plane.rotation.z<0.12){
            game.plane.rotation.z += 0.003;
        }
    }
    if (game.forwardSpeed < game.targetForwardSpeed) {
        game.forwardSpeed += game.speedAcceleration;
        if (game.forwardSpeed > game.targetForwardSpeed) {
            game.forwardSpeed = game.targetForwardSpeed;
        }
    } else if (game.forwardSpeed > game.targetForwardSpeed) {
        game.forwardSpeed -= game.speedAcceleration;
        if (game.forwardSpeed < game.targetForwardSpeed)
            game.forwardSpeed = game.targetForwardSpeed;
    }
    game.verticalVelocity += game.gravity;
    game.plane.position.y += game.verticalVelocity;
    game.plane.translateZ(game.forwardSpeed);

     // Waypoint check
    checkWaypointReached(game);
        // Ground collision
    const hasCollided = checkGroundCollision(game);

    // Ground constraint if needed
    if (!hasCollided && !game.hasTakenOff) {
        if (game.plane.position.y < game.GROUND_LEVEL) {
            game.plane.position.y = game.GROUND_LEVEL;
            game.verticalVelocity = 0;
        }
    }

    // Auto-leveling when not turning
    if (game.plane.rotation.z < 0) {
        game.plane.rotation.z += 0.0015;
    } else if (game.plane.rotation.z > 0) {
        game.plane.rotation.z -= 0.0015;
    }

    // Update movement audio
    game.music.updateMovementAudio(isMoving);
}

function toggleCamera(game) {
    game.cameraMode = game.cameraMode === "thirdPerson" ? "topView" : "thirdPerson";
}
