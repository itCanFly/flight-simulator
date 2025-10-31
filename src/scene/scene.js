// Load Ground / Runway / Sky models
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// (Skybox implementation removed — use ground/runway loaders only)

export function loadGroundModel(game){
    const loader = new GLTFLoader();
    loader.load(
        '/assets/models/ground_plane.glb',
        (gltf) => {
            const model = gltf.scene;
            model.traverse(obj => {
                if (obj.isMesh) {
                    obj.castShadow = false;
                    obj.receiveShadow = true;
                    if (obj.material) obj.material.depthWrite = true;
                }
            });
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= box.min.y; // place lowest at y=0
            const targetExtent = 3000;
            if (size.x < targetExtent * 0.2) {
                const uniformScale = targetExtent / Math.max(size.x, size.z);
                model.scale.setScalar(uniformScale);
            }
            game.ground = model;
            game.scene.add(model);
        },
        undefined,
        (error) => console.error('Error loading ground_plane.glb', error)
    );
}

export function loadRunwayModel(game, position = new THREE.Vector3(0, 0, 0)){
    const loader = new GLTFLoader();
    loader.load(
        '/assets/models/runway.glb',
        (gltf) => {
            const model = gltf.scene;
            model.traverse(obj => {
                if (obj.isMesh) {
                    obj.castShadow = false;
                    obj.receiveShadow = true;
                    if (obj.material) obj.material.depthWrite = true;
                }
            });

            // Compute bounds so we can place the model so its lowest point sits at the desired Y
            const box = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            box.getCenter(center);

            // Position the model so its center (x,z) is at the requested coords
            model.position.x = position.x - center.x;
            model.position.z = position.z - center.z;
            // Place lowest point at requested Y
            model.position.y = position.y - box.min.y;

            // Optionally scale if it's tiny compared to ground (kept conservative)
            const size = new THREE.Vector3();
            box.getSize(size);
            const targetExtent = 3000;
            if (Math.max(size.x, size.z) < targetExtent * 0.05) {
                const uniformScale = targetExtent / Math.max(size.x, size.z);
                model.scale.setScalar(uniformScale);
            }

            game.runway = model;
            game.scene.add(model);
        },
        undefined,
        (error) => console.error('Error loading runway.glb', error)
    );
}

// Simplified sky: create an inside-facing skysphere (fast, reliable)
// Options: { radius, color, texturePath, segments }
export function loadSkybox(scene, options = {}) {
    // Loads the GLB skybox model and adds it to the scene.
    // options: { path, scale, name }
    const { path = '/assets/models/skybox.glb', scale = 1000, name = 'SkyboxModel' } = options;

    // remove previous skybox if any
    const prev = scene.getObjectByName(name);
    if (prev) {
        try { scene.remove(prev); } catch (e) { /* ignore */ }
    }

    const loader = new GLTFLoader();

    loader.load(
        path,
        (gltf) => {
            const skybox = gltf.scene || (gltf.scenes && gltf.scenes[0]);
            if (!skybox) {
                console.error('loadSkybox: GLTF loaded but no scene root in', path);
                return;
            }

            skybox.name = name;
            // scale & position
            skybox.scale.setScalar(scale);
            skybox.position.set(0, 0, 0);

            // Ensure materials render from inside and won't cast/receive shadows
            skybox.traverse((child) => {
                if (child.isMesh) {
                    try {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => { if (m) m.side = THREE.BackSide; if (m) m.needsUpdate = true; });
                        } else if (child.material) {
                            child.material.side = THREE.BackSide;
                            child.material.needsUpdate = true;
                        }
                    } catch (e) {
                        // ignore material tweaks
                    }
                    child.castShadow = false;
                    child.receiveShadow = false;
                    child.frustumCulled = false;
                    child.renderOrder = 0;
                }
            });

            scene.add(skybox);
            console.log('Skybox model loaded and added to scene from', path);
        },
        (xhr) => {
            if (xhr && xhr.total) console.log(`Skybox loading: ${(xhr.loaded / xhr.total * 100).toFixed(1)}%`);
        },
        (err) => {
            console.error('Error loading skybox model from', path, err);
        }
    );
}


