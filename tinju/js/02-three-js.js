'use strict';
// ======================= THREE.JS =======================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x120610); scene.fog = new THREE.Fog(0x120610, 12, 34);
const camera = new THREE.PerspectiveCamera(58, 1, 0.05, 80); const CAM_HOME = new THREE.Vector3(0, 1.62, 2.75);
camera.position.copy(CAM_HOME); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xffeedd, 0x331a22, 0.75));
const spot = new THREE.SpotLight(0xfff0d8, 1.4, 30, 0.75, 0.5); spot.position.set(0, 9, 2); spot.target.position.set(0, 0.8, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); scene.add(spot, spot.target);
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };

// ring
(() => {
  const c = mkCanvas(512, 512), x = c.getContext('2d'); x.fillStyle = '#3a6ac0'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; x.fillRect(i * 64, 0, 64, 512); }
  x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 8; x.strokeRect(36, 36, 440, 440);
  x.fillStyle = 'rgba(255,255,255,.18)'; x.font = 'bold 110px Impact,sans-serif'; x.textAlign = 'center'; x.fillText('TINJU', 256, 290);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.5, 8.6), [0, 0, new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.8 }), 0, 0, 0].map((m, i) => i === 2 ? m : new THREE.MeshStandardMaterial({ color: 0x1a2a50 })));
  floor.position.y = -0.25; floor.receiveShadow = true; scene.add(floor);
  const ropeCols = [0xff3a3a, 0xffffff, 0x3a6aff];
  for (const sd of [[0, -4.2, 8.6, 0.08], [0, 4.2, 8.6, 0.08], [-4.2, 0, 0.08, 8.6], [4.2, 0, 0.08, 8.6]]) for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.BoxGeometry(sd[2] > 1 ? sd[2] : 0.07, 0.07, sd[3] > 1 ? sd[3] : 0.07), new THREE.MeshStandardMaterial({ color: ropeCols[k], roughness: 0.6 })); r.position.set(sd[0], 0.55 + k * 0.5, sd[1]); scene.add(r); }
  for (const [px, pz] of [[-4.2, -4.2], [4.2, -4.2], [-4.2, 4.2], [4.2, 4.2]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.0, 10), new THREE.MeshStandardMaterial({ color: 0x9aa4b8, metalness: 0.5, roughness: 0.4 })); p.position.set(px, 1.0, pz); scene.add(p); }
  // penonton: bayangan di tribun gelap + lampu
  const crowdTex = (() => { const c2 = mkCanvas(512, 128), x2 = c2.getContext('2d'); x2.fillStyle = '#0c0408'; x2.fillRect(0, 0, 512, 128); for (let i = 0; i < 160; i++) { x2.fillStyle = ['#2a1018', '#1a0a18', '#301a10', '#14202a'][i % 4]; x2.beginPath(); x2.arc(Math.random() * 512, 40 + Math.random() * 80, 7 + Math.random() * 6, 0, 6.283); x2.fill(); } for (let i = 0; i < 40; i++) { x2.fillStyle = `rgba(255,${180 + Math.random() * 70 | 0},120,.8)`; x2.fillRect(Math.random() * 512, Math.random() * 50, 3, 3); } return mkTex(c2); })();
  for (const [px, pz, ry] of [[0, -11, 0], [-11, 0, Math.PI / 2], [11, 0, -Math.PI / 2], [0, 11, Math.PI]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(26, 6.5), new THREE.MeshBasicMaterial({ map: crowdTex })); w.position.set(px, 2.8, pz); w.rotation.y = ry; scene.add(w); }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshBasicMaterial({ color: 0xc0202a })); banner.position.set(0, 5.4, -10.9); scene.add(banner);
})();
