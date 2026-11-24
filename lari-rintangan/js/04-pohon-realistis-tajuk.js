'use strict';
// --- pohon realistis: tajuk daun bertekstur (alpha), batang berkulit kayu, palem ---
function makeLeafTex(kind) {
  const c = mkCanvas(128, 128), x = c.getContext('2d');
  const col = () => kind === 'blossom' ? (Math.random() < 0.7 ? `hsl(${rr(335, 352)},${rr(55, 80)}%,${rr(72, 90)}%)` : `hsl(${rr(95, 115)},${rr(35, 50)}%,${rr(28, 42)}%)`) : kind === 'autumn' ? `hsl(${rr(8, 48)},${rr(65, 85)}%,${rr(38, 55)}%)` : kind === 'pine' ? `hsl(${rr(120, 150)},${rr(30, 45)}%,${rr(14, 26)}%)` : `hsl(${rr(88, 120)},${rr(38, 58)}%,${rr(20, 40)}%)`;
  const n = kind === 'pine' ? 420 : 240;
  for (let i = 0; i < n; i++) {
    const px = Math.random() * 128, py = Math.random() * 128, a = Math.random() * 6.283, L = kind === 'pine' ? rr(10, 18) : kind === 'blossom' ? rr(5, 8) : rr(9, 15), Wd = kind === 'pine' ? 1.4 : kind === 'blossom' ? rr(4, 6) : rr(4.5, 7);
    for (const ox of [-128, 0, 128]) for (const oy of [-128, 0, 128]) {
      const X = px + ox, Y = py + oy; if (X < -20 || X > 148 || Y < -20 || Y > 148) continue;
      x.save(); x.translate(X, Y); x.rotate(a); x.fillStyle = col(); x.beginPath();
      if (kind === 'pine') x.rect(-L / 2, -Wd / 2, L, Wd); else x.ellipse(0, 0, L / 2, Wd / 2, 0, 0, 6.283);
      x.fill(); if (kind !== 'pine' && kind !== 'blossom') { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(-L / 2, 0); x.lineTo(L / 2, 0); x.stroke(); }
      x.restore();
    }
  }
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const LEAFTEX = { oak: makeLeafTex('oak'), pine: makeLeafTex('pine'), blossom: makeLeafTex('blossom'), autumn: makeLeafTex('autumn') };
const foliageMat = k => new THREE.MeshStandardMaterial({ map: LEAFTEX[k], vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
const FOL = { oak: foliageMat('oak'), pine: foliageMat('pine'), blossom: foliageMat('blossom'), autumn: foliageMat('autumn') };
const barkTex = (() => {
  const c = mkCanvas(64, 128), x = c.getContext('2d'); x.fillStyle = '#5a4332'; x.fillRect(0, 0, 64, 128);
  for (let i = 0; i < 70; i++) { const px = Math.random() * 64, w = rr(1.5, 4); x.fillStyle = Math.random() < 0.5 ? `rgba(20,12,6,${rr(0.2, 0.5)})` : `rgba(150,120,90,${rr(0.1, 0.3)})`; let y = rr(-20, 60); x.beginPath(); x.moveTo(px, y); for (let k = 0; k < 6; k++) { y += rr(10, 24); x.lineTo(px + rr(-3, 3), y); } x.lineTo(px + w, y); x.lineTo(px + w, rr(-20, 60)); x.fill(); }
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1.5); return t;
})();
const palmBarkTex = (() => { const c = mkCanvas(32, 64), x = c.getContext('2d'); x.fillStyle = '#8a7a62'; x.fillRect(0, 0, 32, 64); for (let y = 0; y < 64; y += 5) { x.fillStyle = 'rgba(40,30,20,.5)'; x.fillRect(0, y, 32, 1.6); x.fillStyle = 'rgba(210,190,150,.16)'; x.fillRect(0, y + 2, 32, 1.4); } for (let i = 0; i < 80; i++) { x.fillStyle = 'rgba(30,20,10,.12)'; x.fillRect(Math.random() * 32, Math.random() * 64, 1, 3); } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const barkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 1 }), palmBarkMat = new THREE.MeshStandardMaterial({ map: palmBarkTex, roughness: 0.95 });
const frondTex = (() => {
  const c = mkCanvas(64, 256), x = c.getContext('2d'); x.strokeStyle = '#4a7a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(32, 256); x.lineTo(32, 0); x.stroke();
  for (let y = 8; y < 250; y += 6) { const L = 30 * Math.sin(Math.PI * Math.min(1, (y + 20) / 270)) + 6, dy = 14; x.strokeStyle = `hsl(${rr(88, 108)},${rr(45, 60)}%,${rr(24, 38)}%)`; x.lineWidth = 2.6; x.beginPath(); x.moveTo(32, 256 - y); x.lineTo(32 - L, 256 - y - dy); x.moveTo(32, 256 - y); x.lineTo(32 + L, 256 - y - dy); x.stroke(); }
  return mkTex(c);
})();
const frondMat = new THREE.MeshStandardMaterial({ map: frondTex, vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.7 });
// gabungkan banyak potongan geometri non-indeks menjadi satu mesh
function mergeParts(parts) {
  let n = 0; parts.forEach(p => n += p.pos.length); const pos = new Float32Array(n), nor = new Float32Array(n), col = new Float32Array(n), uv = new Float32Array(n / 3 * 2); let o = 0, u = 0;
  for (const p of parts) { pos.set(p.pos, o); nor.set(p.nor, o); col.set(p.col, o); uv.set(p.uv, u); o += p.pos.length; u += p.uv.length; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
const _ico = new THREE.IcosahedronGeometry(1, 2), _icoPos = _ico.attributes.position.array;
// gumpalan tajuk: bola yang diacak permukaannya, normal mengarah keluar dari pusat tajuk (cahaya lembut), warna vertex gelap di bawah
function blobPart(cx, cy, cz, rx, ry, rz, centre, y0, y1, seed) {
  const n = _icoPos.length, pos = new Float32Array(n), nor = new Float32Array(n), col = new Float32Array(n), uv = new Float32Array(n / 3 * 2), tint = rr(0.88, 1.08), tmp = [];
  for (let i = 0; i < n; i += 3) {
    let dx = _icoPos[i], dy = _icoPos[i + 1], dz = _icoPos[i + 2]; const L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
    const k = 1 + 0.2 * Math.sin(dx * 5.1 + seed) * Math.sin(dy * 4.3 + seed * 1.7) * Math.sin(dz * 5.7 + seed * 0.6) + 0.07 * Math.sin(dx * 13 + dz * 11 + seed);
    const px = cx + dx * rx * k, py = cy + dy * ry * k, pz = cz + dz * rz * k; pos[i] = px; pos[i + 1] = py; pos[i + 2] = pz;
    let nx = 0.65 * (px - centre[0]) + 0.35 * dx, ny = 0.65 * (py - centre[1]) + 0.35 * dy, nz = 0.65 * (pz - centre[2]) + 0.35 * dz; const nl = Math.hypot(nx, ny, nz) || 1; nor[i] = nx / nl; nor[i + 1] = ny / nl; nor[i + 2] = nz / nl;
    const sh = clamp(0.5 + 0.5 * (py - y0) / Math.max(0.01, y1 - y0), 0.42, 1) * tint; col[i] = col[i + 1] = col[i + 2] = sh;
  }
  for (let t = 0; t < n; t += 9) {   // proyeksi UV per segitiga menurut sumbu dominan (tanpa regangan / sambungan)
    const ax = Math.abs(nor[t] + nor[t + 3] + nor[t + 6]), ay = Math.abs(nor[t + 1] + nor[t + 4] + nor[t + 7]), az = Math.abs(nor[t + 2] + nor[t + 5] + nor[t + 8]);
    for (let v = 0; v < 3; v++) { const i = t + v * 3, j = (t / 3 + v) * 2; if (ay >= ax && ay >= az) { uv[j] = pos[i] * 1.1; uv[j + 1] = pos[i + 2] * 1.1; } else if (ax >= az) { uv[j] = pos[i + 2] * 1.1; uv[j + 1] = pos[i + 1] * 1.1; } else { uv[j] = pos[i] * 1.1; uv[j + 1] = pos[i + 1] * 1.1; } }
  }
  return { pos, nor, col, uv };
}
function conePart(cy, h, r, y0, y1, seed) {   // lapisan cemara menggantung
  const g = new THREE.ConeGeometry(r, h, 14, 2, true).toNonIndexed(), p = g.attributes.position.array, n = p.length, pos = new Float32Array(n), nor = new Float32Array(n), col = new Float32Array(n), uv = new Float32Array(n / 3 * 2);
  for (let i = 0; i < n; i += 3) {
    const ang = Math.atan2(p[i + 2], p[i]), k = 1 + 0.16 * Math.sin(ang * 7 + seed) * (p[i + 1] < 0 ? 1 : 0.3), px = p[i] * k, py = cy + p[i + 1] + (p[i + 1] < 0 ? -0.05 * Math.sin(ang * 5 + seed) : 0), pz = p[i + 2] * k;
    pos[i] = px; pos[i + 1] = py; pos[i + 2] = pz; const nl = Math.hypot(px, 0.55 * r, pz) || 1; nor[i] = px / nl; nor[i + 1] = 0.55 * r / nl; nor[i + 2] = pz / nl;
    col[i] = col[i + 1] = col[i + 2] = clamp(0.5 + 0.5 * (py - y0) / Math.max(0.01, y1 - y0), 0.4, 1);
    const j = (i / 3) * 2; uv[j] = ang * 1.6 + 1; uv[j + 1] = py * 1.8;
  }
  return { pos, nor, col, uv };
}
function trunkMesh(th, r0, r1, mat) {
  const g = new THREE.CylinderGeometry(r1, r0, th, 10, 5), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.1 * Math.sin(a * 3 + y * 2.3) + 0.05 * Math.sin(a * 7 + y * 5); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.position.y = th / 2; m.castShadow = true; return m;
}
function buildTree(kind) {
  const grp = new THREE.Group(), seed = Math.random() * 20;
  if (kind === 'pine') {
    const h = rr(3.4, 4.6), layers = 6, parts = []; grp.add(trunkMesh(h * 0.35, 0.16, 0.1, barkMat));
    for (let i = 0; i < layers; i++) { const t = i / (layers - 1), r = (1.05 - t * 0.78) * rr(0.92, 1.08), lh = 1.1 - t * 0.35, cy = 0.9 + t * (h - 1.2); parts.push(conePart(cy, lh, r, 0.8, h, seed + i)); }
    const m = new THREE.Mesh(mergeParts(parts), FOL.pine); m.castShadow = true; grp.add(m);
  } else if (kind === 'palm') {
    const h = rr(3.6, 5), lean = rr(-0.5, 0.5), segs = 7; let px = 0, py = 0, tx = 0;
    for (let i = 0; i < segs; i++) { const t = i / segs, sh = h / segs, r0 = 0.17 - t * 0.06, r1 = 0.17 - (t + 1 / segs) * 0.06, seg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, sh * 1.08, 9), palmBarkMat); const ang = lean * (t + 0.5 / segs) * 0.7; seg.position.set(px + Math.sin(ang) * sh / 2, py + Math.cos(ang) * sh / 2, 0); seg.rotation.z = -ang; seg.castShadow = true; grp.add(seg); px += Math.sin(ang) * sh; py += Math.cos(ang) * sh; }
    const parts = [], nF = 11;
    for (let f = 0; f < nF; f++) {
      const yaw = f / nF * 6.283 + rr(-0.15, 0.15), up = rr(0.15, 0.6), len = rr(1.9, 2.5), segsL = 7, wd = 0.5, n = segsL * 2 * 3, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2); let vi = 0;
      const P = (s, side) => { const d = s / segsL, z = d * len, dropY = -d * d * 1.2 + d * up * 1.3, w = side * wd * (0.45 + 0.55 * Math.sin(Math.PI * (0.15 + 0.85 * d))) * 0.5; return [w, dropY, z, d]; };
      const quad = (s) => { const a = P(s, -1), b = P(s, 1), c2 = P(s + 1, -1), d2 = P(s + 1, 1); [[a, 0, 0], [b, 1, 0], [c2, 0, 1], [b, 1, 0], [d2, 1, 1], [c2, 0, 1]].forEach(([v, u, vv]) => { pos[vi * 3] = v[0]; pos[vi * 3 + 1] = v[1]; pos[vi * 3 + 2] = v[2]; nor[vi * 3] = 0; nor[vi * 3 + 1] = 1; nor[vi * 3 + 2] = 0; const sh = 0.62 + 0.38 * (1 - v[3]); col[vi * 3] = col[vi * 3 + 1] = col[vi * 3 + 2] = sh; uv[vi * 2] = u; uv[vi * 2 + 1] = v[3]; vi++; }); };
      for (let s = 0; s < segsL; s++) quad(s);
      const ca = Math.cos(yaw), sa = Math.sin(yaw); for (let i = 0; i < n; i++) { const X = pos[i * 3], Z = pos[i * 3 + 2]; pos[i * 3] = X * ca + Z * sa + px; pos[i * 3 + 2] = -X * sa + Z * ca; pos[i * 3 + 1] += py + 0.1; nor[i * 3] = 0; nor[i * 3 + 1] = 1; nor[i * 3 + 2] = 0; }
      parts.push({ pos: pos.slice(0, vi * 3), nor: nor.slice(0, vi * 3), col: col.slice(0, vi * 3), uv: uv.slice(0, vi * 2) });
    }
    const m = new THREE.Mesh(mergeParts(parts), frondMat); m.castShadow = true; grp.add(m);
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), new THREE.MeshStandardMaterial({ color: 0x6a5a34, roughness: 0.9 })); nut.position.set(px, py - 0.05, 0.1); grp.add(nut);
  } else {   // oak / blossom / autumn: batang bercabang + beberapa gumpalan tajuk
    const th = rr(1.7, 2.3), R = rr(1.25, 1.6), cy = th + R * 0.55, centre = [0, cy, 0], parts = [], nB = kind === 'blossom' ? 7 : 8;
    const flare = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.38, 0.35, 10), barkMat); flare.position.y = 0.15; flare.castShadow = true; grp.add(flare);
    grp.add(trunkMesh(th + 0.2, 0.22, 0.12, barkMat));
    for (let b = 0; b < 3; b++) { const ang = b / 3 * 6.283 + rr(0, 1), br = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 1.1, 6), barkMat); br.position.set(Math.cos(ang) * 0.32, th + 0.35, Math.sin(ang) * 0.32); br.rotation.set(Math.sin(ang) * 0.55, 0, -Math.cos(ang) * 0.55); grp.add(br); }
    const y0 = cy - R * 0.9, y1 = cy + R * 1.0;
    for (let i = 0; i < nB; i++) { const a = i / nB * 6.283 + rr(-0.4, 0.4), d = i === 0 ? 0 : rr(0.35, 0.8) * R, rad = rr(0.62, 0.9) * R * (i === 0 ? 1.05 : 0.8); parts.push(blobPart(Math.cos(a) * d, cy + rr(-0.35, 0.55) * R * (i === 0 ? 0.4 : 1), Math.sin(a) * d, rad, rad * rr(0.75, 0.95), rad, centre, y0, y1, seed + i * 3.1)); }
    const m = new THREE.Mesh(mergeParts(parts), FOL[kind === 'blossom' ? 'blossom' : kind === 'autumn' ? 'autumn' : 'oak']); m.castShadow = true; grp.add(m);
  }
  return grp;
}
const TREE_PROTO = {}; for (const k of ['oak', 'pine', 'palm', 'blossom', 'autumn']) TREE_PROTO[k] = Array.from({ length: k === 'oak' || k === 'palm' ? 3 : 2 }, () => buildTree(k));
function makeTree(kind) { const p = pick(TREE_PROTO[kind === 'round' ? 'oak' : kind]).clone(); p.scale.setScalar(rr(0.85, 1.2)); p.rotation.y = Math.random() * 6.283; return p; }
function makeBush() {
  const g = new THREE.Group(), parts = [], seed = Math.random() * 10, flowers = Math.random() < 0.5, fc = pick([0xff5a7a, 0xffd23f, 0xffffff, 0xb06aff]);
  for (let i = 0; i < 3; i++) { const s = rr(0.3, 0.5); parts.push(blobPart(rr(-0.4, 0.4), s * 0.6, rr(-0.3, 0.3), s, s * 0.8, s, [0, 0.3, 0], 0, 0.9, seed + i * 2)); }
  const m = new THREE.Mesh(mergeParts(parts), FOL.oak); m.castShadow = true; g.add(m);
  if (flowers) for (let i = 0; i < 6; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshStandardMaterial({ color: fc, roughness: 0.6 })); f.position.set(rr(-0.45, 0.45), rr(0.3, 0.6), rr(-0.35, 0.35)); g.add(f); }
  return g;
}
const TREE_KINDS = ['oak', 'oak', 'palm', 'pine', 'blossom', 'autumn', 'oak', 'palm'];
[-1, 1].forEach(sd => {
  for (let k = 0; k < 20; k++) {
    const z = ZTOP - k * (SC_LEN / 20) - rr(0, 2);
    addScenery(makeTree(pick(TREE_KINDS)), sd * rr(5.9, 6.4), z);
    if (k % 2) addScenery(makeBush(), sd * rr(7.6, 8.4), z - 3);
    if (k % 3 === 0) { const r = new THREE.Mesh(new THREE.DodecahedronGeometry(rr(0.2, 0.4)), MATS.roof); r.position.y = 0.15; const g = new THREE.Group(); g.add(r); addScenery(g, sd * rr(5.2, 5.6), z - 4.5); }
  }
});
// pagar tanaman (hedge) di tepi trotoar
const hedgeTex = (() => {
  const c = mkCanvas(128, 64), x = c.getContext('2d'); x.fillStyle = '#2a4a24'; x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 700; i++) { x.fillStyle = `hsl(${rr(85, 125)},${rr(35, 55)}%,${rr(16, 36)}%)`; x.beginPath(); x.ellipse(Math.random() * 128, Math.random() * 64, rr(2, 4.5), rr(1.4, 2.6), Math.random() * 3, 0, 6.283); x.fill(); }
  const g = x.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(255,255,200,.08)'); g.addColorStop(1, 'rgba(0,0,0,.3)'); x.fillStyle = g; x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 10; i++) { x.fillStyle = pick(['#e8e4dc', '#e8c44a', '#d86a7a']); x.beginPath(); x.arc(Math.random() * 128, Math.random() * 40 + 6, 1.8, 0, 6.283); x.fill(); }
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 1); return t;
})();
const hedgeMat = new THREE.MeshStandardMaterial({ map: hedgeTex, roughness: 1 });
const hedgeTopTex = hedgeTex.clone(); hedgeTopTex.repeat.set(1, 9); hedgeTopTex.needsUpdate = true; const hedgeTop = new THREE.MeshStandardMaterial({ map: hedgeTopTex, roughness: 1 });
[-1, 1].forEach(sd => { for (let k = 0; k < SC_LEN / 12; k++) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 11.4), [hedgeMat, hedgeMat, hedgeTop, hedgeMat, hedgeMat, hedgeMat]); h.position.y = 0.35; const g = new THREE.Group(); g.add(h); addScenery(g, sd * 4.95, ZTOP - k * 12 - 6); } });
// tiang lampu jalan
const lampGlows = [];
[-1, 1].forEach(sd => { for (let k = 0; k < SC_LEN / 28; k++) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 3.6, 8), MATS.pole); pole.position.y = 1.8; g.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.07), MATS.pole); arm.position.set(-sd * 0.4, 3.55, 0); g.add(arm);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.22), MATS.pole); head.position.set(-sd * 0.85, 3.52, 0); g.add(head);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), MATS.bulb); bulb.position.set(-sd * 0.85, 3.43, 0); g.add(bulb);
  const gl = new THREE.Sprite(glowMat); gl.scale.set(1.8, 1.8, 1); gl.position.set(-sd * 0.85, 3.43, 0); g.add(gl);
  addScenery(g, sd * 3.8, ZTOP - k * 28 - (sd > 0 ? 14 : 0) - 4);
} });
// papan reklame tepi jalan
[-1, 1].forEach(sd => { for (let k = 0; k < 3; k++) {
  const g = new THREE.Group();
  const pn = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.1), new THREE.MeshBasicMaterial({ map: pick(billTexs), side: THREE.DoubleSide })); pn.position.y = 3.4; pn.rotation.y = -sd * 0.35; g.add(pn);
  const fr = new THREE.Mesh(new THREE.BoxGeometry(4.35, 2.25, 0.08), MATS.dark); fr.position.set(0, 3.4, -0.06); fr.rotation.y = -sd * 0.35; g.add(fr);
  [-1.4, 1.4].forEach(px => { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.6, 6), MATS.metal); lg.position.set(px, 1.3, 0); g.add(lg); });
  addScenery(g, sd * 9.2, ZTOP - 20 - k * 52 - (sd > 0 ? 24 : 0));
} });
