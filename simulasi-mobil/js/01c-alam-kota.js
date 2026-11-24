'use strict';
// ======================= POHON & GEDUNG SEMI-REALISTIS (prosedural) =======================
// Pohon: batang berkulit (akar melebar, cabang) + mahkota dari ratusan kartu daun bertekstur alpha. Normal tiap kartu dibuat membulat
//        (menunjuk keluar dari pusat mahkota) sehingga pencahayaannya halus seperti volume, bukan lembaran datar.
// Gedung: fasad prosedural (kaca / kantor / hunian) dengan jendela menyala di malam hari, atap bertingkat, tangki, antena.
const QLOW = settings.quality === 0, QF = QLOW ? 0.5 : 1;
const RG = (() => { let a = 20240607; return (lo = 0, hi = 1) => { a = (a * 1664525 + 1013904223) >>> 0; return lo + (a / 4294967296) * (hi - lo); }; })();   // acak deterministik
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const shadeHex = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

// ---------------- tekstur ----------------
function barkTexture(palm) {
  const c = mkCanvas(128, 256), x = c.getContext('2d'); x.fillStyle = palm ? '#7b6a55' : '#4d3d2f'; x.fillRect(0, 0, 128, 256);
  if (palm) { for (let y = 0; y < 256; y += 9) { x.fillStyle = 'rgba(40,30,20,.45)'; x.fillRect(0, y, 128, 2.5); x.fillStyle = 'rgba(210,190,150,.18)'; x.fillRect(0, y + 3, 128, 2); } }
  for (let i = 0; i < 170; i++) { const px = RG(0, 128), w = RG(1, 3.5), y0 = RG(-20, 240), h = RG(30, 150); x.fillStyle = RG() < 0.55 ? `rgba(20,14,10,${RG(0.2, 0.5)})` : `rgba(150,125,95,${RG(0.1, 0.3)})`; x.fillRect(px, y0, w, h); }
  for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(25,18,12,.55)'; x.beginPath(); x.ellipse(RG(10, 118), RG(10, 246), RG(3, 7), RG(6, 12), 0, 0, 6.283); x.fill(); }
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function leafTexture(kind) {
  const S = 256, c = mkCanvas(S, S), x = c.getContext('2d'), pal = { broad: ['#27501f', '#336a28', '#42803a', '#5a9a48', '#76b058'], umb: ['#2a5a24', '#3a7430', '#4c8c3e', '#66a64c', '#82bc5c'], shrub: ['#2f5e26', '#3f7a31', '#55933f', '#71ad4f', '#8cc062'], pine: ['#17391f', '#1f4a28', '#2a5e33', '#37733f', '#46874b'] }[kind];
  if (kind === 'pine') {   // ranting cemara: batang tipis + ratusan jarum pendek
    for (let b = 0; b < 26; b++) { const a = RG(-0.5, 0.5) + (b % 2 ? 0.9 : -0.9) * 0 - Math.PI / 2 + RG(-1.2, 1.2), L = RG(60, 118); const ox = S / 2 + RG(-14, 14), oy = S * 0.55 + RG(-30, 40); x.strokeStyle = '#3a2a1c'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(ox, oy); x.lineTo(ox + Math.cos(a) * L, oy + Math.sin(a) * L); x.stroke();
      for (let k = 0; k < 30; k++) { const tt = k / 30, px = ox + Math.cos(a) * L * tt, py = oy + Math.sin(a) * L * tt, side = k % 2 ? 1 : -1, na = a + side * RG(0.9, 1.3), nl = RG(8, 15) * (1 - tt * 0.5); x.strokeStyle = pal[(RG(0, pal.length)) | 0]; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(na) * nl, py + Math.sin(na) * nl); x.stroke(); } }
  } else {
    const N = kind === 'shrub' ? 220 : 170, order = [];
    for (let i = 0; i < N; i++) { const ang = RG(0, 6.283), rad = Math.sqrt(RG()) * S * 0.43, px = S / 2 + Math.cos(ang) * rad, py = S / 2 + Math.sin(ang) * rad; order.push([px, py, RG(0, 6.283), RG(20, 34), RG(9, 15), RG()]); }
    order.sort((a, b) => a[1] - b[1]);    // yang di bawah digambar belakangan = tampak di depan
    for (const [px, py, a, len, w, r] of order) {
      x.save(); x.translate(px, py); x.rotate(a); const k = clamp(1 - py / S, 0, 1); x.fillStyle = pal[Math.min(pal.length - 1, Math.floor(r * 3 + k * 2.2))];
      x.beginPath(); x.moveTo(0, -len / 2); x.quadraticCurveTo(w, 0, 0, len / 2); x.quadraticCurveTo(-w, 0, 0, -len / 2); x.fill();
      x.strokeStyle = 'rgba(210,235,170,.28)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, -len / 2 + 2); x.lineTo(0, len / 2 - 2); x.stroke(); x.restore();
    }
  }
  x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, 'rgba(255,255,230,.10)'); g.addColorStop(1, 'rgba(0,12,0,.42)'); x.fillStyle = g; x.fillRect(0, 0, S, S);   // bayangan diri: bawah lebih gelap
  const t = mkTex(c); t.anisotropy = 4; return t;
}
function frondTexture() {
  const W = 128, H = 512, c = mkCanvas(W, H), x = c.getContext('2d'); x.strokeStyle = '#6a8a3a'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2, H); x.lineTo(W / 2, 0); x.stroke();
  for (let i = 0; i < 70; i++) { const y = H - 14 - i * (H - 30) / 70, len = (W / 2 - 3) * Math.sin(Math.PI * Math.min(1, (i + 6) / 76)) ** 0.6; [-1, 1].forEach(sd => { x.strokeStyle = ['#2f5a22', '#3d7a2c', '#4f8f34'][(RG(0, 3)) | 0]; x.lineWidth = 2.4; x.beginPath(); x.moveTo(W / 2, y); x.quadraticCurveTo(W / 2 + sd * len * 0.6, y - 10, W / 2 + sd * len, y - 22 - len * 0.12); x.stroke(); }); }
  return mkTex(c);
}
const barkTex = barkTexture(false), palmBarkTex = barkTexture(true), leafTex = { broad: leafTexture('broad'), umb: leafTexture('umb'), shrub: leafTexture('shrub'), pine: leafTexture('pine') }, frondTex = frondTexture();
const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, bumpMap: barkTex, bumpScale: 1.4, roughness: 0.96 }), palmTrunkMat = new THREE.MeshStandardMaterial({ map: palmBarkTex, bumpMap: palmBarkTex, bumpScale: 1.8, roughness: 0.95 });
const mkLeafMat = map => new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.82, metalness: 0 });
const leafMat = { broad: mkLeafMat(leafTex.broad), umb: mkLeafMat(leafTex.umb), shrub: mkLeafMat(leafTex.shrub), pine: mkLeafMat(leafTex.pine), frond: mkLeafMat(frondTex) };
const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5a7a2a, roughness: 0.7 });

// ---------------- geometri pohon ----------------
function trunkGeo(h, r0, r1, bend, seg = 10, hs = 9, flare = 0.7) {
  const g = new THREE.CylinderGeometry(r1, r0, h, seg, hs, true); g.translate(0, h / 2, 0); const p = g.attributes.position, ph = RG(0, 6);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = y / h, f = t < 0.14 ? 1 + (0.14 - t) / 0.14 * flare : 1, n = 1 + Math.sin(y * 3.1 + ph + Math.atan2(p.getZ(i), p.getX(i)) * 3) * 0.035; p.setXYZ(i, p.getX(i) * f * n + bend * t * t, y, p.getZ(i) * f * n); }
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * h / 1.6);
  g.computeVertexNormals(); return g;
}
function branchGeo(x, y, z, dir, len, r0, r1) {
  const g = new THREE.CylinderGeometry(r1, r0, len, 7, 2, true); g.translate(0, len / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), dir.clone().normalize()); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); g.translate(x, y, z);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 1.5, uv.getY(i) * len / 1.6); return g;
}
// satu kartu daun: pusat c, normal permukaan n (acak), ukuran s; normal verteks = arah keluar dari pusat mahkota (pencahayaan membulat)
function pushCard(B, c, n, s, ctr, scl, aspect = 1) {
  const up = Math.abs(n.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0), u = V3(0, 0, 0).crossVectors(up, n).normalize(), v = V3(0, 0, 0).crossVectors(n, u).normalize(), a = RG(0, 6.283), cs = Math.cos(a), sn = Math.sin(a);
  const uu = u.clone().multiplyScalar(cs).addScaledVector(v, sn), vv = v.clone().multiplyScalar(cs).addScaledVector(u, -sn), hs = s / 2, base = B.pos.length / 3;
  [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(([a_, b_, tu, tv]) => { const p = c.clone().addScaledVector(uu, a_ * hs * aspect).addScaledVector(vv, b_ * hs), nn = V3((p.x - ctr.x) / scl.x, (p.y - ctr.y) / scl.y, (p.z - ctr.z) / scl.z).normalize(); B.pos.push(p.x, p.y, p.z); B.nor.push(nn.x, nn.y, nn.z); B.uv.push(tu, tv); });
  B.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
}
const newB = () => ({ pos: [], nor: [], uv: [], idx: [] });
function B2G(B) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(B.uv, 2)); g.setIndex(B.idx); return g; }
function crown(B, cx, cy, cz, rx, ry, rz, n, smin, smax) {
  const ctr = V3(cx, cy, cz), scl = V3(rx, ry, rz); n = Math.max(6, Math.round(n * QF));
  for (let i = 0; i < n; i++) { const d = V3(RG(-1, 1), RG(-1, 1), RG(-1, 1)); if (d.lengthSq() < 0.01) continue; d.normalize(); const r = 0.5 + 0.5 * RG(), p = V3(cx + d.x * rx * r, cy + d.y * ry * r, cz + d.z * rz * r), nr = d.clone().add(V3(RG(-0.5, 0.5), RG(-0.3, 0.6), RG(-0.5, 0.5))).normalize(); pushCard(B, p, nr, RG(smin, smax), ctr, scl); }
}
function buildBroad(big) {
  const h = RG(4.8, 6.2) * (big ? 1.1 : 1), B = newB(), tr = [trunkGeo(h, RG(0.3, 0.4), RG(0.16, 0.22), RG(-0.6, 0.6))];
  const cl = [[0, h + 2.4, 0, 3.4, 2.8, 3.4, 44], [RG(1.4, 2.2), h + 1.4, RG(0.4, 1.2), 2.3, 1.9, 2.3, 24], [-RG(1.4, 2.2), h + 1.7, -RG(0.4, 1.2), 2.4, 2.0, 2.4, 24]];
  cl.forEach(([cx, cy, cz, rx, ry, rz, n]) => { crown(B, cx, cy, cz, rx, ry, rz, n, 2.4, 3.8); tr.push(branchGeo(0, h * 0.78, 0, V3(cx, cy - h * 0.78, cz), Math.hypot(cx, cy - h * 0.78, cz) * 0.8, 0.11, 0.05)); });
  return { trunk: mergeGeos(tr), fol: B2G(B), mat: leafMat.broad, tmat: trunkMat };
}
function buildUmbrella() {
  const h = RG(3.8, 4.8), B = newB(), tr = [trunkGeo(h, RG(0.46, 0.56), RG(0.28, 0.34), RG(-0.4, 0.4), 12, 8, 0.9)];
  for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + RG(-0.3, 0.3); tr.push(branchGeo(0, h * 0.85, 0, V3(Math.cos(a) * 1.0, 0.55, Math.sin(a) * 1.0), RG(3.4, 4.4), 0.2, 0.07)); }
  crown(B, 0, h + 1.5, 0, 6.2, 1.7, 6.2, 70, 3.0, 4.6); crown(B, 0, h + 2.3, 0, 3.4, 1.2, 3.4, 22, 2.6, 3.6);
  return { trunk: mergeGeos(tr), fol: B2G(B), mat: leafMat.umb, tmat: trunkMat };
}
function buildPine() {
  const h = RG(7.5, 9.5), B = newB(), tr = [trunkGeo(h + 1.5, 0.26, 0.04, RG(-0.3, 0.3), 8, 8, 0.5)], ctr = V3(0, h * 0.55, 0), scl = V3(2.4, h * 0.5, 2.4);
  for (let lv = 0; lv < 11; lv++) { const t = lv / 10, y = 1.8 + t * (h - 1.2), rad = (1 - t) * 2.5 + 0.2, n = Math.max(4, Math.round((9 - lv * 0.5) * QF)); for (let k = 0; k < n; k++) { const a = k / n * 6.283 + lv * 0.7 + RG(-0.2, 0.2), p = V3(Math.cos(a) * rad * 0.55, y + RG(-0.15, 0.15), Math.sin(a) * rad * 0.55), nr = V3(Math.cos(a) * 0.6, 0.8, Math.sin(a) * 0.6).normalize(); pushCard(B, p, nr, rad * 1.5 + 0.9, ctr, scl); } }
  return { trunk: mergeGeos(tr), fol: B2G(B), mat: leafMat.pine, tmat: trunkMat };
}
function buildPalm() {
  const h = RG(7.2, 9.2), bend = RG(-1.4, 1.4), tg = trunkGeo(h, 0.3, 0.17, bend, 10, 12, 0.5), B = newB(), top = V3(bend, h, 0), tr = [tg];
  const nf = Math.max(7, Math.round(13 * QF));
  for (let f = 0; f < nf; f++) {   // pelepah: jalur melengkung ke bawah, dua sisi daun
    const a = f / nf * 6.283 + RG(-0.15, 0.15), L = RG(3.4, 4.6), rise = RG(0.1, 0.9), seg = 8, base = B.pos.length / 3, d = V3(Math.cos(a), 0, Math.sin(a)), side = V3(-d.z, 0, d.x);
    for (let s = 0; s <= seg; s++) { const t = s / seg, p = top.clone().addScaledVector(d, t * L).add(V3(0, rise * 1.4 * Math.sin(t * 1.6) - 1.5 * t * t * (0.9 + rise * 0.4), 0)), w = 0.62 * Math.pow(Math.sin(Math.PI * (0.06 + t * 0.94)), 0.6) + 0.04, nn = V3(0, 1, 0).addScaledVector(d, -0.25).normalize();
      [-1, 1].forEach(sd => { const q = p.clone().addScaledVector(side, sd * w); B.pos.push(q.x, q.y, q.z); B.nor.push(nn.x, nn.y, nn.z); B.uv.push(sd < 0 ? 0 : 1, t); }); }
    for (let s = 0; s < seg; s++) { const i = base + s * 2; B.idx.push(i, i + 1, i + 3, i, i + 3, i + 2); }
  }
  const fol = B2G(B), cg = []; for (let i = 0; i < 5; i++) { const g = new THREE.SphereGeometry(0.2, 8, 6); g.translate(bend + RG(-0.3, 0.3), h - 0.45 - RG(0, 0.2), RG(-0.3, 0.3)); cg.push(g); }
  return { trunk: mergeGeos(tr), fol, mat: leafMat.frond, tmat: palmTrunkMat, extra: mergeGeos(cg) };
}
function buildShrub() { const B = newB(), s = RG(0.9, 1.4); crown(B, 0, 0.55 * s, 0, 1.0 * s, 0.7 * s, 1.0 * s, 16, 1.0, 1.6); return { trunk: null, fol: B2G(B), mat: leafMat.shrub, tmat: null }; }

const TREE_V = [[0, 5, buildBroad], [1, 2, buildUmbrella], [2, 3, buildPine], [3, 3, buildPalm]].map(([k, n, fn]) => Array.from({ length: Math.max(2, Math.round(n * (QLOW ? 0.6 : 1))) }, () => fn()));
const SHRUB_V = Array.from({ length: 4 }, buildShrub);
const depthCache = new Map(); const depthFor = mat => { if (!depthCache.has(mat)) depthCache.set(mat, new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: mat.map, alphaTest: 0.5, side: THREE.DoubleSide })); return depthCache.get(mat); };
function makeTreeFrom(v) {
  const g = new THREE.Group(); if (v.trunk) { const t = new THREE.Mesh(v.trunk, v.tmat); t.castShadow = true; g.add(t); }
  const f = new THREE.Mesh(v.fol, v.mat); f.castShadow = true; f.customDepthMaterial = depthFor(v.mat); g.add(f); let co = null; if (v.extra) { co = new THREE.Mesh(v.extra, coconutMat); g.add(co); }
  if (v.trunk) g.userData.lodParts = [[g.children[0], 105]].concat(co ? [[co, 55]] : []);   // batang disembunyikan di kejauhan (tipis & tertutup kabut)
  const s = RG(0.85, 1.25); g.scale.set(s, s * RG(0.92, 1.1), s); g.rotation.y = RG(0, 6.283); return g;
}
const pickTree = () => { const r = RG(); const kind = r < 0.38 ? 0 : r < 0.5 ? 1 : r < 0.72 ? 2 : 3; const arr = TREE_V[kind]; return makeTreeFrom(arr[(RG() * arr.length) | 0]); };
for (let k = 0; k < 34; k++) [-1, 1].forEach(sd => addScen(pickTree(), sd * RG(10, 34), -k * (SCEN_LEN / 34) + RG(-3, 3), { sd, rx: [10, 34] }));
for (let k = 0; k < 26; k++) [-1, 1].forEach(sd => addScen(makeTreeFrom(SHRUB_V[(RG() * SHRUB_V.length) | 0]), sd * RG(8.2, 13), -k * (SCEN_LEN / 26) + RG(-3, 3), { sd, rx: [8.2, 13] }));

// ---------------- fasad gedung ----------------
function facadeSet(type, tint) {
  const S = 512, N = 4, C = S / N, c = mkCanvas(S, S), x = c.getContext('2d'), ce = mkCanvas(S, S), xe = ce.getContext('2d'); xe.fillStyle = '#000'; xe.fillRect(0, 0, S, S);
  const wall = tint || '#bdb8ac';
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const ox = i * C, oy = j * C, k = RG(0.82, 1.14), lit = RG() < 0.38, warm = ['#ffe2a8', '#ffd27a', '#fff0c8', '#cfe6ff'][(RG(0, 4)) | 0];
    if (type === 'glass') {
      const g = x.createLinearGradient(ox, oy, ox, oy + C); g.addColorStop(0, shadeHex(0x9cc4de, k)); g.addColorStop(0.55, shadeHex(0x4f7e9a, k)); g.addColorStop(1, shadeHex(0x2c5064, k)); x.fillStyle = g; x.fillRect(ox, oy, C, C);
      x.fillStyle = '#6f777d'; x.fillRect(ox, oy + C * 0.76, C, C * 0.24); x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(ox, oy + C * 0.76, C, 4); x.fillStyle = '#1b262e'; x.fillRect(ox, oy, 5, C); x.fillRect(ox, oy, C, 4);
      x.fillStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.moveTo(ox + C * 0.15, oy); x.lineTo(ox + C * 0.5, oy); x.lineTo(ox + C * 0.1, oy + C * 0.74); x.lineTo(ox, oy + C * 0.74); x.closePath(); x.fill();
      if (lit) { xe.fillStyle = warm; xe.fillRect(ox + 6, oy + 5, C - 9, C * 0.7); }
    } else if (type === 'office') {
      x.fillStyle = shadeHex(new THREE.Color(wall).getHex(), k); x.fillRect(ox, oy, C, C);
      x.fillStyle = 'rgba(0,0,0,.08)'; for (let n = 0; n < 40; n++) x.fillRect(ox + RG(0, C), oy + RG(0, C), RG(1, 3), RG(1, 3));
      const gx = ox + 8, gy = oy + C * 0.2, gw = C - 16, gh = C * 0.52, gg = x.createLinearGradient(0, gy, 0, gy + gh); gg.addColorStop(0, shadeHex(0x5d7f96, k)); gg.addColorStop(1, shadeHex(0x2e4658, k)); x.fillStyle = gg; x.fillRect(gx, gy, gw, gh);
      x.fillStyle = '#d6d3ca'; x.fillRect(gx - 3, gy - 4, gw + 6, 4); x.fillRect(gx - 3, gy + gh, gw + 6, 6); x.fillStyle = '#2b3036'; x.fillRect(gx + gw / 2 - 1.5, gy, 3, gh);
      if (lit) { xe.fillStyle = warm; xe.fillRect(gx, gy, gw, gh); }
    } else {   // hunian: jendela berkerai, balkon, AC
      x.fillStyle = shadeHex(new THREE.Color(wall).getHex(), k); x.fillRect(ox, oy, C, C); x.fillStyle = 'rgba(0,0,0,.07)'; for (let n = 0; n < 30; n++) x.fillRect(ox + RG(0, C), oy + RG(0, C), RG(1, 3), RG(1, 3));
      const gx = ox + C * 0.22, gy = oy + C * 0.16, gw = C * 0.56, gh = C * 0.46; x.fillStyle = '#f1efe8'; x.fillRect(gx - 4, gy - 4, gw + 8, gh + 8); x.fillStyle = shadeHex(0x3a5064, k); x.fillRect(gx, gy, gw, gh);
      x.fillStyle = 'rgba(230,215,190,.55)'; x.fillRect(gx, gy, gw * 0.3, gh); x.fillRect(gx + gw * 0.7, gy, gw * 0.3, gh); x.fillStyle = '#f1efe8'; x.fillRect(gx + gw / 2 - 1.5, gy, 3, gh);
      x.fillStyle = '#a7a398'; x.fillRect(ox, oy + C * 0.7, C, C * 0.07); x.strokeStyle = '#3c4046'; x.lineWidth = 2; for (let r = 0; r < 9; r++) { x.beginPath(); x.moveTo(ox + 6 + r * (C - 12) / 8, oy + C * 0.7); x.lineTo(ox + 6 + r * (C - 12) / 8, oy + C * 0.93); x.stroke(); } x.beginPath(); x.moveTo(ox + 6, oy + C * 0.93); x.lineTo(ox + C - 6, oy + C * 0.93); x.stroke();
      if (RG() < 0.3) { x.fillStyle = '#e8e8ea'; x.fillRect(ox + C * 0.7, oy + C * 0.76, C * 0.22, C * 0.12); x.fillStyle = '#555'; x.fillRect(ox + C * 0.72, oy + C * 0.79, C * 0.18, 3); }
      if (lit) { xe.fillStyle = warm; xe.fillRect(gx, gy, gw, gh); }
    }
  }
  const mk = cv => { const t = mkTex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
  return { map: mk(c), emi: mk(ce) };
}
const FAC = { glass: facadeSet('glass'), office: facadeSet('office', '#b5b0a4'), resA: facadeSet('res', '#d8c7a6'), resB: facadeSet('res', '#c9a08a') };
const roofMat = new THREE.MeshStandardMaterial({ color: 0x6a6d72, roughness: 0.9 }), metalMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.45, metalness: 0.6 }), warnMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
const BLD = {
  glass: new THREE.MeshStandardMaterial({ map: FAC.glass.map, emissiveMap: FAC.glass.emi, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.22, metalness: 0.4 }),
  office: new THREE.MeshStandardMaterial({ map: FAC.office.map, emissiveMap: FAC.office.emi, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.75 }),
  resA: new THREE.MeshStandardMaterial({ map: FAC.resA.map, emissiveMap: FAC.resA.emi, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 }),
  resB: new THREE.MeshStandardMaterial({ map: FAC.resB.map, emissiveMap: FAC.resB.emi, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.85 })
};
function applyBuildingEnv(E) {
  const em = E.night > 0.9 ? 1 : E.night > 0 ? 0.45 : 0, dim = E.night > 0.9 ? 0.5 : 1;
  for (const k in BLD) { BLD[k].emissiveIntensity = em; BLD[k].color.setScalar(dim); if (typeof carEnvPM !== 'undefined' && carEnvPM && k === 'glass') { BLD[k].envMap = carEnvPM; BLD[k].envMapIntensity = 0.9; BLD[k].needsUpdate = true; } }
  roofMat.color.setScalar(dim); metalMat.color.setScalar(dim); warnMat.visible = E.night > 0.2;
}
// BoxGeometry + larik material = 6 draw call (1 per sisi). Kelompokkan sisi bermaterial sama menjadi satu grup (urutkan ulang indeks): order = daftar sisi per material (0 px,1 nx,2 py,3 ny,4 pz,5 nz)
function regroupBox(g, order) {
  const src = g.index.array, dst = new src.constructor(src.length); let o = 0; g.clearGroups();
  order.forEach((faces, mi) => { const start = o; faces.forEach(f => { for (let k = 0; k < 6; k++) dst[o++] = src[f * 6 + k]; }); g.addGroup(start, o - start, mi); }); src.set(dst); g.index.needsUpdate = true; return g;
}
const bakeMesh = m => { m.updateMatrix(); return m.geometry.clone().applyMatrix4(m.matrix); };
function boxFacade(w, h, d, mat) {   // kotak dengan UV fasad sesuai ukuran (1 sel = 3.6 m × 3.4 m, 1 tekstur = 4×4 sel)
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, CW = 3.6 * 4, CH = 3.4 * 4;
  for (let f = 0; f < 6; f++) { if (f === 2 || f === 3) continue; const fw = f < 2 ? d : w; for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * fw / CW, uv.getY(k) * h / CH); } }   // sisi: px,nx (lebar d), pz,nz (lebar w)
  regroupBox(g, [[0, 1, 4, 5], [2, 3]]); const m = new THREE.Mesh(g, [mat, roofMat]); m.position.y = h / 2; return m;   // 2 draw call (bukan 6)
}
function makeBuilding(kind) {
  const grp = new THREE.Group(), det = [];
  const tall = kind === 'glass', h = tall ? RG(26, 54) : kind === 'office' ? RG(16, 34) : RG(10, 24), w = tall ? RG(11, 17) : RG(12, 20), d = tall ? RG(11, 17) : RG(11, 18), mat = kind === 'res' ? (RG() < 0.5 ? BLD.resA : BLD.resB) : BLD[kind];
  const body = boxFacade(w, h, d, mat); grp.add(body); let topY = h, tw = w, td = d;
  if (tall || (kind === 'office' && RG() < 0.6)) { const h2 = RG(4, 9), w2 = w * RG(0.6, 0.78), d2 = d * RG(0.6, 0.78), up = boxFacade(w2, h2, d2, mat); up.position.y = h + h2 / 2; grp.add(up); topY = h + h2; tw = w2; td = d2; }
  det.push(bx(tw + 0.5, 0.6, td + 0.5, 0, topY + 0.3, 0));                                         // parapet
  for (let i = 0, n = (RG(1, 4)) | 0; i < n; i++) det.push(bx(RG(1.6, 3.2), RG(0.9, 1.8), RG(1.4, 2.6), RG(-tw / 2 + 1.6, tw / 2 - 1.6), topY + 1.1, RG(-td / 2 + 1.4, td / 2 - 1.4)));   // unit AC / mesin lift
  if (kind !== 'glass' && RG() < 0.7) { const tx = RG(-tw / 3, tw / 3), tz = RG(-td / 3, td / 3); det.push(cyY(1.3, 2.4, tx, topY + 1.7, tz)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => det.push(bx(0.18, 1.2, 0.18, tx + a * 0.9, topY + 0.6, tz + b * 0.9))); }   // tangki air
  const ax = RG(-tw / 4, tw / 4), az = RG(-td / 4, td / 4), al = RG(6, 11); det.push(cyY(0.07, al, ax, topY + al / 2, az));
  grp.add(new THREE.Mesh(mergeGeos(det), roofMat));
  if (tall) { const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), warnMat); lamp.position.set(ax, topY + al + 0.2, az); grp.add(lamp); }
  return grp;
}
for (let k = 0; k < 14; k++) [-1, 1].forEach(sd => { const kind = RG() < 0.3 ? 'glass' : RG() < 0.5 ? 'office' : 'res'; addScen(makeBuilding(kind), sd * RG(48, 90), -k * (SCEN_LEN / 14), { sd, fixed: true }); });
applyBuildingEnv(ENVS[settings.env % ENVS.length]);
// lampu jalan (dibangun di 01-scene): gabungkan tiang + lengan (material sama) menjadi 1 mesh
for (const s of scen) { const ch = s.o.children; if (s.fixed && ch.length >= 3 && ch[0].geometry && ch[0].geometry.type === 'CylinderGeometry' && ch[1].geometry && ch[1].geometry.type === 'BoxGeometry' && ch[0].material === ch[1].material) { const m = new THREE.Mesh(mergeGeos([bakeMesh(ch[0]), bakeMesh(ch[1])]), ch[0].material); s.o.remove(ch[0]); s.o.remove(ch[0]); s.o.add(m); s.o.userData.lamp = true; } }

