import * as THREE from 'three';
import { gameOver } from '../items/gameflow';

export function createBracketPair(position, color = 0x0a3766) {
    const group = new THREE.Group();

    const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1.5,
        metalness: 0.7,
        roughness: 0.2,
        transparent: true,
        opacity: 0.95,
    });

    const barLength = 50;
    const barThickness = 4;
    const barHeight = 100;

    const verticalBarGeo = new THREE.BoxGeometry(barThickness, barHeight, barThickness);
    const horizontalBarGeo = new THREE.BoxGeometry(barLength, barThickness, barThickness);

    const leftGroup = new THREE.Group();
    const leftTop = new THREE.Mesh(horizontalBarGeo, material);
    const leftBottom = new THREE.Mesh(horizontalBarGeo, material);
    const leftSide = new THREE.Mesh(verticalBarGeo, material);

    leftTop.position.set(0, barHeight / 2, 0);
    leftBottom.position.set(0, -barHeight / 2, 0);
    leftSide.position.set(-barLength / 2, 0, 0);

    const bracketGap = 120;

    leftGroup.add(leftTop, leftBottom, leftSide);
    leftGroup.position.x = -bracketGap;

    const rightGroup = new THREE.Group();
    const rightTop = new THREE.Mesh(horizontalBarGeo, material);
    const rightBottom = new THREE.Mesh(horizontalBarGeo, material);
    const rightSide = new THREE.Mesh(verticalBarGeo, material);

    rightTop.position.set(0, barHeight / 2, 0);
    rightBottom.position.set(0, -barHeight / 2, 0);
    rightSide.position.set(barLength / 2, 0, 0);

    rightGroup.add(rightTop, rightBottom, rightSide);
    rightGroup.position.x = bracketGap;

    group.add(leftGroup, rightGroup);
    group.position.copy(position);

    group.isCheckpoint = true;
    group.isPassed = false;

    return group;
}

export function createCheckpoints(level, scene) {
    const checkpoints = [];

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

    const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.3);
    const segments = 8 + level * 5;
    const curvePoints = curve.getPoints(segments);

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(200));
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0x008800 });
    const curveLine = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveLine);

    for (let i = 0; i < curvePoints.length; i++) {
        const position = curvePoints[i];
        const isLast = i === curvePoints.length - 1;

        const color = isLast ? 0xFFD700 : 0x0a3766;
        const bracketPair = createBracketPair(position, color);

        if (i < curvePoints.length - 1) {
            const next = curvePoints[i + 1];
            const dir = new THREE.Vector3().subVectors(next, position).normalize();
            bracketPair.lookAt(position.clone().add(dir));
        }

        checkpoints.push(bracketPair);
        scene.add(bracketPair);
    }

    return checkpoints;
}

export function handleCheckpoints(game) {
    if (!game.checkpoints || game.currCheckpointIndex >= game.checkpoints.length) return;

    const bracket = game.checkpoints[game.currCheckpointIndex];
    const planePos = game.plane.position;

    const dx = planePos.x - bracket.position.x;
    const dz = planePos.z - bracket.position.z;
    const dy = planePos.y - bracket.position.y;

    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    const verticalDist = Math.abs(dy);

    const horizontalThreshold = 120;
    const verticalThreshold = 60;

    if (horizontalDist < horizontalThreshold && verticalDist < verticalThreshold && !bracket.isPassed) {
        bracket.isPassed = true;
        game.score += 1;

        bracket.traverse(child => {
            if (child.material) child.material.emissive.set(0x00ff00);
        });

        setTimeout(() => {
            bracket.traverse(child => {
                if (child.material) {
                    const targetColor = game.currCheckpointIndex === game.checkpoints.length - 1 ? 0xFFD700 : 0x0a3766;
                    child.material.emissive.set(targetColor);
                }
            });
        }, 800);

        game.currCheckpointIndex++;

        if (game.currCheckpointIndex >= game.checkpoints.length) {
            console.log("🏁 Level Complete!");
            gameOver(game);
        }
    }

    const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.01;
    game.checkpoints.forEach(cp => {
        cp.scale.setScalar(pulse);
    });
}
