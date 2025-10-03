import * as THREE from "three";
import { createScene } from "../src/scene/scene.js";
import { Game } from "./game.js";

// Shared game object
export const game = new Game();

// Get the container for the Three.js canvas
const sceneContainer = document.getElementById("sceneContainer");

// Create the scene using our helper
const { scene, camera, plane, updateWorld } = createScene();

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
sceneContainer.appendChild(renderer.domElement);

// Animate loop
function animate() {
  requestAnimationFrame(animate);

  if (game.state === "PLAYING") {
    // Update the world (controls, grid, camera)
    updateWorld();

    // Optional: move plane forward constantly
    plane.position.z -= 0.1;
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

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = sceneContainer.clientWidth / sceneContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
});
