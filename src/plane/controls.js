export function setupControls(plane) {
  const keys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false,
  };

  window.addEventListener("keydown", (e) => {
    if (e.code in keys) keys[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.code in keys) keys[e.code] = false;
  });

  let verticalVelocity = 0;
  const gravity = -0.0005;    // very gentle downward pull
  const liftStrength = 0.002; // holding UP keeps you in the air
  const forwardSpeed = 0.05;   // constant forward movement

  return function updateControls() {
    // Apply lift when UP is pressed
    if (keys.ArrowUp) {
      verticalVelocity += liftStrength;
    }

    // Apply gravity
    verticalVelocity += gravity;

    // Update vertical position
    plane.position.y += verticalVelocity;

    // Move plane forward at constant speed
    plane.translateZ(-forwardSpeed);

    // Steering
    if (keys.ArrowLeft) plane.rotation.y += 0.002;
    if (keys.ArrowRight) plane.rotation.y -= 0.002;

    // Don’t let plane fall through the ground
    if (plane.position.y < 1) {
      plane.position.y = 1;
      verticalVelocity = 0;
    }
  };
}
