import * as THREE from "three";

export class ExhaustShaderParticles {
  constructor(scene, options = {}) {
    this.scene = scene;

    const opts = Object.assign({
      count: 500,
      lifetime: 2,
      position: new THREE.Vector3(0.0, -0.2, -0.85), 
      radius: 0.1, 
      height: 0.0,
      velocity: new THREE.Vector3(0, -1.0, -1.0),
      fireColor: new THREE.Color(0xff6600),
      smokeColor: new THREE.Color(0x555555),
      size: 10.0,
    }, options);

    this.count = opts.count;
    this.lifetime = opts.lifetime;
    this.position = opts.position;
    this.radius = opts.radius;
    this.height = opts.height;
    this.velocity = opts.velocity;
    this.size = opts.size;
    this.fireColor = opts.fireColor;
    this.smokeColor = opts.smokeColor;

    const positions = new Float32Array(this.count * 3);
    const startTimes = new Float32Array(this.count);
    const colors = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {

      const p = this.randomPointOnCylinder(this.radius, this.height);
      positions[i * 3] = this.position.x + p.x;
      positions[i * 3 + 1] = this.position.y + p.y;
      positions[i * 3 + 2] = this.position.z + p.z;

      startTimes[i] = Math.random() * this.lifetime;

      const color = Math.random() < 0.5 ? this.fireColor : this.smokeColor;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("startTime", new THREE.BufferAttribute(startTimes, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLifetime: { value: this.lifetime },
        uVelocity: { value: this.velocity },
        uSize: { value: this.size },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uLifetime;
        uniform vec3 uVelocity;
        uniform float uSize;
        attribute float startTime;
        attribute vec3 color;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          float age = mod(uTime - startTime, uLifetime);
          vAlpha = 1.0 - age / uLifetime;
          vColor = color;

          // basic upward motion
          vec3 newPos = position + uVelocity * age;

          // small radial flare for realism
          vec3 radial = normalize(vec3(position.x, 0.0, position.z));
          newPos += radial * age * 0.1;

          // horizontal jitter
          newPos.x += sin(age * 10.0) * 0.02;
          newPos.z += cos(age * 10.0) * 0.02;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
          gl_PointSize = uSize * (1.0 - age / uLifetime);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);

    this.startTime = performance.now() / 1000;
  }

  randomPointOnCylinder(radius, height) {
    const theta = Math.random() * Math.PI * 2;
    const r = radius * Math.sqrt(Math.random());
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = height; 
    return new THREE.Vector3(x, y, z);
  }

  update() {
    const now = performance.now() / 1000;
    this.points.material.uniforms.uTime.value = now - this.startTime;
  }
}
