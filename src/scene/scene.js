    // Load Ground Model 
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
