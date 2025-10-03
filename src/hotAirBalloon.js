import * as THREE from "three";


export function createHotAirBalloon(radius = 2, segments = 32) {
    const group = new THREE.Group();

    const balloonGeometry = new THREE.SphereGeometry(radius, segments, segments);
    const balloonMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.8
    });
    const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);

    const stripes = new THREE.Group();
    const stripeCount = 12;
    for (let i = 0; i < stripeCount; i++) {
        const stripeGeometry = new THREE.CylinderGeometry(
            radius * 1.01,
            radius * 1.01,
            radius * 2,
            segments,
            1,
            true,
            i * (Math.PI * 2 / stripeCount),
            Math.PI * 2 / (stripeCount * 2)
        );
        const stripeMaterial = new THREE.MeshStandardMaterial({
            color: i % 2 === 0 ? 0xff0000 : 0xffffff,
            side: THREE.DoubleSide
        });
        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
        stripe.rotation.x = Math.PI / 2;
        stripes.add(stripe);
    }

    balloon.position.y = radius * 2;
    stripes.position.y = radius * 2;
    group.add(balloon);
    group.add(stripes);

    const basketHeight = radius * 0.75;
    const basketGeometry = new THREE.CylinderGeometry(radius * 0.3, radius * 0.4, basketHeight, 8);
    const basketMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const basket = new THREE.Mesh(basketGeometry, basketMaterial);
    basket.position.y = basketHeight / 2;
    group.add(basket);

    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ropeGeo = new THREE.CylinderGeometry(0.03, 0.03, radius * 1.5, 8);

    const ropePositions = [
        [0.5 * radius, radius * 1.25, 0.5 * radius],
        [-0.5 * radius, radius * 1.25, 0.5 * radius],
        [0.5 * radius, radius * 1.25, -0.5 * radius],
        [-0.5 * radius, radius * 1.25, -0.5 * radius]
    ];

    ropePositions.forEach(pos => {
        const rope = new THREE.Mesh(ropeGeo, ropeMat);
        rope.position.set(pos[0], pos[1], pos[2]);
        rope.rotation.x = Math.PI / 2;
        group.add(rope);
    });

    return group;
}