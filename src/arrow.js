import * as THREE from "three";

/**
 * 🌀 Creates a smooth, bent 3D arrow (cube-style) between two points.
 *
 * @param {THREE.Vector3} start - Start position of the arrow
 * @param {THREE.Vector3} end - End position of the arrow
 * @param {number} bend - Bend intensity (0 = straight line)
 * @param {number} thickness - Thickness of the arrow body
 * @returns {THREE.Group} Arrow group
 */
export function createCurvedArrow(start, end, bend = 0.3, thickness = 0.4) {
  const group = new THREE.Group();

  // Compute direction & control point
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  let perp = new THREE.Vector3().crossVectors(dir, up);
  if (perp.length() < 0.001) perp = new THREE.Vector3(1, 0, 0);
  perp.normalize();

  const control = mid.clone().addScaledVector(perp, bend * length);

  // Curve path
  const curve = new THREE.QuadraticBezierCurve3(start, control, end);
  const points = curve.getPoints(50);

  // Create blocky segments along the curve
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    metalness: 0.4,
    roughness: 0.5,
  });

  const boxDepth = length / points.length;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segmentDir = new THREE.Vector3().subVectors(p2, p1).normalize();

    const boxGeometry = new THREE.BoxGeometry(thickness, thickness, boxDepth);
    const box = new THREE.Mesh(boxGeometry, material);

    const midSeg = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    box.position.copy(midSeg);

    const quat = new THREE.Quaternion();
    quat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), segmentDir);
    box.quaternion.copy(quat);

    group.add(box);
  }

  // Cube head
  const headSize = thickness * 3;
  const headGeometry = new THREE.BoxGeometry(headSize, headSize, headSize * 2);
  const head = new THREE.Mesh(headGeometry, material);
  head.position.copy(end);
  head.lookAt(control);
  group.add(head);

  return group;
}

/**
 * ➡️ Creates a straight, cube-like 3D arrow between two points.
 *
 * @param {THREE.Vector3} start - Start position
 * @param {THREE.Vector3} end - End position
 * @param {number} thickness - Shaft width/height
 * @returns {THREE.Group} Arrow group
 */
export function createStraightArrow(start, end, thickness = 1.4) {
  const group = new THREE.Group();

  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  dir.normalize();

  const material = new THREE.MeshStandardMaterial({
    color: 0x00ccff,
    metalness: 0.4,
    roughness: 0.5,
  });

  // Shaft (rectangular box)
  const shaftLength = length - thickness * 2;
  const shaftGeometry = new THREE.BoxGeometry(thickness, thickness, shaftLength);
  const shaft = new THREE.Mesh(shaftGeometry, material);
  shaft.position.copy(start).addScaledVector(dir, shaftLength / 2);
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  group.add(shaft);

  // Head (cube tip)
  const headSize = thickness * 3;
  const headGeometry = new THREE.BoxGeometry(headSize, headSize, headSize * 2);
  const head = new THREE.Mesh(headGeometry, material);
  head.position.copy(end);
  head.quaternion.copy(shaft.quaternion);
  group.add(head);

  return group;
}
