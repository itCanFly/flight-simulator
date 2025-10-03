import * as THREE from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

const clock = new THREE.Clock();
const noise = new ImprovedNoise();

export function applyTurbulence(airplane, intensity){
    const time = clock.getElapsedTime();

    const disturbance_x = noise.noise(time *0.5, 0, 0);
    const disturbance_y = noise.noise(0, time * 0.5, 0);
    const disturbance_z = noise.noise(0, 0, time * 0.5);

    airplane.rotation.x += disturbance_x * intensity;
    airplane.rotation.y += disturbance_y * intensity;
    airplane.rotation.z += disturbance_z * intensity;

}

let turbulenceStart = 0;

export function shakeCamera(camera, intensity) {
      const elapsed = performance.now() - turbulenceStart;
    camera.rotation.x = Math.sin(elapsed * 0.01) * intensity;
    camera.rotation.z = Math.sin(elapsed * 0.013) * intensity;
}