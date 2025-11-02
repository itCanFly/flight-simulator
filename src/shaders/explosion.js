// shaders/explosion.js
import * as THREE from 'three';

let scene, camera, renderer;
let fireMesh, groundMesh;
let explosionFrames = [];
let groundExplosionFrames = [];
let totalFrames = 60; // explosion0001.png to explosion0060.png
let totalGroundFrames = 100; // GroundExploded0001.png to GroundExploded0100.png
let allLoaded = false;
let groundLoaded = false;
let isExploding = false;
let startTime = 0;
const duration = 6000; // Increased from 5000ms to 6000ms (6 seconds)

// --------------------------
// SETUP
// --------------------------
export function setupExplosion(s, c, r) {
  scene = s;
  camera = c;
  renderer = r;

  const loader = new THREE.TextureLoader();
  const fireGeo = new THREE.PlaneGeometry(10, 10); // Reduced from 15x15 to 10x10 for more concentrated effect
  const groundGeo = new THREE.PlaneGeometry(12, 8); // Reduced from 20x12 to 12x8

  const fireMat = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false, // Always render on top
    side: THREE.DoubleSide, // Visible from both sides
    opacity: 1.0, // Full opacity - additive blending will make it bright
  });

  const groundMat = new THREE.MeshBasicMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false, // Always render on top
    opacity: 0.9, // Slightly less for ground
  });

  fireMesh = new THREE.Mesh(fireGeo, fireMat);
  groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.position.y = -2;
  groundMesh.rotation.x = -Math.PI / 2;

  // Set render order to ensure explosion renders on top
  fireMesh.renderOrder = 999;
  groundMesh.renderOrder = 998;

  fireMesh.visible = false;
  groundMesh.visible = false;
  scene.add(fireMesh);
  scene.add(groundMesh);

  preloadExplosionFrames(loader);
}

// --------------------------
// PRELOAD
// --------------------------
async function preloadExplosionFrames(loader) {
  const promises = [];

  // Explosion frames: explosion0001.png to explosion0060.png (60 files)
  for (let i = 1; i <= totalFrames; i++) {
    const num = i.toString().padStart(4, '0');
    const url = `public/assets/textures/Explosion 1/Explosion 1/explosion${num}.png`;
    promises.push(
      new Promise((resolve) => {
        loader.load(
          url,
          (tex) => {
            try {
              tex.colorSpace = THREE.SRGBColorSpace;
            } catch (e) {}
            explosionFrames[i - 1] = tex; // Store at index 0..59
            resolve();
          },
          undefined,
          (err) => {
            console.warn('Failed to load explosion frame', url, err);
            explosionFrames[i - 1] = null;
            resolve();
          }
        );
      })
    );
  }

  // Ground explosion frames: GroundExploded0001.png to GroundExploded0100.png (100 files)
  for (let i = 1; i <= totalGroundFrames; i++) {
    const num = i.toString().padStart(4, '0');
    const url = `public/assets/textures/Ground Exploded/Ground Exploded/GroundExploded${num}.png`;
    promises.push(
      new Promise((resolve) => {
        loader.load(
          url,
          (tex) => {
            try {
              tex.colorSpace = THREE.SRGBColorSpace;
            } catch (e) {}
            groundExplosionFrames[i - 1] = tex; // Store at index 0..99
            resolve();
          },
          undefined,
          (err) => {
            console.warn('Failed to load ground explosion frame', url, err);
            groundExplosionFrames[i - 1] = null;
            resolve();
          }
        );
      })
    );
  }

  await Promise.all(promises);
  allLoaded = true;
  groundLoaded = true;
  console.log('Explosion textures loaded.');
}

// --------------------------
// CONTROL FUNCTIONS
// --------------------------
export function triggerExplosion(position = new THREE.Vector3(0, 0, 0)) {
  if (!allLoaded || !groundLoaded || !fireMesh || !groundMesh) {
    console.warn('Explosion not ready - textures still loading');
    return;
  }

  // Position explosion at plane location
  fireMesh.position.copy(position);
  // Ground explosion slightly below
  groundMesh.position.set(position.x, 0.5, position.z); // Just above ground

  fireMesh.visible = true;
  groundMesh.visible = true;
  isExploding = true;
  startTime = performance.now();
  
  console.log('💥 Explosion triggered at:', position);
}

export function updateExplosion() {
  if (!isExploding) return;

  const t = (performance.now() - startTime) / duration;
  if (t >= 1) {
    isExploding = false;
    fireMesh.visible = false;
    groundMesh.visible = false;
    console.log('💥 Explosion complete');
    return;
  }

  const frameIndex = Math.floor(t * (totalFrames - 1));
  const groundFrameIndex = Math.floor(t * (totalGroundFrames - 1));

  const tex = explosionFrames[frameIndex];
  const groundTex = groundExplosionFrames[groundFrameIndex];
  
  if (tex) {
    fireMesh.material.map = tex;
    fireMesh.material.needsUpdate = true;
  } else if (frameIndex === 0) {
    console.warn('No texture loaded for frame', frameIndex);
  }
  
  if (groundTex) {
    groundMesh.material.map = groundTex;
    groundMesh.material.needsUpdate = true;
  }

  // Billboard effect - make explosion always face camera
  if (camera) {
    fireMesh.quaternion.copy(camera.quaternion);
  }

  // Scale animation - smaller and more concentrated
  const baseScale = 6; // Reduced from 10 to 6 for tighter explosion
  const pulseScale = 3; // Reduced from 5 to 3 for less expansion
  const scale = baseScale + Math.sin(t * Math.PI) * pulseScale;
  fireMesh.scale.setScalar(scale);
  
  // Ground explosion also smaller and tighter
  const gBaseScale = 1.8; // Reduced from 2.5
  const gPulse = 0.8; // Reduced from 1.2
  const gScale = gBaseScale + Math.sin(t * Math.PI) * gPulse;
  groundMesh.scale.set(gScale * 2.5, 1, gScale * 2); // Reduced multipliers from 3.5 and 2.5
  
  // Enhanced color/brightness for more vibrant effect
  const brightness = 1.0; // Keep constant for maximum visibility
  fireMesh.material.opacity = brightness;
  groundMesh.material.opacity = brightness * 0.85;
}

export function resetExplosion() {
  isExploding = false;
  if (fireMesh) fireMesh.visible = false;
  if (groundMesh) groundMesh.visible = false;
}