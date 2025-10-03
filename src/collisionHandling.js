function getObstacleBoundingSphere(obstacleGroup, radius){
    const sphere = new THREE.Sphere();

    const obstacleMesh = obstacle.children[0];
    const position = obstacle.position.clone().add(obstacleMesh.position);

    sphere.center.copy(position);
    sphere.radius = radius;
    return sphere;

}

export function getVehicleBoundingSphere(vehicle, radius) {
    const sphere = new THREE.Sphere();
    sphere.center.copy(vehicle.position);
    sphere.radius = radius;
    return sphere;
}

export function checkSphereCollision(sphere1, sphere2) {
    const distance = sphere1.center.distanceTo(sphere2.center);
    return distance < (sphere1.radius + sphere2.radius);
}

export function checkVehicleBalloonCollision(vehicle, balloons, vehicleRadius = 1.5, balloonRadius = 2) {
    const vehicleSphere = getVehicleBoundingSphere(vehicle, vehicleRadius);
    for (let i = 0; i < balloons.length; i++) {
        const balloonSphere = getObstacleBoundingSphere(balloons[i], balloonRadius);
        if (checkSphereCollision(vehicleSphere, balloonSphere)) {
            return true;
        }
    }
    return false;
}