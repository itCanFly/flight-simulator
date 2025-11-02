import * as THREE from 'three';


export function setupScene(level = 1) {
    const scene = new THREE.Scene();

    // --- Background & fog per level ---
    if (level === 1) {
        // Day
        scene.background = new THREE.Color(0x87ceeb); // Light blue
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.0008);
    } else {
        // Night (levels 2 and 3)
        scene.background = new THREE.Color(0x000022); // Deep night sky
        scene.fog = new THREE.FogExp2(0x000011, 0.0004);
    }

    return scene;
}

// export function setupLighting(scene) {
//     // const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
//     // sunLight.position.set(100, 200, 100);
//     // sunLight.castShadow = true;
//     // sunLight.shadow.mapSize.width = 1024; // Reduced from 2048 for better performance
//     // sunLight.shadow.mapSize.height = 1024;
//     // sunLight.shadow.camera.near = 0.5;
//     // sunLight.shadow.camera.far = 500;
//     // sunLight.shadow.camera.left = -200;
//     // sunLight.shadow.camera.right = 200;
//     // sunLight.shadow.camera.top = 200;
//     // sunLight.shadow.camera.bottom = -200;
//     // scene.add(sunLight);

//     // const ambient = new THREE.AmbientLight(0xffffff, 0.4);
//     // scene.add(ambient);

//     // return sunLight;
//     // Dim “moonlight”
//     const moonLight = new THREE.DirectionalLight(0xaaaaee, 0.3); // cool light
//     moonLight.position.set(100, 200, 100);
//     moonLight.castShadow = true;
//     moonLight.shadow.mapSize.width = 2048;
//     moonLight.shadow.mapSize.height = 2048;
//     moonLight.shadow.camera.near = 0.5;
//     moonLight.shadow.camera.far = 500;
//     moonLight.shadow.camera.left = -200;
//     moonLight.shadow.camera.right = 200;
//     moonLight.shadow.camera.top = 200;
//     moonLight.shadow.camera.bottom = -200;
//     scene.add(moonLight);

//     // Dim ambient light for overall visibility
//     const ambient = new THREE.AmbientLight(0x222244, 0.2); // dark bluish ambient
//     scene.add(ambient);
//     addStars(scene, 3000, 10000)
//     return moonLight;
// }
export function setupLighting(scene, level = 1) {
    let mainLight, ambient;

    if (level === 1) {
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        // ... setup sunLight
        scene.add(sunLight);

        ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);

        mainLight = sunLight;
    } else {
        const moonLight = new THREE.DirectionalLight(0xaaaaff, 0.35);
        // ... setup moonLight
        scene.add(moonLight);

        ambient = new THREE.AmbientLight(0x222244, 0.25);
        scene.add(ambient);

        addStars(scene, level === 2 ? 2500 : 3500, 10000);

        mainLight = moonLight;
    }

    return mainLight; // <-- important!
}

export function setupRenderer(containerId) {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance",
        stencil: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    renderer.setClearColor(0x88ccee);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById(containerId).appendChild(renderer.domElement);
    return renderer;
}

export function setupCamera(level = 1) {
    const camera = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 0.1, 3000);

    // Slightly different height/angle for night missions
    if (level === 1) {
        camera.position.set(0, 150, 400);
    } else {
        camera.position.set(0, 120, 350);
    }

    return camera;
}

export function addStars(scene, count = 2000, spread = 5000) {
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];

    for (let i = 0; i < count; i++) {
        // Random positions in all directions
        const x = (Math.random() - 0.5) * spread; // left-right
        const y = (Math.random() - 0.5) * spread + 500; // slightly above center
        const z = (Math.random() - 0.5) * spread; // forward-back
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
    return stars;
}




export function createRain(scene, options = {}) {
    const {
        count = 10000,      // number of raindrops
        area = 1000,        // spread of the rain
        speed = 0.2,        // falling speed
        height = 500,       // initial height of drops
        color = 0xaaaaaa    // raindrop color
    } = options;

    const rainGeometry = new THREE.BufferGeometry();
    const rainVertices = [];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * area;
        const y = Math.random() * height;
        const z = (Math.random() - 0.5) * area;
        rainVertices.push(x, y, z);
    }

    rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rainVertices, 3));

    const rainMaterial = new THREE.PointsMaterial({
        color: color,
        size: 1.2,
        transparent: true,
        opacity: 0.6
    });

    const rain = new THREE.Points(rainGeometry, rainMaterial);
    scene.add(rain);

    // Update function to animate rain (call inside your animation loop)
    function updateRain() {
        const positions = rain.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] -= speed;
            if (positions[i] < 0) {
                positions[i] = height + Math.random() * 100;
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
    }

    return { rain, updateRain };
}

