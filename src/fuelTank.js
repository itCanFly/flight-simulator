import * as THREE from "three";

export function createFuelCan(options = {}) {
  const opts = Object.assign({
    size: 1,
    color: '#ff3b3b', 
    pickupRadius: null,
    onPickup: () => {},
    idleAmplitude: 0.1,
    idleSpeed: 1.5,
  }, options);

  if (opts.pickupRadius === null) opts.pickupRadius = 1.5 * opts.size;

  const group = new THREE.Group();
  group.name = 'fuelCan';
  group.userData.collected = false;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: opts.color,
    roughness: 0.3,
    metalness: 0.6,
    emissive: '#220000',
    emissiveIntensity: 0.15,
  });

  const handleMaterial = new THREE.MeshStandardMaterial({
    color: '#cc2020',
    metalness: 0.8,
    roughness: 0.25,
  });

  const labelTexture = makeLabelTexture('FUEL');
  const labelMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    emissive: '#441111',
    emissiveIntensity: 0.3,
    roughness: 0.5,
  });

  const bodyGeometry = makeRoundedBox(0.9 * opts.size, 1.1 * opts.size, 0.35 * opts.size, 0.12 * opts.size, 4);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);

  const handleGeometry = makeRoundedBox(0.5 * opts.size, 0.15 * opts.size, 0.3 * opts.size, 0.05 * opts.size, 3);
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0, 0.6 * opts.size, 0);
  group.add(handle);

  const lid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05 * opts.size, 0.05 * opts.size, 0.3 * opts.size, 12),
    handleMaterial
  );
  lid.rotation.z = Math.PI / 2;
  lid.position.set(0.45 * opts.size, 0.35 * opts.size, 0);
  group.add(lid);

  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.7 * opts.size, 0.3 * opts.size), labelMaterial);
  label.position.set(0, 0, 0.18 * opts.size + 0.002);
  group.add(label);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.9 * opts.size, 12, 12),
    new THREE.MeshBasicMaterial({
      color: '#ff5555',
      transparent: true,
      opacity: 0.15,
    })
  );
  glow.scale.set(1.1, 1., 1.1);
  group.add(glow);

  group.traverse(m => {
    if (m.isMesh) {
      m.castShadow = true;
      m.receiveShadow = true;
    }
  });

  const state = {
    time: Math.random() * 100,
    collected: false,
    pickupTweenT: 0,
    pickupAnimating: false,
    pickupDuration: 0.5,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
  };
  group.userData.startY = null;

  function update(delta, playerPosition) {
    if (state.collected && state.pickupAnimating) {
      state.pickupTweenT += delta / state.pickupDuration;
      const t = Math.min(1, state.pickupTweenT);
      const et = 1 - Math.pow(1 - t, 3);
      group.scale.setScalar(Math.max(0.001, 1 - et));
      group.rotation.y += delta * 6;
      if (t >= 1) {
        group.visible = false;
        state.pickupAnimating = false;
        try { opts.onPickup(); } catch (e) {}
      }
      return;
    }

    state.time += delta * opts.idleSpeed;
    if (group.userData.startY !== null) {
      group.position.y = group.userData.startY + Math.sin(state.time) * opts.idleAmplitude;
    }
    group.rotation.y += delta * 0.5;

    if (playerPosition && !state.collected) {
      const worldPos = new THREE.Vector3();
      group.getWorldPosition(worldPos);
      if (worldPos.distanceTo(playerPosition) < opts.pickupRadius) {
        pickup(playerPosition);
      }
    }
  }

  function pickup(playerPosition) {
    state.collected = true;
    state.pickupAnimating = true;
    state.pickupTweenT = 0;
  }

  function dispose() {
    labelTex.dispose();
    group.traverse(m => {
      if (m.isMesh) {
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      }
    });
  }

  group.userData.update = update;
  group.userData.dispose = dispose;
  return { group, update, dispose };
}

function makeRoundedBox(w, h, d, r, smoothness) {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const radius = r - eps;
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, h - radius * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(w - radius * 2, h - radius * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(w - radius * 2, eps, eps, 0, -Math.PI / 2, true);

  const extrudeSettings = {
    depth: d - radius * 2,
    bevelEnabled: true,
    bevelSegments: smoothness,
    steps: 1,
    bevelSize: radius,
    bevelThickness: radius,
    curveSegments: smoothness,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

function makeLabelTexture(text = 'FUEL') {
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#fdd835';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#111';
  ctx.font = `bold ${Math.round(h * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);

  return new THREE.CanvasTexture(c);
}
