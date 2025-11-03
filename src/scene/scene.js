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
                
                // Apply material settings to original model
                model.traverse(obj => {
                    if (obj.isMesh) {
                        obj.castShadow = false;
                        obj.receiveShadow = true;
                        if (obj.material) obj.material.depthWrite = true;
                    }
                });
                
                // Get original model bounds BEFORE any transformation
                let box = new THREE.Box3().setFromObject(model);
                let size = new THREE.Vector3();
                let center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                
                // Store original dimensions
                const tileWidth = size.x;
                const tileDepth = size.z;
                const minY = box.min.y;
                
                // Overlap factor - models will overlap significantly to fuse together
                const overlapFactor = 0.10; // 10% overlap - models will lap heavily into each other
                const fusedWidth = tileWidth * (1 - overlapFactor);
                const fusedDepth = tileDepth * (1 - overlapFactor);
                
                console.log(`Creating fused ground: tile size ${tileWidth.toFixed(2)}x${tileDepth.toFixed(2)}m with ${(overlapFactor*100).toFixed(1)}% overlap (heavy lapping)`);
                
                // Create a group to hold all linked ground segments
                const groundGroup = new THREE.Group();
                groundGroup.name = 'FusedGroundModel';
                
                // Position the main/center model at origin (centered)
                model.position.x = -center.x;
                model.position.z = -center.z;
                model.position.y = -minY; // place lowest at y=0
                
                // Add the center/main model
                groundGroup.add(model);
                
                // Create 4 duplicates positioned with overlap to fuse them together (first ring)
                const duplicates = [
                    { name: 'front', offsetX: 0, offsetZ: -fusedDepth },        // Front (-Z) with overlap
                    { name: 'back', offsetX: 0, offsetZ: fusedDepth },          // Back (+Z) with overlap
                    { name: 'left', offsetX: -fusedWidth, offsetZ: 0 },         // Left (-X) with overlap
                    { name: 'right', offsetX: fusedWidth, offsetZ: 0 }          // Right (+X) with overlap
                ];
                
                // Add 4 corner tiles on the shoulders of the side tiles (second ring)
                const cornerDuplicates = [
                    { name: 'frontLeft', offsetX: -fusedWidth, offsetZ: -fusedDepth },     // Front-Left corner
                    { name: 'frontRight', offsetX: fusedWidth, offsetZ: -fusedDepth },     // Front-Right corner
                    { name: 'backLeft', offsetX: -fusedWidth, offsetZ: fusedDepth },       // Back-Left corner
                    { name: 'backRight', offsetX: fusedWidth, offsetZ: fusedDepth }        // Back-Right corner
                ];
                
                // Combine all duplicates
                const allDuplicates = [...duplicates, ...cornerDuplicates];
                
                allDuplicates.forEach((dup) => {
                    const tileModel = model.clone(true); // deep clone
                    tileModel.name = `GroundTile_${dup.name}`;
                    
                    // Position with overlap to fuse the edges
                    tileModel.position.x = -center.x + dup.offsetX;
                    tileModel.position.y = -minY; // Same Y as center
                    tileModel.position.z = -center.z + dup.offsetZ;
                    
                    // Apply aggressive low quality settings to duplicates for optimal performance
                    tileModel.traverse(obj => {
                        if (obj.isMesh) {
                            obj.castShadow = false;
                            obj.receiveShadow = false; // Disable shadow receiving for better performance
                            obj.frustumCulled = true; // Enable frustum culling
                            obj.matrixAutoUpdate = false; // Disable auto matrix updates since position is fixed
                            obj.updateMatrix(); // Update matrix once
                            
                            if (obj.material) {
                                // Clone material to avoid affecting original
                                obj.material = obj.material.clone();
                                
                                obj.material.depthWrite = true;
                                
                                // Aggressive quality reduction
                                if (obj.material.map) {
                                    obj.material.map.minFilter = THREE.NearestFilter; // Lowest quality filtering
                                    obj.material.map.magFilter = THREE.NearestFilter;
                                    obj.material.map.anisotropy = 0; // No anisotropic filtering
                                    obj.material.map.generateMipmaps = false; // Disable mipmaps for performance
                                }
                                
                                // Disable all advanced material features
                                obj.material.flatShading = true;
                                obj.material.fog = true; // Ensure fog affects duplicates
                                
                                // Reduce material precision
                                if (obj.material.normalMap) {
                                    obj.material.normalMap = null; // Remove normal maps
                                }
                                if (obj.material.roughnessMap) {
                                    obj.material.roughnessMap = null; // Remove roughness maps
                                }
                                if (obj.material.metalnessMap) {
                                    obj.material.metalnessMap = null; // Remove metalness maps
                                }
                                if (obj.material.aoMap) {
                                    obj.material.aoMap = null; // Remove ambient occlusion maps
                                }
                                
                                // Simplify lighting calculations
                                obj.material.envMap = null;
                                
                                obj.material.needsUpdate = true;
                            }
                            
                            // Simplify geometry
                            if (obj.geometry) {
                                obj.geometry.computeBoundingSphere();
                                obj.geometry.computeBoundingBox();
                                
                                // Remove unnecessary attributes for performance
                                if (obj.geometry.attributes.normal) {
                                    // Keep normals for basic lighting but mark as static
                                    obj.geometry.attributes.normal.needsUpdate = false;
                                }
                                if (obj.geometry.attributes.uv) {
                                    obj.geometry.attributes.uv.needsUpdate = false;
                                }
                            }
                        }
                    });
                    
                    groundGroup.add(tileModel);
                    console.log(`  Fused ${dup.name} tile (LOW QUALITY) at (${tileModel.position.x.toFixed(2)}, ${tileModel.position.y.toFixed(2)}, ${tileModel.position.z.toFixed(2)})`);
                });
                
                game.ground = groundGroup;
                game.scene.add(groundGroup);
                console.log(` Fused ground created: ${allDuplicates.length + 1} tiles (1 center + 4 sides + 4 corners) with ${(overlapFactor*100).toFixed(1)}% overlap`);
                resolve(groundGroup);
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


