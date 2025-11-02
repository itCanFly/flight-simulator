import * as THREE from 'three';
import { createFuelCan } from '../fuelTank.js';
import { getWaypointsForLevel } from '../scene/waypoints.js';
import { HUD } from '../ui/hud.js';

export function spawnFuelCans(game) {
    const { scene, fuelCans } = game;
    const waypoints = getWaypointsForLevel(game.level);

    fuelCans.forEach(c => scene.remove(c.group));
    game.fuelCans = [];

    const curve = new THREE.CatmullRomCurve3(waypoints, false, 'catmullrom', 0.2);
    const numCans = 5 - game.level ;

    for (let i = 1; i <= numCans; i++) {
        const t = i / (numCans + 1);
        const pos = curve.getPoint(t);
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
