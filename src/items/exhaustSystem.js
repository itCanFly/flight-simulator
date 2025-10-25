// exhaustSystem.js
import * as THREE from 'three';
import { ExhaustShaderParticles } from '../fire.js';

export function spawnExhausts(game) {
    const { scene, plane } = game;

    if (!plane) return;

    const exhaustLeft = new ExhaustShaderParticles(scene, {
        count: 300,
        lifetime: 2,
        size: 20,
        fireColor: new THREE.Color(0xff6600),
        smokeColor: new THREE.Color(0x555555)
    });

    const exhaustRight = new ExhaustShaderParticles(scene, {
        count: 300,
        lifetime: 2,
        size: 20,
        fireColor: new THREE.Color(0xff6600),
        smokeColor: new THREE.Color(0x555555)
    });

    game.exhausts = { left: exhaustLeft, right: exhaustRight };

    game.updateExhausts = () => {
        if (!plane) return;

        const leftOffset = new THREE.Vector3(-1.2, 3.5, -4.2);
        const rightOffset = new THREE.Vector3(1.2, 3.5, -4.2);

        leftOffset.applyQuaternion(plane.quaternion);
        rightOffset.applyQuaternion(plane.quaternion);

        exhaustLeft.points.position.copy(plane.position).add(leftOffset);
        exhaustLeft.points.quaternion.copy(plane.quaternion);
        exhaustLeft.update();

        exhaustRight.points.position.copy(plane.position).add(rightOffset);
        exhaustRight.points.quaternion.copy(plane.quaternion);
        exhaustRight.update();
    };
}
