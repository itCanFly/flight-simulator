// src/takeoffScene.js
import * as THREE from "three";
import { createPlane } from "./plane.js";
import { loadGroundModel } from "./scene/scene.js";

export function initTakeoffScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  // === Lighting ===
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  scene.add(dirLight);

  // === Ground ===
  loadGroundModel({ scene }); // Reuse your ground loader

  // === Plane ===
  const plane = createPlane();
  plane.position.set(1800, 1, -1200);
  scene.add(plane);

  // === Animation Variables ===
  let speed = 0;
  let altitude = 1;
  let pitch = 0;
  let phase = 0; // 0=accel, 1=takeoff, 2=climb, 3=reset
  const cameraFollowStartZ = -800; // when plane passes this, camera starts moving
  let cameraFollowActive = false;

  // === Camera initial position (fixed until threshold) ===
  camera.position.set(1800, 8, -750);
  camera.lookAt(new THREE.Vector3(1800, 0, -900));

  function animate() {
    requestAnimationFrame(animate);

    // --- Plane Phases ---
    switch (phase) {
      // --- Phase 0: Acceleration ---
      case 0:
        camera.position.set(1800, 8, -750);
        speed += (1.5 - speed) * 0.005;
        plane.position.z += speed;
        if (plane.position.z > -900) phase = 1;
        break;

      // --- Phase 1: Takeoff Roll + Lift ---
      case 1:
        speed += (2.0 - speed) * 0.01;
        plane.position.z += speed;
        altitude += 0.2;
        pitch += (0.3 - pitch) * 0.02;
        plane.rotation.x = -pitch;
        plane.position.y = altitude * 0.5;
        if (plane.position.y > 30) phase = 2;
        break;

      // --- Phase 2: Climb & Fly Away ---
      case 2:
        plane.position.z += speed * 1.5;
        plane.position.y += 0.5;
        if (plane.position.y > 90) phase = 3;
        break;

      // --- Phase 3: Reset ---
      case 3:
        plane.position.set(1800, 1, -1200);
        plane.rotation.x = 0;
        altitude = 1;
        speed = 0;
        pitch = 0;
        cameraFollowActive = false;
        phase = 0;
        break;
    }

    // === Camera Behavior ===
    if (!cameraFollowActive && plane.position.z > cameraFollowStartZ) {
      cameraFollowActive = true;
    }

    if (cameraFollowActive) {
      // Smooth follow after threshold
      const targetCamZ = plane.position.z - 20;
      const targetCamY = plane.position.y + 10;
      camera.position.z += (targetCamZ - camera.position.z) * 0.085;
      camera.position.y += (targetCamY - camera.position.y) * 0.085;
      camera.lookAt(plane.position);
    } else {
      // Keep camera fixed before threshold
      camera.lookAt(plane.position);
    }

    renderer.render(scene, camera);
  }

  animate();

  // === Handle Resize ===
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
