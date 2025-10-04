// clouds.js
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Enhanced Volumetric Cloud System with Advanced Lighting
 * Features:
 * - More 3D appearance using multiple layered spheres
 * - Infinite spawning ahead of camera
 * - Smooth fade in/out opacity animation
 * - Better distribution and variety
 * - Advanced lighting with sunlight interaction
 * - Realistic cloud coloring based on sun position
 */

// Path to the new GLB cloud asset (user mentioned new cloud.glb; actual file present is clouds.glb)
// If you rename the asset to cloud.glb just update this constant.
const CLOUD_GLB_PATH = 'assets/models/clouds.glb';

// Cloud configuration
const CLOUD_CONFIG = {
  count: 200,                    // Total number of cloud clusters
  spawnDistance: 1000,          // How far ahead to spawn clouds
  recycleDistance: 200,         // Distance behind camera to recycle
  fadeInDuration: 2.0,          // Seconds to fade in
  fadeOutDuration: 1.5,         // Seconds to fade out
  fadeOutDistance: 150,         // Start fading when this close to recycling
  minHeight: 15,
  maxHeight: 90,
  spreadX: 450,                 // Horizontal spread
  
  // Lighting properties
  sunColor: new THREE.Color(0xffddaa),       // Warm sunlight color
  ambientColor: new THREE.Color(0x87ceeb),   // Sky blue ambient
  baseCloudColor: new THREE.Color(0xffffff), // Base white
  emissiveIntensity: 0.2,                    // How much clouds glow
  ambientIntensity: 0.3,                     // Ambient light influence
  // Drift / motion
  driftSpeedMin: 0.2,
  driftSpeedMax: 0.6,
  verticalDriftScale: 0.15,
  noiseScale: 0.0003,
  // LOD distances
  lodNear: 0,           // full detail
  lodMid: 550,          // reduce lighting frequency
  lodFar: 850,          // stop lighting + lower opacity
  // Instanced far billboard layer
  farBillboardCount: 120,
};

/**
 * Creates a single 3D cloud cluster using multiple spheres
 * for a more volumetric appearance with advanced lighting
 */
function createCloudCluster(cloudTexture, directionalLight) {
  const cluster = new THREE.Group();
  
  // MORE spheres for fluffier, more 3D appearance
  const puffCount = THREE.MathUtils.randInt(15, 30);
  
  // Store fade properties and lighting info on the cluster
  cluster.userData = {
    fadeProgress: 0,          // 0 to 1 for fade in
    targetOpacity: THREE.MathUtils.randFloat(0.75, 0.95),
    isFadingOut: false,
    fadeOutProgress: 0,
    baseScale: THREE.MathUtils.randFloat(1.8, 3.5),
    directionalLight: directionalLight, // Store reference for lighting updates
    driftSeed: Math.random() * 1000,
    driftSpeed: THREE.MathUtils.randFloat(CLOUD_CONFIG.driftSpeedMin, CLOUD_CONFIG.driftSpeedMax),
    cachedMeshes: null, // will populate later when GLB replaces or for procedural
    lastLightUpdateTime: 0,
  };

  // Create a more organic, billowy cloud shape with layers
  // Layer 1: Core (larger spheres in center)
  const coreCount = Math.floor(puffCount * 0.4);
  for (let i = 0; i < coreCount; i++) {
    const radius = THREE.MathUtils.randFloat(15, 30); // Larger core
    const geometry = new THREE.SphereGeometry(radius, 16, 12); // Higher detail
    
    const material = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
      color: CLOUD_CONFIG.baseCloudColor,
      emissive: CLOUD_CONFIG.sunColor,
      emissiveIntensity: CLOUD_CONFIG.emissiveIntensity,
      fog: true, // Enable fog interaction
    });

    const puff = new THREE.Mesh(geometry, material);

    // Cluster core spheres closer together
    puff.position.set(
      THREE.MathUtils.randFloat(-15, 15),
      THREE.MathUtils.randFloat(-12, 12),
      THREE.MathUtils.randFloat(-15, 15)
    );
    
    puff.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scaleVariation = THREE.MathUtils.randFloat(0.8, 1.2);
    puff.scale.setScalar(scaleVariation);
    
    puff.castShadow = false;
    puff.receiveShadow = true;
    
    cluster.add(puff);
  }

  // Layer 2: Mid layer (medium spheres around core)
  const midCount = Math.floor(puffCount * 0.35);
  for (let i = 0; i < midCount; i++) {
    const radius = THREE.MathUtils.randFloat(10, 20);
    const geometry = new THREE.SphereGeometry(radius, 14, 10);
    
    const material = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
      color: CLOUD_CONFIG.baseCloudColor,
      emissive: CLOUD_CONFIG.sunColor,
      emissiveIntensity: CLOUD_CONFIG.emissiveIntensity * 1.1, // Slightly more glow
      fog: true,
    });

    const puff = new THREE.Mesh(geometry, material);

    // Spread around the core
    const angle = (i / midCount) * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(15, 30);
    
    puff.position.set(
      Math.cos(angle) * distance + THREE.MathUtils.randFloat(-10, 10),
      THREE.MathUtils.randFloat(-15, 15),
      Math.sin(angle) * distance + THREE.MathUtils.randFloat(-10, 10)
    );
    
    puff.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scaleVariation = THREE.MathUtils.randFloat(0.7, 1.4);
    puff.scale.setScalar(scaleVariation);
    
    puff.castShadow = false;
    puff.receiveShadow = true;
    
    cluster.add(puff);
  }

  // Layer 3: Outer wispy layer (smaller spheres for detail)
  const outerCount = puffCount - coreCount - midCount;
  for (let i = 0; i < outerCount; i++) {
    const radius = THREE.MathUtils.randFloat(5, 15);
    const geometry = new THREE.SphereGeometry(radius, 12, 8);
    
    const material = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
      side: THREE.DoubleSide,
      color: CLOUD_CONFIG.baseCloudColor,
      emissive: CLOUD_CONFIG.sunColor,
      emissiveIntensity: CLOUD_CONFIG.emissiveIntensity * 1.3, // Brighter edges catch sunlight
      fog: true,
    });

    const puff = new THREE.Mesh(geometry, material);

    // More scattered outer layer for fluffy edges
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(25, 45);
    
    puff.position.set(
      Math.cos(angle) * distance + THREE.MathUtils.randFloat(-12, 12),
      THREE.MathUtils.randFloat(-18, 18),
      Math.sin(angle) * distance + THREE.MathUtils.randFloat(-12, 12)
    );
    
    puff.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    const scaleVariation = THREE.MathUtils.randFloat(0.6, 1.5);
    puff.scale.setScalar(scaleVariation);
    
    puff.castShadow = false;
    puff.receiveShadow = true;
    
    cluster.add(puff);
  }

  return cluster;
}

/**
 * Positions a cloud cluster in front of the camera
 */
function positionCloudAhead(cloud, camera, distance) {
  // Get camera forward direction
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  
  // Position ahead of camera
  cloud.position.copy(camera.position);
  cloud.position.addScaledVector(forward, -distance);
  
  // Add random offset
  cloud.position.x += THREE.MathUtils.randFloatSpread(CLOUD_CONFIG.spreadX);
  cloud.position.y = THREE.MathUtils.randFloat(
    CLOUD_CONFIG.minHeight,
    CLOUD_CONFIG.maxHeight
  );
  
  // Random rotation
  cloud.rotation.y = Math.random() * Math.PI * 2;
  
  // Reset scale
  cloud.scale.setScalar(cloud.userData.baseScale);
  
  // Reset fade state
  cloud.userData.fadeProgress = 0;
  cloud.userData.isFadingOut = false;
  cloud.userData.fadeOutProgress = 0;
}

/**
 * Updates the opacity of all meshes in a cloud cluster
 */
function updateCloudOpacity(cloud, opacity) {
  cloud.traverse((obj) => {
    if (obj.isMesh && obj.material) {
      obj.material.opacity = opacity;
    }
  });
}

/**
 * Updates cloud lighting based on sun position and time of day
 * Creates realistic sunlit and shadowed areas on clouds
 */
function updateCloudLighting(cloud, directionalLight) {
  if (!directionalLight) return;

  const sunDirection = directionalLight.position.clone().normalize();
  const cloudToSun = sunDirection.clone().sub(cloud.position).normalize();
  const facingSun = Math.max(0, cloudToSun.dot(sunDirection));

  // Collect all descendant meshes so GLB clones also work
  // Use cached meshes if available (set after GLB replacement) otherwise traverse once and cache.
  if (!cloud.userData.cachedMeshes) {
    const collected = [];
    cloud.traverse(obj => { if (obj.isMesh && obj.material) collected.push(obj); });
    cloud.userData.cachedMeshes = collected;
  }
  const meshes = cloud.userData.cachedMeshes;
  const total = meshes.length || 1;

  meshes.forEach((puff, index) => {
    const puffWorldPos = new THREE.Vector3();
    puff.getWorldPosition(puffWorldPos);
    const puffToSun = sunDirection.clone().sub(puffWorldPos).normalize();
    const puffFacingSun = Math.max(0, puffToSun.dot(sunDirection));
    const sunInfluence = (facingSun * 0.7 + puffFacingSun * 0.3);
    const finalEmissive = CLOUD_CONFIG.sunColor.clone().lerp(
      CLOUD_CONFIG.ambientColor,
      1.0 - sunInfluence
    );
    puff.material.emissive?.copy(finalEmissive);
    const layerFactor = index / total;
    puff.material.emissiveIntensity = CLOUD_CONFIG.emissiveIntensity * (1.0 + layerFactor * 0.5) * (0.5 + sunInfluence * 0.5);
  });
}

/**
 * Creates the entire cloud system with advanced lighting
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.DirectionalLight} directionalLight - The main sun/directional light
 */
export function createClouds(scene, directionalLight = null) {
  const cloudGroup = new THREE.Group();
  const textureLoader = new THREE.TextureLoader();
  const gltfLoader = new GLTFLoader();
  let glbModel = null; // will hold loaded GLB root for cloning

  // Load cloud texture
  const cloudTexture = textureLoader.load(
    "assets/textures/cloud.png",
    undefined,
    undefined,
    () => console.warn("☁️ Could not load cloud texture — check path.")
  );
  
  cloudTexture.wrapS = THREE.RepeatWrapping;
  cloudTexture.wrapT = THREE.RepeatWrapping;

  // If no directional light provided, create a default one
  if (!directionalLight) {
    console.warn("⚠️ No directional light provided to clouds - creating default");
    directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(1, 1, 1);
  }

  // Create initial procedural placeholder clusters (will be replaced by GLB once loaded)
  for (let i = 0; i < CLOUD_CONFIG.count; i++) {
    const cluster = createCloudCluster(cloudTexture, directionalLight);
    const angle = Math.random() * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(200, CLOUD_CONFIG.spawnDistance);
    cluster.position.set(
      Math.cos(angle) * distance,
      THREE.MathUtils.randFloat(CLOUD_CONFIG.minHeight, CLOUD_CONFIG.maxHeight),
      Math.sin(angle) * distance
    );
    cluster.rotation.y = Math.random() * Math.PI * 2;
    cluster.scale.setScalar(cluster.userData.baseScale);
    cluster.userData.fadeProgress = 1.0;
    updateCloudOpacity(cluster, cluster.userData.targetOpacity);
    updateCloudLighting(cluster, directionalLight);
    cloudGroup.add(cluster);
  }

  // Asynchronously load the new GLB cloud model and replace puff clusters for more detailed visuals
  gltfLoader.load(
    CLOUD_GLB_PATH,
    (gltf) => {
      glbModel = gltf.scene;
      // Compute scaling so model fits aesthetically
      const box = new THREE.Box3().setFromObject(glbModel);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetDim = 80; // desired approx width
      const baseScaleFactor = targetDim / maxDim;

      // Replace each cluster content with a clone of the GLB
      cloudGroup.children.forEach(cluster => {
        cluster.clear();
        const clone = glbModel.clone(true);
        clone.traverse(obj => {
          if (obj.isMesh) {
            obj.material = obj.material.clone();
            obj.material.transparent = true;
            obj.material.depthWrite = false;
            obj.material.opacity = cluster.userData.fadeProgress >= 1 ? cluster.userData.targetOpacity : 0;
            obj.material.fog = true;
            // Provide emissive for lighting updates
            if (!obj.material.emissive) obj.material.emissive = CLOUD_CONFIG.sunColor.clone();
            obj.material.emissiveIntensity = CLOUD_CONFIG.emissiveIntensity;
          }
        });
        const randomScale = THREE.MathUtils.randFloat(0.6, 1.4);
        clone.scale.setScalar(baseScaleFactor * randomScale);
        cluster.add(clone);
        // Cache meshes after replacement for performance
        cluster.userData.cachedMeshes = [];
        cluster.traverse(o => { if (o.isMesh && o.material) cluster.userData.cachedMeshes.push(o); });
        // Re-apply lighting now that meshes changed
        updateCloudLighting(cluster, directionalLight);
      });
      console.log('☁️ Loaded GLB cloud model and applied to clusters');
    },
    undefined,
    (err) => {
      console.warn('⚠️ Could not load GLB cloud model, keeping procedural clouds.', err);
    }
  );

  scene.add(cloudGroup);

  // === FAR BILLBOARD INSTANCED LAYER ===
  // Simple very-far background layer using planes to reduce heavy geometry afar.
  const farGeometry = new THREE.PlaneGeometry(120, 60, 1, 1);
  const farMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  const instanced = new THREE.InstancedMesh(farGeometry, farMaterial, CLOUD_CONFIG.farBillboardCount);
  instanced.name = 'FarCloudBillboards';
  const dummy = new THREE.Object3D();
  for (let i = 0; i < CLOUD_CONFIG.farBillboardCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(CLOUD_CONFIG.spawnDistance * 0.9, CLOUD_CONFIG.spawnDistance * 1.2);
    dummy.position.set(
      Math.cos(angle) * radius,
      THREE.MathUtils.randFloat(CLOUD_CONFIG.minHeight + 10, CLOUD_CONFIG.maxHeight + 40),
      Math.sin(angle) * radius
    );
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = THREE.MathUtils.randFloat(0.8, 2.2);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  instanced.instanceMatrix.needsUpdate = true;
  instanced.renderOrder = -1;
  cloudGroup.add(instanced);
  
  console.log(`☁️ Created ${CLOUD_CONFIG.count} volumetric cloud clusters with advanced lighting`);
  
  return cloudGroup;
}

/**
 * Updates clouds with smooth fade animations, infinite spawning, and dynamic lighting
 */
export function updateClouds(cloudGroup, plane, camera, deltaTime) {
  if (!camera) {
    console.warn("⚠️ Camera not provided to updateClouds");
    return;
  }

  const time = performance.now() * 0.001;

  cloudGroup.children.forEach((cloud) => {
    if (cloud.isInstancedMesh) return; // skip instanced far layer here
    // Calculate distance from plane position (not just behind)
    const distanceFromPlane = cloud.position.distanceTo(plane.position);
    
    // === FADE IN LOGIC ===
    if (cloud.userData.fadeProgress < 1.0 && !cloud.userData.isFadingOut) {
      cloud.userData.fadeProgress += deltaTime / CLOUD_CONFIG.fadeInDuration;
      cloud.userData.fadeProgress = Math.min(cloud.userData.fadeProgress, 1.0);
      
      // Smooth fade in using easing
      const easedProgress = easeInOutCubic(cloud.userData.fadeProgress);
      const currentOpacity = easedProgress * cloud.userData.targetOpacity;
      updateCloudOpacity(cloud, currentOpacity);
    }
    
    // === FADE OUT LOGIC ===
    // Start fading out when far from plane
    if (distanceFromPlane > CLOUD_CONFIG.spawnDistance - CLOUD_CONFIG.fadeOutDistance && 
        !cloud.userData.isFadingOut) {
      cloud.userData.isFadingOut = true;
      cloud.userData.fadeOutProgress = 0;
    }
    
    if (cloud.userData.isFadingOut) {
      cloud.userData.fadeOutProgress += deltaTime / CLOUD_CONFIG.fadeOutDuration;
      cloud.userData.fadeOutProgress = Math.min(cloud.userData.fadeOutProgress, 1.0);
      
      // Smooth fade out
      const fadeOutAmount = 1.0 - easeInOutCubic(cloud.userData.fadeOutProgress);
      const currentOpacity = fadeOutAmount * cloud.userData.targetOpacity;
      updateCloudOpacity(cloud, currentOpacity);
    }
    
    // === DRIFT (lightweight pseudo-noise) ===
    const seed = cloud.userData.driftSeed;
    const driftSpeed = cloud.userData.driftSpeed;
    // Hash-like trigonometric pseudo noise
    const nx = Math.sin((seed + time * driftSpeed) * 1.1) * 0.5 + Math.sin((seed * 0.37 + time * driftSpeed * 0.7)) * 0.5;
    const nz = Math.cos((seed + time * driftSpeed) * 0.9) * 0.5 + Math.sin((seed * 0.17 + time * driftSpeed * 0.4)) * 0.5;
    const ny = Math.sin((seed + time * driftSpeed) * 0.6) * 0.5;
    cloud.position.x += nx * CLOUD_CONFIG.noiseScale * 60;
    cloud.position.z += nz * CLOUD_CONFIG.noiseScale * 60;
    cloud.position.y += ny * CLOUD_CONFIG.noiseScale * 25 * CLOUD_CONFIG.verticalDriftScale;

    // === LOD DECISIONS ===
    // Skip heavy lighting update if far away using tiers
    if (cloud.userData.directionalLight) {
      const dist = distanceFromPlane;
      let updateLighting = false;
      if (dist < CLOUD_CONFIG.lodMid) {
        // near: update every frame
        updateLighting = true;
      } else if (dist < CLOUD_CONFIG.lodFar) {
        // mid: update every ~0.5s
        if (time - cloud.userData.lastLightUpdateTime > 0.5) updateLighting = true;
      } else {
        // far: update every ~2s and reduce opacity gradually
        if (time - cloud.userData.lastLightUpdateTime > 2.0) updateLighting = true;
        const farFade = THREE.MathUtils.clamp(1 - (dist - CLOUD_CONFIG.lodFar) / 300, 0, 1);
        updateCloudOpacity(cloud, farFade * cloud.userData.targetOpacity);
      }
      if (updateLighting) {
        updateCloudLighting(cloud, cloud.userData.directionalLight);
        cloud.userData.lastLightUpdateTime = time;
      }
    }
    
    // === RECYCLING LOGIC ===
    // Recycle clouds that are too far from the plane
    if (distanceFromPlane > CLOUD_CONFIG.spawnDistance) {
      // Respawn in a random direction around the plane
      const angle = Math.random() * Math.PI * 2;
      const distance = THREE.MathUtils.randFloat(300, 600);
      
      cloud.position.set(
        plane.position.x + Math.cos(angle) * distance,
        THREE.MathUtils.randFloat(CLOUD_CONFIG.minHeight, CLOUD_CONFIG.maxHeight),
        plane.position.z + Math.sin(angle) * distance
      );
      
      cloud.rotation.y = Math.random() * Math.PI * 2;
      
      // Reset fade state for fade in
      cloud.userData.fadeProgress = 0;
      cloud.userData.isFadingOut = false;
      cloud.userData.fadeOutProgress = 0;
      updateCloudOpacity(cloud, 0);
      
      // Update lighting for newly spawned cloud
      if (cloud.userData.directionalLight) {
        updateCloudLighting(cloud, cloud.userData.directionalLight);
      }
    }
  });
}

/**
 * Cubic easing function for smooth animations
 */
function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Optional: Update cloud atmosphere colors based on sun position/time of day
 * Call this when you want to change the overall cloud mood (sunset, etc.)
 * @param {THREE.Color} newSunColor - The new sun color
 * @param {THREE.Color} newAmbientColor - The new ambient sky color
 */
export function setCloudAtmosphere(newSunColor, newAmbientColor) {
  if (newSunColor) {
    CLOUD_CONFIG.sunColor.copy(newSunColor);
  }
  if (newAmbientColor) {
    CLOUD_CONFIG.ambientColor.copy(newAmbientColor);
  }
}
