import * as THREE from 'three';
import { createStraightArrow } from '../arrow.js';
import { win } from "../items/gameflow";

export const waypointsLevel1 = [
    new THREE.Vector3(1800, 1, -400),
    new THREE.Vector3(1800, 80, 400),
    new THREE.Vector3(1800, 150, 1000),
    new THREE.Vector3(1800, 220, 1400),

    new THREE.Vector3(1700, 220, 1600),
    new THREE.Vector3(1500, 220, 1750),
    new THREE.Vector3(800, 220, 1750),
    new THREE.Vector3(0, 220, 1750),
    new THREE.Vector3(-400, 220, 1800),

    new THREE.Vector3(-550, 225, 1780),
    new THREE.Vector3(-670, 228, 1720),
    new THREE.Vector3(-750, 230, 1650),

    new THREE.Vector3(-800, 230, 1600),
    new THREE.Vector3(-800, 230, 1400),
    new THREE.Vector3(-900, 240, 800),
    new THREE.Vector3(-900, 250, 0),
    new THREE.Vector3(-1000, 250, -600),
    new THREE.Vector3(-1000, 260, -1000),
    // new THREE.Vector3(900, 220, 1600),
    // new THREE.Vector3(800, 220, 1400),
    // new THREE.Vector3(800, 220, 800),
    // new THREE.Vector3(800, 220, 200),
    // new THREE.Vector3(800, 220, -400),
];

export const waypointsLevel2 = [
    new THREE.Vector3(1800, 10, -900),
    new THREE.Vector3(1900, 60, -950),
    new THREE.Vector3(2000, 40, -1100),
    new THREE.Vector3(2100, 70, -1300),
    new THREE.Vector3(2200, 80, -1500),
];

export const waypointsLevel3 = [
    new THREE.Vector3(1800, 10, -900),
    new THREE.Vector3(1850, 30, -950),
    new THREE.Vector3(1900, 50, -1000),
    new THREE.Vector3(2000, 60, -1150),
    new THREE.Vector3(2100, 80, -1300),
    new THREE.Vector3(2200, 90, -1500),
    new THREE.Vector3(2400, 120, -1800),
];

export function getWaypointsForLevel(level) {
    switch (level) {
        case 1: return waypointsLevel1;
        case 2: return waypointsLevel2;
        case 3: return waypointsLevel3;
        default: return waypointsLevel1;
    }
}

// export function createArrows(scene) {
//     const arrows = [];
//     for (let i = 0; i < waypoints.length - 1; i++) {
//         const arrow = createStraightArrow(waypoints[i], waypoints[i + 1]);
//         arrows.push(arrow);
//         scene.add(arrow);
//     }
//     return arrows;
// }

// export function createRotatingCircle(scene) {
//     const geo = new THREE.TorusGeometry(30, 3, 16, 100);
//     const mat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x0088ff, shininess: 100 });
//     const circle = new THREE.Mesh(geo, mat);
//     const finalWaypoint = waypoints[waypoints.length - 1];
//     circle.position.copy(finalWaypoint);
//     circle.rotation.x = Math.PI / 2;
//     circle.position.set(-2363, 1, -2304);
//     scene.add(circle);
//     return circle;
// }

//     // Check if plane reached current waypoint
// export function checkWaypointReached(game) {
//     if (game.currentWaypointIndex >=waypoints.length) return;

//     const targetWaypoint = waypoints[game.currentWaypointIndex];
//     const distance = game.plane.position.distanceTo(targetWaypoint);

//     // Check if reached current waypoint
//     if (distance < game.waypointReachDistance) {
        
//         // Move to next waypoint
//         game.currentWaypointIndex++;
        
//         // Check if reached final destination
//         if (game.currentWaypointIndex >= waypoints.length) {
//             console.log("Reached destination!");
//             win(game);
//         } else {
//             // Optional: Remove the arrow we just passed
//             if (game.currentWaypointIndex - 1 < game.arrows.length) {
//                 const passedArrow = game.arrows[game.currentWaypointIndex - 1];
//                 game.scene.remove(passedArrow);
//             }
//         }
//     }
// }