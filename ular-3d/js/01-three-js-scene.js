'use strict';
// ---------- three.js: scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07130d);
scene.fog = new THREE.Fog(0x07130d, 40, 95);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);

scene.add(new THREE.HemisphereLight(0xcfffe0, 0x14301f, 0.75));
const sun = new THREE.DirectionalLight(0xffffff, 0.9);
sun.position.set(-8, 22, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 });
scene.add(sun);

// lantai kotak-kotak
(() => {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const x = c.getContext('2d'), s = 512 / N;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    x.fillStyle = (i + j) % 2 ? '#1c4a2c' : '#216034';
    x.fillRect(i * s, j * s, s, s);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(N, N), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x0a1f14, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.6; ground.receiveShadow = true;
  scene.add(ground);
  // bingkai papan
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.7, emissive: 0x201004 });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x7dff5a });
  const L = N + 1.2;
  [[0, -(N / 2 + 0.3), L, 0.6], [0, N / 2 + 0.3, L, 0.6], [-(N / 2 + 0.3), 0, 0.6, L], [N / 2 + 0.3, 0, 0.6, L]].forEach(([px, pz, sx, sz]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.9, sz), wallMat);
    m.position.set(px, 0.2, pz); m.castShadow = m.receiveShadow = true; scene.add(m);
    const g = new THREE.Mesh(new THREE.BoxGeometry(sx > sz ? sx : 0.12, 0.06, sz > sx ? sz : 0.12), glowMat);
    g.position.set(px + (sx < sz ? (px > 0 ? -0.2 : 0.2) : 0), 0.68, pz + (sz < sx ? (pz > 0 ? -0.2 : 0.2) : 0));
    scene.add(g);
  });
})();

// ular: bola-bola ber-instance
const MAXI = N * N * 2 + 8;
const bodyMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 20, 14), new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.15 }), MAXI);
bodyMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
bodyMesh.castShadow = true; bodyMesh.receiveShadow = true; bodyMesh.frustumCulled = false;
for (let i = 0; i < MAXI; i++) bodyMesh.setColorAt(i, new THREE.Color(0x66dd44));   // harus sebelum count = 0: three r128 memakai `count` untuk ukuran buffer warna
bodyMesh.count = 0;
scene.add(bodyMesh);

// kepala (satu per pemain)
const eyeW = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), eyeB = new THREE.MeshBasicMaterial({ color: 0x111111 });
const heads = [0, 1].map(() => {
  const g = new THREE.Group();
  g.userData.mat = new THREE.MeshStandardMaterial({ color: 0x7dff5a, roughness: 0.3, metalness: 0.1 });
  const hm = new THREE.Mesh(new THREE.SphereGeometry(0.58, 24, 18), g.userData.mat);
  hm.scale.set(1, 0.9, 1.1); hm.castShadow = true; g.add(hm);
  [-1, 1].forEach(sd => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), eyeW); e.position.set(sd * 0.27, 0.2, 0.36); g.add(e);
    const pp = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), eyeB); pp.position.set(sd * 0.27, 0.22, 0.49); g.add(pp);
  });
  g.userData.tongue = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.03, 0.4), new THREE.MeshBasicMaterial({ color: 0xff2d55 }));
  g.userData.tongue.position.set(0, -0.08, 0.78); g.add(g.userData.tongue);
  scene.add(g);
  return g;
});

// apel
const food = new THREE.Group();
const apple = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 16), new THREE.MeshStandardMaterial({ color: 0xff2d2d, roughness: 0.25, emissive: 0x5a0000 }));
apple.castShadow = true; food.add(apple);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6), new THREE.MeshStandardMaterial({ color: 0x5a3a1a }));
stem.position.y = 0.4; food.add(stem);
const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3fd24a }));
leaf.scale.set(1.6, 0.35, 0.8); leaf.position.set(0.14, 0.46, 0); leaf.rotation.z = 0.4; food.add(leaf);
const fLight = new THREE.PointLight(0xff5533, 0.9, 6); fLight.position.y = 0.6; food.add(fLight);
scene.add(food);

// apel emas
const gold = new THREE.Group();
const gem = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), new THREE.MeshStandardMaterial({ color: 0xffd23f, roughness: 0.15, metalness: 0.8, emissive: 0x8a5a00 }));
gem.castShadow = true; gold.add(gem);
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfff08a }));
ring.rotation.x = Math.PI / 2; gold.add(ring);
const gLight = new THREE.PointLight(0xffd23f, 1.2, 7); gLight.position.y = 0.6; gold.add(gLight);
gold.visible = false; scene.add(gold);

// partikel
const PART = [];
for (let i = 0; i < 70; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1 });
}
function burst(x, y, z, n, colors, speed = 4) {
  for (const p of PART) {
    if (n <= 0) break;
    if (p.life > 0) continue;
    n--;
    const a = Math.random() * 6.283, u = Math.random() * 0.9 + 0.1, s = (0.4 + Math.random()) * speed;
    p.vx = Math.cos(a) * s * u; p.vz = Math.sin(a) * s * u; p.vy = (1.5 + Math.random() * 3.5) * (speed / 4);
    p.life = p.max = 0.5 + Math.random() * 0.6;
    p.m.position.set(x, y, z); p.m.material.color.set(colors[(Math.random() * colors.length) | 0]);
    p.m.visible = true; p.m.scale.setScalar(0.7 + Math.random() * 0.9);
  }
}
