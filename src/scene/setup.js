import * as THREE from 'three';

export function setupScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x88ccee, 0.0012);
    return scene;
}

export function setupLighting(scene) {
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    scene.add(sunLight);

    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    return sunLight;
}

export function setupRenderer(containerId) {
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x88ccee);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById(containerId).appendChild(renderer.domElement);
    return renderer;
}

export function setupCamera() {
    return new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 3000);
}
