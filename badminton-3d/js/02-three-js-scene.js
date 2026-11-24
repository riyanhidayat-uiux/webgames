'use strict';
// ---------- three.js: scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a1230);
scene.fog = new THREE.Fog(0x0a1230, 28, 70);
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 200);
scene.add(new THREE.HemisphereLight(0xdde8ff, 0x1a2540, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(-6, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 12, bottom: -12, near: 1, far: 40 });
scene.add(sun);

(() => {
  const W = 1000, H = 1700, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), X = v => W / 2 + v * 100, Z = v => H / 2 + v * 100;
  x.fillStyle = '#17503f'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#1e66b3'; x.fillRect(X(-HW - 0.9), Z(-HL - 0.9), (HW + 0.9) * 200, (HL + 0.9) * 200);
  x.fillStyle = '#2678cf'; x.fillRect(X(-HW), Z(-HL), HW * 200, HL * 200);
  x.strokeStyle = '#fff'; x.lineWidth = 5;
  x.strokeRect(X(-HW), Z(-HL), HW * 200, HL * 200);
  [-1.98, 1.98].forEach(z => { x.beginPath(); x.moveTo(X(-HW), Z(z)); x.lineTo(X(HW), Z(z)); x.stroke(); });
  [[-HL, -1.98], [1.98, HL]].forEach(([a, b]) => { x.beginPath(); x.moveTo(X(0), Z(a)); x.lineTo(X(0), Z(b)); x.stroke(); });
  const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 17), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0x0c1a30, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
  // net
  const nc = document.createElement('canvas'); nc.width = 512; nc.height = 64;
  const n = nc.getContext('2d');
  n.strokeStyle = 'rgba(240,240,240,.75)'; n.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += 8) { n.beginPath(); n.moveTo(i, 0); n.lineTo(i, 64); n.stroke(); }
  for (let j = 0; j <= 64; j += 8) { n.beginPath(); n.moveTo(0, j); n.lineTo(512, j); n.stroke(); }
  n.fillStyle = '#fff'; n.fillRect(0, 0, 512, 9);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 + 0.9, 0.76), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(nc), transparent: true, side: THREE.DoubleSide }));
  net.position.set(0, NET_H - 0.38, 0); scene.add(net);
  const postM = new THREE.MeshStandardMaterial({ color: 0xcfd6e6, metalness: 0.5, roughness: 0.4 });
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, NET_H + 0.05, 10), postM); p.position.set(s * (HW + 0.45), (NET_H + 0.05) / 2, 0); p.castShadow = true; scene.add(p); });
  // dinding & lampu stadion
  const wallM = new THREE.MeshStandardMaterial({ color: 0x101c44, roughness: 1 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 14), wallM); back.position.set(0, 7, -17); scene.add(back);
  const lm = new THREE.MeshBasicMaterial({ color: 0xcfe0ff });
  for (let i = -3; i <= 3; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.5), lm); l.position.set(i * 5, 11, -3 + (Math.abs(i) % 2) * 2); scene.add(l); }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(40, 1.1), new THREE.MeshBasicMaterial({ color: 0x244ca8 })); banner.position.set(0, 1.0, -16.9); scene.add(banner);
})();

// pemain
function makeRacket() {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.4 });
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), m); handle.position.y = 0.25; g.add(handle);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 8, 24), new THREE.MeshStandardMaterial({ color: 0xe0e6f2, metalness: 0.4, roughness: 0.3 }));
  head.scale.set(1, 1.3, 1); head.position.y = 0.72; g.add(head);
  const str = new THREE.Mesh(new THREE.CircleGeometry(0.17, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
  str.scale.set(1, 1.3, 1); str.position.y = 0.72; g.add(str);
  return g;
}
function makePlayerMesh(col) {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.7 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.75, 14), body); torso.position.y = 1.05; torso.castShadow = true; g.add(torso);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf2f4fa })); hip.position.y = 0.66; g.add(hip);
  const legs = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.62, 8), new THREE.MeshStandardMaterial({ color: 0xf2f4fa })); l.position.set(s * 0.1, 0.32, 0); l.castShadow = true; g.add(l); return l; });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 12), skin); head.position.y = 1.62; head.castShadow = true; g.add(head);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 14), body); band.position.y = 1.68; g.add(band);
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.55, 8), skin); armL.position.set(-0.32, 1.1, 0.05); armL.rotation.z = 0.25; g.add(armL);
  const arm = new THREE.Group(); arm.position.set(0.3, 1.32, 0.05);
  const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.5, 8), skin); armR.position.y = -0.2; armR.rotation.z = -0.1; arm.add(armR);
  const racket = makeRacket(); racket.position.set(0.04, -0.4, 0.05); racket.rotation.x = -0.4; arm.add(racket);
  g.add(arm);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; g.add(sh);
  g.userData = { arm, legs, racket };
  scene.add(g);
  return g;
}

// kok
const shuttle = new THREE.Group();
(() => {
  const cork = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshStandardMaterial({ color: 0xf3e2b5, roughness: 0.5 })); cork.position.y = 0.02;
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.15, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x888888, side: THREE.DoubleSide, roughness: 0.6 })); skirt.position.y = -0.075;
  shuttle.add(cork); shuttle.add(skirt); shuttle.scale.setScalar(2.4); shuttle.traverse(o => { o.castShadow = true; });
})();
scene.add(shuttle);
const shuttleGlow = new THREE.PointLight(0xffffff, 0.5, 4); shuttle.add(shuttleGlow);
const sShadow = new THREE.Mesh(new THREE.CircleGeometry(0.22, 14), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.4 }));
sShadow.rotation.x = -Math.PI / 2; sShadow.position.y = 0.02; scene.add(sShadow);
const TRN = 20, trailPos = new Float32Array(TRN * 3), trailGeo = new THREE.BufferGeometry();
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.55 }));
trail.frustumCulled = false; scene.add(trail);
const trailHist = [];

// partikel
const PART = [];
for (let i = 0; i < 60; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1 });
}
function burst(x, y, z, n, colors, speed = 3) {
  for (const p of PART) {
    if (n <= 0) break; if (p.life > 0) continue; n--;
    const a = Math.random() * 6.283, e = Math.random() * 3.14 - 1.2, s = (0.4 + Math.random()) * speed;
    p.vx = Math.cos(a) * Math.cos(e) * s; p.vz = Math.sin(a) * Math.cos(e) * s; p.vy = Math.sin(e) * s + 1.5;
    p.life = p.max = 0.4 + Math.random() * 0.5;
    p.m.position.set(x, y, z); p.m.material.color.set(colors[(Math.random() * colors.length) | 0]); p.m.visible = true;
  }
}
