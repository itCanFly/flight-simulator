import * as THREE from 'three';
import { gameOver } from '../items/gameflow';

export function createRing(position, color = 0x00ffff) {
    const geometry = new THREE.TorusGeometry(50, 4, 16, 100); // radius, tube, radial segments, tubular segments
    const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.4,
        metalness: 0.3,
        roughness: 0.6,
        transparent: true,
        opacity: 0.8,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    
    ring.isCheckpoint = true;
    ring.isPassed = false;
    return ring;
}

export function createCheckpoints(level, scene) {
    const rings = [];

    // Define your path control points
    let controlPoints = [];
    if (level === 1) {
        controlPoints = [
            new THREE.Vector3(1800, 1, -800),
            new THREE.Vector3(1742, 92, -236),
            new THREE.Vector3(-125, 365, -558),
            new THREE.Vector3(-1706, 295, -2033),
        ];
    } else if (level === 2) {
        controlPoints = [
            new THREE.Vector3(1800, 10, -900),
            new THREE.Vector3(1900, 60, -950),
            new THREE.Vector3(2000, 40, -1100),
            new THREE.Vector3(2100, 70, -1300),
            new THREE.Vector3(2200, 80, -1500),
        ];
    } else if (level === 3) {
        controlPoints = [
            new THREE.Vector3(1800, 10, -900),
            new THREE.Vector3(1850, 30, -950),
            new THREE.Vector3(1900, 50, -1000),
            new THREE.Vector3(2000, 60, -1150),
            new THREE.Vector3(2100, 80, -1300),
            new THREE.Vector3(2200, 90, -1500),
            new THREE.Vector3(2400, 120, -1800),
        ];
    }

    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.2);

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const curveLine = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveLine);

 
    const segments = 10 + level * 5; 
    const curvePoints = curve.getPoints(segments);

    for (let i = 0; i < curvePoints.length; i++) {
        const position = curvePoints[i];
        const ring = createRing(position, i === curvePoints.length - 1 ? 0xffaa00 : 0x00ffff);

        if (i < curvePoints.length - 1) {
            const next = curvePoints[i + 1];
            const dir = new THREE.Vector3().subVectors(next, position).normalize();
            ring.lookAt(position.clone().add(dir));
        }

        rings.push(ring);
        scene.add(ring);
    }

    return rings;
}


export function handleCheckpoints(game) {
    if (!game.checkpoints || game.currCheckpointIndex >= game.checkpoints.length) return;

    const ring = game.checkpoints[game.currCheckpointIndex];
    const planePos = game.plane.position;
    const distance = planePos.distanceTo(ring.position);

    
    if (distance < 50 && !ring.isPassed) {
        ring.isPassed = true;
        ring.material.color.set(0x00ff00);
        game.score += 1; 
        game.currCheckpointIndex++;

        
        if (game.currCheckpointIndex >= game.checkpoints.length) {
            console.log("🏁 Level Complete!");

            game.checkpoints.forEach(ring => {
                game.scene.remove(ring);

                if (ring.geometry) ring.geometry.dispose();
                if (ring.material) {
                    if (ring.material.map) ring.material.map.dispose();
                    ring.material.dispose();
                }
            });

            game.checkpoints = [];
        }
    }

    if (game.checkpoints) {
        game.checkpoints.forEach(ring => {
            ring.rotation.z += 0.01;
            ring.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.05);
        });
    }

}