// plane.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export function createPlane() {
  const group = new THREE.Group();
  group.name = "playerPlane";

  const loader = new GLTFLoader();
  loader.load(
    "assets/models/bus.glb", 
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(1.5, 1.5, 1.5);
      model.position.set(0, 0, 0);
      model.traverse((child) => {
      if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
});

      group.add(model);
    },
   
    // (error) => console.error("Error loading GLB:", error)
  );

  // ---- Add Lights Here ----
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  group.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  group.add(dirLight);

  return group;
}
