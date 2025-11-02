import * as THREE from 'three';
import { win, lose } from '../items/gameflow';
import { getWaypointsForLevel } from './waypoints';

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
            
    const waypoints = getWaypointsForLevel(level);

    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.2);
    const segments = 5 + level * 5;
    const curvePoints = curve.getPoints(segments);

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
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
        
    if (!game.checkpoints) return;

    const planePos = game.plane.position.clone();

    for (let i = 0; i < game.checkpoints.length; i++) {
        const bracket = game.checkpoints[i];
        if (bracket.isPassed) continue; 
        const localPos = bracket.worldToLocal(planePos.clone());
        const forwardThreshold = 10;
        const sideThreshold = 60;
        const verticalThreshold = 80;

        const passedThrough =
            Math.abs(localPos.z) < forwardThreshold &&
            Math.abs(localPos.x) < sideThreshold &&
            Math.abs(localPos.y) < verticalThreshold;

        if (passedThrough && !bracket.isPassed) {
            bracket.isPassed = true;
            console.log(`✅ Passed checkpoint ${i}!`);

            bracket.traverse(child => {
                if (child.material) child.material.emissive.set(0x00ff00);
            });

            game.score += 100;
            game.currCheckpointIndex = i + 1; 
        }
    }

    const lastIndex = game.checkpoints.length - 1;
    const lastCheckpoint = game.checkpoints[lastIndex];

    const totalCheckpoints = game.checkpoints.length;
    const passedCheckpoints = game.checkpoints.filter(cp => cp.isPassed).length;

    const percentPassed = (passedCheckpoints / totalCheckpoints) * 100;
    const winThreshold = 70 + (game.level*10) ;

    if (lastCheckpoint.isPassed){
        if (percentPassed > winThreshold){
            win(game);
        }
        else{
            lose(game);
        }
    }

    const allPassed = game.checkpoints.every(cp => cp.isPassed);
    
    if (allPassed) {
        console.log("🏁 Level Complete!");
        win(game);
    }

    if (game.checkpoints) {
        const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.1;
        game.checkpoints.forEach(cp => cp.scale.setScalar(pulse));
    }
}
