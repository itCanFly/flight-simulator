import * as THREE from 'three';
import { createFuelCan } from '../fuelTank.js';
import { HUD } from '../ui/hud.js';

export function spawnFuelCans(game) {
    const { scene, fuelCans } = game;
    const waypoints = [
                new THREE.Vector3(1800, 0.995, -800),
                new THREE.Vector3(1742, 92, -236),
                new THREE.Vector3(-125.611, 365.464, -558.506),
                new THREE.Vector3(-1706.841, 294.921, -2033.331)
            ];
    fuelCans.forEach(c => scene.remove(c.group));
    game.fuelCans = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        const pos = new THREE.Vector3().lerpVectors(start, end, 0.5);
        pos.y += 10;

        const pickupAmount = 15;
        const { group, update } = createFuelCan({
            size: 50,
            onPickup: () => {
                game.stats.fuel = Math.min(100, game.stats.fuel + pickupAmount);
                try { HUD.showFuelPickup(pickupAmount); } catch (e) {}
                // Play refuel sound when fuel tank is acquired
                try { game.music.playRefuel(); } catch (e) {}
            }
        });

        group.position.copy(pos);
        scene.add(group);
        game.fuelCans.push({ group, update });
    }
}
