import * as THREE from 'three';
import { createStraightArrow } from '../arrow.js';
import { win } from "../items/gameflow";
export const waypoints = [
            new THREE.Vector3(1800, 0.995, -800),
            new THREE.Vector3(1742, 92, -236),
            new THREE.Vector3(-125.611, 365.464, -558.506),
            new THREE.Vector3(-1706.841, 294.921, -2033.331)
        ];
export function createArrows(scene) {
    const arrows = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
        const arrow = createStraightArrow(waypoints[i], waypoints[i + 1]);
        arrows.push(arrow);
        scene.add(arrow);
    }
    return arrows;
}

export function createRotatingCircle(scene) {
    const geo = new THREE.TorusGeometry(30, 3, 16, 100);
    const mat = new THREE.MeshPhongMaterial({ color: 0x00ffff, emissive: 0x0088ff, shininess: 100 });
    const circle = new THREE.Mesh(geo, mat);
    const finalWaypoint = waypoints[waypoints.length - 1];
    circle.position.copy(finalWaypoint);
    circle.rotation.x = Math.PI / 2;
    circle.position.set(-2363, 1, -2304);
    scene.add(circle);
    return circle;
}

    // Check if plane reached current waypoint
export function checkWaypointReached(game) {
        if (game.currentWaypointIndex >=waypoints.length) return;

        const targetWaypoint = waypoints[game.currentWaypointIndex];
        const distance = game.plane.position.distanceTo(targetWaypoint);

        // Check if reached current waypoint
        if (distance < game.waypointReachDistance) {
            
            // Move to next waypoint
            game.currentWaypointIndex++;
            
            // Check if reached final destination
            if (game.currentWaypointIndex >= waypoints.length) {
                console.log("Reached destination!");
                win(game);
            } else {
                // Optional: Remove the arrow we just passed
                if (game.currentWaypointIndex - 1 < game.arrows.length) {
                    const passedArrow = game.arrows[game.currentWaypointIndex - 1];
                    game.scene.remove(passedArrow);
                }
            }

            // (no extra work here)
        }
    }

// Compute shortest distance from point P to segment AB in 3D
export function distanceFromSegment(point, a, b) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ap = new THREE.Vector3().subVectors(point, a);
    const abLen2 = ab.lengthSq();
    if (abLen2 === 0) return ap.length();
    const t = Math.max(0, Math.min(1, ap.dot(ab) / abLen2));
    const proj = new THREE.Vector3().copy(ab).multiplyScalar(t).add(a);
    return proj.distanceTo(point);
}