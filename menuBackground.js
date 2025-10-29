// src/menuBackground.js
import * as THREE from "three";
import { createPlane } from "./src/plane.js";
// import { loadGround } from "./scene.js"; // whatever you need

export function initMenuBackground() {
  // === Scene Setup ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // === Add Plane / Ground ===
  const plane = createPlane();
  scene.add(plane);
  // loadGround({ scene }); // optional, if you want a model

  // === Camera Animation Setup ===
  let angle = 0;
  let radius = 10;
  let rotationPhase = 0;
  const baseSpeed = 0.01;
  const minRadius = 10;
  const maxRadius = 20;
  const easing = 0.02;

  function menuAnimate() {
    requestAnimationFrame(menuAnimate);

    switch(rotationPhase) {
      case 0: angle += baseSpeed; if(angle >= Math.PI*2) rotationPhase=1; break;
      case 1: radius += (maxRadius-radius)*easing; if(Math.abs(radius-maxRadius)<0.01) rotationPhase=2; angle=Math.PI*2; break;
      case 2: angle -= baseSpeed; if(angle <=0) rotationPhase=3; break;
      case 3: radius += (minRadius-radius)*easing; if(Math.abs(radius-minRadius)<0.01) rotationPhase=0; angle=0; break;
    }

    camera.position.x = plane.position.x + radius*Math.sin(angle);
    camera.position.z = plane.position.z + radius*Math.cos(angle);
    camera.position.y = 5 + (radius-minRadius)*0.2;
    camera.lookAt(plane.position);

    renderer.render(scene, camera);
  }

  menuAnimate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
