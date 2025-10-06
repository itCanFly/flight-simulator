// game.js
import * as THREE from 'three';
import { createPlane } from './plane.js';
import { applyTurbulence,shakeCamera } from './physics.js';
import { createClouds, updateClouds } from './clouds/clouds.js';
import { startStatsLoop, stopStatsLoop , resetStatsLoop,getFormatted } from './scene/stats.js';

export class Game {
    constructor(containerId) {
        // -----------------
        // Core Game State
        // -----------------
        this.state = 'MENU';
        this.level = 1;
        this.score = 0;
        this.listeners = [];

        // Movement variables
        this.verticalVelocity = 0;
        this.gravity = -0.005;
        this.liftStrength = 0.007;
        this.forwardSpeed = 1.9;

        // Stats
        this.stats={
            speed : 90,
            fuel : 100,
            timeElapsed : 0,
        }

        this.statsInterval = null;

        // Control keys
        this.keys = {
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // Clock for delta time
        this.clock = new THREE.Clock();

        // -----------------
        // Scene Setup
        // -----------------
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x88ccee, 0.0012);

        // 🌞 Directional sunlight setup
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.sunLight.position.set(100, 200, 100);
        this.sunLight.castShadow = true;

        // Configure shadow quality
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -200;
        this.sunLight.shadow.camera.right = 200;
        this.sunLight.shadow.camera.top = 200;
        this.sunLight.shadow.camera.bottom = -200;

        this.scene.add(this.sunLight);

        this.ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambient);

        this.gridHelper = new THREE.GridHelper(3000, 500);
        this.scene.add(this.gridHelper);

        this.groundColor = new THREE.Color(0xff0000);
        this.airColor = new THREE.Color(0xffffff);

        this.camera = new THREE.PerspectiveCamera(100,window.innerWidth / window.innerHeight,0.1,3000);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x88ccee);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // smoother shadows
        document.getElementById(containerId).appendChild(this.renderer.domElement);

        // -----------------
        // Plane Setup
        // -----------------
        this.plane = createPlane();
        this.scene.add(this.plane);

        // ☁️ Add volumetric-looking clouds with sunlight integration
        this.cloudGroup = createClouds(this.scene, this.sunLight);

        // Camera initial pos
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(this.plane.position);

        // -----------------
        // Controls & Resize
        // -----------------
        this._setupControls();
        window.addEventListener('resize', () => this._onResize());

        // Animation
        this.isAnimating = false;
    }
    // Stats Handling
    // -----------------
    startStats() {
        startStatsLoop(this.stats, this.statsInterval, () => this.notify(),() => this.gameOver() );
    }

    stopStats() {
        stopStatsLoop(this.statsInterval);
    }

    resetStats() {
        resetStatsLoop(this.stats,this.forwardSpeed);
    }

    getFormattedTime() {
        getFormatted(this.stats);
    }
    // -----------------
    // Listener System
    // -----------------
    onChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }

    // -----------------
    // Game Flow
    // -----------------
    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.verticalVelocity = 0;
        this.resetPosition();
        this.resetStats();

        this.isAnimating = true;
        this.animate();
        this.startStats();
        this.notify();
    }
    gameOver() {
        this.state = 'GAME_OVER';
        this.isAnimating = false;
        this.stopStats();
        this.resetPosition();
        this.notify();
    }
    win() {
        this.state = 'WIN';
        this.isAnimating = false;
        this.stopStats();
        this.resetPosition();
        this.notify();
    }

    lose() {
        this.state = 'LOSE';
        this.isAnimating = false;
        this.stopStats();
        this.resetPosition();
        this.notify();
    }

    resume() {
        if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.isAnimating = true;
            this.animate();     
            this.startStats();  
            this.notify();      
        }
    }

    changeState() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.isAnimating = false;
            this.stopStats();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.isAnimating = true;
            this.animate();
            this.startStats();
        }
        this.notify();
    }


    resetPosition() {
        this.plane.position.set(0, 5, 0);
        this.plane.rotation.set(0, 0, 0);
        this.verticalVelocity = 0;
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(this.plane.position);
    }
    // -----------------
    // Controls Handling
    // -----------------
    _setupControls() {
        window.addEventListener("keydown", (e) => {
            if (e.code in this.keys) this.keys[e.code] = true;
        });
        window.addEventListener("keyup", (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
                this.stats.fuel=this.stats.fuel -1;
            }
        });
    }

    _updateControls() {
        if (this.state !== 'PLAYING') return;

        if (this.keys.ArrowUp) this.verticalVelocity += this.liftStrength;
        this.verticalVelocity += this.gravity;

        this.plane.position.y += this.verticalVelocity;
        this.plane.translateZ(this.forwardSpeed);
  
        if(this.plane.position.z>=1500){
            this.win();
        }
        if (this.keys.ArrowLeft) this.plane.rotation.y += 0.004;
        if (this.keys.ArrowRight) this.plane.rotation.y -= 0.004;

        if (this.plane.position.y < 1) {
            this.plane.position.y = 1;
            this.verticalVelocity = 0;
        }
    }

    // -----------------
    // Animation Loop
    // -----------------
    animate() {
        if (!this.isAnimating) return;
        requestAnimationFrame(() => this.animate());

        // Get delta time for smooth animations
        const deltaTime = this.clock.getDelta();

        this._updateControls();

        // Update moving clouds with fade animations
        updateClouds(this.cloudGroup, this.plane, this.camera, deltaTime);
        // Update storm system (disabled)
        // if (this.updateStorm) this.updateStorm(deltaTime);


        const targetColor = (this.plane.position.y <= 1.01) ? this.groundColor : this.airColor;
        this.gridHelper.material.color.lerp(targetColor, 0.05);

        this.camera.position.x = this.plane.position.x - 5 * Math.sin(this.plane.rotation.y);
        this.camera.position.z = this.plane.position.z - 5 * Math.cos(this.plane.rotation.y);
        this.camera.position.y = this.plane.position.y + 6;
        
        this.camera.lookAt(this.plane.position);
        // shakeCamera(this.camera,0.25);
        this.renderer.render(this.scene, this.camera);
    }

    // -----------------
    // Resize Handling
    // -----------------
    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
