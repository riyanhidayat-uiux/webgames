'use strict';
// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcfe8ff, 28, 100);
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a6a40, 0.85); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(-6, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 12, bottom: -14, near: 1, far: 40 });
scene.add(sun); scene.add(sun.target);

const LANES = [-2.1, 0, 2.1];
