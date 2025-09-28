// plane.js
import * as THREE from 'three';

export function createPlane() {
  const geometry = new THREE.BoxGeometry(1, 0.5, 2); // stretched cube
  const material = new THREE.MeshBasicMaterial({ color: 0x00aaff });
  const plane = new THREE.Mesh(geometry, material);
  plane.name = "playerPlane"; // easy to find later
  return plane;
}
