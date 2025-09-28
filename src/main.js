// main.js
import * as THREE from 'three';
import { createPlane } from './plane/plane.js';
import { setupControls } from './plane/controls.js';

// Scene setup
const scene = new THREE.Scene();
// Helpers
const axesHelper = new THREE.AxesHelper(5);   // X=red, Y=green, Z=blue
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(50, 50); // size, divisions
scene.add(gridHelper);


const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add plane
const plane = createPlane();
scene.add(plane);

// Setup controls
setupControls(plane);

// Camera follow (behind plane)
camera.position.set(0, 2, 5);
camera.lookAt(plane.position);

// Render loop
function animate() {
  requestAnimationFrame(animate);

  // Update camera to follow plane (optional)
  camera.position.x = plane.position.x - 5 * Math.sin(plane.rotation.y);
  camera.position.z = plane.position.z - 5 * Math.cos(plane.rotation.y);
  camera.position.y = plane.position.y + 2;
  camera.lookAt(plane.position);

  renderer.render(scene, camera);
}
animate();
