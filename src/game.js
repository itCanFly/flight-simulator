// game.js
import * as THREE from 'three';       // ✅ make sure THREE is imported here
import { createPlane } from './plane.js';

export class Game {
    constructor(containerId) {
        // -----------------
        // Core Game State
        // -----------------
        this.state = 'MENU';
        this.level = 1;
        this.score = 0;
        this.listeners = [];

        // Stats
        this.speed = 0;
        this.fuel = 100;
        this.timeElapsed = 0;
        this.statsInterval = null;

        // Movement variables
        this.verticalVelocity = 0;
        this.gravity = -0.0005;
        this.liftStrength = 0.002;
        this.forwardSpeed = 0.5;

        // Control keys
        this.keys = {
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // -----------------
        // Scene Setup
        // -----------------
        this.scene = new THREE.Scene();

        this.gridHelper = new THREE.GridHelper(2000, 500);
        this.scene.add(this.gridHelper);

        this.groundColor = new THREE.Color(0xff0000);
        this.airColor = new THREE.Color(0xffffff);

        this.camera = new THREE.PerspectiveCamera(
            100,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById(containerId).appendChild(this.renderer.domElement);

        // -----------------
        // Plane Setup
        // -----------------
        this.plane = createPlane();
        this.scene.add(this.plane);

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
        this.stopStats();
        this.statsInterval = setInterval(() => {
            if (this.fuel <= 0) {
                this.stopStats();
                this.gameOver();
                return;
            }
            this.speed = Math.min(this.speed, 500);
            this.fuel = Math.max(this.fuel, 0);
            this.timeElapsed++;
            this.notify();  // Let UI know stats changed
        }, 1000);
    }

    stopStats() {
        if (this.statsInterval) clearInterval(this.statsInterval);
        this.statsInterval = null;
    }
    resetStats() {
        this.speed = 0;
        this.fuel = 100;
        this.timeElapsed = 0;
    }
    getFormattedTime() {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    gameOver() {
        this.state = 'GAME_OVER';
        this.isAnimating = false;
        this.stopStats();
        this.resetPosition();
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
                this.fuel=this.fuel - 2;
            }
        });
    }

    _updateControls() {
        if (this.state !== 'PLAYING') return;

        if (this.keys.ArrowUp) this.verticalVelocity += this.liftStrength;
        this.verticalVelocity += this.gravity;

        this.plane.position.y += this.verticalVelocity;
        this.plane.translateZ(this.forwardSpeed);

        if (this.keys.ArrowLeft) this.plane.rotation.y += 0.009;
        if (this.keys.ArrowRight) this.plane.rotation.y -= 0.009;

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

        this._updateControls();

        const targetColor = (this.plane.position.y <= 1.01) ? this.groundColor : this.airColor;
        this.gridHelper.material.color.lerp(targetColor, 0.05);

        this.camera.position.x = this.plane.position.x - 5 * Math.sin(this.plane.rotation.y);
        this.camera.position.z = this.plane.position.z - 5 * Math.cos(this.plane.rotation.y);
        this.camera.position.y = this.plane.position.y + 6;
        this.camera.lookAt(this.plane.position);

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
