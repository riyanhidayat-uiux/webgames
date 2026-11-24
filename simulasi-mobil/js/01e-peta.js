'use strict';
// ======================= PETA / LOKASI =======================
// Lima peta: Kota & Tol (bawaan), Jalan Desa (sawah, rumah, kelapa, tiang listrik), Pegunungan (lereng hutan pinus, jurang, awan lembah),
// Pantai (laut beranimasi, bukit pasir, perahu, payung), Bebatuan (ngarai batu merah berlapis, bongkahan). Tiap peta mengubah: tanah, tekstur jalan,
// pagar, pemandangan, siluet gunung latar, kabut, komposisi lalu lintas, dan tingkat kelokan.
// Medan di sisi jalan = blok heightfield yang PERIODIK sepanjang SCEN_LEN (280 m) sehingga sambungan antar-blok mulus saat didaur ulang.
const KIND_ORDER = ['sedan', 'hatch', 'suv', 'mpv', 'coupe', 'pickup', 'taxi', 'angkot', 'motor', 'motor2', 'truck', 'truckm', 'bus', 'minibus', 'busdd'];
const KIND_BASE = { sedan: 12, hatch: 9, suv: 9, mpv: 10, coupe: 3, pickup: 6, taxi: 4, angkot: 4, motor: 12, motor2: 7, truck: 7, truckm: 4, bus: 5, minibus: 3, busdd: 1.5 };
// pengali per peta terhadap bobot dasar (yang tidak disebut = 1)
const KIND_MUL = {
  tol: { taxi: 1.8, busdd: 1.8, coupe: 1.3, bus: 1.2 },
  desa: { motor: 3, motor2: 3.4, angkot: 2.5, pickup: 1.8, truckm: 1.8, taxi: 0.1, busdd: 0, coupe: 0.2, suv: 0.6, truck: 0.5, mpv: 0.8 },
  gunung: { truck: 3.2, truckm: 1.8, suv: 1.5, pickup: 1.5, bus: 1.4, minibus: 1.3, motor: 0.4, motor2: 0.3, taxi: 0.1, busdd: 0, angkot: 0.5, coupe: 0.4 },
  pantai: { suv: 1.6, mpv: 1.5, coupe: 2.2, bus: 1.6, minibus: 1.4, taxi: 0.6, motor: 1.1, truck: 0.5, busdd: 0.3 },
  batu: { suv: 2.5, pickup: 2.6, truck: 2.6, truckm: 1.6, coupe: 0.3, taxi: 0.05, motor: 0.4, motor2: 0.2, busdd: 0, minibus: 0.7 },
  salju: { suv: 2.2, pickup: 2, truck: 2, truckm: 1.4, bus: 1.2, motor: 0.15, motor2: 0.1, taxi: 0.1, busdd: 0, coupe: 0.3, angkot: 0.3 },
  hutan: { motor: 1.7, motor2: 1.5, pickup: 2.2, truck: 1.6, truckm: 1.4, angkot: 1.5, suv: 1.3, taxi: 0.1, busdd: 0, coupe: 0.2, minibus: 1.2 },
  neon: { taxi: 2.8, coupe: 2.4, busdd: 2.2, sedan: 1.2, bus: 1.3, motor: 1.4, truck: 0.35, truckm: 0.5, pickup: 0.5, angkot: 0.6 }
};
const MAPS = [
  { id: 'tol', n: '🏙️ Kota & Tol', terr: 1, mix: [0.28, 0.18, 0.14, 0.12, 0.08, 0.1, 0.1], ground: 'rumput', road: 'tol', rails: 'tol', ridge: 'tol', env: null, help: 'Jalan raya kota dengan gedung, pohon rindang, dan lampu jalan.' },
  { id: 'desa', n: '🌾 Jalan Desa', terr: 0.8, mix: [0.12, 0.12, 0.08, 0.34, 0.22, 0.06, 0.06], ground: 'sawah', road: 'desa', rails: 'desa', ridge: 'volcano', env: { tint: 0xf0e0bc, k: 0.22, nearK: 1, farK: 0.95, sunK: 1, hemiK: 1 }, help: 'Sawah, rumah desa, pohon kelapa, dan banyak motor. Gunung berapi di kejauhan.' },
  { id: 'gunung', n: '⛰️ Pegunungan', terr: 1.35, mix: [0.22, 0.14, 0.2, 0.06, 0.04, 0.24, 0.1], ground: 'hutan', road: 'gunung', rails: 'gunung', ridge: 'alp', env: { tint: 0xaebfcf, k: 0.3, nearK: 0.7, farK: 0.78, sunK: 0.88, hemiK: 1.05 }, help: 'Lereng pinus di kiri, jurang di kanan, tikungan lebih tajam, dan kabut tipis. Truk lebih banyak.' },
  { id: 'pantai', n: '🏖️ Pantai', terr: 0.5, mix: [0.2, 0.2, 0.22, 0.14, 0.1, 0.06, 0.08], ground: 'pasir', road: 'pantai', rails: 'pantai', ridge: 'coast', env: { tint: 0xcdeeee, k: 0.2, nearK: 1, farK: 1.15, sunK: 1.12, hemiK: 1 }, help: 'Jalan pesisir: laut di kiri, bukit pasir dan kelapa di kanan, perahu nelayan dan payung pantai.' },
  { id: 'batu', n: '🏜️ Bebatuan', terr: 1.15, mix: [0.18, 0.14, 0.3, 0.06, 0.04, 0.2, 0.08], ground: 'tanah', road: 'batu', rails: 'batu', ridge: 'mesa', env: { tint: 0xe8c49c, k: 0.3, nearK: 1, farK: 1, sunK: 1.1, hemiK: 1 }, help: 'Ngarai batu merah berlapis dengan bongkahan dan semak kering. Banyak SUV dan truk.' },
  { id: 'salju', n: '❄️ Salju', terr: 1.1, mix: [0.2, 0.14, 0.24, 0.06, 0.04, 0.2, 0.08], ground: 'salju', road: 'salju', rails: 'salju', ridge: 'alp', env: { tint: 0xdce8f4, k: 0.45, nearK: 0.6, farK: 0.7, sunK: 0.9, hemiK: 1.12 }, grip: 0.8, help: 'Lereng bersalju dengan pinus, salju turun, jarak pandang pendek, dan jalan licin (grip berkurang).' },
  { id: 'hutan', n: '🌴 Hutan Hujan', terr: 1.0, mix: [0.12, 0.12, 0.1, 0.1, 0.1, 0.2, 0.06], ground: 'rimba', road: 'rimba', rails: 'rimba', ridge: 'coast', env: { tint: 0x8fb890, k: 0.5, nearK: 0.3, farK: 0.45, sunK: 0.8, hemiK: 0.92 }, help: 'Hutan tropis lebat: pohon menjulang, pakis, pisang, kabut lembap, serangga dan burung.' },
  { id: 'neon', n: '🌃 Kota Malam', terr: 0.9, scen: 'tol', force: 2, wet: 0.55, ground: 'rumput', road: 'neon', rails: 'tol', ridge: 'tol', env: { tint: 0x6a2a9a, k: 1.0, nearK: 1, farK: 1, sunK: 1, hemiK: 1.15 }, help: 'Kota selalu malam & basah: papan neon, pantulan jalan, taksi dan bus dua tingkat. Waktu hari dikunci.' }
];
let MAP = MAPS[settings.map | 0] || MAPS[0];
function pickKind() { const mul = KIND_MUL[MAP.id] || {}, w = KIND_ORDER.map(k => KIND_BASE[k] * (mul[k] == null ? 1 : mul[k])); let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return KIND_ORDER[i]; } return 'sedan'; }

// ---------------- noise periodik (z berulang tiap 280 m) ----------------
const h2n = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }, PERZ = 280;
function vnP(x, y, per) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = n => ((n % per) + per) % per; return lerp(lerp(h2n(xi, w(yi)), h2n(xi + 1, w(yi)), u), lerp(h2n(xi, w(yi + 1)), h2n(xi + 1, w(yi + 1)), u), v); }
function fbmP(x, z, lam, oct = 4) { let s = 0, a = 0.5, t = 0; for (let k = 0; k < oct; k++) { const l = lam / (1 << k); s += a * vnP(x / l, z / l, PERZ / l); t += a; a *= 0.5; } return s / t; }

// ---------------- batu (bongkahan): ikosahedron berfaset + warna lapisan per verteks ----------------
const ROCK_PAL = { granit: [[0.45, 0.44, 0.42], [0.28, 0.27, 0.27]], pasir: [[0.72, 0.4, 0.24], [0.5, 0.25, 0.15]], kapur: [[0.8, 0.72, 0.58], [0.6, 0.52, 0.4]], vulkan: [[0.27, 0.26, 0.26], [0.14, 0.13, 0.13]] };
function makeRockGeo(pal) {
  const g = new THREE.IcosahedronGeometry(1, 3), p = g.attributes.position, n = p.count, col = new Float32Array(n * 3), ph = RG(0, 100), a = ROCK_PAL[pal][0], b = ROCK_PAL[pal][1];
  for (let i = 0; i < n; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i); const L = Math.hypot(x, y, z); x /= L; y /= L; z /= L;
    const d = 1 + 0.2 * Math.sin(x * 3.1 + ph) * Math.cos(z * 2.7 + ph * 1.3) + 0.13 * Math.sin(y * 5.3 + x * 2.1 + ph) + 0.07 * Math.sin(z * 8.7 + y * 6.1 + ph) + 0.04 * Math.sin(x * 15 + z * 13);
    let yy = y; if (yy < -0.25) yy = -0.25 + (yy + 0.25) * 0.15; p.setXYZ(i, x * d, yy * d, z * d);
    const band = 0.5 + 0.5 * Math.sin(yy * 7 + ph + Math.sin(x * 3) * 1.2), k = 0.75 + 0.25 * Math.sin(x * 21 + z * 17 + ph) + (yy > 0.3 ? 0.12 : 0);
    col[i * 3] = lerp(b[0], a[0], band) * k; col[i * 3 + 1] = lerp(b[1], a[1], band) * k; col[i * 3 + 2] = lerp(b[2], a[2], band) * k;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 }), ROCKS = {};
function rockItem(pal, size) {
  const vs = ROCKS[pal] || (ROCKS[pal] = Array.from({ length: 4 }, () => makeRockGeo(pal))), m = new THREE.Mesh(vs[(RG() * 4) | 0], rockMat), s = size * RG(0.8, 1.2);
  m.scale.set(s * RG(0.8, 1.3), s * RG(0.55, 0.95), s * RG(0.8, 1.3)); m.rotation.y = RG(0, 6.283); m.position.y = -0.12 + s * 0.06; m.castShadow = true; return m;
}

// ---------------- blok medan (heightfield) ----------------
const detailTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#e6e6e6'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 900; i++) { const v = (RG(0, 1) * 70 + 150) | 0; x.fillStyle = `rgba(${v},${v},${v},.55)`; const s = RG(1, 5); x.fillRect(RG(0, 128), RG(0, 128), s, s); } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const terrMat = new THREE.MeshStandardMaterial({ vertexColors: true, map: detailTex, roughness: 0.96 });
function terrBlock(x0, x1, zc, len, fn, colFn, nx = 30, nz = 26) {
  const pos = [], nor = [], cols = [], uv = [], idx = [], e = 0.7;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, zl = -len / 2 + len * j / nz, zw = zc + zl, y = fn(x, zw), hx = fn(x + e, zw) - fn(x - e, zw), hz = fn(x, zw + e) - fn(x, zw - e), n = V3(-hx / (2 * e), 1, -hz / (2 * e)).normalize(), c = colFn(x, y, zw, n);
    pos.push(x, y, zl); nor.push(n.x, n.y, n.z); cols.push(c[0], c[1], c[2]); uv.push(x / 6, zw / 6);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = (j + 1) * (nx + 1) + i, c = a + 1, d = b + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, terrMat); m.receiveShadow = true; return m;
}
const BLOCK_LEN = 40, NBLK = SCEN_LEN / BLOCK_LEN;
function addTerrain(id, x0, x1, fn, colFn, nx, nz) { const sd = x0 < 0 ? -1 : 1; for (let j = 0; j < NBLK; j++) addScen(terrBlock(x0, x1, -BLOCK_LEN / 2 - j * BLOCK_LEN, BLOCK_LEN, fn, colFn, nx, nz), 0, -BLOCK_LEN / 2 - j * BLOCK_LEN, { map: id, fixed: true, sd, terrain: true }); }
const mixC = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)], jit = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ---------------- tekstur tanah, jalan, pagar ----------------
const snapCanvas = c => { const s = document.createElement('canvas'); s.width = c.width; s.height = c.height; s.getContext('2d').drawImage(c, 0, 0); return s; };
const SNAP = { grass: snapCanvas(grassTex.image), road: snapCanvas(roadTex.image) }, GRASS_REP = [grassTex.repeat.x, grassTex.repeat.y];
let GTILE = 6;
function speckle(x, W, H, n, cols, smin, smax) { for (let i = 0; i < n; i++) { x.fillStyle = cols[(RG(0, cols.length)) | 0]; const s = RG(smin, smax); x.fillRect(RG(0, W), RG(0, H), s, s); } }
function paintGround(style) {
  const c = grassTex.image; let rx = GRASS_REP[0], ry = GRASS_REP[1];
  if (style === 'rumput') { c.width = SNAP.grass.width; c.height = SNAP.grass.height; c.getContext('2d').drawImage(SNAP.grass, 0, 0); }
  else {
    c.width = c.height = 256; const x = c.getContext('2d'), W = 256;
    if (style === 'sawah') {   // petak sawah: padi muda/tua, petak tergenang, pematang
      const plots = [[0, 0, 124, 124], [132, 0, 124, 124], [0, 132, 124, 124], [132, 132, 124, 124]], kinds = ['young', 'old', 'water', 'young'];
      x.fillStyle = '#6a5a3a'; x.fillRect(0, 0, W, W);
      plots.forEach(([px, py, w, h], i) => {
        const k = kinds[i]; if (k === 'water') { const g = x.createLinearGradient(px, py, px, py + h); g.addColorStop(0, '#9db8c4'); g.addColorStop(1, '#6f8d9a'); x.fillStyle = g; x.fillRect(px, py, w, h); for (let r = 0; r < 6; r++) for (let q = 0; q < 8; q++) { x.fillStyle = '#4f8a3a'; x.fillRect(px + 6 + q * 15 + RG(-2, 2), py + 8 + r * 20, 2, 5); } }
        else { x.fillStyle = k === 'young' ? '#7fb23c' : '#b4b04a'; x.fillRect(px, py, w, h); for (let r = 0; r < 24; r++) { x.fillStyle = k === 'young' ? (r % 2 ? '#6aa02e' : '#92c24a') : (r % 2 ? '#9a9a3a' : '#c8c05a'); x.fillRect(px + r * (w / 24), py, w / 48 + 1, h); } }
        x.fillStyle = 'rgba(20,40,10,.15)'; for (let s = 0; s < 50; s++) x.fillRect(px + RG(0, w), py + RG(0, h), RG(1, 3), RG(2, 7));
      });
      x.fillStyle = '#8a7650'; x.fillRect(124, 0, 8, W); x.fillRect(0, 124, W, 8); speckle(x, W, W, 500, ['rgba(60,50,30,.3)', 'rgba(210,200,150,.18)'], 1, 2.5); rx = 30; ry = 25;
    } else if (style === 'hutan') {
      x.fillStyle = '#2f4a22'; x.fillRect(0, 0, W, W); for (let i = 0; i < 70; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, RG() < 0.5 ? 'rgba(80,110,40,.35)' : 'rgba(15,30,12,.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(RG(0, W), RG(0, W)); x.fillStyle = g; x.fillRect(-40, -40, 80, 80); x.restore(); }
      speckle(x, W, W, 900, ['#5a4a2a', '#3a2c18', '#6a7a3a', '#26361a', '#7a6a48'], 1, 3); rx = 40; ry = 30;
    } else if (style === 'salju') {
      x.fillStyle = '#eef3fa'; x.fillRect(0, 0, W, W); for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 38); g.addColorStop(0, RG() < 0.6 ? 'rgba(150,175,215,.28)' : 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.save(); x.translate(RG(0, W), RG(0, W)); x.fillStyle = g; x.fillRect(-38, -38, 76, 76); x.restore(); }
      speckle(x, W, W, 1200, ['rgba(255,255,255,.9)', 'rgba(170,190,225,.5)', 'rgba(120,130,150,.35)'], 1, 2.4); rx = 40; ry = 30;
    } else if (style === 'rimba') {
      x.fillStyle = '#1b3815'; x.fillRect(0, 0, W, W); for (let i = 0; i < 80; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, RG() < 0.55 ? 'rgba(70,130,50,.4)' : 'rgba(8,22,8,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(RG(0, W), RG(0, W)); x.fillStyle = g; x.fillRect(-34, -34, 68, 68); x.restore(); }
      x.lineWidth = 1.4; for (let i = 0; i < 160; i++) { x.strokeStyle = RG() < 0.5 ? 'rgba(90,160,60,.55)' : 'rgba(40,100,40,.55)'; const X = RG(0, W), Y = RG(0, W), a = RG(0, 6.28); for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(a + k * 1.2) * 6, Y + Math.sin(a + k * 1.2) * 6 - 3, X + Math.cos(a + k * 1.2) * 11, Y + Math.sin(a + k * 1.2) * 11); x.stroke(); } }
      speckle(x, W, W, 700, ['#5a4326', '#3a2a16', '#7a8a3a', '#1c2c14'], 1, 3); rx = 40; ry = 30;
    } else if (style === 'pasir') {
      x.fillStyle = '#d8c08e'; x.fillRect(0, 0, W, W); for (let r = 0; r < 26; r++) { x.strokeStyle = r % 2 ? 'rgba(160,130,80,.22)' : 'rgba(255,240,200,.25)'; x.lineWidth = 2; x.beginPath(); for (let i = 0; i <= W; i += 8) { const y = r * 10 + Math.sin(i * 0.05 + r) * 3; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
      speckle(x, W, W, 1400, ['rgba(120,95,60,.5)', 'rgba(255,250,235,.55)', 'rgba(190,160,110,.5)'], 1, 2.2); for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(255,245,235,.8)'; x.beginPath(); x.ellipse(RG(0, W), RG(0, W), 3, 2, RG(0, 3), 0, 6.283); x.fill(); } rx = 36; ry = 26;
    } else {   // tanah merah berkerikil & retak
      x.fillStyle = '#a4623c'; x.fillRect(0, 0, W, W); for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 36); g.addColorStop(0, RG() < 0.5 ? 'rgba(200,120,70,.35)' : 'rgba(70,30,18,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(RG(0, W), RG(0, W)); x.fillStyle = g; x.fillRect(-36, -36, 72, 72); x.restore(); }
      speckle(x, W, W, 1100, ['rgba(60,30,18,.5)', 'rgba(220,170,120,.4)', 'rgba(130,100,80,.5)'], 1, 3.5); x.strokeStyle = 'rgba(50,20,10,.5)'; x.lineWidth = 1.3; for (let i = 0; i < 12; i++) { let X = RG(0, W), Y = RG(0, W); x.beginPath(); x.moveTo(X, Y); for (let k = 0; k < 8; k++) { X += RG(-14, 14); Y += RG(-14, 14); x.lineTo(X, Y); } x.stroke(); } rx = 36; ry = 26;
    }
  }
  grassTex.repeat.set(rx, ry); GTILE = 300 / ry; grassTex.needsUpdate = true;
}
function paintRoad(style) {
  const c = roadTex.image, x = c.getContext('2d'), W = c.width, H = c.height; x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, W, H); x.drawImage(SNAP.road, 0, 0);
  if (style !== 'tol') {
    const over = (col, a) => { x.fillStyle = col; x.globalAlpha = a; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }, edge = (col, w) => { for (const sd of [0, 1]) { const g = x.createLinearGradient(sd ? W : 0, 0, sd ? W - w : w, 0); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(sd ? W - w : 0, 0, w, H); } };
    if (style === 'desa') { over('rgb(120,100,78)', 0.16); edge('rgba(120,92,56,.8)', 46); for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(25,25,28,.28)'; x.fillRect(RG(40, W - 80), RG(0, H), RG(30, 90), RG(20, 80)); } speckle(x, W, H, 500, ['rgba(130,100,60,.5)'], 1, 3); x.fillStyle = 'rgba(200,200,190,.12)'; x.fillRect(0, 0, W, H); }
    else if (style === 'gunung') { over('rgb(60,70,90)', 0.2); edge('rgba(60,78,40,.7)', 34); for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(10,14,22,.3)'; x.fillRect(RG(30, W - 90), RG(0, H), RG(40, 110), RG(30, 120)); } speckle(x, W, H, 420, ['rgba(120,80,30,.6)', 'rgba(150,110,40,.5)', 'rgba(60,80,30,.5)'], 2, 5); }
    else if (style === 'pantai') { over('rgb(190,180,165)', 0.13); for (const sd of [0, 1]) { x.fillStyle = 'rgba(224,204,160,.92)'; x.beginPath(); for (let y = 0; y <= H; y += 16) { const w = 30 + Math.sin(y * 0.03 + sd) * 14 + RG(0, 12); y ? x.lineTo(sd ? W - w : w, y) : x.moveTo(sd ? W - w : w, y); } x.lineTo(sd ? W : 0, H); x.lineTo(sd ? W : 0, 0); x.closePath(); x.fill(); } speckle(x, W, H, 900, ['rgba(236,220,180,.75)', 'rgba(200,180,140,.6)'], 1, 3); }
    else if (style === 'salju') { over('rgb(118,124,136)', 0.2); edge('rgba(244,247,252,.95)', 78); for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(235,240,250,.4)'; x.fillRect(RG(40, W - 100), RG(0, H), RG(30, 100), RG(20, 70)); } speckle(x, W, H, 700, ['rgba(255,255,255,.7)', 'rgba(90,100,120,.5)'], 1, 3); }
    else if (style === 'rimba') { over('rgb(60,62,58)', 0.22); edge('rgba(40,86,30,.9)', 56); for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(70,50,30,.32)'; x.fillRect(RG(30, W - 90), RG(0, H), RG(40, 100), RG(30, 90)); } speckle(x, W, H, 600, ['rgba(100,120,40,.55)', 'rgba(130,90,40,.5)', 'rgba(50,80,30,.5)'], 2, 5); }
    else if (style === 'neon') { over('rgb(26,26,44)', 0.32); for (let i = 0; i < 24; i++) { const col = ['rgba(255,60,220,.16)', 'rgba(40,230,255,.16)', 'rgba(255,230,60,.1)'][i % 3], w = RG(8, 26); x.fillStyle = col; x.fillRect(RG(0, W), RG(0, H), w, RG(60, 220)); } }
    else if (style === 'batu') { over('rgb(150,80,50)', 0.2); edge('rgba(176,96,56,.9)', 58); speckle(x, W, H, 900, ['rgba(120,60,40,.6)', 'rgba(210,150,100,.5)', 'rgba(90,60,50,.6)'], 1, 4); for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(190,120,76,.22)'; x.fillRect(RG(40, W - 120), RG(0, H), RG(50, 130), RG(30, 90)); } }
  }
  roadTex.needsUpdate = true;
}
// pagar: gaya per peta (material & ukuran mesh pagar)
const stoneTex = (() => { const c = mkCanvas(128, 64), x = c.getContext('2d'); x.fillStyle = '#6a6860'; x.fillRect(0, 0, 128, 64); for (let r = 0; r < 4; r++) { let px = (r % 2) * 14; while (px < 128) { const w = RG(22, 34); const gv = RG(96, 150) | 0; x.fillStyle = `rgb(${gv + (RG(0, 10) | 0)},${gv - 3},${gv - 12 + (RG(0, 6) | 0)})`; x.fillRect(px + 1, r * 16 + 1, w - 2, 14); x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(px + 1, r * 16 + 10, w - 2, 5); px += w; } } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(75, 1); return t; })();
const wallTexW = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.fillStyle = '#e8e4d8'; x.fillRect(0, 0, 64, 64); x.fillStyle = 'rgba(120,100,70,.22)'; x.fillRect(0, 52, 64, 12); x.fillStyle = '#c8c2b2'; x.fillRect(0, 0, 64, 8); x.fillRect(0, 0, 3, 64); speckle(x, 64, 64, 80, ['rgba(60,50,30,.18)'], 1, 3); const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(75, 1); return t; })();
const sandTexB = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.fillStyle = '#d6bd8a'; x.fillRect(0, 0, 64, 64); speckle(x, 64, 64, 200, ['rgba(120,95,60,.4)', 'rgba(255,245,220,.5)'], 1, 2.5); const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(75, 1); return t; })();
const RAILM = { tol: railMat, desa: new THREE.MeshStandardMaterial({ map: wallTexW, roughness: 0.95 }), stone: new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.97 }), pantai: new THREE.MeshStandardMaterial({ map: sandTexB, roughness: 1 }) };
function setRails(style) {
  const cfg = { tol: [railMat, railMat, 1, 1, 0.55], desa: [RAILM.desa, RAILM.desa, 2.6, 1.5, 0.4], gunung: [RAILM.stone, railMat, 2.8, 1.7, 0.5], pantai: [RAILM.pantai, RAILM.pantai, 3.4, 1.0, 0.3], batu: [RAILM.stone, RAILM.stone, 3.6, 2.0, 0.55], salju: [RAILM.stone, railMat, 2.8, 1.7, 0.5], rimba: [RAILM.desa, RAILM.desa, 2.6, 1.5, 0.4] }[style] || [railMat, railMat, 1, 1, 0.55];
  railMeshes.forEach((r, i) => { const metal = i === 1 && (style === 'gunung' || style === 'salju'); r.material = cfg[i]; r.scale.set(metal ? 1 : cfg[2], metal ? 1 : cfg[3], 1); r.position.y = metal ? 0.55 : cfg[4]; });
}
// ---------------- siluet pegunungan latar ----------------
function ridgeTex(style, layer) {
  if (style === 'tol') return ridge(layer ? 360 : 420, layer ? 42 : 70, 40, layer ? 3 : 0);
  const W = 1024, H = 256, c = mkCanvas(W, H), x = c.getContext('2d'), s = layer ? 3.3 : 0.7; let top = new Array(W + 1);
  for (let i = 0; i <= W; i++) {
    let y;
    if (style === 'volcano') y = layer ? 190 - Math.sin(i * 0.011 + s) * 22 - Math.sin(i * 0.037 + s * 2) * 9 : 232 - 150 * Math.exp(-Math.pow((i - 330) / 175, 2)) - 60 * Math.exp(-Math.pow((i - 760) / 150, 2)) - Math.sin(i * 0.02 + s) * 8;
    else if (style === 'alp') y = 250 - (Math.abs(Math.sin(i * 0.006 + s)) * (layer ? 80 : 115) + Math.abs(Math.sin(i * 0.017 + s * 2)) * (layer ? 36 : 62) + Math.abs(Math.sin(i * 0.043 + s)) * 14);
    else if (style === 'coast') y = layer ? 215 - Math.sin(i * 0.008 + s) * 14 : 232 - 38 * Math.exp(-Math.pow((i - 220) / 120, 2)) - 26 * Math.exp(-Math.pow((i - 760) / 90, 2));
    else y = layer ? 175 : ((i % 340) < 150 ? 120 : (i % 340) < 200 ? 120 + ((i % 340) - 150) * 2.2 : 230) - Math.sin(i * 0.05) * 3;   // mesa berpuncak datar
    top[i] = y;
  }
  const grd = x.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#f4f6fa'); grd.addColorStop(1, '#a9b3c2'); x.fillStyle = grd; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= W; i++) x.lineTo(i, top[i]); x.lineTo(W, H); x.closePath(); x.fill();
  x.globalCompositeOperation = 'source-atop';
  if (style === 'alp') { x.globalCompositeOperation = 'source-atop'; const sg = x.createLinearGradient(0, 40, 0, 150); sg.addColorStop(0, 'rgba(255,255,255,1)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = sg; x.fillRect(0, 0, W, 150); }
  x.globalCompositeOperation = 'source-over'; return mkTex(c);
}
const RIDGE_SCALE = { tol: [1, 1], volcano: [1.7, 1], alp: [2.5, 1.7], coast: [0.8, 0.7], mesa: [1.5, 1] };
function paintRidges(style) { mountains.forEach((m, i) => { const old = m.material.map; m.material.map = ridgeTex(style, i); m.material.needsUpdate = true; if (old && style !== 'tol') old.dispose(); const sc = RIDGE_SCALE[style][i], h = i ? 42 : 70; m.scale.y = sc; m.position.y = h * sc / 2 - 4; }); }

// ---------------- komponen pemandangan ----------------
const addMap = (id, o, x, z, extra) => addScen(o, x, z, Object.assign({ map: id }, extra || {}));
const EXTRA = {};
function leafTex2(kind) {
  const S = 256, c = mkCanvas(S, S), x = c.getContext('2d');
  if (kind === 'bamboo') { for (let i = 0; i < 90; i++) { const a = RG(-2.6, -0.5), L = RG(60, 110), ox = S / 2 + RG(-30, 30), oy = S * 0.6 + RG(-40, 40); x.strokeStyle = ['#4a7a2a', '#5e9632', '#76ac3e', '#8ac04c'][(RG(0, 4)) | 0]; x.lineWidth = RG(2, 4); x.beginPath(); x.moveTo(ox, oy); x.quadraticCurveTo(ox + Math.cos(a) * L * 0.5, oy + Math.sin(a) * L * 0.5 - 10, ox + Math.cos(a) * L, oy + Math.sin(a) * L + 14); x.stroke(); } }
  else if (kind === 'banana') { x.fillStyle = '#5a9a2e'; x.beginPath(); x.moveTo(S / 2, S); x.quadraticCurveTo(S * 0.02, S * 0.5, S / 2, 0); x.quadraticCurveTo(S * 0.98, S * 0.5, S / 2, S); x.fill(); x.strokeStyle = '#b8d878'; x.lineWidth = 3; x.beginPath(); x.moveTo(S / 2, S); x.lineTo(S / 2, 0); x.stroke(); for (let i = 0; i < 24; i++) { const y = S - 14 - i * 10; x.strokeStyle = 'rgba(40,80,20,.5)'; x.lineWidth = 1.4; [-1, 1].forEach(sd => { x.beginPath(); x.moveTo(S / 2, y); x.lineTo(S / 2 + sd * (S * 0.42) * Math.sin(Math.PI * (1 - y / S)) ** 0.6, y - 10); x.stroke(); }); } }
  else { const pal = ['#8a8a3a', '#a09a46', '#6e7a34', '#b4a85a']; for (let i = 0; i < 180; i++) { const px = S / 2 + Math.cos(RG(0, 6.28)) * Math.sqrt(RG()) * S * 0.42, py = S / 2 + Math.sin(RG(0, 6.28)) * Math.sqrt(RG()) * S * 0.42; x.save(); x.translate(px, py); x.rotate(RG(0, 6.28)); x.fillStyle = pal[(RG(0, 4)) | 0]; x.beginPath(); x.moveTo(0, -12); x.quadraticCurveTo(6, 0, 0, 12); x.quadraticCurveTo(-6, 0, 0, -12); x.fill(); x.restore(); } }
  x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(255,255,230,.08)'); g.addColorStop(1, 'rgba(0,12,0,.35)'); x.fillStyle = g; x.fillRect(0, 0, S, S); const t = mkTex(c); t.anisotropy = 4; return t;
}
const bambooM = mkLeafMat(leafTex2('bamboo')), bananaM = mkLeafMat(leafTex2('banana')), dryM = mkLeafMat(leafTex2('dry'));
function stripLeaf(B, top, a, L, rise, wmax, drop, seg = 7) {
  const base = B.pos.length / 3, d = V3(Math.cos(a), 0, Math.sin(a)), side = V3(-d.z, 0, d.x);
  for (let s = 0; s <= seg; s++) { const t = s / seg, p = top.clone().addScaledVector(d, t * L).add(V3(0, rise * Math.sin(t * 1.5) - drop * t * t, 0)), w = wmax * Math.pow(Math.sin(Math.PI * (0.08 + t * 0.9)), 0.7) + 0.03, nn = V3(0, 1, 0).addScaledVector(d, -0.2).normalize(); [-1, 1].forEach(sd => { const q = p.clone().addScaledVector(side, sd * w); B.pos.push(q.x, q.y, q.z); B.nor.push(nn.x, nn.y, nn.z); B.uv.push(sd < 0 ? 0 : 1, t); }); }
  for (let s = 0; s < seg; s++) { const i = base + s * 2; B.idx.push(i, i + 1, i + 3, i, i + 3, i + 2); }
}
function buildBanana() { const B = newB(), h = RG(1.6, 2.4), n = 8; for (let k = 0; k < n; k++) stripLeaf(B, V3(0, h, 0), k / n * 6.283 + RG(-0.3, 0.3), RG(2.2, 3), RG(0.4, 1.2), 0.55, RG(1.2, 2.4)); return { trunk: trunkGeo(h, 0.16, 0.11, RG(-0.2, 0.2), 8, 4, 0.2), fol: B2G(B), mat: bananaM, tmat: trunkMat }; }
function buildBamboo() {
  const B = newB(), tr = []; for (let i = 0; i < 12; i++) { const a = RG(0, 6.28), r = RG(0.1, 0.8), h = RG(6, 9.5), bend = RG(-0.9, 0.9), x = Math.cos(a) * r, z = Math.sin(a) * r, g = new THREE.CylinderGeometry(0.035, 0.055, h, 6, 5, true); g.translate(0, h / 2, 0); const p = g.attributes.position; for (let k = 0; k < p.count; k++) { const t = p.getY(k) / h; p.setXYZ(k, p.getX(k) + bend * t * t + x, p.getY(k), p.getZ(k) + z); } tr.push(g); crown(B, x + bend, h - 0.6, z, 1.0, 1.6, 1.0, 5, 1.2, 2); }
  return { trunk: mergeGeos(tr), fol: B2G(B), mat: bambooM, tmat: new THREE.MeshStandardMaterial({ color: 0x9aa84a, roughness: 0.7 }) };
}
function buildDryShrub() { const B = newB(), s = RG(0.8, 1.4); crown(B, 0, 0.5 * s, 0, 0.9 * s, 0.6 * s, 0.9 * s, 12, 0.9, 1.5); return { trunk: null, fol: B2G(B), mat: dryM, tmat: null }; }
const BANANA_V = Array.from({ length: 3 }, buildBanana), BAMBOO_V = Array.from({ length: 3 }, buildBamboo), DRY_V = Array.from({ length: 4 }, buildDryShrub);
const pickV = arr => arr[(RG() * arr.length) | 0], treeOf = arr => makeTreeFrom(pickV(arr));

// ---- rumah desa ----
function plasterTex(col, front) {
  const c = mkCanvas(256, 256), x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 256, 256); speckle(x, 256, 256, 400, ['rgba(80,70,50,.14)', 'rgba(255,255,255,.08)'], 1, 4);
  const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(50,40,25,.18)'); g.addColorStop(0.2, 'rgba(0,0,0,0)'); g.addColorStop(0.85, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,45,30,.4)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  if (front) { x.fillStyle = '#5a3c26'; x.fillRect(150, 96, 56, 160); x.fillStyle = '#3e2818'; x.fillRect(158, 106, 40, 70); x.fillRect(158, 186, 40, 60); x.fillStyle = '#e8e2d0'; x.fillRect(32, 92, 84, 76); x.fillStyle = '#2a3a4a'; x.fillRect(38, 98, 72, 64); x.fillStyle = '#4a7a5a'; x.fillRect(32, 92, 22, 76); x.fillRect(94, 92, 22, 76); x.fillStyle = '#e8e2d0'; x.fillRect(73, 98, 3, 64); x.fillRect(38, 128, 72, 3); }
  return mkTex(c);
}
const roofTileTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#a4502e'; x.fillRect(0, 0, 128, 128); for (let r = 0; r < 12; r++) for (let q = 0; q < 10; q++) { x.fillStyle = `rgb(${(RG(150, 190)) | 0},${(RG(70, 96)) | 0},${(RG(40, 62)) | 0})`; x.fillRect(q * 13 + (r % 2) * 6, r * 11, 12, 9.5); x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(q * 13 + (r % 2) * 6, r * 11 + 8, 12, 2); } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const HOUSE_COL = ['#e6dcc4', '#d8c8a2', '#c9d6c0', '#e8cdb0', '#d6d6d0'], houseFront = HOUSE_COL.map(c => new THREE.MeshStandardMaterial({ map: plasterTex(c, true), roughness: 0.9 })), houseSide = HOUSE_COL.map(c => new THREE.MeshStandardMaterial({ map: plasterTex(c, false), roughness: 0.92 }));
const roofMatT = new THREE.MeshStandardMaterial({ map: roofTileTex, roughness: 0.85, side: THREE.DoubleSide }), floorMat = new THREE.MeshStandardMaterial({ color: 0x8a8a84, roughness: 0.95 });
function gableRoof(w, d, rh, ov) {
  const hx = w / 2 + ov, hz = d / 2 + ov * 0.9, sl = Math.hypot(hz, rh), P = [], U = [], I = [], quad = (a, b, c, e) => { const i = P.length / 3; [a, b, c, e].forEach(p => P.push(...p)); U.push(0, 0, hx * 2 / 1.1, 0, hx * 2 / 1.1, sl / 0.5, 0, sl / 0.5); I.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  quad([-hx, 0, hz], [hx, 0, hz], [hx, rh, 0], [-hx, rh, 0]); quad([hx, 0, -hz], [-hx, 0, -hz], [-hx, rh, 0], [hx, rh, 0]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals(); return g;
}
function makeHouse() {
  const g = new THREE.Group(), w = rr(6.5, 9), d = rr(5, 7), h = rr(2.7, 3.3), k = (RG() * HOUSE_COL.length) | 0, rh = rr(1.5, 2.1);
  const body = new THREE.Mesh(regroupBox(new THREE.BoxGeometry(w, h, d), [[0, 1, 5], [4], [2, 3]]), [houseSide[k], houseFront[k], floorMat]);   // 3 draw call (bukan 6) body.position.y = h / 2; body.castShadow = true; g.add(body);
  const roof = new THREE.Mesh(gableRoof(w, d, rh, 0.55), roofMatT); roof.position.y = h; roof.castShadow = true; g.add(roof);
  const tri = new THREE.BufferGeometry(), hz0 = d / 2; tri.setAttribute('position', new THREE.Float32BufferAttribute([w / 2, h, -hz0, w / 2, h, hz0, w / 2, h + rh * 0.9, 0, -w / 2, h, hz0, -w / 2, h, -hz0, -w / 2, h + rh * 0.9, 0], 3)); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1, 0, 0, 1, 0, 0.5, 1], 2)); tri.computeVertexNormals(); g.add(new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ map: houseSide[k].map, roughness: 0.9, side: THREE.DoubleSide })));
  const det = new THREE.Group(); g.add(det); g.userData.lodParts = [[det, 85]];   // teras & tiang disembunyikan di kejauhan
  const ver = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.15, 1.6), floorMat); ver.position.set(0, 0.07, d / 2 + 0.8); const parts = [bakeMesh(ver)];
  [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, h - 0.2, 8), floorMat); p.position.set(sd * w * 0.4, h / 2, d / 2 + 1.4); parts.push(bakeMesh(p)); });
  det.add(new THREE.Mesh(mergeGeos(parts), floorMat));    // teras + tiang = 1 mesh
  const vroof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.12, 1.9), roofMatT); vroof.position.set(0, h - 0.15, d / 2 + 0.95); det.add(vroof);
  return g;
}
function makeHut() { const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.95 }); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.2, 6), wood); p.position.set(a * 1.1, 1.1, b * 1.1); g.add(p); }); const fl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 2.6), wood); fl.position.y = 0.8; g.add(fl); const rf = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.5, 4, 1, true), new THREE.MeshStandardMaterial({ color: 0xb8a060, roughness: 1, side: THREE.DoubleSide })); rf.rotation.y = Math.PI / 4; rf.position.y = 2.9; rf.castShadow = true; g.add(rf); return g; }
function makePole(spacing) {
  const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x9a9a94, roughness: 0.9 }), p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 8.5, 8), m); p.position.y = 4.25; const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 2.0), m); arm.position.y = 8.1; arm.rotation.y = Math.PI / 2; const pm = new THREE.Mesh(mergeGeos([bakeMesh(p), bakeMesh(arm)]), m); pm.castShadow = true; g.add(pm);   // tiang + lengan = 1 mesh
  const pts = []; [-0.9, 0, 0.9].forEach(dx => { const y0 = 8.1 + (dx === 0 ? 0.35 : 0); let last = null; for (let k = 0; k <= 8; k++) { const t = k / 8, pt = [dx, y0 - Math.sin(Math.PI * t) * 0.9, -spacing * t]; if (last) pts.push(...last, ...pt); last = pt; } });
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x15151a }))); return g;
}
// ---- pantai ----
function umbrella() {
  const g = new THREE.Group(), pair = pick([['#e8402a', '#f8f0e8'], ['#2a7ae8', '#f8f0e8'], ['#f0b020', '#f8f0e8'], ['#20a860', '#f8f0e8']]), c = mkCanvas(64, 8), x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? pair[1] : pair[0]; x.fillRect(i * 8, 0, 8, 8); }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xcfcfcf, metalness: 0.6, roughness: 0.4 })); pole.position.y = 1.2; g.add(pole);
  const can = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.5, 16, 1, true), new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.8, side: THREE.DoubleSide })); can.position.y = 2.35; can.castShadow = true; g.add(can); g.rotation.z = RG(-0.08, 0.08);
  const ch = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.8 }); [-1, 1].forEach(sd => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 1.1), ch); b.position.set(sd * 0.8, 0.28, 0.2); b.rotation.x = -0.35; g.add(b); }); return g;
}
function boat() {
  const g = new THREE.Group(), col = pick([0x2a6ae0, 0xd8222a, 0xf2b81c, 0xe8e8ee, 0x2a9a4a]), poly = polyV([[-2.5, 0.35], [-2.3, 0.04], [2.1, 0.04], [2.8, 0.5], [2.6, 0.62], [-2.4, 0.58]]), hull = new THREE.Mesh(bodyLoft2(poly, -2.5, 2.8, 0.42, { N: 30, nTop: 2.4, nBot: 2.2, rF: 0.5, rR: 0.2, M: 20 }), new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.1 })); hull.castShadow = true; g.add(hull);
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.9 }); [-1.3, 0.9].forEach(z => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.2, 6), wood); a.rotation.z = Math.PI / 2; a.position.set(1.5, 0.75, z); g.add(a); }); const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 4.4, 8), wood); fl.rotation.x = Math.PI / 2; fl.position.set(3.1, 0.35, -0.2); g.add(fl); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 2.4, 6), wood); m.position.set(0, 1.5, 0); g.add(m);
  g.rotation.y = RG(-0.2, 0.2); return g;
}
const seaCv = (() => { const c = mkCanvas(256, 256), x = c.getContext('2d'); x.fillStyle = '#2a8fb0'; x.fillRect(0, 0, 256, 256); for (let k = 0; k < 46; k++) { x.strokeStyle = RG() < 0.5 ? 'rgba(210,245,250,.28)' : 'rgba(10,70,100,.3)'; x.lineWidth = RG(1.5, 4); x.beginPath(); const y0 = RG(0, 256), ph = RG(0, 6.28); for (let i = -8; i <= 264; i += 8) { const y = y0 + Math.sin(i * 0.05 + ph) * 6; i < 0 ? x.moveTo(i, y) : x.lineTo(i, y); } x.stroke(); } speckle(x, 256, 256, 260, ['rgba(255,255,255,.5)'], 1, 2.2); return c; })();
const seaTex = (() => { const t = mkTex(seaCv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(19, 15); return t; })();
const foamTex = (() => { const c = mkCanvas(64, 256), x = c.getContext('2d'); for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(255,255,255,${RG(0.15, 0.6)})`; x.beginPath(); x.ellipse(RG(0, 64), RG(0, 256), RG(2, 9), RG(1, 4), 0, 0, 6.28); x.fill(); } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 50); return t; })();
let sea = null, foam = null;
function buildSea() {
  const g = new THREE.PlaneGeometry(380, 300, 24, 150), p = g.attributes.position, cols = []; for (let i = 0; i < p.count; i++) cols.push(...mixC([0.08, 0.28, 0.52], [0.3, 0.82, 0.86], clamp((p.getX(i) - 100) / 90, 0, 1)));   // dalam (biru tua) → dangkal (toska) menuju pantai
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); sea = new THREE.Mesh(g, envMat(new THREE.MeshStandardMaterial({ map: seaTex, vertexColors: true, roughness: 0.16, metalness: 0.15 }), 1.3)); sea.rotation.x = -Math.PI / 2; sea.position.set(-236, -1.3, -120); scene.add(sea);
  foam = new THREE.Mesh(new THREE.PlaneGeometry(5, 300, 1, 150), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); foam.rotation.x = -Math.PI / 2; foam.position.set(-46, -1.26, -120); scene.add(foam); EXTRA.pantai = [sea, foam];
}
// ---- salju turun (Points mengikuti kamera; jatuh pelan + terbawa laju mobil) ----
const SNOW_N = 650; let snow = null; const snowD = new Float32Array(SNOW_N * 3);
function buildSnow() {
  const g = new THREE.BufferGeometry(), pos = new Float32Array(SNOW_N * 3); for (let i = 0; i < SNOW_N; i++) { snowD[i * 3] = rr(-16, 16); snowD[i * 3 + 1] = rr(-2.5, 13); snowD[i * 3 + 2] = rr(-60, 6); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: 0xffffff, size: 0.16, transparent: true, opacity: 0.9, depthWrite: false, fog: false }); m.userData.noBend = true;
  snow = new THREE.Points(g, m); snow.frustumCulled = false; snow.renderOrder = 19; scene.add(snow); EXTRA.salju = [snow];
}
function snowFrame(dt, v) {
  if (!snow || !snow.visible) return; const p = snow.geometry.attributes.position.array, spd = state === 'play' || state === 'count' ? v : 4, n = Math.round(SNOW_N * (typeof GFXC !== 'undefined' ? Math.max(0.4, GFXC.rain) : 1)); snow.geometry.setDrawRange(0, n);
  for (let i = 0; i < n; i++) { const j = i * 3; let x = snowD[j] + Math.sin(elapsed * 0.8 + i) * 0.3 * dt, y = snowD[j + 1] - 1.7 * dt, z = snowD[j + 2] + spd * dt; if (y < -2.5) { x = rr(-16, 16); y = rr(8, 13); z = rr(-60, 6); } else if (z > 7) { x = rr(-16, 16); y = rr(-1, 13); z = -55 - rr(0, 6); } snowD[j] = x; snowD[j + 1] = y; snowD[j + 2] = z; p[j] = x; p[j + 1] = y; p[j + 2] = z; }
  snow.geometry.attributes.position.needsUpdate = true; snow.position.copy(camera.position);
}
// ---- awan lembah (pegunungan) ----
const cloudTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'); for (let i = 0; i < 22; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 40); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.save(); x.translate(RG(30, 98), RG(40, 88)); x.scale(RG(0.9, 1.5), RG(0.5, 0.9)); x.fillStyle = g; x.fillRect(-40, -40, 80, 80); x.restore(); } return mkTex(c); })();

// ---------------- pembangun tiap peta ----------------
const BUILT = {};
function ensureBuilt(id) {
  if (BUILT[id] || id === 'tol') return; BUILT[id] = true;
  if (id === 'desa') {
    for (let k = 0; k < 7; k++) [-1, 1].forEach(sd => { const h = makeHouse(); h.rotation.y = -sd * Math.PI / 2 + RG(-0.12, 0.12); addMap('desa', h, sd * RG(13, 26), -k * (SCEN_LEN / 7) - RG(0, 20), { sd, fixed: true }); });
    for (let k = 0; k < 11; k++) [-1, 1].forEach(sd => addMap('desa', makePole(SCEN_LEN / 11), sd * 8.7, -k * (SCEN_LEN / 11), { sd, fixed: true }));
    for (let k = 0; k < 20; k++) [-1, 1].forEach(sd => addMap('desa', pickTree0(), sd * RG(9.5, 40), -k * (SCEN_LEN / 20) + RG(-4, 4), { sd, rx: [9.5, 40] }));
    for (let k = 0; k < 14; k++) [-1, 1].forEach(sd => addMap('desa', treeOf(BANANA_V), sd * RG(9, 20), -k * (SCEN_LEN / 14) + RG(-5, 5), { sd, rx: [9, 20] }));
    for (let k = 0; k < 7; k++) [-1, 1].forEach(sd => addMap('desa', treeOf(BAMBOO_V), sd * RG(12, 30), -k * (SCEN_LEN / 7) + RG(-8, 8), { sd, rx: [12, 30] }));
    for (let k = 0; k < 5; k++) [-1, 1].forEach(sd => addMap('desa', makeHut(), sd * RG(14, 36), -k * (SCEN_LEN / 5) - RG(0, 30), { sd, fixed: true }));
  } else if (id === 'gunung') {
    const hL = (x, z) => { const d0 = Math.max(0, -x - 9), d = d0 + (fbmP(x * 1.4, z * 1.4, 40, 4) - 0.5) * 7 * smoothS(0, 10, d0); return (d < 4 ? d * 1.15 : 4.6 + (d - 4) * 0.58) + (fbmP(x * 2.5, z * 2.5, 40, 4) - 0.5) * (1.2 + d * 0.3); };
    const hR = (x, z) => { const d = Math.max(0, x - 9); return Math.max(-28, -(d * 0.17 + d * d * 0.0125)) + (fbmP(x, z, 40, 4) - 0.5) * (0.4 + d * 0.16); };
    const forest = (x, y, z, n) => { const steep = clamp(1 - n.y, 0, 1), nz = fbmP(x * 1.7, z * 1.7, 40, 3), rock = clamp((steep - 0.28) * 4, 0, 1); return jit(mixC(mixC([0.1, 0.2, 0.09], [0.2, 0.32, 0.14], nz), [0.4, 0.37, 0.32], rock), 0.78 + 0.35 * fbmP(x * 4, z * 4, 40, 2)); };
    addTerrain('gunung', -62, -9, hL, forest, 44, 30); addTerrain('gunung', 9, 62, hR, forest, 40, 28);
    const pine = () => makeTreeFrom(pickV(TREE_V[2]));
    for (let k = 0; k < 26; k++) [-1, 1].forEach(sd => { const f = sd < 0 ? hL : hR, o = pine(); o.scale.multiplyScalar(RG(1.0, 1.7)); addMap('gunung', o, sd * RG(10, 48), -k * (SCEN_LEN / 26) + RG(-5, 5), { sd, fixed: true, yf: (x, bz) => f(x, bz) - 0.2 }); const it = scen[scen.length - 1]; it.o.position.y = it.yf(it.o.position.x, it.bz); });
    for (let k = 0; k < 18; k++) { const o = rockItem(pick(['granit', 'granit', 'vulkan']), RG(0.7, 2.2)); addMap('gunung', o, -RG(9.4, 13), -k * (SCEN_LEN / 18) - RG(0, 10), { sd: -1, fixed: true }); }
    const cl = []; for (let k = 0; k < 9; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, opacity: 0.55 })); s.scale.set(70, 30, 1); s.userData.own = true; addMap('gunung', s, RG(40, 95), -k * (SCEN_LEN / 9), { sd: 1, fixed: true }); s.position.y = RG(-16, -6); }
  } else if (id === 'pantai') {
    const hD = (x, z) => { const d = Math.max(0, x - 9); return Math.min(2.4, d * 0.05) * (0.5 + fbmP(x, z, 40, 3)) + (fbmP(x * 2, z * 2, 40, 3) - 0.5) * 0.7 - 0.1; };
    const hB = (x, z) => { const d = Math.max(0, -x - 9); return (d < 28 ? 0 : -(d - 28) * 0.13) - 0.1 + (fbmP(x, z, 40, 3) - 0.5) * 0.25 * (d < 28 ? 1 : 0.3); };
    const sand = (x, y, z, n) => { const nz = fbmP(x * 2, z * 2, 40, 3), d = -x - 9, wet = x < 0 ? clamp((d - 30) / 8, 0, 1) : 0, grass = x > 0 ? clamp((fbmP(x * 0.7, z * 0.7, 40, 3) - 0.55) * 4, 0, 0.8) : 0; return jit(mixC(mixC(mixC([0.86, 0.75, 0.55], [0.78, 0.66, 0.46], nz), [0.5, 0.42, 0.3], wet), [0.42, 0.52, 0.25], grass), 0.9 + 0.2 * nz); };
    addTerrain('pantai', -72, -9, hB, sand, 36, 22); addTerrain('pantai', 9, 70, hD, sand, 30, 22); buildSea();
    for (let k = 0; k < 18; k++) [-1, 1].forEach(sd => { const o = makeTreeFrom(pickV(TREE_V[3])); o.rotation.z = RG(-0.12, 0.12); o.scale.multiplyScalar(RG(1, 1.2)); addMap('pantai', o, sd * RG(sd < 0 ? 10.5 : 11, sd < 0 ? 26 : 40), -k * (SCEN_LEN / 18) + RG(-5, 5), { sd, rx: [sd < 0 ? 10.5 : 11, sd < 0 ? 26 : 40] }); });
    for (let k = 0; k < 14; k++) addMap('pantai', umbrella(), -RG(13, 30), -k * (SCEN_LEN / 14) - RG(0, 10), { sd: -1, fixed: true });
    for (let k = 0; k < 7; k++) addMap('pantai', boat(), -RG(30, 40), -k * (SCEN_LEN / 7) - RG(0, 25), { sd: -1, fixed: true });
    for (let k = 0; k < 6; k++) addMap('pantai', makeHut(), -RG(12, 20), -k * (SCEN_LEN / 6) - RG(0, 30), { sd: -1, fixed: true });
    for (let k = 0; k < 14; k++) addMap('pantai', treeOf(DRY_V), RG(11, 34), -k * (SCEN_LEN / 14) + RG(-5, 5), { sd: 1, rx: [11, 34] });
  } else if (id === 'batu') {
    const hC = (x, z) => { const d0 = Math.max(0, Math.abs(x) - 9), d = d0 + (fbmP(x * 1.6, z * 1.6, 40, 4) - 0.5) * 9 * smoothS(0, 7, d0) + (fbmP(x * 5, z * 5, 40, 3) - 0.5) * 1.6 * smoothS(3, 10, d0), w = smoothS(4, 16, d); return w * 40 + Math.max(0, d - 16) * 0.5 + (fbmP(x * 3, z * 3, 40, 3) - 0.5) * (0.5 + w * 4); };
    const strata = (x, y, z, n) => { const t = y * 0.55 + (fbmP(x, z, 40, 3) - 0.5) * 2.4, b = Math.floor(t) % 5, bands = [[0.66, 0.3, 0.18], [0.78, 0.46, 0.28], [0.88, 0.7, 0.5], [0.5, 0.22, 0.14], [0.72, 0.36, 0.22]], c = bands[(b + 5) % 5], steep = clamp(1 - n.y, 0, 1); return jit(mixC(c, [0.6, 0.42, 0.3], (1 - steep) * 0.55), 0.78 + 0.4 * fbmP(x * 5, z * 5, 40, 2)); };
    addTerrain('batu', -62, -9, (x, z) => hC(x, z), strata, 48, 34); addTerrain('batu', 9, 62, (x, z) => hC(x, z), strata, 48, 34);
    for (let k = 0; k < 24; k++) [-1, 1].forEach(sd => { const o = rockItem(pick(['pasir', 'pasir', 'kapur', 'granit']), RG(0.5, 2.6)); addMap('batu', o, sd * RG(9.6, 17), -k * (SCEN_LEN / 24) + RG(-5, 5), { sd, fixed: true }); });
    for (let k = 0; k < 14; k++) [-1, 1].forEach(sd => addMap('batu', treeOf(DRY_V), sd * RG(10, 16), -k * (SCEN_LEN / 14) + RG(-5, 5), { sd, rx: [10, 16] }));
  }
  else if (id === 'salju') {
    const hL = (x, z) => { const d0 = Math.max(0, -x - 9), d = d0 + (fbmP(x * 1.4, z * 1.4, 40, 4) - 0.5) * 7 * smoothS(0, 10, d0); return (d < 4 ? d * 1.15 : 4.6 + (d - 4) * 0.58) + (fbmP(x * 2.5, z * 2.5, 40, 4) - 0.5) * (1.2 + d * 0.3); };
    const hR = (x, z) => { const d = Math.max(0, x - 9); return Math.max(-28, -(d * 0.17 + d * d * 0.0125)) + (fbmP(x, z, 40, 4) - 0.5) * (0.4 + d * 0.16); };
    const snow = (x, y, z, n) => { const steep = clamp(1 - n.y, 0, 1), nz = fbmP(x * 2, z * 2, 40, 3), rock = clamp((steep - 0.42) * 4, 0, 0.8); return jit(mixC(mixC([0.94, 0.96, 1], [0.78, 0.85, 0.96], nz), [0.4, 0.38, 0.38], rock), 0.93 + 0.1 * fbmP(x * 5, z * 5, 40, 2)); };
    addTerrain('salju', -62, -9, hL, snow, 44, 30); addTerrain('salju', 9, 62, hR, snow, 40, 28);
    for (let k = 0; k < 22; k++) [-1, 1].forEach(sd => { const f = sd < 0 ? hL : hR, o = makeTreeFrom(pickV(TREE_V[2])); o.scale.multiplyScalar(RG(0.9, 1.6)); addMap('salju', o, sd * RG(10, 46), -k * (SCEN_LEN / 22) + RG(-5, 5), { sd, fixed: true, yf: (x, bz) => f(x, bz) - 0.2 }); const it = scen[scen.length - 1]; it.o.position.y = it.yf(it.o.position.x, it.bz); });
    for (let k = 0; k < 12; k++) addMap('salju', rockItem('granit', RG(0.7, 2)), -RG(9.4, 13), -k * (SCEN_LEN / 12) - RG(0, 10), { sd: -1, fixed: true });
    buildSnow();
  } else if (id === 'hutan') {
    const hF = (x, z) => { const d = Math.max(0, Math.abs(x) - 9); return Math.min(9, d * 0.2) * (0.6 + fbmP(x * 1.2, z * 1.2, 40, 3)) + (fbmP(x * 3, z * 3, 40, 3) - 0.5) * 1.4 - 0.1; };
    const moss = (x, y, z, n) => { const nz = fbmP(x * 2, z * 2, 40, 3); return jit(mixC([0.07, 0.19, 0.06], [0.18, 0.36, 0.1], nz), 0.8 + 0.3 * fbmP(x * 5, z * 5, 40, 2)); };
    addTerrain('hutan', -62, -9, hF, moss, 40, 28); addTerrain('hutan', 9, 62, hF, moss, 40, 28);
    const plant = (o, x, z) => { addMap('hutan', o, x, z, { sd: Math.sign(x), fixed: true, yf: (xx, bz) => hF(xx, bz) - 0.15 }); const it = scen[scen.length - 1]; it.o.position.y = it.yf(it.o.position.x, it.bz); };
    for (let k = 0; k < 26; k++) [-1, 1].forEach(sd => { const o = makeTreeFrom(pickV(TREE_V[RG() < 0.8 ? 0 : 1])); o.scale.multiplyScalar(RG(1.5, 2.4)); plant(o, sd * RG(9.6, 44), -k * (SCEN_LEN / 26) + RG(-5, 5)); });
    for (let k = 0; k < 14; k++) [-1, 1].forEach(sd => plant(treeOf(BANANA_V), sd * RG(9, 22), -k * (SCEN_LEN / 14) + RG(-5, 5)));
    for (let k = 0; k < 10; k++) [-1, 1].forEach(sd => plant(treeOf(BAMBOO_V), sd * RG(10, 30), -k * (SCEN_LEN / 10) + RG(-8, 8)));
    for (let k = 0; k < 8; k++) [-1, 1].forEach(sd => plant(pickTree0(), sd * RG(10, 30), -k * (SCEN_LEN / 8) + RG(-8, 8)));
    for (let k = 0; k < 10; k++) addMap('hutan', rockItem('vulkan', RG(0.5, 1.4)), (k % 2 ? 1 : -1) * RG(9.5, 14), -k * (SCEN_LEN / 10) - RG(0, 12), { sd: k % 2 ? 1 : -1, fixed: true });
  } else if (id === 'neon') {
    const WORDS = ['HOTEL', 'BAR', 'RAMEN', '24 JAM', 'KARAOKE', 'PIZZA', 'CAFE', 'TOKO', 'APOTEK', 'BANK', 'SPA', 'CLUB'], COLS = ['#ff2bd6', '#25e8ff', '#ffe93a', '#8a6cff', '#ff4a4a', '#3aff9a'];
    const signMats = WORDS.map((w, i) => { const c = mkCanvas(128, 256), x = c.getContext('2d'), col = COLS[i % COLS.length]; x.fillStyle = '#06060e'; x.fillRect(0, 0, 128, 256); x.shadowColor = col; x.shadowBlur = 14; x.strokeStyle = col; x.lineWidth = 5; x.strokeRect(10, 10, 108, 236); x.fillStyle = col; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; const parts = w.split(' '); if (w.length <= 5) { x.save(); x.translate(64, 128); x.rotate(-Math.PI / 2); x.font = 'bold 56px sans-serif'; x.fillText(w, 0, 18); x.restore(); } else parts.forEach((p, k) => x.fillText(p, 64, 110 + k * 42)); for (let k = 0; k < 6; k++) { x.globalAlpha = 0.35; x.fillRect(24, 24 + k * 6, 80, 2); } x.globalAlpha = 1; const t = mkTex(c); return new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, fog: false }); });
    const sign = i => { const g = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.2), signMats[i % signMats.length]); m.position.y = 0; g.add(m); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4, 6), new THREE.MeshStandardMaterial({ color: 0x222228 })); pole.position.y = -4; g.add(pole); return g; };
    for (let k = 0; k < 11; k++) [-1, 1].forEach(sd => { const g = sign(k * 2 + (sd > 0 ? 1 : 0)), o = new THREE.Group(); g.position.y = RG(6.5, 10); o.add(g); o.rotation.y = sd < 0 ? Math.PI / 2 : -Math.PI / 2; addMap('neon', o, sd * RG(9.6, 12), -k * (SCEN_LEN / 11) + RG(-6, 6), { sd, fixed: true }); });
    // garis neon sepanjang pagar (tabung emissive di kedua sisi, berwarna bergantian)
    for (let k = 0; k < 14; k++) [-1, 1].forEach(sd => { const col = [0xff2bd6, 0x25e8ff][(k + (sd > 0 ? 1 : 0)) % 2], m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, SCEN_LEN / 14 - 2), new THREE.MeshBasicMaterial({ color: col, fog: false })); m.position.y = 1.15; addMap('neon', m, sd * 7.1, -k * (SCEN_LEN / 14) - SCEN_LEN / 28, { sd, fixed: true }); });
  }
  const cur = MAP.id; scen.forEach(s => { if (s.map === id) s.o.visible = cur === id; });
}
const pickTree0 = () => makeTreeFrom(pickV(TREE_V[3]));   // kelapa
// ---------------- penerapan peta ----------------
function setMap(i) {
  MAP = MAPS[i] || MAPS[0]; settings.map = MAPS.indexOf(MAP); saveSettings(); ensureBuilt(MAP.id);
  const sc0 = MAP.scen || MAP.id; for (const s of scen) { const m = s.map || 'tol'; s.o.visible = m === MAP.id || m === sc0 || s.map === 'all'; }
  FORCE_ENV = MAP.force == null ? null : MAP.force; MAP_WET = MAP.wet || 0; MAP_GRIP = MAP.grip || 1;
  for (const k in EXTRA) EXTRA[k].forEach(o => { o.visible = k === MAP.id; });
  paintGround(MAP.ground); paintRoad(MAP.road); setRails(MAP.rails); paintRidges(MAP.ridge);
  grass.visible = true; grass.position.x = MAP.id === 'pantai' ? 250 : 0; grass.position.y = MAP.id === 'gunung' || MAP.id === 'salju' ? -28 : -0.12;
  terrSetup(); if (typeof applyEnv === 'function') applyEnv(settings.env);
}
function applyMap(E) {
  const M = MAP.env; if (!M) return; const tint = new THREE.Color(M.tint), k = M.k * (1 - E.night * 0.8);
  scene.fog.color.lerp(tint, k); scene.background.copy(scene.fog.color); ['mid', 'bot'].forEach(n => skyMat.uniforms[n].value.lerp(tint, k * 0.7));
  scene.fog.near *= M.nearK; scene.fog.far *= M.farK; sun.intensity *= M.sunK; hemi.intensity *= M.hemiK;
}
function mapScroll(d) { if (MAP.id === 'pantai' && sea) { seaTex.offset.y += d / 20; foamTex.offset.y += d / 6; } for (const m of [RAILM.desa, RAILM.stone, RAILM.pantai]) if (m.map) m.map.offset.x += d / 3; }
function mapFocus(cz) { const w = v => ((v % 1) + 1) % 1; if (sea) { sea.position.z = cz; foam.position.z = cz; seaTex.offset.y = w(-(cz + 150) / 20); foamTex.offset.y = w(-(cz + 150) / 6); } for (const m of [RAILM.desa, RAILM.stone, RAILM.pantai]) if (m.map) m.map.offset.x = w((cz + 150) / 3); }
function mapFrame(dt) { if (MAP.id === 'salju') snowFrame(dt, typeof raceActive === 'function' && raceActive() ? race.humans[0].v : P.v); if (MAP.id === 'pantai' && sea) { seaTex.offset.x += dt * 0.012; foamTex.offset.x += dt * 0.004; foam.material.opacity = 0.6 + 0.3 * Math.sin(performance.now() / 900); } }
// ---------------- UI pilihan peta ----------------
function envLockUI() {   // peta yang memaksa waktu (neon = malam): tombol waktu dinonaktifkan + keterangan
  const eb = $('envBox'); if (!eb) return; const lk = MAP && MAP.force != null; eb.style.opacity = lk ? 0.45 : ''; eb.style.pointerEvents = lk ? 'none' : '';
  let h = $('envLockNote'); if (!h) { h = document.createElement('div'); h.id = 'envLockNote'; h.className = 'hint'; eb.parentNode.insertBefore(h, eb.nextSibling); }
  h.textContent = lk ? '🔒 Peta ini selalu malam hari (pilihan waktu dinonaktifkan).' : ''; h.style.display = lk ? '' : 'none';
}
(function buildMapUI() {
  const box = $('mapBox'), help = $('mapHelp'); if (!box) return;
  MAPS.forEach((m, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (MAP === m ? ' on' : ''); b.textContent = m.n; b.onclick = () => { setMap(k); if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); [...box.children].forEach((x, j) => x.classList.toggle('on', j === k)); help.textContent = m.help; envLockUI(); }; box.appendChild(b); });
  help.textContent = MAP.help; envLockUI();
})();
setMap(settings.map | 0);
