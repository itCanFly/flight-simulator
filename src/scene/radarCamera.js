import * as THREE from 'three';

export function createRadarCamera() {
    
    const size = 100;
    const aspect = 1.0; 
    const radarCamera = new THREE.OrthographicCamera(
        -size, size,
        size, -size,
        0.1, 1000
    );
    radarCamera.position.set(0, 300, 0); 
    radarCamera.lookAt(new THREE.Vector3(0, 0, 0));
    radarCamera.up.set(0, 0, -1); 
    return radarCamera;
}

export function renderRadar(game) {
    const insetWidth = window.innerWidth / 5;
    const insetHeight = window.innerHeight / 5;

    const cam = game.radarCamera;

    cam.position.set(
        game.plane.position.x,
        game.plane.position.y + 100,
        game.plane.position.z
    );
    cam.lookAt(game.plane.position);

    game.renderer.setViewport(10, 10, insetWidth, insetHeight);
    game.renderer.setScissor(10, 10, insetWidth, insetHeight);
    game.renderer.setScissorTest(true);

    game.renderer.setClearColor(0x002200, 1);

    if (game.radarOverlayMaterial) {
        game.scene.overrideMaterial = game.radarOverlayMaterial;
    }

    game.renderer.render(game.scene, cam);

    game.renderer.setScissorTest(false);
}