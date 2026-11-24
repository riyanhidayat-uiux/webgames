'use strict';
// ======================= LINGKUNGAN =======================
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
const pick = a => a[(Math.random() * a.length) | 0];
const rr = (a, b) => a + Math.random() * (b - a);
const shade = (hex, f) => { const r = Math.min(255, ((hex >> 16) & 255) * f) | 0, g = Math.min(255, ((hex >> 8) & 255) * f) | 0, b = Math.min(255, (hex & 255) * f) | 0; return `rgb(${r},${g},${b})`; };
const SC_LEN = 168, ZTOP = 12;
const sceneryItems = [];
const addScenery = (o, x, z) => { o.position.x = x; o.position.z = z; scene.add(o); sceneryItems.push(o); return o; };

// --- jalan, trotoar, rumput (menggulir mengikuti kecepatan) ---
const ROAD_L = 18, SIDE_L = 3.2;
const roadTex = (() => {
  const W = 512, H = 1400, PPU = W / 6.6, c = mkCanvas(W, H), x = c.getContext('2d');   // 1 satuan dunia = 77.6 px; panjang ubin 18 satuan
  const U = v => (v + 3.3) * PPU;
  x.fillStyle = '#3c3f46'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 420; i++) { const r = rr(20, 90), g = x.createRadialGradient(0, 0, 0, 0, 0, r), px = Math.random() * W, py = Math.random() * H; x.save(); x.translate(px, py); x.scale(1, rr(0.8, 2.2)); g.addColorStop(0, Math.random() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); x.restore(); }   // belang tonal
  [-2.1, 0, 2.1].forEach(lx => [-0.78, 0.78].forEach(wx => { const g = x.createLinearGradient(U(lx + wx) - 26, 0, U(lx + wx) + 26, 0); g.addColorStop(0, 'rgba(10,10,14,0)'); g.addColorStop(0.5, 'rgba(10,10,14,.20)'); g.addColorStop(1, 'rgba(10,10,14,0)'); x.fillStyle = g; x.fillRect(U(lx + wx) - 26, 0, 52, H); }));   // jejak roda
  const img = x.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 34, k = Math.random() < 0.02 ? 38 : 0; d[i] += n + k; d[i + 1] += n + k; d[i + 2] += n + k * 0.9; } x.putImageData(img, 0, 0);   // butiran aspal
  for (let i = 0; i < 2200; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(200,200,205,.22)' : 'rgba(10,10,12,.3)'; const s = rr(1, 2.6); x.fillRect(Math.random() * W, Math.random() * H, s, s); }   // kerikil
  // tambalan aspal
  [[U(-1.5), 260, 90, 150], [U(1.6), 760, 110, 120], [U(0.2), 1180, 80, 170]].forEach(([px, py, w, h]) => { x.fillStyle = 'rgba(18,20,24,.45)'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + w, py + rr(-4, 4)); x.lineTo(px + w + rr(-6, 6), py + h); x.lineTo(px + rr(-6, 6), py + h + rr(-4, 4)); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2; x.stroke(); });
  // retakan bercabang
  const crack = (px, py, len, a) => { x.beginPath(); x.moveTo(px, py); for (let i = 0; i < len; i++) { a += rr(-0.5, 0.5); px += Math.cos(a) * rr(5, 12); py += Math.sin(a) * rr(8, 18); x.lineTo(px, py); if (Math.random() < 0.12 && len > 5) { const sx = px, sy = py; x.stroke(); crack(sx, sy, len >> 1, a + rr(-1, 1)); x.beginPath(); x.moveTo(sx, sy); } } x.stroke(); };
  x.strokeStyle = 'rgba(0,0,0,.65)'; x.lineWidth = 1.6; crack(U(-2.6), 80, 22, 1.5); crack(U(2.4), 520, 26, 1.6); crack(U(-0.5), 980, 18, 1.4); x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 1; crack(U(1.2), 1250, 12, 1.5);
  // sambungan aspal (garis tar hitam mengilap) melintang
  [330, 1010].forEach(y => { x.fillStyle = 'rgba(6,6,8,.55)'; x.fillRect(0, y, W, 3); x.fillStyle = 'rgba(255,255,255,.05)'; x.fillRect(0, y + 3, W, 1); });
  // bekas rem & noda oli
  x.strokeStyle = 'rgba(8,8,10,.35)'; x.lineWidth = 7; [[U(-0.7), 120, 240], [U(0.9), 640, 200]].forEach(([px, py, l]) => { x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + 10, py + l / 3, px - 8, py + l * 0.66, px + 6, py + l); x.stroke(); });
  [[U(1.9), 460, 30], [U(-1.0), 880, 24], [U(0.1), 70, 20]].forEach(([px, py, r]) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(5,5,8,.6)'); g.addColorStop(1, 'rgba(5,5,8,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * 1.5, 0, 0, 6.283); x.fill(); });
  // tutup selokan (manhole)
  const manhole = (px, py) => { const r = 31; x.fillStyle = 'rgba(0,0,0,.5)'; x.beginPath(); x.arc(px, py, r + 3, 0, 6.283); x.fill(); x.fillStyle = '#4a4742'; x.beginPath(); x.arc(px, py, r, 0, 6.283); x.fill(); x.strokeStyle = '#2a2824'; x.lineWidth = 2.2; for (let k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(px - r + 6, py + k * 8); x.lineTo(px + r - 6, py + k * 8); x.stroke(); } x.beginPath(); x.arc(px, py, r - 5, 0, 6.283); x.stroke(); x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.arc(px - 8, py - 9, 10, 0, 6.283); x.fill(); };
  manhole(U(-1.2), 560); manhole(U(1.0), 1290);
  // saluran air di tepi jalan
  [[U(-3.0), 420], [U(3.0), 1120], [U(-3.0), 1230]].forEach(([px, py]) => { x.fillStyle = '#1a1a1c'; x.fillRect(px - 17, py - 30, 34, 60); x.fillStyle = '#55524d'; for (let k = 0; k < 8; k++) x.fillRect(px - 15, py - 28 + k * 7.4, 30, 3.4); });
  // marka jalan: garis putus-putus putih yang mulai pudar
  const paint = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); const dd = x.getImageData(px | 0, py | 0, Math.ceil(w), Math.ceil(h)); for (let i = 0; i < dd.data.length; i += 4) { if (Math.random() < 0.07) { dd.data[i] = 90; dd.data[i + 1] = 90; dd.data[i + 2] = 90; } else { const n = (Math.random() - 0.5) * 10; dd.data[i] += n; dd.data[i + 1] += n; dd.data[i + 2] += n; } } x.putImageData(dd, px | 0, py | 0); };
  const DASH = 2.4 * PPU, PERIOD = 6 * PPU;
  [-1.05, 1.05].forEach(lx => { for (let k = 0; k < 3; k++) paint(U(lx) - 5, 20 + k * PERIOD + k * 0, 10, DASH, '#e9ebef'); });
  paint(U(-3.14) - 5, 0, 11, H, '#e8b923'); paint(U(3.14) - 5, 0, 11, H, '#e8b923');   // garis tepi kuning
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, 12, H); x.fillRect(W - 12, 0, 12, H);   // talang gelap di tepi
  const t = rep(mkTex(c), 1, 250 / ROAD_L); t.anisotropy = 8; return t;
})();
const road = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 250), new THREE.MeshStandardMaterial({ map: roadTex, bumpMap: roadTex, bumpScale: 0.7, roughness: 0.92, metalness: 0 }));
road.rotation.x = -Math.PI / 2; road.position.z = -100; road.receiveShadow = true; scene.add(road);
const sideTex = (() => {
  const c = mkCanvas(128, 256), x = c.getContext('2d'), N = 64;   // 2 x 4 ubin paving, tiap ubin 0.8 satuan
  for (let r = 0; r < 4; r++) for (let q = 0; q < 2; q++) { const v = rr(158, 186) | 0; x.fillStyle = `rgb(${v},${v - 2},${v - 6})`; x.fillRect(q * N, r * N, N, N); const g = x.createLinearGradient(q * N, r * N, q * N + N, r * N + N); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.07)'); x.fillStyle = g; x.fillRect(q * N, r * N, N, N); }
  const img = x.getImageData(0, 0, 128, 256), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(img, 0, 0);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(60,55,45,${rr(0.05, 0.14)})`; x.beginPath(); x.ellipse(Math.random() * 128, Math.random() * 256, rr(2, 8), rr(2, 6), 0, 0, 6.283); x.fill(); }   // noda
  x.strokeStyle = 'rgba(70,70,74,.85)'; x.lineWidth = 2.5; for (let r = 0; r <= 4; r++) { x.beginPath(); x.moveTo(0, r * N); x.lineTo(128, r * N); x.stroke(); } for (let q = 0; q <= 2; q++) { x.beginPath(); x.moveTo(q * N, 0); x.lineTo(q * N, 256); x.stroke(); }
  x.strokeStyle = 'rgba(40,40,44,.55)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(20, 70); x.lineTo(34, 92); x.lineTo(30, 118); x.lineTo(44, 126); x.stroke();   // retak ubin
  x.fillStyle = 'rgba(40,40,44,.6)'; [[100, 30], [30, 190], [90, 224]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, 2, 0, 6.283); x.fill(); });
  const t = rep(mkTex(c), 1, 250 / SIDE_L); t.anisotropy = 8; return t;
})();
const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.95 });
const curbMat = new THREE.MeshStandardMaterial({ color: 0xcfcfca, roughness: 0.9 });
[-1, 1].forEach(sd => {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 250), sideMat); w.rotation.x = -Math.PI / 2; w.position.set(sd * 4.15, 0.12, -100); w.receiveShadow = true; scene.add(w);
  const cb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 250), curbMat); cb.position.set(sd * 3.41, 0.06, -100); cb.receiveShadow = true; scene.add(cb);
  const ou = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 250), curbMat); ou.position.set(sd * 4.99, 0.06, -100); scene.add(ou);
});
const grassTex = (() => {
  const c = mkCanvas(128, 128), x = c.getContext('2d');
  x.fillStyle = '#5b7a36'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, Math.random() < 0.5 ? 'rgba(120,140,50,.25)' : 'rgba(30,60,20,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(Math.random() * 128, Math.random() * 128); x.fillStyle = g; x.fillRect(-30, -30, 60, 60); x.restore(); }
  for (let i = 0; i < 1400; i++) { const px = Math.random() * 128, py = Math.random() * 128; x.strokeStyle = `hsl(${rr(72, 105)},${rr(35, 55)}%,${rr(20, 42)}%)`; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(3, 7)); x.stroke(); }
  const t = mkTex(c); return rep(t, 24, 250 / 5);
})();
const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 });
const grass = new THREE.Mesh(new THREE.PlaneGeometry(200, 260), grassMat);
grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.03, -100); grass.receiveShadow = true; scene.add(grass);
function scrollEnv(d) {
  roadTex.offset.y += d / ROAD_L; sideTex.offset.y += d / SIDE_L; grassTex.offset.y += d / 5;
  for (const o of sceneryItems) { o.position.z += d; if (o.position.z > ZTOP) o.position.z -= SC_LEN; }
}

// --- material bersama ---
const MATS = {
  concrete: new THREE.MeshStandardMaterial({ color: 0xc8ccd6, roughness: 0.9 }), roof: new THREE.MeshStandardMaterial({ color: 0x8a8f9c, roughness: 0.95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2e3a, roughness: 0.8 }), metal: new THREE.MeshStandardMaterial({ color: 0xb8bfd0, metalness: 0.6, roughness: 0.35 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 }), trunkL: new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 1 }),
  beacon: new THREE.MeshStandardMaterial({ color: 0xff2a2a, emissive: 0xff0000, emissiveIntensity: 1 }),
  bulb: new THREE.MeshBasicMaterial({ color: 0xfff0b0 }), pole: new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.5, roughness: 0.5 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xff3a1a, emissive: 0xff2200, emissiveIntensity: 1 })
};
const glowTex = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.35, 'rgba(255,220,120,.5)'); g.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })();
const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.25 });
