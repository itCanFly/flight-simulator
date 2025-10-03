// main.js
import * as THREE from "three";
import { createPlane } from "./plane/plane.js";
import { setupControls } from "./plane/controls.js";
import { Game } from "./game.js";

export const game = new Game();  // create shared game object

// Get the scene container inside gameScreen
const sceneContainer = document.getElementById("sceneContainer");

// Scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  sceneContainer.clientWidth / sceneContainer.clientHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
sceneContainer.appendChild(renderer.domElement);

// Plane
const plane = createPlane();
scene.add(plane);
setupControls(plane);

// Camera setup
camera.position.set(0, 2, 5);
camera.lookAt(plane.position);

// Animate
function animate() {
  requestAnimationFrame(animate);

  if (game.state === "PLAYING") {
    // plane moves only when game is active
    plane.position.z -= 0.1;

    camera.position.x = plane.position.x - 5 * Math.sin(plane.rotation.y);
    camera.position.z = plane.position.z - 5 * Math.cos(plane.rotation.y);
    camera.position.y = plane.position.y + 2;
    camera.lookAt(plane.position);
  }

  renderer.render(scene, camera);
}
animate();

// React to game state changes
game.onChange(g => {
  console.log("3D World noticed game state:", g.state, "Level:", g.level);

  if (g.state === "PLAYING") {
    plane.position.set(0, 1, 0); // reset plane at start
  }
});

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
});
