//scene.js

import * as THREE from "three";
import { createPlane } from "../plane/plane.js";
import { setupControls } from "../plane/controls.js";
import { createClouds, updateClouds } from "../clouds/clouds.js";


export function createScene() {
  const scene = new THREE.Scene();
  
  // ---------- Axes helper ----------
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // ---------- Lighting ----------
  // Add directional light for cloud system
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
  sunLight.position.set(1, 1, 1);
  scene.add(sunLight);

  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // ---------- Colored Grid ----------
  const gridSize = 500;
  const gridDivisions = 50;
  const originalColors = []; // store original colors
  const gridGroup = new THREE.Group();
  const step = gridSize / gridDivisions;
  const halfSize = gridSize / 2;

  for (let i = 0; i < gridDivisions; i++) {
    for (let j = 0; j < gridDivisions; j++) {
      const geometry = new THREE.PlaneGeometry(step, step);
      const isEven = (i + j) % 2 === 0;
      const color = isEven ? 0x000 : 0xffffffff;
      const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
      originalColors.push(new THREE.Color(color));
      const square = new THREE.Mesh(geometry, material);
      square.rotation.x = -Math.PI / 2;
      square.position.x = i * step - halfSize + step / 2;
      square.position.z = j * step - halfSize + step / 2;
      gridGroup.add(square);
    }
  }
  scene.add(gridGroup);

  // ---------- Plane ----------
  const plane = createPlane();
  scene.add(plane);

  // ---------- Clouds ----------
  const cloudGroup = createClouds(scene, sunLight);


  // ---------- Controls ----------
  const updateControls = setupControls(plane);

  // ---------- Camera ----------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 4, 5);
  camera.lookAt(plane.position);

  // ---------- Colors ----------
  const groundColor = new THREE.Color(0xff0000);

  // ---------- Clock for delta time ----------
  const clock = new THREE.Clock();

  // Update world per frame
  function updateWorld() {
    const deltaTime = clock.getDelta();
    
    // Controls update
    updateControls();

    // Clouds movement update with delta time
    updateClouds(cloudGroup, plane, camera, deltaTime);


    // Grid coloring
    gridGroup.children.forEach((square, idx) => {
      const target = (plane.position.y <= 1.01) ? groundColor : originalColors[idx];
      square.material.color.lerp(target, 0.05);
    });

    // Camera follow
    camera.position.x = plane.position.x + 5 * Math.sin(plane.rotation.y);
    camera.position.z = plane.position.z + 5 * Math.cos(plane.rotation.y);
    camera.position.y = plane.position.y + 2;
    camera.lookAt(plane.position);
  }

  return { scene, camera, plane, updateWorld };
}
