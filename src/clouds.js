import * as THREE from "three";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";


export function createCloudSystem(scene, options = {}) {
  const opts = Object.assign({
    count: 2048,
    spawnIterations: 8,
    noiseLayers: 4,
    lacunarity: 2.0,
    persistence: 0.5,
    noiseScale: 1.0,
    sizeMin: 0.5,
    sizeMax: 3.0,
    cloudHeight: 50,
    heightVariance: 5,
    renderThreshold: 200,
    collisionRadius: 6,
    scaleAmplitude: 0.25,
    shrinkSpeed: 0.5,
    particleTexture: null, 
    seed: 1337,
    areaSize: 500 
  }, options);

  const smoothstep = (a, b, x) => {
    if (x <= a) return 0;
    if (x >= b) return 1;
    const t = (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  };
  const lerp = (a, b, t) => a + (b - a) * t;

  function makePrng(seed) {
    let s = seed >>> 0;
    return {
      nextUint() {
        s ^= s << 13; s >>>= 0;
        s ^= s >>> 17; s >>>= 0;
        s ^= s << 5; s >>>= 0;
        return s >>> 0;
      },
      nextFloat() { return this.nextUint() / 4294967295; }
    };
  }

  function randomGaussian(prng) {
    let u = 0, v = 0;
    while (u === 0) u = prng.nextFloat();
    while (v === 0) v = prng.nextFloat();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  const noiseGen = new ImprovedNoise();
  function fractalNoise(numLayers, lacunarity, persistence, scale, pos) {
    let n = 0;
    let frequency = scale;
    let amplitude = 1;
    for (let i = 0; i < numLayers; i++) {
      const v = noiseGen.noise(pos.x * frequency, pos.y * frequency, pos.z * frequency);
      n += v * amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return n;
  }

  const N = opts.count;
  const positions = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const baseSizes = new Float32Array(N);
  const velocities = new Float32Array(N * 3);
  const inCloud = new Uint8Array(N);
  const scaleSpeeds = new Float32Array(N);
  const timeOffset = new Float32Array(N);

  // geometry & material
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));

  const sprite = opts.particleTexture || null;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: { pointTexture: { value: sprite }, scale: { value: 1.0 } },
    vertexShader: `
      attribute float size;
      varying float vAlpha;
      void main() {
        vAlpha = 1.0;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D pointTexture;
      varying float vAlpha;
      void main() {
        vec4 c = vec4(1.0,1.0,1.0,1.0) * texture2D(pointTexture, gl_PointCoord);
        if(c.a < 0.05) discard;
        gl_FragColor = c;
      }
    `
  });

  if (!sprite) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.6, 'rgba(255,255,255,0.5)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,size,size);
    mat.uniforms.pointTexture.value = new THREE.CanvasTexture(canvas);
  }

  const points = new THREE.Points(geom, mat);
  scene.add(points);

  const prng = makePrng(opts.seed);
  const playerPos = new THREE.Vector3(0, 0, 0);

  function spawnParticle(i) {
    let bestPos = new THREE.Vector3();
    let maxNoiseVal = -Infinity;
    for (let k = 0; k < opts.spawnIterations; k++) {
      const x = (prng.nextFloat() - 0.5) * opts.areaSize;
      const z = (prng.nextFloat() - 0.5) * opts.areaSize;
      const samplePos = new THREE.Vector3(x, 0, z);
      const n = fractalNoise(opts.noiseLayers, opts.lacunarity, opts.persistence, opts.noiseScale, samplePos);
      if (n > maxNoiseVal) {
        maxNoiseVal = n;
        bestPos.set(x, 0, z);
      }
    }

    const t = smoothstep(-0.5, 0.5, maxNoiseVal);
    const size = lerp(opts.sizeMin, opts.sizeMax, t);
    const y = opts.cloudHeight + randomGaussian(prng) * (opts.heightVariance * 0.5);
    const pos = new THREE.Vector3(bestPos.x, y, bestPos.z);

    positions[3*i + 0] = pos.x;
    positions[3*i + 1] = pos.y;
    positions[3*i + 2] = pos.z;

    sizes[i] = size;
    baseSizes[i] = size;
    const vel = new THREE.Vector3((prng.nextFloat() - 0.5)*0.2, (prng.nextFloat()-0.5)*0.2, (prng.nextFloat()-0.5)*0.2);
    velocities[3*i + 0] = vel.x;
    velocities[3*i + 1] = vel.y;
    velocities[3*i + 2] = vel.z;

    scaleSpeeds[i] = lerp(0.15, 0.75, prng.nextFloat());
    timeOffset[i] = prng.nextFloat() * Math.PI * 2;
    inCloud[i] = 1;
  }

  for (let i = 0; i < N; i++) spawnParticle(i);
  geom.attributes.position.needsUpdate = true;
  geom.attributes.size.needsUpdate = true;

  // --- update function ---
  function update(delta) {
    const posVec = new THREE.Vector3();
    const velVec = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      posVec.set(positions[3*i + 0], positions[3*i + 1], positions[3*i + 2]);
      velVec.set(velocities[3*i + 0], velocities[3*i + 1], velocities[3*i + 2]);
      tmp.copy(playerPos).sub(posVec);
      const dist = tmp.length();

      if (dist < opts.renderThreshold) {
        if (inCloud[i]) {
          if (dist < opts.collisionRadius) {
            const dir = tmp.clone().normalize();
            velVec.copy(dir).multiplyScalar(lerp(1.3, 2.0, Math.max(0, dir.dot(new THREE.Vector3(0,0,1)))));
            velocities[3*i + 0] = velVec.x;
            velocities[3*i + 1] = velVec.y;
            velocities[3*i + 2] = velVec.z;
            inCloud[i] = 0;
          } else {
            sizes[i] = baseSizes[i] + Math.sin(performance.now() * 0.001 * scaleSpeeds[i] + timeOffset[i]) * opts.scaleAmplitude;
          }
        } else {
          sizes[i] = Math.max(0.0, sizes[i] - (opts.shrinkSpeed * delta));
          positions[3*i + 0] += velocities[3*i + 0] * delta;
          positions[3*i + 1] += velocities[3*i + 1] * delta;
          positions[3*i + 2] += velocities[3*i + 2] * delta;
          if (sizes[i] <= 0.01 || posVec.distanceTo(playerPos) > opts.renderThreshold * 1.5) spawnParticle(i);
        }
      } else {
        if (!inCloud[i]) spawnParticle(i);
        else {
          const wind = Math.sin((i + performance.now() * 0.0001) * 0.1) * 0.01;
          positions[3*i + 0] += wind * delta;
          positions[3*i + 2] += wind * delta;
          sizes[i] = baseSizes[i] + Math.sin(performance.now() * 0.001 * scaleSpeeds[i] + timeOffset[i]) * opts.scaleAmplitude;
        }
      }
    }
    geom.attributes.position.needsUpdate = true;
    geom.attributes.size.needsUpdate = true;
  }

  function setPlayer(vec3) {
    playerPos.copy(vec3);
  }

  return { points, material: mat, update, setPlayer };
}
