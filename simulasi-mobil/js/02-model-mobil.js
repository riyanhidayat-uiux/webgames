'use strict';
// ======================= MODEL MOBIL DETAIL (bodi melengkung, kaca, velg, lampu, plat) =======================
const _M4 = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _V = new THREE.Vector3(), _E = new THREE.Euler(), _S = new THREE.Vector3();
const BOXG = new THREE.BoxGeometry(1, 1, 1), CYLG = new THREE.CylinderGeometry(1, 1, 1, 14), SPHG = new THREE.SphereGeometry(1, 12, 8);
function place(geo, x, y, z, rx, ry, rz, sx, sy, sz) { const g = geo.clone(); _M4.compose(_V.set(x, y, z), _Q.setFromEuler(_E.set(rx || 0, ry || 0, rz || 0)), _S.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)); g.applyMatrix4(_M4); return g; }
const bx = (w, h, d, x, y, z, rx, ry, rz) => place(BOXG, x, y, z, rx, ry, rz, w, h, d);
const cyX = (r, len, x, y, z) => place(CYLG, x, y, z, 0, 0, Math.PI / 2, r, len, r), cyZ = (r, len, x, y, z) => place(CYLG, x, y, z, Math.PI / 2, 0, 0, r, len, r), cyY = (r, len, x, y, z) => place(CYLG, x, y, z, 0, 0, 0, r, len, r);
const spE = (sx, sy, sz, x, y, z) => place(SPHG, x, y, z, 0, 0, 0, sx, sy, sz);
function shapeFrom(ops) { const s = new THREE.Shape(); for (const o of ops) { if (o[0] === 'm') s.moveTo(o[1], o[2]); else if (o[0] === 'l') s.lineTo(o[1], o[2]); else s.quadraticCurveTo(o[1], o[2], o[3], o[4]); } s.closePath(); return s; }
// bentuk samping (x = maju, y = atas) -> diekstrusi selebar `width`; sumbu x bentuk menjadi -z dunia (depan = -z)
function extShape(shape, width, bevel) { const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, width - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 8 }); g.translate(0, 0, -(width - 2 * bevel) / 2); g.rotateY(Math.PI / 2); return g; }
const extPoly = (pts, w, b) => extShape(shapeFrom(pts.map((p, i) => [i ? 'l' : 'm', p[0], p[1]])), w, b);
function mergeGeos(list) {
  if (!list.length) return null; const parts = list.map(g => g.index ? g.toNonIndexed() : g); let n = 0; parts.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  for (const g of parts) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += c; }
  const r = new THREE.BufferGeometry(); r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); r.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return r;
}
// --- peta lingkungan (pantulan langit pada cat & kaca), diperbarui saat ganti siang/senja/malam ---
const carEnv = (() => { const faces = Array.from({ length: 6 }, () => mkCanvas(64, 64)); const t = new THREE.CubeTexture(faces); t.needsUpdate = true; t.userData = { faces }; return t; })();
function drawEnvFaces(E) {
  const hx = n => '#' + n.toString(16).padStart(6, '0'), gnd = E.night > 0.9 ? '#0a0c18' : E.night > 0 ? '#3a3228' : '#5c6458';
  carEnv.userData.faces.forEach((c, i) => { const x = c.getContext('2d'); if (i === 2) { x.fillStyle = hx(E.sky[0]); x.fillRect(0, 0, 64, 64); } else if (i === 3) { x.fillStyle = gnd; x.fillRect(0, 0, 64, 64); } else { const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, hx(E.sky[0])); g.addColorStop(0.3, hx(E.sky[1])); g.addColorStop(0.5, hx(E.sky[2])); g.addColorStop(0.52, gnd); g.addColorStop(1, gnd); x.fillStyle = g; x.fillRect(0, 0, 64, 64); if (i === 5 && E.night < 0.9) { const s = x.createRadialGradient(24, 26, 0, 24, 26, 18); s.addColorStop(0, 'rgba(255,250,225,1)'); s.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = s; x.fillRect(0, 0, 64, 64); } } });
  carEnv.needsUpdate = true; headMat.emissiveIntensity = E.night > 0.2 ? 2.4 : 0.6;
}
const platesTex = ['B 1234 KXZ', 'D 8821 AB', 'B 4607 TRS', 'AB 335 QW', 'L 2047 CD'].map(t => { const c = mkCanvas(128, 32), x = c.getContext('2d'); x.fillStyle = '#f4f4ee'; x.fillRect(0, 0, 128, 32); x.strokeStyle = '#111'; x.lineWidth = 2; x.strokeRect(1, 1, 126, 30); x.fillStyle = '#111'; x.font = 'bold 20px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 64, 17); x.fillStyle = '#d22'; x.fillRect(6, 25, 116, 2); return mkTex(c); });
const plateMats = platesTex.map(t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
const phong = (o) => new THREE.MeshPhongMaterial(Object.assign({ envMap: carEnv, combine: THREE.MixOperation }, o));      // Phong membaca peta pantulan langsung (tanpa PMREM)
const glassMat = phong({ color: 0x0b1320, specular: 0xffffff, shininess: 140, reflectivity: 0.6 });
const trimMat = new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: 0.55, metalness: 0.25 });
const chromeMat = phong({ color: 0xcfd4de, specular: 0xffffff, shininess: 160, reflectivity: 0.85 });
const headMat = phong({ color: 0xfff6dd, emissive: 0xfff0c0, emissiveIntensity: 0.6, specular: 0xffffff, shininess: 120, reflectivity: 0.3 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 0.92 }), rimMat = phong({ color: 0xc4c9d2, specular: 0xffffff, shininess: 120, reflectivity: 0.75 });
const cargoTex = (() => { const c = mkCanvas(128, 64), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 64); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(i * 16 + 8, 0); x.lineTo(i * 16 + 8, 64); x.stroke(); } x.strokeRect(1, 1, 126, 62); return mkTex(c); })();
const busTex = (() => { const c = mkCanvas(256, 64), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#d82a2a'; x.fillRect(0, 40, 256, 10); x.fillStyle = '#0a4a9a'; x.fillRect(0, 52, 256, 6); return mkTex(c); })();
// --- roda: ban (lathe) + velg 5 jari + cakram rem ---
const wheelCache = {};
function wheelGeos(R, side) {
  const key = R + '|' + side; if (wheelCache[key]) return wheelCache[key]; const Wd = R * 0.62, s = side;
  const prof = [[R * 0.6, -Wd / 2], [R * 0.9, -Wd / 2], [R * 0.985, -Wd * 0.38], [R, -Wd * 0.1], [R, Wd * 0.1], [R * 0.985, Wd * 0.38], [R * 0.9, Wd / 2], [R * 0.6, Wd / 2]].map(p => new THREE.Vector2(p[0], p[1]));
  const tire = new THREE.LatheGeometry(prof, 22); tire.rotateZ(Math.PI / 2);
  const barrel = cyX(R * 0.6, 0.02, s * Wd * 0.3, 0, 0), rim = [new THREE.TorusGeometry(R * 0.62, R * 0.04, 8, 24).rotateY(Math.PI / 2).translate(s * Wd * 0.39, 0, 0)];
  for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; rim.push(place(BOXG, s * Wd * 0.39, Math.cos(a) * R * 0.32, Math.sin(a) * R * 0.32, a, 0, 0, Wd * 0.13, R * 0.6, R * 0.13)); }
  rim.push(spE(Wd * 0.1, R * 0.15, R * 0.15, s * Wd * 0.43, 0, 0));
  return (wheelCache[key] = { tire: mergeGeos([tire, barrel]), rim: mergeGeos(rim) });
}
const calipMat = new THREE.MeshStandardMaterial({ color: 0xc8201c, roughness: 0.4, metalness: 0.4 });
// --- badan mobil penumpang (sedan / hatchback / SUV) dari parameter ---
function carBody(p) {
  const { L, W, y0, belt, hoodF, roof, cabF, cabFT, cabRT, cabR, hatch, wr, sporty } = p, xF = L / 2, xR = -L / 2, o = { paintLow: [], paintRoof: [], glass: [], trim: [], chrome: [], head: [], tail: [], plate: [], blinkL: [], blinkR: [], wheels: [] };
  const ops = [['m', xR + 0.05, y0], ['l', xR, y0 + 0.22], ['q', xR - 0.03, belt - 0.12, xR + 0.1, belt - 0.05]]; if (!hatch) ops.push(['l', cabR - 0.5, belt - 0.02]); ops.push(['l', cabR, belt], ['l', cabF - 0.35, belt], ['q', cabF + 0.15, belt + 0.01, cabF + 0.55, hoodF + 0.1], ['l', xF - 0.18, hoodF], ['q', xF, hoodF - 0.04, xF, hoodF - 0.24], ['l', xF - 0.03, y0 + 0.12], ['q', xF - 0.06, y0, xF - 0.22, y0], ['l', xR + 0.05, y0]);
  o.paintLow.push(extShape(shapeFrom(ops), W, 0.07));
  o.glass.push(extPoly([[cabR, belt - 0.03], [cabRT, roof - 0.04], [cabFT, roof - 0.03], [cabF, belt - 0.03]], W * 0.86, 0.03));
  o.paintRoof.push(extPoly([[cabRT + 0.03, roof - 0.03], [cabRT + 0.07, roof + 0.02], [cabFT - 0.03, roof + 0.03], [cabFT + 0.02, roof - 0.02]], W * 0.84, 0.02));
  const lat = W * 0.43 - 0.02, bxs = (cabFT + cabRT) / 2;
  [-1, 1].forEach(sd => {
    o.paintRoof.push(extPoly([[cabF, belt - 0.03], [cabF + 0.07, belt - 0.03], [cabFT + 0.04, roof], [cabFT - 0.05, roof]], 0.07, 0.01).translate(sd * lat, 0, 0));
    o.paintRoof.push(extPoly([[bxs - 0.05, belt - 0.02], [bxs + 0.05, belt - 0.02], [bxs + 0.05, roof - 0.02], [bxs - 0.05, roof - 0.02]], 0.07, 0.01).translate(sd * lat, 0, 0));
    o.paintRoof.push(extPoly([[cabR - 0.02, belt - 0.03], [cabR + 0.09, belt - 0.03], [cabRT + 0.08, roof], [cabRT - 0.03, roof]], 0.08, 0.01).translate(sd * lat, 0, 0));
    [cabF - 0.45, bxs - 0.1, cabR + 0.35].forEach(xs => o.trim.push(bx(0.012, belt - y0 - 0.3, 0.012, sd * (W / 2 + 0.012), (y0 + 0.14 + belt - 0.12) / 2, -xs)));
    [bxs + 0.35, cabR + 0.6].forEach(xs => o.chrome.push(bx(0.022, 0.03, 0.17, sd * (W / 2 + 0.02), belt - 0.15, -xs)));
    o.paintLow.push(spE(0.07, 0.055, 0.1, sd * (W / 2 + 0.1), belt + 0.08, -(cabF - 0.05))); o.trim.push(bx(0.12, 0.02, 0.05, sd * (W / 2 + 0.04), belt + 0.05, -(cabF - 0.05)));
    o.head.push(bx(0.42, 0.13, 0.08, sd * W * 0.34, hoodF - 0.2, -(xF - 0.05))); o.chrome.push(bx(0.46, 0.018, 0.09, sd * W * 0.34, hoodF - 0.125, -(xF - 0.05)));
    o.chrome.push(spE(0.04, 0.04, 0.03, sd * W * 0.32, y0 + 0.2, -(xF - 0.02)));
    o.tail.push(bx(0.46, 0.14, 0.07, sd * W * 0.34, belt - 0.14, -xR)); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.14, 0.07, 0.07, sd * W * 0.44, belt - 0.27, -xR));
    o.chrome.push(cyZ(0.042, 0.14, sd * W * 0.28, y0 + 0.08, -(xR - 0.04)));
    [[xF - 0.9, true], [xR + 0.92, false]].forEach(([wx, fr]) => { o.trim.push(new THREE.RingGeometry(wr * 1.0, wr * 1.34, 28).rotateY(sd * Math.PI / 2).translate(sd * (W / 2 + 0.009), wr, -wx)); o.wheels.push({ x: sd * (W / 2 - 0.08), z: -wx, front: fr, side: sd }); });
  });
  o.trim.push(bx(W * 0.5, 0.14, 0.04, 0, hoodF - 0.3, -xF)); for (let i = 0; i < 3; i++) o.chrome.push(bx(W * 0.5, 0.012, 0.046, 0, hoodF - 0.35 + i * 0.045, -(xF + 0.003)));
  o.trim.push(bx(W * 0.64, 0.1, 0.04, 0, y0 + 0.2, -(xF - 0.03))); o.trim.push(bx(W * 0.92, 0.07, 0.4, 0, y0 + 0.04, -(xF - 0.22))); o.trim.push(bx(W * 0.9, 0.1, L * 0.88, 0, y0 + 0.05, 0));
  o.tail.push(bx(W * 0.5, 0.03, 0.06, 0, belt - 0.14, -xR)); o.chrome.push(spE(0.05, 0.05, 0.02, 0, hoodF - 0.3, -(xF + 0.03)));
  o.plate.push(bx(0.5, 0.11, 0.012, 0, y0 + 0.17, -(xF + 0.012))); o.plate.push(bx(0.5, 0.11, 0.012, 0, belt - 0.38, -(xR - 0.012)));
  o.trim.push(cyY(0.008, 0.32, 0, roof + 0.16, -(cabRT + 0.25)));
  if (sporty) { o.paintLow.push(bx(W * 0.82, 0.04, 0.3, 0, belt + 0.12, -(xR + 0.28))); [-1, 1].forEach(sd => { o.trim.push(bx(0.05, 0.2, 0.1, sd * W * 0.32, belt + 0.02, -(xR + 0.3))); o.trim.push(bx(0.1, 0.06, L * 0.5, sd * (W / 2 + 0.02), y0 + 0.08, 0)); }); o.trim.push(bx(W * 0.95, 0.05, 0.3, 0, y0 + 0.03, -(xF + 0.04))); }
  o.R = wr; o.L = L; o.W = W; return o;
}
function truckBody() {
  const L = 8.2, W = 2.3, xF = 4.1, xR = -4.1, o = { paintLow: [], paintRoof: [], glass: [], trim: [], chrome: [], head: [], tail: [], plate: [], blinkL: [], blinkR: [], wheels: [], cargo: [] };
  o.paintLow.push(extShape(shapeFrom([['m', 2.1, 0.5], ['l', 2.1, 2.45], ['l', 3.5, 2.5], ['l', 4.0, 1.7], ['l', 4.1, 1.55], ['l', 4.1, 0.58], ['l', 4.02, 0.5]]), 2.2, 0.08));
  o.glass.push(bx(2.0, 0.86, 0.04, 0, 2.06, -3.78, 0.57, 0, 0)); [-1, 1].forEach(sd => { o.glass.push(bx(0.02, 0.62, 1.0, sd * 1.11, 1.95, -3.0)); o.head.push(bx(0.4, 0.2, 0.08, sd * 0.78, 0.98, -(xF + 0.01))); o.tail.push(bx(0.3, 0.2, 0.07, sd * 0.85, 1.0, -xR)); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.14, 0.08, 0.07, sd * 1.05, 0.7, -xR)); o.chrome.push(bx(0.1, 0.34, 0.1, sd * 1.25, 2.1, -3.3)); [3.1, -2.2, -3.4].forEach((wx, i) => o.wheels.push({ x: sd * 0.95, z: -wx, front: i === 0, side: sd })); });
  o.trim.push(bx(2.0, 0.22, 8.0, 0, 0.5, 0)); o.trim.push(bx(1.7, 0.5, 0.05, 0, 0.8, -xF)); o.chrome.push(bx(1.7, 0.1, 0.1, 0, 0.55, -(xF + 0.02))); o.chrome.push(bx(1.9, 0.14, 0.12, 0, 0.5, -(xR - 0.06)));
  o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.55, -(xF + 0.07))); o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.6, -(xR - 0.13)));
  o.cargo.push(extShape(shapeFrom([['m', -4.1, 0.78], ['l', 1.95, 0.78], ['l', 1.95, 3.2], ['l', -4.1, 3.2]]), W, 0.05)); o.R = 0.5; o.L = L; o.W = W; return o;
}
function busBody() {
  const L = 9.6, W = 2.5, xF = 4.8, xR = -4.8, o = { paintLow: [], paintRoof: [], glass: [], trim: [], chrome: [], head: [], tail: [], plate: [], blinkL: [], blinkR: [], wheels: [] };
  o.paintLow.push(extShape(shapeFrom([['m', -4.8, 0.55], ['l', 4.8, 0.55], ['l', 4.85, 1.3], ['q', 4.9, 2.8, 4.6, 3.05], ['l', -4.7, 3.05], ['l', -4.8, 0.7]]), W, 0.12));
  [-1, 1].forEach(sd => { o.glass.push(bx(0.03, 0.95, 8.3, sd * (W / 2 + 0.02), 2.15, 0)); o.head.push(bx(0.3, 0.16, 0.08, sd * 0.9, 1.0, -(xF + 0.07))); o.tail.push(bx(0.3, 0.2, 0.07, sd * 0.9, 1.4, -(xR - 0.01))); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.14, 0.08, 0.07, sd * 1.1, 1.0, -(xR - 0.01))); [3.2, -3.1].forEach((wx, i) => o.wheels.push({ x: sd * 1.05, z: -wx, front: i === 0, side: sd })); });
  o.glass.push(bx(2.2, 1.2, 0.04, 0, 2.15, -(xF + 0.06))); o.glass.push(bx(2.0, 0.9, 0.04, 0, 2.2, -(xR - 0.04))); o.trim.push(bx(1.2, 0.25, 2.0, 0, 3.15, -1)); o.trim.push(bx(2.3, 0.2, 0.1, 0, 0.7, -(xF + 0.07))); o.chrome.push(bx(2.2, 0.08, 0.1, 0, 0.55, -(xF + 0.08)));
  o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.9, -(xF + 0.09))); o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.95, -(xR - 0.07))); o.R = 0.5; o.L = L; o.W = W; return o;
}
const KINDS = { sedan: { w: 1.8, l: 4.5 }, hatch: { w: 1.75, l: 3.9 }, suv: { w: 1.95, l: 4.7 }, truck: { w: 2.3, l: 8.2 }, bus: { w: 2.5, l: 9.6 } };
const KIND_CACHE = {};
function kindParts(kind, sporty) {
  const key = kind + (sporty ? 'S' : ''); if (KIND_CACHE[key]) return KIND_CACHE[key]; let o;
  if (kind === 'sedan') o = carBody({ L: 4.5, W: 1.8, y0: 0.31, belt: 1.03, hoodF: 0.84, roof: 1.57, cabF: 0.98, cabFT: 0.34, cabRT: -0.72, cabR: -1.2, hatch: false, wr: 0.33, sporty });
  else if (kind === 'hatch') o = carBody({ L: 3.9, W: 1.75, y0: 0.31, belt: 1.02, hoodF: 0.84, roof: 1.6, cabF: 0.78, cabFT: 0.2, cabRT: -1.45, cabR: -1.82, hatch: true, wr: 0.31 });
  else if (kind === 'suv') o = carBody({ L: 4.7, W: 1.95, y0: 0.42, belt: 1.2, hoodF: 1.03, roof: 1.86, cabF: 1.05, cabFT: 0.5, cabRT: -1.75, cabR: -2.1, hatch: true, wr: 0.38 });
  else if (kind === 'truck') o = truckBody(); else o = busBody();
  const g = {}; for (const k of ['paintLow', 'paintRoof', 'glass', 'trim', 'chrome', 'head', 'tail', 'plate', 'blinkL', 'blinkR', 'cargo']) g[k] = o[k] && o[k].length ? mergeGeos(o[k]) : null;
  return (KIND_CACHE[key] = { g, wheels: o.wheels, R: o.R, L: o.L, W: o.W });
}
function makeCar(kind, colorHex, hq) {
  const K = kindParts(kind, hq), G = K.g, grp = new THREE.Group();
  const paint = phong({ color: colorHex, specular: hq ? 0x888888 : 0x555555, shininess: hq ? 110 : 70, reflectivity: hq ? 0.26 : 0.2 });
  const tailM = new THREE.MeshStandardMaterial({ color: 0x661010, emissive: 0xff1a1a, emissiveIntensity: 0.4, roughness: 0.25 });
  const mk = (geo, mat) => { if (!geo) return null; const m = new THREE.Mesh(geo, mat); grp.add(m); return m; };
  const paintLow = mk(G.paintLow, paint), paintRoof = mk(G.paintRoof, paint), glass = mk(G.glass, glassMat);
  mk(G.trim, trimMat); mk(G.chrome, chromeMat); mk(G.head, headMat); mk(G.tail, tailM); mk(G.plate, pick(plateMats));
  if (G.cargo) mk(G.cargo, new THREE.MeshStandardMaterial({ map: cargoTex, color: pick([0xf2f2f6, 0xdad2c2, 0xc4d6ea, 0xe6c8c0]), roughness: 0.55 }));
  if (kind === 'bus' && paintLow) paintLow.material = phong({ map: busTex, color: pick([0xffffff, 0xffe8c0, 0xd8f0ff]), specular: 0x666666, shininess: 60, reflectivity: 0.2 });
  const blinkers = []; [['blinkL', -1], ['blinkR', 1]].forEach(([k, sd]) => { if (!G[k]) return; const m = new THREE.Mesh(G[k], new THREE.MeshStandardMaterial({ color: 0x664400, emissive: 0xffaa00, emissiveIntensity: 0 })); m.userData.side = sd; grp.add(m); blinkers.push(m); });
  const wheels = [], R = K.R;
  K.wheels.forEach(w => { const root = new THREE.Group(); root.position.set(w.x, R, w.z); const yaw = new THREE.Group(), spin = new THREE.Group(); root.add(yaw); yaw.add(spin); const wg = wheelGeos(R, w.side); spin.add(new THREE.Mesh(wg.tire, tireMat)); spin.add(new THREE.Mesh(wg.rim, rimMat)); grp.add(root); wheels.push({ piv: spin, yaw, r: R, front: w.front }); });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobMat); blob.rotation.x = -Math.PI / 2; blob.scale.set(K.W * 1.5, K.L * 1.12, 1); blob.position.y = 0.01; grp.add(blob);
  return { g: grp, kind, wheels, tailM, blinkers, paintLow, paintRoof, glass, w: K.W, l: K.L };
}
const blobTex = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })();
var blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

// ======================= KOKPIT PENGEMUDI (tampilan dalam mobil) =======================
const dashMat = new THREE.MeshStandardMaterial({ color: 0x1b1d24, roughness: 0.72 }), fabMat = new THREE.MeshStandardMaterial({ color: 0x2c2f3a, roughness: 0.95, side: THREE.DoubleSide }), leatherMat = new THREE.MeshStandardMaterial({ color: 0x0f0f12, roughness: 0.6 }), gloveMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7 }), seatMat = new THREE.MeshStandardMaterial({ color: 0x3a3d48, roughness: 0.9 });
const clusterCv = mkCanvas(256, 128), clusterCtx = clusterCv.getContext('2d'), clusterTex = mkTex(clusterCv);
const mirrorRT = new THREE.WebGLRenderTarget(256, 96); mirrorRT.texture.wrapS = THREE.RepeatWrapping; mirrorRT.texture.repeat.x = -1; mirrorRT.texture.offset.x = 1;
const mirrorCam = new THREE.PerspectiveCamera(36, 256 / 96, 0.3, 220);
let playerCar = null, cockpit = null;
function drawCluster(kmh, steerS, blink) {
  const x = clusterCtx; x.fillStyle = '#05070c'; x.fillRect(0, 0, 256, 128);
  const dial = (cx, cy, r, v, max, col, label) => { x.strokeStyle = '#1c2230'; x.lineWidth = 9; x.beginPath(); x.arc(cx, cy, r, Math.PI * 0.75, Math.PI * 2.25); x.stroke(); x.strokeStyle = col; x.lineWidth = 9; x.beginPath(); x.arc(cx, cy, r, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * clamp(v / max, 0, 1))); x.stroke(); for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.75 + 1.5 * i / 10); x.strokeStyle = '#8a92a8'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8)); x.lineTo(cx + Math.cos(a) * (r - 14), cy + Math.sin(a) * (r - 14)); x.stroke(); } const a = Math.PI * (0.75 + 1.5 * clamp(v / max, 0, 1)); x.strokeStyle = '#ff5a3c'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); x.stroke(); x.fillStyle = '#9aa4be'; x.font = '10px system-ui'; x.textAlign = 'center'; x.fillText(label, cx, cy + r * 0.78); };
  dial(62, 66, 48, kmh, 240, '#3ad0ff', 'km/j'); dial(194, 66, 48, 800 + (kmh % 55) * 90 + clamp(kmh, 0, 240) * 18, 8000, '#ffd23f', 'x1000 rpm');
  x.fillStyle = '#7fffd0'; x.font = 'bold 34px system-ui,sans-serif'; x.textAlign = 'center'; x.fillText(String(Math.round(kmh)), 128, 70); x.fillStyle = '#9aa4be'; x.font = '12px system-ui'; x.fillText('D', 128, 90);
  if (blink && steerS) { x.fillStyle = '#7dff5a'; x.font = 'bold 22px system-ui'; x.fillText(steerS < 0 ? '◀' : '▶', steerS < 0 ? 96 : 160, 28); }
  clusterTex.needsUpdate = true;
}
function buildCockpit(car) {
  const W = 1.8, grp = new THREE.Group(), add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); grp.add(m); return m; };
  add(extShape(shapeFrom([['m', 1.02, 0.86], ['l', 1.02, 1.0], ['q', 0.95, 1.04, 0.86, 1.03], ['l', 0.8, 1.0], ['l', 0.78, 0.86]]), W * 0.86, 0.03), dashMat);
  add(extShape(shapeFrom([['m', 0.95, 1.02], ['l', 0.94, 1.13], ['l', 0.84, 1.12], ['l', 0.83, 1.0]]), 0.62, 0.02).translate(0.4, 0, 0), dashMat);
  add(mergeGeos([bx(0.3, 0.26, 1.0, 0, 0.78, 0.0), bx(0.07, 0.36, 1.7, W / 2 - 0.08, 0.9, 0.0), bx(0.07, 0.36, 1.7, -(W / 2 - 0.08), 0.9, 0.0), bx(0.5, 0.72, 0.14, -0.4, 0.9, 0.9), bx(0.5, 0.72, 0.14, 0.4, 0.9, 0.95), bx(0.07, 0.07, 0.4, 0, 0.94, 0.1)]), seatMat);
  add(mergeGeos([bx(0.22, 0.2, 0.1, -0.4, 1.34, 0.9), bx(0.22, 0.2, 0.1, 0.4, 1.34, 0.95)]), seatMat);
  add(bx(W * 0.8, 0.03, 1.4, 0, 1.5, 0.35), fabMat);
  [-1, 1].forEach(sd => add(extShape(shapeFrom([['m', 0.99, 1.0], ['l', 1.08, 1.0], ['l', 0.39, 1.57], ['l', 0.27, 1.55]]), 0.09, 0.01).translate(sd * 0.76, 0, 0), fabMat));
  const stPos = new THREE.Group(); stPos.position.set(0.4, 0.84, -0.6); const tilt = new THREE.Group(); tilt.rotation.x = -0.32; const spin = new THREE.Group(); stPos.add(tilt); tilt.add(spin); grp.add(stPos);
  spin.add(new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 10, 36), leatherMat));
  [[-0.095, 0, 0.19, 0.034], [0.095, 0, 0.19, 0.034]].forEach(([x, y, w, h]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), leatherMat); m.position.set(x, y, 0); spin.add(m); }); const sb = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.17, 0.02), leatherMat); sb.position.set(0, -0.095, 0); spin.add(sb);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.05, 16), leatherMat); hub.rotation.x = Math.PI / 2; spin.add(hub); const logo = new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), chromeMat); logo.position.z = 0.027; spin.add(logo);
  [-1, 1].forEach(sd => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), gloveMat); h.scale.set(1, 0.85, 1.3); h.position.set(sd * 0.185, 0.01, 0.025); spin.add(h); });
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.4, 10), dashMat); col.position.set(0.4, 0.84, -0.72); col.rotation.x = 1.2; grp.add(col);
  const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.17), new THREE.MeshBasicMaterial({ map: clusterTex })); cl.position.set(0.4, 1.075, -0.812); cl.rotation.x = -0.32; grp.add(cl);
  const mh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.03), trimMat); mh.position.set(0, 1.43, -0.45); grp.add(mh); const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.075), new THREE.MeshBasicMaterial({ map: mirrorRT.texture })); mp.position.set(0, 1.43, -0.433); grp.add(mp);
  // kap mesin & spion samping milik kokpit (badan bawah disembunyikan agar lantai kabin tidak menutupi pandangan)
  const pm = car.paintFlat || car.paintLow.material, W2 = 1.8, belt = 1.03, hoodF = 0.84, xF = 2.25, y0 = 0.31, cabF = 0.98;
  add(extShape(shapeFrom([['m', cabF - 0.02, belt - 0.05], ['l', cabF - 0.02, belt], ['q', cabF + 0.25, belt + 0.01, cabF + 0.6, hoodF + 0.1], ['l', xF - 0.18, hoodF], ['q', xF, hoodF - 0.04, xF, hoodF - 0.24], ['l', xF - 0.03, y0 + 0.12], ['l', cabF - 0.02, y0 + 0.12]]), W2, 0.07), pm);
  [-1, 1].forEach(sd => { const m = new THREE.Mesh(SPHG, pm); m.scale.set(0.07, 0.055, 0.1); m.position.set(sd * (W2 / 2 + 0.1), belt + 0.08, -(cabF - 0.05)); grp.add(m); });
  grp.visible = false; car.g.add(grp); cockpit = { grp, spin, eye: new THREE.Vector3(0.4, 1.24, 0.12), frame: 0 };
}
const VIEWS = ['🚗 Belakang', '🧑‍✈️ Pengemudi', '🛻 Kap mesin'];
function setView(v) { settings.view = v; if (!playerCar) return; if (cockpit) cockpit.grp.visible = v === 1; if (playerCar.paintRoof) playerCar.paintRoof.visible = v !== 1; if (playerCar.paintLow) playerCar.paintLow.visible = v !== 1; if (playerCar.paintPlain) playerCar.paintPlain.visible = v !== 1; if (playerCar.glass) playerCar.glass.visible = v !== 1; }
const neonTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 8, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.15)'); g.addColorStop(0.55, 'rgba(255,255,255,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return mkTex(c); })();
function addNeon(car, idx) {   // cahaya neon di bawah mobil (dibeli di Garasi)
  const hex = NEON_HEX[idx | 0]; if (!hex) return; const m = new THREE.Mesh(new THREE.PlaneGeometry(car.w * 2.4, car.l * 1.7), new THREE.MeshBasicMaterial({ map: neonTex, color: hex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.04; car.g.add(m); car.neon = m;
}
function buildPlayer() { if (playerCar) scene.remove(playerCar.g); playerCar = makeCar(PLAYER_KINDS[settings.model | 0] || 'sedan', CAR_COLORS[settings.carc % CAR_COLORS.length].c, true); addNeon(playerCar, settings.neon); buildCockpit(playerCar); scene.add(playerCar.g); setView(settings.view || 0); }
// partikel (asap, percikan, debu)
const PART = []; const partGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
for (let i = 0; i < 70; i++) { const m = new THREE.Mesh(partGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false })); m.visible = false; scene.add(m); PART.push({ m, life: 0, max: 1, vx: 0, vy: 0, vz: 0 }); }
function puff(x, y, z, n, colors, spd, size = 1) { for (let i = 0; i < n; i++) { const p = PART.find(q => q.life <= 0); if (!p) return; p.life = p.max = rr(0.4, 1.0); p.vx = rr(-1, 1) * spd; p.vy = rr(0.2, 1) * spd; p.vz = rr(-1, 1) * spd; p.m.position.set(x + rr(-0.3, 0.3), y, z + rr(-0.3, 0.3)); p.m.scale.setScalar(size * rr(0.6, 1.6)); p.m.material.color.setHex(pick(colors)); p.m.visible = true; } }
function updateParts(dt, d) { for (const p of PART) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.m.visible = false; continue; } p.vy -= 6 * dt; p.m.position.x += p.vx * dt; p.m.position.y = Math.max(0.05, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt + d; p.m.material.opacity = Math.min(1, p.life / p.max * 1.6); } }
drawEnvFaces(ENVS[settings.env % ENVS.length]); window.carEnvReady = true;
buildPlayer();
