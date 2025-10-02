// main.js
import * as THREE from 'three';
import { createPlane } from './plane/plane.js';
import { setupControls } from './plane/controls.js';

// Scene setup
const scene = new THREE.Scene();

// Helpers
const axesHelper = new THREE.AxesHelper(5);   // X=red, Y=green, Z=blue
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(500, 500); // large grid
scene.add(gridHelper);

// Colors for grid transitions
const groundColor = new THREE.Color(0xff0000); // red
const airColor = new THREE.Color(0xffffff);   // white

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add plane
const plane = createPlane();
scene.add(plane);

// Setup controls (returns updater function)
const updateControls = setupControls(plane);

// Camera initial pos
camera.position.set(0, 2, 5);
camera.lookAt(plane.position);

// Render loop
function animate() {
  requestAnimationFrame(animate);

  // Update plane physics/controls
  updateControls();

  // Smoothly blend grid color depending on height
  const targetColor = (plane.position.y <= 1.01) ? groundColor : airColor;
  gridHelper.material.color.lerp(targetColor, 0.05);

  // Camera follow plane from behind
  camera.position.x = plane.position.x + 5 * Math.sin(plane.rotation.y);
  camera.position.z = plane.position.z + 5 * Math.cos(plane.rotation.y);
  camera.position.y = plane.position.y + 2;
  camera.lookAt(plane.position);

  renderer.render(scene, camera);
}
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
