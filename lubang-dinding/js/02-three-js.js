'use strict';
// ======================= THREE.JS =======================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x140a2e);
scene.fog = new THREE.Fog(0x140a2e, 22, 62);
const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 150);
camera.position.set(0, 0.7, 12.5); camera.lookAt(0, -0.7, 0);
const hemi = new THREE.HemisphereLight(0xc8b8ff, 0x201040, 0.9); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 0.7); key.position.set(3, 6, 10); scene.add(key);
const WHT = 7, WCY = -0.7, TUN_X = 8, TUN_TOP = 3.6, TUN_BOT = -4.2;
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };

// lorong: lantai berpola yang bergulir, dinding samping bergaris lampu
const floorTex = (() => {
  const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#1c1140'; x.fillRect(0, 0, 128, 128);
  x.strokeStyle = '#6a4ae0'; x.lineWidth = 3; x.strokeRect(1, 1, 126, 126); x.strokeStyle = 'rgba(160,130,255,.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke();
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(8, 28); return t;
})();
const sideTex = (() => {
  const c = mkCanvas(64, 128), x = c.getContext('2d'); x.fillStyle = '#241450'; x.fillRect(0, 0, 64, 128);
  x.fillStyle = '#7a5aff'; x.fillRect(0, 56, 64, 6); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(0, 58, 64, 2);
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 28); return t;
})();
const LEN_T = 90;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(TUN_X * 2, LEN_T), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, TUN_BOT, 12 - LEN_T / 2); scene.add(floor);
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(TUN_X * 2, LEN_T), new THREE.MeshStandardMaterial({ color: 0x1a0f3c })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, TUN_TOP, 12 - LEN_T / 2); scene.add(ceil);
[-1, 1].forEach(sd => { const w = new THREE.Mesh(new THREE.PlaneGeometry(LEN_T, TUN_TOP - TUN_BOT), new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.7 })); w.rotation.y = -sd * Math.PI / 2; w.position.set(sd * TUN_X, (TUN_TOP + TUN_BOT) / 2, 12 - LEN_T / 2); scene.add(w); });
const lampMat = new THREE.MeshBasicMaterial({ color: 0xc8b8ff });
const lamps = [];
for (let i = 0; i < 14; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 0.5), lampMat); l.position.set(0, TUN_TOP - 0.06, 8 - i * 6.5); scene.add(l); lamps.push(l); }

// ---------- pemain ----------
let versus = false;
const OFFS = () => versus ? [-2.2, 2.2] : [0];
const NP = () => versus ? 2 : 1;
const mkPlayer = i => ({ i, B: { J: {}, valid: false, seen: 0 }, k: { arm: 1, torso: 1 }, score: 0, lives: 3, combo: 0, cleared: 0, perfects: 0, bestAcc: 0, preset: 0, alive: true, miss: 0, lastPose: -1, px: 0, pxT: 0, ax: 0, cx0: null });   // px: posisi lateral (lebar bahu) dari titik kalibrasi; ax: posisi tampil avatar
let PL = [mkPlayer(0)];
