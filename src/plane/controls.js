// controls.js
export function setupControls(plane) {
  const speed = 0.1;
  const turnSpeed = 0.05;

  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowUp': // Move forward
        plane.position.z -= speed * Math.cos(plane.rotation.y);
        plane.position.x -= speed * Math.sin(plane.rotation.y);
        break;
      case 'ArrowDown': // Move backward
        plane.position.z += speed * Math.cos(plane.rotation.y);
        plane.position.x += speed * Math.sin(plane.rotation.y);
        break;
      case 'ArrowLeft': // Rotate left
        plane.rotation.y += turnSpeed;
        break;
      case 'ArrowRight': // Rotate right
        plane.rotation.y -= turnSpeed;
        break;
      case 'w': // Move up
        plane.position.y += speed;
        break;
      case 's': // Move down
        plane.position.y -= speed;
        break;
    }
  });
}
