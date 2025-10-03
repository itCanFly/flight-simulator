import * as THREE from "three";
import { createPlane } from "./plane/plane.js";
import { setupControls } from "./plane/controls.js";

export function createScene() {
  const scene = new THREE.Scene();

  // ---------- Axes helper ----------
  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);

  // ---------- Colored Grid ----------
  const gridSize = 500;
  const gridDivisions = 10;
  const originalColors = []; // store original colors
  const gridGroup = new THREE.Group();
  const step = gridSize / gridDivisions;
  const halfSize = gridSize / 2;

  for (let i = 0; i < gridDivisions; i++) {
    for (let j = 0; j < gridDivisions; j++) {
      const geometry = new THREE.PlaneGeometry(step, step);
      const isEven = (i + j) % 2 === 0;
      const color = isEven ? 0xcccccc : 0x999999;
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

  // ---------- Controls ----------
  const updateControls = setupControls(plane);

  // ---------- Camera ----------
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);
  camera.lookAt(plane.position);

  // ---------- Colors ----------
  const groundColor = new THREE.Color(0xff0000);

  // Update world per frame
  function updateWorld() {
    // Controls update
    updateControls();

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
