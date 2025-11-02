// Load Ground / Runway / Sky models
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// (Skybox implementation removed — use ground/runway loaders only)

export function loadGroundModel(game){
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            'assets/models/ground_plane.glb',
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
                console.log(' Ground model loaded');
                resolve(model);
            },
            (xhr) => {
                if (xhr && xhr.total) {
                    const progress = (xhr.loaded / xhr.total * 100).toFixed(0);
                    console.log(`Ground loading: ${progress}%`);
                }
            },
            (error) => {
                console.error(' Error loading ground_plane.glb', error);
                reject(error);
            }
        );
    });
}

export function loadRunwayModel(game, position = new THREE.Vector3(0, 0, 0)){
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            'assets/models/runway.glb',
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
                let box = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                box.getCenter(center);

                // Shorten the runway to 1/3 along its longest horizontal axis (x or z)
                const size = new THREE.Vector3();
                box.getSize(size);
                // Guard against zero-size
                const horizX = Math.max(size.x, 1e-6);
                const horizZ = Math.max(size.z, 1e-6);

                const axis = horizX >= horizZ ? 'x' : 'z';
                const shortenFactor = 1 / 3; // keep one third of original length along chosen axis

                // Apply non-uniform scaling on the chosen axis while preserving other scales
                // model.scale is a Vector3; multiply the selected component
                if (!model.scale) model.scale = new THREE.Vector3(1, 1, 1);
                model.scale[axis] = (model.scale[axis] || 1) * shortenFactor;

                // After scaling, recompute bounds so centering/positioning is correct
                box = new THREE.Box3().setFromObject(model);
                box.getSize(size);
                box.getCenter(center);

                // Position the model so its center (x,z) is at the requested coords
                model.position.x = position.x - center.x;
                model.position.z = position.z - center.z;
                // Place lowest point at requested Y (so runway sits at desired height)
                model.position.y = position.y - box.min.y;

                // Optionally scale if it's tiny compared to ground (kept conservative)
                const targetExtent = 3000;
                if (Math.max(size.x, size.z) < targetExtent * 0.05) {
                    const uniformScale = targetExtent / Math.max(size.x, size.z);
                    model.scale.setScalar(uniformScale);
                    // recompute box/center/position after uniform scaling
                    box = new THREE.Box3().setFromObject(model);
                    box.getSize(size);
                    box.getCenter(center);
                    model.position.x = position.x - center.x;
                    model.position.z = position.z - center.z;
                    model.position.y = position.y - box.min.y;
                }

                console.log(` Runway model loaded and shortened on ${axis}-axis by factor ${shortenFactor}`);

                game.runway = model;
                game.scene.add(model);
                resolve(model);
            },
            (xhr) => {
                if (xhr && xhr.total) {
                    const progress = (xhr.loaded / xhr.total * 100).toFixed(0);
                    console.log(`Runway loading: ${progress}%`);
                }
            },
            (error) => {
                console.error(' Error loading runway.glb', error);
                reject(error);
            }
        );
    });
}

// Simplified sky: create an inside-facing skysphere (fast, reliable)
// Options: { radius, color, texturePath, segments }
export function loadSkybox(scene, options = {}) {
    return new Promise((resolve, reject) => {
        // Loads the GLB skybox model and adds it to the scene.
        // options: { path, scale, name }
        const { path = 'assets/models/skybox.glb', scale = 1000, name = 'SkyboxModel' } = options;

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
                    console.error(' loadSkybox: GLTF loaded but no scene root in', path);
                    reject(new Error('No scene root in skybox'));
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
                resolve(skybox);
            },
            (xhr) => {
                if (xhr && xhr.total) {
                    const progress = (xhr.loaded / xhr.total * 100).toFixed(0);
                    console.log(`Skybox loading: ${progress}%`);
                }
            },
            (err) => {
                console.error(' Error loading skybox model from', path, err);
                reject(err);
            }
        );
    });
}


