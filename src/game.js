// game.js
import * as THREE from 'three';
import { createPlane } from './plane.js';
import { applyTurbulence,shakeCamera } from './physics.js';
import { createClouds, updateClouds } from './clouds/clouds.js';
import { startStatsLoop, stopStatsLoop , resetStatsLoop,getFormatted } from './scene/stats.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createCurvedArrow,createStraightArrow } from './arrow.js';

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
        this.forwardSpeed = 0.5;
        this.targetForwardSpeed = 0.5;
        this.minForwardSpeed = 0.1;
        this.speedAcceleration = 0.005;

        // Waypoint System
        this.waypoints = [
            new THREE.Vector3(1800, 0.995, -800),
            new THREE.Vector3(1742, 92, -236),
            new THREE.Vector3(-125.611, 365.464, -558.506),
            new THREE.Vector3(-1706.841, 294.921, -2033.331)
        ];
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

        // Control keys
        this.keys = {
            ArrowUp: false,
            ArrowLeft: false,
            ArrowRight: false,
        };

        // Clock for delta time
        this.clock = new THREE.Clock();

        // Scene Setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x88ccee, 0.0012);

        //  Directional sunlight setup
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

        this.gridHelper = new THREE.GridHelper(3000, 500);
        this.scene.add(this.gridHelper);

        this.groundColor = new THREE.Color(0xff0000);
        this.airColor = new THREE.Color(0xffffff);

        // Ambient light for soft fill
        this.ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.ambient);

        // Ground model 
        this.ground = null;
        this._loadGroundModel();

        this.camera = new THREE.PerspectiveCamera(100,window.innerWidth / window.innerHeight,0.1,3000);

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x88ccee);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // smoother shadows
        document.getElementById(containerId).appendChild(this.renderer.domElement);

        // Plane Setup
        this.plane = createPlane();
        this.scene.add(this.plane);

        this.cloudGroup = createClouds(this.scene, this.sunLight);

        // Create rotating circle
        this._createRotatingCircle();

        // Camera initial pos
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(this.plane.position);

        // -----------------
        // Controls & Resize
        // -----------------
        this._setupControls();
        window.addEventListener('resize', () => this._onResize());
        
        // Initialize arrows
        this._createArrows();

        // Animation
        this.isAnimating = false;
    }

    // Create rotating circle at waypoint position
    _createRotatingCircle() {
        const geo = new THREE.TorusGeometry(30, 3, 16, 100);
        const mat = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x0088ff,
            shininess: 100,
            specular: 0xffffff
        });
        this.rotatingCircle = new THREE.Mesh(geo, mat);
        
        // Position at the final waypoint
        const finalWaypoint = this.waypoints[this.waypoints.length - 1];
        this.rotatingCircle.position.copy(finalWaypoint);
        
        // Rotate to face sideways (normal at 90 degrees)
        this.rotatingCircle.rotation.x = Math.PI / 2;
        
        this.scene.add(this.rotatingCircle);
    }

    // Create arrows between waypoints
    _createArrows() {
        // Clear existing arrows
        this.arrows.forEach(arrow => this.scene.remove(arrow));
        this.arrows = [];

        // Create arrows between consecutive waypoints
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const start = this.waypoints[i];
            const end = this.waypoints[i + 1];
            
            // You can choose between straight or curved arrows
            const arrow = createStraightArrow(start, end);
            this.arrows.push(arrow);
            this.scene.add(arrow);
        }
    }

    // Check if plane reached current waypoint
    _checkWaypointReached() {
        if (this.currentWaypointIndex >= this.waypoints.length) return;

        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        const distance = this.plane.position.distanceTo(targetWaypoint);

        // Check if reached current waypoint
        if (distance < this.waypointReachDistance) {
            console.log(`Reached waypoint ${this.currentWaypointIndex + 1}`);
            
            // Move to next waypoint
            this.currentWaypointIndex++;
            
            // Check if reached final destination
            if (this.currentWaypointIndex >= this.waypoints.length) {
                console.log("Reached destination!");
                this.win();
            } else {
                // Optional: Remove the arrow we just passed
                if (this.currentWaypointIndex - 1 < this.arrows.length) {
                    const passedArrow = this.arrows[this.currentWaypointIndex - 1];
                    this.scene.remove(passedArrow);
                }
            }
        }
    }

    // Get direction to current waypoint (for optional guidance)
    _getDirectionToWaypoint() {
        if (this.currentWaypointIndex >= this.waypoints.length) return null;

        const targetWaypoint = this.waypoints[this.currentWaypointIndex];
        const direction = new THREE.Vector3()
            .subVectors(targetWaypoint, this.plane.position)
            .normalize();
        
        return direction;
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
    // Listener System
    onChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this));
    }
    // Game Flow
    start() {
        this.state = 'PLAYING';
        this.score = 0;
        this.verticalVelocity = 0;
        this.forwardSpeed = this.minForwardSpeed; 
        this.currentWaypointIndex = 0;
        this._createArrows(); 

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
        this.plane.position.set(1800, 1, -910);
        this.plane.rotation.set(0, 0, 0);
        this.verticalVelocity = 0;
        this.camera.position.set(0, 8, 8);
        this.camera.lookAt(this.plane.position);
    }
    // Controls Handling
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

        // Gradually increase forward speed to target speed
        if (this.forwardSpeed < this.targetForwardSpeed) {
            this.forwardSpeed += this.speedAcceleration;
            if (this.forwardSpeed > this.targetForwardSpeed) {
                this.forwardSpeed = this.targetForwardSpeed;
            }
        }

        if (this.keys.ArrowUp) {
            this.verticalVelocity += this.liftStrength;
            if(this.plane.rotation.x>-0.3){
                this.plane.rotation.x -= 0.0003;
            }
        }
        this.verticalVelocity += this.gravity;

        this.plane.position.y += this.verticalVelocity;
        this.plane.translateZ(this.forwardSpeed);

        // Check waypoint progress
        this._checkWaypointReached();

        console.log("Position x = ",this.plane.position.x);
        console.log("Position y = ",this.plane.position.y);
        console.log("Position z = ",this.plane.position.z);
        console.log("Current waypoint:", this.currentWaypointIndex + 1, "/", this.waypoints.length);

        if (this.keys.ArrowLeft) {
            this.plane.rotation.y += 0.009;
            if(this.plane.rotation.z>-0.12){
                this.plane.rotation.z -= 0.003;
            }
        }
        if (this.keys.ArrowRight) {
            this.plane.rotation.y -= 0.009;
            if(this.plane.rotation.z<0.12){
                this.plane.rotation.z += 0.003;
            }
        }

        if (this.plane.position.y < 1) {
            this.plane.position.y = 1;
            this.verticalVelocity = 0;
        }
        if (this.plane.rotation.z<0){
            this.plane.rotation.z+=0.0015;
        }
        else if (this.plane.rotation.z>0){
            this.plane.rotation.z-=0.0015;
        }
        if(this.plane.rotation.x<0){
            this.plane.rotation.x+=0.0015;
        }
        else if(this.plane.rotation.x>0){
            this.plane.rotation.x-=0.0015;
        }
    }
    // Animation Loop
    animate() {
        if (!this.isAnimating) return;
        requestAnimationFrame(() => this.animate());

        // Get delta time for smooth animations
        const deltaTime = this.clock.getDelta();

        this._updateControls();

        // Update moving clouds with fade animations
        updateClouds(this.cloudGroup, this.plane, this.camera, deltaTime);

        // Rotate the circle
        if (this.rotatingCircle) {
            this.rotatingCircle.rotation.z += 0.02;
        }

        this.camera.position.x = this.plane.position.x - 5 * Math.sin(this.plane.rotation.y);
        this.camera.position.z = this.plane.position.z - 5 * Math.cos(this.plane.rotation.y);
        this.camera.position.y = this.plane.position.y + 6;
        
        this.camera.lookAt(this.plane.position);
        // shakeCamera(this.camera,0.25);
        this.renderer.render(this.scene, this.camera);
    }
    // Resize Handling
    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Load Ground Model 
    _loadGroundModel(){
        const loader = new GLTFLoader();
        loader.load(
            '/assets/models/ground_plane.glb',
            (gltf) => {
                const model = gltf.scene;
                model.traverse(obj => {
                    if (obj.isMesh) {
                        obj.castShadow = false;
                        obj.receiveShadow = true;
                        if (obj.material) obj.material.depthWrite = true;
                    }
                });
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                const center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                model.position.x -= center.x;
                model.position.z -= center.z;
                model.position.y -= box.min.y; // place lowest at y=0
                const targetExtent = 3000;
                if (size.x < targetExtent * 0.2) {
                    const uniformScale = targetExtent / Math.max(size.x, size.z);
                    model.scale.setScalar(uniformScale);
                }
                this.ground = model;
                this.scene.add(model);
            },
            undefined,
            (error) => console.error('Error loading ground_plane.glb', error)
        );
    }
}