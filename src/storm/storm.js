// storm.js
// Realistic storm zone environment: dark storm clouds, lightning flashes, rain particles, fog modulation, collision => game over.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const STORM_CONFIG = {
  cloudCount: 60,
  radiusMin: 200,
  radiusMax: 550,
  minHeight: 40,
  maxHeight: 140,
  stormThickness: 180,
  baseOpacity: 0.65,
  darkColorA: new THREE.Color('#2e3138'),
  darkColorB: new THREE.Color('#3d4250'),
  violetTint: new THREE.Color('#5d5b78'),
  lightningIntervalMin: 4,
  lightningIntervalMax: 10,
  lightningFlashDuration: 0.35,
  lightningIntensity: 6.5,
  lightningAmbientBoost: 0.35,
  rainParticleCount: 2500,
  rainAreaSize: 600,
  rainSpeed: 65,
  rainTilt: 0.35,
  rainOpacity: 0.55,
  fogBaseDensity: 0.0012,
  fogStormDensity: 0.0022,
  collisionRadius: 35, // per storm cloud cluster (approx)
  // Assets
  cloudGlb: 'assets/models/cloud2bckup.glb',
  lightningGlb: 'assets/models/lightning.glb',
};

function randomInRange(a, b) { return THREE.MathUtils.randFloat(a, b); }

function createStormCloudMaterial() {
  const mat = new THREE.MeshStandardMaterial({
    color: STORM_CONFIG.darkColorA.clone().lerp(STORM_CONFIG.darkColorB, Math.random()),
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: STORM_CONFIG.baseOpacity * THREE.MathUtils.randFloat(0.6, 1.0),
    depthWrite: false,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0.0,
    fog: true,
  });
  return mat;
}

function createProceduralFallbackCluster() { // kept as fallback
  const group = new THREE.Group();
  group.userData.isStormCloud = true;
  group.userData.baseOpacity = STORM_CONFIG.baseOpacity;
  group.userData.flashFactor = 0;
  const puffCount = THREE.MathUtils.randInt(8, 14);
  for (let i = 0; i < puffCount; i++) {
    const radius = THREE.MathUtils.randFloat(15, 36);
    const geo = new THREE.SphereGeometry(radius, 12, 10);
    const mat = createStormCloudMaterial();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      THREE.MathUtils.randFloatSpread(50),
      THREE.MathUtils.randFloatSpread(24),
      THREE.MathUtils.randFloatSpread(50)
    );
    mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    mesh.scale.setScalar(THREE.MathUtils.randFloat(0.7, 1.2));
    group.add(mesh);
  }
  group.userData.boundingRadius = 50;
  return group;
}

function createRainSystem() {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(STORM_CONFIG.rainParticleCount * 3);
  const velocities = new Float32Array(STORM_CONFIG.rainParticleCount * 3);
  for (let i = 0; i < STORM_CONFIG.rainParticleCount; i++) {
    const idx = i * 3;
    positions[idx] = THREE.MathUtils.randFloatSpread(STORM_CONFIG.rainAreaSize);
    positions[idx + 1] = randomInRange(20, STORM_CONFIG.maxHeight + 80);
    positions[idx + 2] = THREE.MathUtils.randFloatSpread(STORM_CONFIG.rainAreaSize);
    velocities[idx] = -STORM_CONFIG.rainTilt; // x drift from wind
    velocities[idx + 1] = -1;                // downward
    velocities[idx + 2] = -0.4;              // z drift (towards camera/forward)
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xbfd6ff,
    size: 2.2,
    sizeAttenuation: true,
    transparent: true,
    opacity: STORM_CONFIG.rainOpacity,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.isRain = true;
  return points;
}

export function createStormEnvironment(scene, mainLight, ambientLight, fog) {
  const stormGroup = new THREE.Group();
  stormGroup.name = 'StormEnvironment';
  const gltfLoader = new GLTFLoader();
  let cloudModel = null;
  let lightningModel = null;
  // Create volumetric dark storm layer ring
  for (let i = 0; i < STORM_CONFIG.cloudCount; i++) {
    const cloud = createProceduralFallbackCluster();
    const angle = Math.random() * Math.PI * 2;
    const radius = randomInRange(STORM_CONFIG.radiusMin, STORM_CONFIG.radiusMax);
    cloud.position.set(
      Math.cos(angle) * radius,
      randomInRange(STORM_CONFIG.minHeight, STORM_CONFIG.maxHeight),
      Math.sin(angle) * radius
    );
    cloud.rotation.y = Math.random() * Math.PI * 2;
    const s = randomInRange(1.5, 2.8);
    cloud.scale.set(s, s * 0.9, s);
    stormGroup.add(cloud);
  }

  // Rain system (centered)
  const rain = createRainSystem();
  stormGroup.add(rain);

  // Lightning state
  const lightning = new THREE.Group();
  lightning.name = 'LightningContainer';
  stormGroup.add(lightning);
  let nextLightningTime = performance.now() * 0.001 + randomInRange(STORM_CONFIG.lightningIntervalMin, STORM_CONFIG.lightningIntervalMax);
  let lightningActive = false;
  let lightningStart = 0;

  // A helper plane for glow flashes (optional subtle glow)
  const glowPlaneGeo = new THREE.PlaneGeometry(400, 400);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x99bbff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowPlane = new THREE.Mesh(glowPlaneGeo, glowMat);
  glowPlane.rotation.x = -Math.PI/2;
  glowPlane.position.y = STORM_CONFIG.minHeight - 5;
  stormGroup.add(glowPlane);

  scene.add(stormGroup);

  const originalLightIntensity = mainLight.intensity;
  const originalAmbient = ambientLight.intensity;
  const baseFogDensity = fog ? fog.density : STORM_CONFIG.fogBaseDensity;

  function triggerLightning() {
    lightningActive = true;
    lightningStart = performance.now() * 0.001;
    nextLightningTime = lightningStart + randomInRange(STORM_CONFIG.lightningIntervalMin, STORM_CONFIG.lightningIntervalMax);

    // Choose a few random storm clouds to flash
    for (let i = 0; i < 5; i++) {
      const cloud = stormGroup.children[THREE.MathUtils.randInt(0, STORM_CONFIG.cloudCount - 1)];
      if (!cloud || !cloud.userData.isStormCloud) continue;
      cloud.traverse(obj => {
        if (obj.isMesh && obj.material) {
          obj.material.emissive = new THREE.Color(0xffffff);
          obj.material.emissiveIntensity = 0.0; // will ramp
        }
      });
      cloud.userData.flashFactor = 1; // used to ramp emissive
    }

    // Spawn lightning bolt model clones if available
    if (lightningModel) {
      // Clear old
      while (lightning.children.length) lightning.remove(lightning.children[0]);
      const bolts = THREE.MathUtils.randInt(1, 3);
      for (let b = 0; b < bolts; b++) {
        const bolt = lightningModel.clone(true);
        const targetCloud = stormGroup.children[THREE.MathUtils.randInt(0, STORM_CONFIG.cloudCount - 1)];
        if (targetCloud) {
          bolt.position.copy(targetCloud.position);
          bolt.position.x += THREE.MathUtils.randFloatSpread(25);
          bolt.position.z += THREE.MathUtils.randFloatSpread(25);
          bolt.position.y += 20 + Math.random()*30;
        }
        const scale = THREE.MathUtils.randFloat(4, 8);
        bolt.scale.setScalar(scale);
        bolt.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveIntensity = 2.5; o.material.transparent = true; o.material.opacity = 0.0; } });
        lightning.add(bolt);
      }
    }
  }

  function updateLightning(time) {
    if (time >= nextLightningTime && !lightningActive) {
      triggerLightning();
    }
    if (lightningActive) {
      const elapsed = time - lightningStart;
      const t = elapsed / STORM_CONFIG.lightningFlashDuration;
      const flashPhase = Math.sin(t * Math.PI);
      const intensity = flashPhase * STORM_CONFIG.lightningIntensity;
      mainLight.intensity = originalLightIntensity + intensity;
      ambientLight.intensity = originalAmbient + flashPhase * STORM_CONFIG.lightningAmbientBoost;
      glowPlane.material.opacity = flashPhase * 0.35;
      if (fog) fog.density = THREE.MathUtils.lerp(baseFogDensity, STORM_CONFIG.fogStormDensity, flashPhase * 0.7);

      // Update flashing clouds emissive & fade in/out lightning bolts
      stormGroup.children.forEach(c => {
        if (c.userData && c.userData.isStormCloud && c.userData.flashFactor > 0) {
          c.traverse(o => {
            if (o.isMesh && o.material && o.material.emissive) {
              o.material.emissiveIntensity = flashPhase * 2.5;
              o.material.emissive.setRGB(1, 1, 1);
            }
          });
        }
      });
      lightning.children.forEach(bolt => {
        bolt.traverse(o => {
          if (o.isMesh && o.material) {
            o.material.opacity = flashPhase; // simple alpha flash
          }
        });
      });

      if (elapsed > STORM_CONFIG.lightningFlashDuration) {
        lightningActive = false;
        stormGroup.children.forEach(c => { if (c.userData) c.userData.flashFactor = 0; });
        mainLight.intensity = originalLightIntensity;
        ambientLight.intensity = originalAmbient * 0.6; // keep ambience slightly darker than original
        glowPlane.material.opacity = 0;
        if (fog) fog.density = STORM_CONFIG.fogStormDensity * 0.9; // retain heavier fog after flash
        // Clear lightning models after flash
        while (lightning.children.length) lightning.remove(lightning.children[0]);
      }
    }
  }

  function updateRain(delta, plane) {
    const positions = rain.geometry.getAttribute('position');
    const velocities = rain.geometry.getAttribute('velocity');
    for (let i = 0; i < STORM_CONFIG.rainParticleCount; i++) {
      const idx = i * 3;
      positions.array[idx] += velocities.array[idx] * STORM_CONFIG.rainSpeed * delta;      // x
      positions.array[idx + 1] += velocities.array[idx + 1] * STORM_CONFIG.rainSpeed * delta; // y
      positions.array[idx + 2] += velocities.array[idx + 2] * STORM_CONFIG.rainSpeed * delta; // z

      // recycle if below plane or too low
      if (positions.array[idx + 1] < 0) {
        positions.array[idx] = plane.position.x + THREE.MathUtils.randFloatSpread(STORM_CONFIG.rainAreaSize);
        positions.array[idx + 1] = plane.position.y + randomInRange(60, 120);
        positions.array[idx + 2] = plane.position.z + THREE.MathUtils.randFloatSpread(STORM_CONFIG.rainAreaSize);
      }
    }
    positions.needsUpdate = true;
  }

  function checkCollisions(plane, onHit) {
    const planePos = plane.position;
    for (const child of stormGroup.children) {
      if (!child.userData || !child.userData.isStormCloud) continue;
      const dist = planePos.distanceTo(child.position);
      if (dist < child.userData.boundingRadius || dist < STORM_CONFIG.collisionRadius) {
        onHit();
        return;
      }
    }
  }

  function updateStorm(delta, plane, onCollisionGameOver) {
    const time = performance.now() * 0.001;
    updateLightning(time);
    updateRain(delta, plane);
    // Slight turbulent vertical wobble
    stormGroup.children.forEach(c => {
      if (c.userData && c.userData.isStormCloud) {
        c.position.y += Math.sin((time + c.id) * 0.2) * 0.05;
      }
    });
    // Collision
    checkCollisions(plane, onCollisionGameOver);
  }

  // === Load GLB Assets ===
  gltfLoader.load(
    STORM_CONFIG.cloudGlb,
    (gltf) => {
      cloudModel = gltf.scene;
      // Replace procedural fallback clouds
      stormGroup.children.forEach(child => {
        if (!child.userData || !child.userData.isStormCloud) return;
        // remove previous geometry
        while (child.children.length) child.remove(child.children[0]);
        const clone = cloudModel.clone(true);
        // Adjust materials to storm palette
        clone.traverse(o => {
          if (o.isMesh) {
            o.material = o.material.clone();
            o.material.color.lerp(STORM_CONFIG.violetTint, 0.25);
            o.material.transparent = true;
            o.material.opacity = child.userData.baseOpacity * THREE.MathUtils.randFloat(0.7, 1.1);
            o.material.depthWrite = false;
            if (!o.material.emissive) o.material.emissive = new THREE.Color(0x000000);
            o.material.emissiveIntensity = 0.0;
            o.material.fog = true;
          }
        });
        const scaleMul = THREE.MathUtils.randFloat(2.2, 3.6);
        clone.scale.multiplyScalar(scaleMul);
        child.add(clone);
        child.userData.boundingRadius = 70 * scaleMul * 0.4; // approximate
      });
      console.log('🌩️ Storm clouds GLB applied');
    },
    undefined,
    (e) => console.warn('Failed to load storm cloud GLB', e)
  );

  gltfLoader.load(
    STORM_CONFIG.lightningGlb,
    (gltf) => {
      lightningModel = gltf.scene;
      lightningModel.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.emissive = new THREE.Color(0xffffff); o.material.emissiveIntensity = 3.5; o.material.transparent = true; } });
      console.log('⚡ Lightning GLB loaded');
    },
    undefined,
    (e) => console.warn('Failed to load lightning GLB', e)
  );

  return { stormGroup, updateStorm };
}
