// clouds.js
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// If you rename the asset to cloud.glb just update this constant.
const CLOUD_GLB_PATH = 'assets/models/clouds.glb';
// Debug toggle for verbose cloud system logging
const CLOUD_DEBUG = false;

// Feature toggles
const USE_INSTANCING_PLACEHOLDER = true;   // Use GPU instanced puff spheres before GLB loads
const CLOUD_FOG_OVERLAY_ENABLED = true;    // Enable simple screen fog overlay when inside a cloud

// Fog overlay configuration
const FOG_OVERLAY_CONFIG = {
  maxOpacity: 0.45,        // Peak opacity when deeply inside cloud
  fadeSpeed: 2.5,          // Opacity lerp speed per second
  radiusMultiplier: 0.9,   // How close to cloud center before max effect
  color: 0xffffff,
};

// Cloud configuration
// Altitude offset to raise entire cloud layer without hunting through code.
// Increase this value to push clouds higher globally. Example: 0 -> original, 150 -> much higher sky layer.
const CLOUD_ALTITUDE_OFFSET = 350; // << raised layer

const CLOUD_CONFIG = {
  count: 0,                    // More clouds for better coverage
  spawnDistance: 2000,          // Reasonable spawn distance for good coverage
  fadeInDuration: 2.0,          // Seconds to fade in
  // gameplay plane (y≈1–10) flies well below cloud deck.
  minHeight: 15 + CLOUD_ALTITUDE_OFFSET,
  maxHeight: 90 + CLOUD_ALTITUDE_OFFSET,
  spreadX: 600,                 // Horizontal spread
  
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
  if (USE_INSTANCING_PLACEHOLDER) {
    return createInstancedPlaceholderCluster(cloudTexture, directionalLight);
  }
  // Fallback / alternative detailed (non-instanced) version kept for reference
  const cluster = new THREE.Group();
  
  // spheres for better visibility
  const puffCount = THREE.MathUtils.randInt(8, 18);
  
  // Store fade properties and lighting info on the cluster
  cluster.userData = {
    fadeProgress: 0,          // 0 to 1 for fade in
    targetOpacity: THREE.MathUtils.randFloat(0.45, 0.70), // Reduced opacity for better visibility
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
 * Creates a lightweight instanced placeholder cluster (single InstancedMesh) until GLB cloud model loads.
 */
function createInstancedPlaceholderCluster(cloudTexture, directionalLight) {
  const cluster = new THREE.Group();
  const puffCount = THREE.MathUtils.randInt(10, 20); // Reduced for better visibility
  const baseScale = THREE.MathUtils.randFloat(1.8, 3.5);

  const geometry = new THREE.SphereGeometry(18, 12, 10); // base shape; per-instance scaling will vary
  const material = new THREE.MeshLambertMaterial({
    map: cloudTexture,
    transparent: true,
    depthWrite: false,
    opacity: 0,
    side: THREE.DoubleSide,
    color: CLOUD_CONFIG.baseCloudColor,
    emissive: CLOUD_CONFIG.sunColor,
    emissiveIntensity: CLOUD_CONFIG.emissiveIntensity,
    fog: true,
  });
  const instanced = new THREE.InstancedMesh(geometry, material, puffCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < puffCount; i++) {
    const layer = i / puffCount;
    const radiusScatter = THREE.MathUtils.randFloat(0.4, 1.0);
    const radialDistance = THREE.MathUtils.randFloat(12, 42) * radiusScatter;
    const angle = Math.random() * Math.PI * 2;
    dummy.position.set(
      Math.cos(angle) * radialDistance * 0.9 + THREE.MathUtils.randFloat(-6, 6),
      THREE.MathUtils.randFloat(-18, 18),
      Math.sin(angle) * radialDistance + THREE.MathUtils.randFloat(-6, 6)
    );
    dummy.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
    const s = THREE.MathUtils.randFloat(0.5, 1.6) * (1.0 + layer * 0.4);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  instanced.instanceMatrix.needsUpdate = true;
  cluster.add(instanced);
  cluster.userData = {
    fadeProgress: 0,
    targetOpacity: THREE.MathUtils.randFloat(0.45, 0.70), // Reduced opacity for better visibility
    baseScale,
    directionalLight,
    driftSeed: Math.random()*1000,
    driftSpeed: THREE.MathUtils.randFloat(CLOUD_CONFIG.driftSpeedMin, CLOUD_CONFIG.driftSpeedMax),
    cachedMeshes: [instanced],
    lastLightUpdateTime: 0,
    boundingRadius: 55 * baseScale,
    instancedPlaceholder: true,
  };
  return cluster;
}

/**
 * Positions a cloud cluster in front of the camera
 */
// Removed unused function positionCloudAhead (was not referenced)

/**
 * Updates the opacity of all meshes in a cloud cluster
 */
function updateCloudOpacity(cloud, opacity) {
  // Use cached meshes if available for performance; else traverse once to build.
  if (!cloud.userData.cachedMeshes) {
    const collected = [];
    cloud.traverse(o => { if (o.isMesh && o.material) collected.push(o); });
    cloud.userData.cachedMeshes = collected;
  }
  for (const m of cloud.userData.cachedMeshes) {
    m.material.opacity = opacity;
  }
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
/**
 * Initialize the cloud system.
 * @param {THREE.Scene} scene Scene to attach cloud group to.
 * @param {THREE.DirectionalLight|null} directionalLight Optional existing sun light.
 * @returns {THREE.Group} Group containing all clouds and far billboards.
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

  // Create initial procedural placeholder clusters covering large atmospheric area
  // Use multiple rings/layers for natural distribution across the entire sky
  const totalArea = CLOUD_CONFIG.spawnDistance * 4; // Large sky coverage area
  
  for (let i = 0; i < CLOUD_CONFIG.count; i++) {
    const cluster = createCloudCluster(cloudTexture, directionalLight);
    
    // Create layered circular distribution for natural sky coverage
    const layer = Math.floor(i / (CLOUD_CONFIG.count / 3)); // 3 layers
    const layerRadius = (layer + 1) * (totalArea / 6); // Different radii per layer
    const angle = (i * 2.4) + (layer * 0.8); // Offset each layer
    
    // Add variation within each layer
    const radiusVariation = layerRadius * 0.4;
    const finalRadius = layerRadius + THREE.MathUtils.randFloat(-radiusVariation, radiusVariation);
    
    cluster.position.set(
      Math.cos(angle) * finalRadius,
      THREE.MathUtils.randFloat(CLOUD_CONFIG.minHeight, CLOUD_CONFIG.maxHeight),
      Math.sin(angle) * finalRadius
    );
    
    cluster.rotation.y = Math.random() * Math.PI * 2;
    cluster.scale.setScalar(cluster.userData.baseScale || 1);
    
    // Start all clouds at full opacity for immediate sky coverage
    cluster.userData.fadeProgress = 1.0;
    updateCloudOpacity(cluster, cluster.userData.targetOpacity);
    updateCloudLighting(cluster, directionalLight);
    if (!cluster.userData.boundingRadius) cluster.userData.boundingRadius = 55 * (cluster.userData.baseScale || 1);
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
        // Recompute bounding radius based on new geometry
        const bbox = new THREE.Box3().setFromObject(clone);
        const sizeVec = new THREE.Vector3();
        bbox.getSize(sizeVec);
        cluster.userData.boundingRadius = sizeVec.length() * 0.33; // heuristic
        cluster.userData.instancedPlaceholder = false;
        // Re-apply lighting now that meshes changed
        updateCloudLighting(cluster, directionalLight);
      });
      if (CLOUD_DEBUG) console.log('☁️ Loaded GLB cloud model and applied to clusters');
    },
    undefined,
    (err) => {
      if (CLOUD_DEBUG) console.warn('⚠️ Could not load GLB cloud model, keeping procedural clouds.', err);
    }
  );

  scene.add(cloudGroup);

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
  // Distribute far background clouds across distant horizon
  for (let i = 0; i < CLOUD_CONFIG.farBillboardCount; i++) {
    const angle = (i / CLOUD_CONFIG.farBillboardCount) * Math.PI * 2;
    const distance = THREE.MathUtils.randFloat(CLOUD_CONFIG.spawnDistance * 1.5, CLOUD_CONFIG.spawnDistance * 3);
    
    dummy.position.set(
      Math.cos(angle) * distance,
      THREE.MathUtils.randFloat(CLOUD_CONFIG.minHeight + 10, CLOUD_CONFIG.maxHeight + 40),
      Math.sin(angle) * distance
    );
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = THREE.MathUtils.randFloat(1.2, 3.0); // Larger far clouds
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix);
  }
  instanced.instanceMatrix.needsUpdate = true;
  instanced.renderOrder = -1;
  cloudGroup.add(instanced);
  
  if (CLOUD_DEBUG) console.log(`☁️ Created ${CLOUD_CONFIG.count} volumetric cloud clusters`);
  
  return cloudGroup;
}
/**
 * Updates clouds with smooth fade animations, infinite spawning, and dynamic lighting
 */
/**
 * Per-frame update for clouds: fade, drift, lighting LOD, recycling.
 * @param {THREE.Group} cloudGroup Cloud system group.
 * @param {THREE.Object3D} plane The player plane (position reference).
 * @param {THREE.Camera} camera Active camera.
 * @param {number} deltaTime Frame delta in seconds.
 */
export function updateClouds(cloudGroup, plane, camera, deltaTime) {
  if (!camera) {
    if (CLOUD_DEBUG) console.warn("⚠️ Camera not provided to updateClouds");
    return;
  }

  const time = performance.now() * 0.001;

  // Ensure fog overlay mesh exists if feature enabled
  if (CLOUD_FOG_OVERLAY_ENABLED && !cloudGroup.userData.overlayMesh) {
    const overlayGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
    const overlayMat = new THREE.MeshBasicMaterial({
      color: FOG_OVERLAY_CONFIG.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    const overlay = new THREE.Mesh(overlayGeo, overlayMat);
    overlay.name = 'CloudFogOverlay';
    overlay.renderOrder = 999;
    camera.add(overlay);
    overlay.position.set(0,0,-0.5); // in front of camera
    cloudGroup.userData.overlayMesh = overlay;
    cloudGroup.userData.overlayOpacity = 0;
  }

  let insideDepth = 0; // 0..1 how deep inside a cloud volume

  cloudGroup.children.forEach((cloud) => {
    if (cloud.isInstancedMesh) return; // skip instanced far layer here
    // Calculate distance from plane position (not just behind)
    const distanceFromPlane = cloud.position.distanceTo(plane.position);
    
    
    // Keep all clouds at full opacity immediately - no fade in
    updateCloudOpacity(cloud, cloud.userData.targetOpacity);
    
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
      
      // Keep clouds at full opacity when recycling to avoid gaps
      cloud.userData.fadeProgress = 1.0;
      updateCloudOpacity(cloud, cloud.userData.targetOpacity);
      
      // Update lighting for newly spawned cloud
      if (cloud.userData.directionalLight) {
        updateCloudLighting(cloud, cloud.userData.directionalLight);
      }
    }

    // Interior fog determination (approximate sphere volume)
    if (CLOUD_FOG_OVERLAY_ENABLED && cloud.userData.boundingRadius) {
      const radius = cloud.userData.boundingRadius;
      const dist = distanceFromPlane;
      const effectiveRadius = radius * FOG_OVERLAY_CONFIG.radiusMultiplier;
      if (dist < effectiveRadius) {
        const depth = 1 - dist / effectiveRadius; // 0 at edge, 1 at center
        if (depth > insideDepth) insideDepth = depth;
      }
    }
  });

  // Update overlay opacity smoothly
  if (CLOUD_FOG_OVERLAY_ENABLED && cloudGroup.userData.overlayMesh) {
    const target = insideDepth * FOG_OVERLAY_CONFIG.maxOpacity;
    cloudGroup.userData.overlayOpacity = THREE.MathUtils.lerp(
      cloudGroup.userData.overlayOpacity,
      target,
      Math.min(1, FOG_OVERLAY_CONFIG.fadeSpeed * deltaTime)
    );
    cloudGroup.userData.overlayMesh.material.opacity = cloudGroup.userData.overlayOpacity;
    // Scale overlay to cover viewport: set scale based on FOV
    const dist = 0.5; // plane Z offset
    const height = 2 * Math.tan((camera.fov * Math.PI/180)/2) * dist;
    const width = height * camera.aspect;
    cloudGroup.userData.overlayMesh.scale.set(width, height, 1);
  }
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
