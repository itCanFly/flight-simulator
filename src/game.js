// game.js
import * as THREE from 'three';
import { createPlane } from './plane.js';
import { createClouds} from './clouds/clouds.js';
import { getFormatted } from './scene/stats.js';
import { setupScene, setupLighting, setupRenderer, setupCamera } from './scene/setup.js';
import { createRotatingCircle, createArrows } from './scene/waypoints.js';
import { Music } from './audio/Music.js';
import { setupControls } from './controls/controls.js';

export class Game {
    constructor(containerId) {
        // -----------------
        // Core Game State
        // -----------------
        this.state = 'MENU';
        this.level = 1;
        this.score = 0;
        this.listeners = [];

        this.verticalVelocity = 0;
        this.gravity = -0.005;
        this.liftStrength = 0.007;
        this.forwardSpeed = 0.9;
        
        this.minForwardSpeed = 0.6;
        this.speedAcceleration = 0.005;

        this.currentWaypointIndex = 0;

        this.waypointReachDistance = 50;
        this.destinationReachDistance = 30;
        
        this.arrows = [];

        // Rotating circle
        this.rotatingCircle = null;

        // Stats
        this.stats={
            speed : 90,
            fuel : 100,
            timeElapsed : 0,
        }

        this.statsInterval = null;

        // Altitude warning system
        // this.ALTITUDE_WARNING_THRESHOLD = 700; // Warning when getting too high
        this.ALTITUDE_GAME_OVER_THRESHOLD = 900; // Game over threshold
        this.isAltitudeWarningActive = false;
        this.altitudeWarningElement = null;

        // Ground collision system
        this.TAKEOFF_HEIGHT_THRESHOLD = 5; // Height required to be considered "taken off"
        this.GROUND_LEVEL = 1; // Ground level Y position
        this.CRASH_THRESHOLD = 0.5; // Plane crashes when it hits close to ground level
        this.hasTakenOff = false;

        // Audio warning system
        this.FUEL_WARNING_THRESHOLD = 5; // Fuel percentage for warning
        this.hasPlayedFuelWarning = false;
        this.hasPlayedAltitudeWarning = false;

        // Control keys
        this.keys = {
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // Clock for delta time
        this.clock = new THREE.Clock();
        this.isAnimating = false;
        this.fuelCans = [];

        // Scene Setup
        this.scene = setupScene();
        this.sunLight = setupLighting(this.scene);
        this.renderer = setupRenderer(containerId);
        this.camera = setupCamera();
        this.scene.add(this.sunLight);

        // Plane Setup
        this.plane = createPlane();
        this.scene.add(this.plane);

        this.gridHelper = new THREE.GridHelper(3000, 500);
        this.scene.add(this.gridHelper);

        this.groundColor = new THREE.Color(0xff0000);
        this.airColor = new THREE.Color(0xffffff);

        // Ground model 
        this.ground = null;

        // Clouds & Arrows
        this.cloudGroup = createClouds(this.scene, this.sunLight);


        // Start with menu music
        this.music = new Music();
        this.music.playMenu();

        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(this.plane.position);

        // Initialize altitude warning system
       this.altitudeWarningElement = document.getElementById('altitudeWarning');

        // Controls
        setupControls(this);
        window.addEventListener('resize', () => this._onResize());
        
        // Initialize arrows
        this.arrows = createArrows(this.scene);
        // Create rotating circle
        this.rotatingCircle = createRotatingCircle(this.scene);
 
    }

    getFormattedTime() {
        getFormatted(this.stats);
    }
    // Listener System
    onChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    toggleCameraMode() {
        this.cameraMode = this.cameraMode === "thirdPerson" ? "topView" : "thirdPerson";
    }
    // Resize Handling
    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }


}