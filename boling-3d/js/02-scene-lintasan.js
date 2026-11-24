'use strict';
// ======================= SCENE 3D: GEDUNG BOLING =======================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0716); scene.fog = new THREE.Fog(0x0a0716, 20, 50);
const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; };
scene.add(new THREE.HemisphereLight(0x9a8ad0, 0x1a1228, 0.6));
[[0, 5, 2, 0.5, 18], [0, 5, -11, 1.0, 24], [0, 4.6, -22.5, 1.3, 15]].forEach(([x, y, z, i, d]) => { const l = new THREE.PointLight(0xfff0d8, i, d); l.position.set(x, y, z); scene.add(l); });
const pinSpot = new THREE.SpotLight(0xffffff, 1.2, 16, 0.5, 0.6); pinSpot.position.set(0, 5, -20); pinSpot.target.position.set(0, 0, -24.5); scene.add(pinSpot, pinSpot.target);
const zy = (z, H) => (z - Z_FAR) / (Z_NEAR - Z_FAR) * H;

// --- papan lintasan kayu: 39 papan, panah, titik, garis lemparan ---
const PIN_SPOTS = (() => { const a = []; for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) a.push({ x: (j - k / 2) * PIN_DX, z: Z_HEAD - k * PIN_DZ }); return a; })();
const laneTex = (() => {
  const W = 512, H = 2048, c = mkCanvas(W, H), x = c.getContext('2d'), N = 39, bw = W / N, yF = zy(0, H);
  for (let i = 0; i < N; i++) {
    const t = Math.random() * 10 - 5, lane = `hsl(${34 + t * 0.4},${68 + t}%,${56 + t * 0.9}%)`, appr = `hsl(${38 + t * 0.3},${50 + t}%,${70 + t * 0.6}%)`;
    x.fillStyle = lane; x.fillRect(i * bw, 0, bw + 1, yF); x.fillStyle = appr; x.fillRect(i * bw, yF, bw + 1, H - yF);
    for (let k = 0; k < 7; k++) { x.fillStyle = `rgba(90,50,10,${rr(0.04, 0.12)})`; x.fillRect(i * bw + rr(0, bw), rr(0, H), 1, rr(80, 400)); }
  }
  x.fillStyle = 'rgba(60,30,5,.35)'; for (let i = 0; i <= N; i++) x.fillRect(i * bw - 0.5, 0, 1, H);
  x.fillStyle = '#1a1208'; x.fillRect(0, yF - 4, W, 8);                                   // garis lemparan
  x.fillStyle = 'rgba(40,25,10,.8)'; for (let k = -3; k <= 3; k++) x.beginPath(), x.arc(W / 2 + k * bw * 3, zy(0.9, H), 4, 0, 6.283), x.fill();   // titik pendekat
  for (let k = -3; k <= 3; k++) { const ax = W / 2 + k * bw * 3, ay = zy(-4.6 + Math.abs(k) * 0.55, H); x.fillStyle = 'rgba(40,22,8,.85)'; x.beginPath(); x.moveTo(ax, ay - 26); x.lineTo(ax - 9, ay + 18); x.lineTo(ax + 9, ay + 18); x.closePath(); x.fill(); }   // panah
  for (let k = -2; k <= 2; k++) { x.fillStyle = 'rgba(40,22,8,.7)'; x.beginPath(); x.arc(W / 2 + k * bw * 4, zy(-2.4, H), 3.2, 0, 6.283); x.fill(); }
  PIN_SPOTS.forEach(p => { x.fillStyle = 'rgba(30,20,8,.55)'; x.beginPath(); x.arc((p.x / LANE_W + 0.5) * W, zy(p.z, H), 5, 0, 6.283); x.fill(); });
  const t = mkTex(c); return t;
})();
const laneMat = new THREE.MeshStandardMaterial({ map: laneTex, roughness: 0.55, metalness: 0 });
const lane = new THREE.Mesh(new THREE.PlaneGeometry(LANE_W, Z_NEAR - Z_FAR), laneMat); lane.rotation.x = -Math.PI / 2; lane.position.z = (Z_NEAR + Z_FAR) / 2; scene.add(lane);
// --- talang, pembatas, kolam pin ---
const gutMat = new THREE.MeshStandardMaterial({ color: 0x20222a, roughness: 0.4, metalness: 0.5 }), railMat = new THREE.MeshStandardMaterial({ color: 0x3a1a6a, roughness: 0.5, metalness: 0.2 });
[-1, 1].forEach(sd => {
  const g = new THREE.Mesh(new THREE.BoxGeometry(GUT_W, 0.06, Z_NEAR - Z_PIT), gutMat); g.position.set(sd * (LANE_W / 2 + GUT_W / 2), -0.12, (Z_NEAR + Z_PIT) / 2); scene.add(g);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, Z_NEAR - Z_PIT), gutMat); gl.position.set(sd * (LANE_W / 2 + 0.03), -0.04, (Z_NEAR + Z_PIT) / 2); scene.add(gl);
  const rl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, Z_NEAR - Z_PIT), railMat); rl.position.set(sd * (LANE_W / 2 + GUT_W + 0.15), 0.12, (Z_NEAR + Z_PIT) / 2); scene.add(rl);
  const rt = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, Z_NEAR - Z_PIT), new THREE.MeshStandardMaterial({ color: 0xff6ac8, emissive: 0xff3aa8, emissiveIntensity: 0.9 })); rt.position.set(sd * (LANE_W / 2 + GUT_W + 0.15), 0.42, (Z_NEAR + Z_PIT) / 2); scene.add(rt);
});
const pit = new THREE.Mesh(new THREE.BoxGeometry(LANE_W + GUT_W * 2, 0.1, Z_PIT - Z_BACK), new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.9 })); pit.position.set(0, -0.5, (Z_PIT + Z_BACK) / 2); scene.add(pit);
const pitWall = new THREE.Mesh(new THREE.BoxGeometry(LANE_W + GUT_W * 2, 0.9, 0.1), new THREE.MeshStandardMaterial({ color: 0x15151f, roughness: 0.8 })); pitWall.position.set(0, -0.1, Z_PIT); scene.add(pitWall);
// --- lantai karpet bergaya arkade ---
const carpetTex = (() => {
  const c = mkCanvas(256, 256), x = c.getContext('2d'); x.fillStyle = '#120a28'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) { x.fillStyle = ['#ff3aa8', '#3ad0ff', '#ffd23f', '#7a3ad8', '#3aff9a'][i % 5]; x.globalAlpha = 0.85; const px = Math.random() * 256, py = Math.random() * 256, s = 4 + Math.random() * 7; x.beginPath(); if (i % 3 === 0) { x.moveTo(px, py - s); x.lineTo(px + s, py + s); x.lineTo(px - s, py + s); x.closePath(); } else if (i % 3 === 1) x.arc(px, py, s * 0.7, 0, 6.283); else x.rect(px - s / 2, py - s / 2, s, s * 0.6); x.fill(); }
  x.globalAlpha = 1; const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 12); return t;
})();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 44), new THREE.MeshStandardMaterial({ map: carpetTex, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.25, -10); scene.add(floor);
// --- dinding samping dengan strip neon, langit-langit dan lampu ---
const wallMat = new THREE.MeshStandardMaterial({ color: 0x1a1030, roughness: 0.9 });
[-1, 1].forEach((sd, k) => {
  const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 46), wallMat); w.position.set(sd * 5.2, 2.5, -10); scene.add(w);
  [[0.9, 0xff3aa8], [2.6, 0x3ad0ff], [4.3, 0xffd23f]].forEach(([y, col], i) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 46), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.2 })); s.position.set(sd * 5.02, y, -10); scene.add(s); });
});
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(11, 46), new THREE.MeshStandardMaterial({ color: 0x0d0820, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 5.3, -10); scene.add(ceil);
[3, -3, -9, -15, -21].forEach(z => { const b = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 0.35), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0xfff0c8, emissiveIntensity: 1.4 })); b.position.set(0, 5.22, z); scene.add(b); });
// --- panel belakang (mesin pemasang pin) dengan papan neon ---
const backTex = (() => {
  const c = mkCanvas(1024, 400), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 400); g.addColorStop(0, '#1a0f40'); g.addColorStop(1, '#0a0620'); x.fillStyle = g; x.fillRect(0, 0, 1024, 400);
  for (let i = 0; i < 18; i++) { x.fillStyle = i % 2 ? 'rgba(255,58,168,.18)' : 'rgba(58,208,255,.18)'; x.fillRect(i * 60 - 40, 0, 30, 400); }
  x.strokeStyle = '#3ad0ff'; x.lineWidth = 6; x.shadowColor = '#3ad0ff'; x.shadowBlur = 24; x.strokeRect(40, 40, 944, 320);
  x.font = 'bold 190px Impact,Bangers,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ff6ac8'; x.shadowColor = '#ff3aa8'; x.shadowBlur = 40; x.fillText('BOLING', 512, 150);
  x.font = 'bold 70px Impact,sans-serif'; x.fillStyle = '#ffd23f'; x.shadowColor = '#ffa200'; x.fillText('★ STRIKE ZONE ★', 512, 300); return mkTex(c);
})();
const backPanel = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.5), new THREE.MeshBasicMaterial({ map: backTex })); backPanel.position.set(0, 2.4, Z_BACK - 0.2); scene.add(backPanel);
const backMask = new THREE.Mesh(new THREE.BoxGeometry(LANE_W + GUT_W * 2 + 1.2, 1.3, 0.3), new THREE.MeshStandardMaterial({ color: 0x241848, roughness: 0.6, metalness: 0.2 })); backMask.position.set(0, 1.6, Z_PIT - 0.3); scene.add(backMask);
// bayangan lembut (blob)
const blobTex = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })();
const blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const blobGeo = new THREE.PlaneGeometry(1, 1);
function makeBlob(sz) { const m = new THREE.Mesh(blobGeo, blobMat); m.rotation.x = -Math.PI / 2; m.scale.set(sz, sz, 1); m.position.y = 0.006; scene.add(m); return m; }
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); const f = $('fx'); f.width = innerWidth; f.height = innerHeight; }
addEventListener('resize', resize);
