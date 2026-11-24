'use strict';
// ======================= TRUK, BUS & MOTOR (setara mobil penumpang: badan lengkung, cat PBR, jendela bertekstur) =======================
// Memakai loftGeo/silhouetteAt dari 02b-mobil-halus.js. Koordinat profil: x maju (= -z dunia), y atas, lateral = x dunia.
const polyV = pts => pts.map(p => new THREE.Vector2(p[0], p[1]));
// badan lengkung dari siluet samping: tiap stasiun = superelips selebar hw, ujung membulat, lengkung roda dipotong ke bodi
function bodyLoft2(poly, x0, x1, hw, o = {}) {
  const N = o.N || 56, nT = o.nTop || 4.6, nB = o.nBot || 3.4, rF = o.rF == null ? 0.15 : o.rF, rR = o.rR == null ? 0.12 : o.rR, wr = o.wr || 0.5, ak = o.archK || 1.2, sts = [];
  const edge = (d, r) => d < r ? 0.15 + 0.85 * Math.sqrt(Math.max(0, 1 - Math.pow((r - d) / r, 2))) : 1;
  for (let i = 0; i <= N; i++) {
    const x = x0 + 0.01 + (x1 - x0 - 0.02) * (0.5 - 0.5 * Math.cos(Math.PI * i / N)), sl = silhouetteAt(poly, x); if (!(sl[1] > sl[0])) continue; let yb = sl[0];
    for (const wx of (o.wheelsX || [])) { const dx = x - wx, ra = wr * ak; if (Math.abs(dx) < ra) yb = Math.max(yb, wr + Math.sqrt(ra * ra - dx * dx) * 0.96); }
    yb = Math.min(yb, sl[1] - 0.1); sts.push({ x, yb, yt: sl[1], a: hw * edge(x1 - x, rF) * edge(x - x0, rR), u: (x - x0) / (x1 - x0) });
  }
  return loftGeo(sts, o.M || 32, 0, Math.PI * 2, true, (st, th) => { const c = Math.cos(th), s = Math.sin(th), n = s >= 0 ? nT : nB, cy = (st.yb + st.yt) / 2, b = (st.yt - st.yb) / 2; return [st.a * spow(c, 2 / n), cy + b * spow(s, 2 / n)]; });
}
const wheelLiner = (sd, wx, wr, hw, wl) => { const g = new THREE.CylinderGeometry(wr * 1.17, wr * 1.17, wl, 20, 1, true, 0, Math.PI); g.rotateZ(Math.PI / 2); g.translate(sd * (hw - wl / 2), wr, -wx); return g; };
// silinder dari titik a ke b (lengan, kaki, garpu, knalpot)
function cylBetween(a, b, r, seg = 8) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(), g = new THREE.CylinderGeometry(r, r, len, seg, 1, false);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()))); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); return g;
}
// ---- tekstur zona: jendela (kaca gelap), strip warna, garis sambungan; sisi kanan v≈0, kiri dicerminkan (v' = 0.5 - v) ----
function zoneMaps({ glass = [], stripes = [], lines = [], base = '#ffffff' }) {
  const W = 1024, H = 256, mk = () => { const c = mkCanvas(W, H); return [c, c.getContext('2d')]; }, [c1, x1] = mk(), [c2, x2] = mk(), [c3, x3] = mk();
  x1.fillStyle = base; x1.fillRect(0, 0, W, H); x2.fillStyle = 'rgb(96,96,96)'; x2.fillRect(0, 0, W, H); x3.fillStyle = '#808080'; x3.fillRect(0, 0, W, H);
  const Y = v => (1 - v) * H, segV = (a, b) => b <= 0 ? [[a + 1, b + 1]] : a >= 0 ? [[a, b]] : [[a + 1, 1], [0, b]], sides = (a, b, sym) => (sym === false ? [[a, b]] : [[a, b], [0.5 - b, 0.5 - a]]);
  for (const s of stripes) for (const [a0, b0] of sides(s.v0, s.v1, s.sym)) for (const [a, b] of segV(a0, b0)) { x1.fillStyle = s.color; x1.fillRect(0, Y(b), W, Y(a) - Y(b)); }
  for (const gz of glass) for (const [a0, b0] of sides(gz.v0, gz.v1, gz.sym)) for (const [a, b] of segV(a0, b0)) {
    const ya = Y(b), yb = Y(a), xa = gz.u0 * W, wd = (gz.u1 - gz.u0) * W, g = x1.createLinearGradient(0, ya, 0, yb); g.addColorStop(0, '#2a3b4a'); g.addColorStop(0.5, '#10181f'); g.addColorStop(1, '#080c10');
    x1.fillStyle = g; x1.fillRect(xa, ya, wd, yb - ya); x2.fillStyle = 'rgb(14,14,14)'; x2.fillRect(xa, ya, wd, yb - ya);
  }
  for (const l of lines) for (const [a0, b0] of sides(l.v0, l.v1, l.sym)) for (const [a, b] of segV(a0, b0)) [[x1, 'rgba(10,10,12,.7)', 2.2], [x3, '#303030', 3]].forEach(([cx, col, w]) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(l.u * W, Y(b)); cx.lineTo(l.u * W, Y(a)); cx.stroke(); });
  const t = c => { const x = mkTex(c); x.anisotropy = 8; return x; }; return { map: t(c1), rough: t(c2), bump: t(c3) };
}
const zoneCache = {};
function zonePaintMat(hex, z) { const k = hex + '|z' + z.map.id; return zoneCache[k] || (zoneCache[k] = envMat(new THREE.MeshPhysicalMaterial({ color: hex, map: z.map, roughnessMap: z.rough, bumpMap: z.bump, bumpScale: 0.25, metalness: 0.5, roughness: 1, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }), 1.2)); }
// ---- warna acak per kendaraan (pengendara, muatan, dsb.) ----
const ROLE_HEX = { jacket: [0x2a4a8a, 0xc23030, 0x2b2b30, 0x2d7a3a, 0xd89a1a, 0x7a7a82, 0x6a3a8a], jacket2: [0xd8d8dc, 0x2a4a8a, 0xc27a30, 0x2d6a6a, 0x8a2a4a], pants: [0x1d2a4a, 0x18181c, 0x3a3a40, 0x2a2a1e], helmet: [0xf0f0f0, 0xc23030, 0x2a2a30, 0xe8b020, 0x2a6ae0, 0x2d8a4a], helmet2: [0x2a2a30, 0xf0f0f0, 0xd8222a, 0x2a6ae0], bag: [0x202228, 0x3a4a2a, 0x8a2a2a, 0x2a3a6a], accent: [0xf2f2f4, 0x1a1a1e, 0xf2d21c, 0xd8222a, 0x1a8a4a], tank: [0xe8eaee, 0xc8ccd4, 0xf4f4f4, 0xd8dce2], bed: [0xf2b81c, 0xe87a1e, 0x2a9a4a, 0x2a6ae0, 0xd8222a] };
const roleCache = {};
function roleMat(role, over) {
  if (role === 'skin') return roleCache.skin || (roleCache.skin = new THREE.MeshStandardMaterial({ color: 0xb88a6a, roughness: 0.8 }));
  if (role === 'visor') return roleCache.visor || (roleCache.visor = envMat(new THREE.MeshStandardMaterial({ color: 0x0a0e14, metalness: 0.9, roughness: 0.08 }), 1.2));
  if (role === 'wood') return roleCache.wood || (roleCache.wood = new THREE.MeshStandardMaterial({ color: 0x8a6a42, roughness: 0.92 }));
  if (role === 'soil') return roleCache.soil || (roleCache.soil = new THREE.MeshStandardMaterial({ color: 0x5a4636, roughness: 1 }));
  const list = (over && over[role]) || ROLE_HEX[role], hex = pick(list), k = role + hex, hel = role.indexOf('helmet') === 0, metal = role === 'tank';
  return roleCache[k] || (roleCache[k] = (hel || role === 'accent' || role === 'bed') ? envMat(new THREE.MeshPhysicalMaterial({ color: hex, metalness: hel ? 0.2 : 0.5, roughness: hel ? 0.3 : 0.38, clearcoat: 1, clearcoatRoughness: 0.08 }), 1) : metal ? envMat(new THREE.MeshStandardMaterial({ color: hex, metalness: 0.85, roughness: 0.28 }), 1.2) : new THREE.MeshStandardMaterial({ color: hex, roughness: 0.88 }));
}
const NVAR = { pickup: 3, truck: 5, truckm: 2, bus: 4, minibus: 2, busdd: 1, motor: 4, motor2: 2 };
const isBigKind = k => k === 'truck' || k === 'truckm' || k === 'bus' || k === 'minibus' || k === 'busdd';
const newOut = (extra = []) => { const o = { paintLow: [], paintRoof: [], paintPlain: [], glass: [], trim: [], chrome: [], head: [], tail: [], plate: [], blinkL: [], blinkR: [], wheels: [], cargo: [], accent: [], tank: [], bed: [], wood: [], soil: [] }; extra.forEach(k => { o[k] = []; }); return o; };
// v (tinggi y) → v tekstur pada cincin superelips badan (agar jendela tepat di ketinggian yang diinginkan)
function vAtY(y, yb, yt, nT, nB) { const cy = (yb + yt) / 2, b = (yt - yb) / 2, r = clamp((y - cy) / b, -1, 1), n = r >= 0 ? nT : nB, s = Math.sign(r) * Math.pow(Math.abs(r), n / 2); return Math.asin(clamp(s, -1, 1)) / (Math.PI * 2); }
// ======================= TRUK (v: 0 boks · 1 peti kemas · 2 bak kayu gelondongan · 3 tanker · 4 dump) · truk sedang (medium): 0 bak kayu · 1 boks =======================
function truckBody(v = 0, medium = false) {
  const xF = medium ? 3.1 : 4.1, xR = -xF, L = xF * 2, W = 2.3, o = newOut(), cx = xF - 2.05, fx = xF - 1.0, rearX = medium ? [xR + 1.0] : [xR + 1.9, xR + 0.7], uc = x => (x - cx) / 2.05;
  const cabPoly = polyV([[cx, 0.55], [cx, 2.5], [cx + 0.35, 2.62], [cx + 1.25, 2.62], [cx + 1.9, 1.9], [xF, 1.62], [xF, 0.62], [xF - 0.1, 0.55]]);
  o.paintRoof.push(bodyLoft2(cabPoly, cx, xF, 1.1, { N: 40, nTop: 4.2, nBot: 3.2, rF: 0.12, rR: 0.1, wheelsX: [fx], wr: 0.5 }));
  const vs0 = vAtY(1.6, 0.55, 2.62, 4.2, 3.2), vs1 = vAtY(2.35, 0.55, 2.62, 4.2, 3.2);
  o.zone = zoneMaps({ glass: [{ u0: uc(cx + 1.25) + 0.01, u1: uc(xF - 0.02), v0: 0.12, v1: 0.38, sym: false }, { u0: uc(cx + 0.45), u1: uc(xF - 0.2), v0: vs0, v1: vs1 }], lines: [{ u: uc(cx + 0.4), v0: -0.07, v1: vs1 }, { u: uc(xF - 0.18), v0: -0.07, v1: vs1 }] });
  const cL = xR + 0.0, cR = cx - 0.12;      // rentang muatan
  if (!medium) {
    if (v === 0) { o.cargo.push(bodyLoft2(polyV([[cL, 0.82], [cL, 3.25], [cR, 3.25], [cR, 0.82]]), cL, cR, 1.15, { N: 36, nTop: 9, nBot: 9, rF: 0.08, rR: 0.08, wheelsX: rearX, wr: 0.5, archK: 1.15, M: 28 })); }
    else if (v === 1) { o.cargo.push(bodyLoft2(polyV([[cL, 0.95], [cL, 3.55], [cR, 3.55], [cR, 0.95]]), cL, cR, 1.2, { N: 36, nTop: 11, nBot: 11, rF: 0.05, rR: 0.05, wheelsX: rearX, wr: 0.5, archK: 1.1, M: 28 })); o.cargoPal = [0x2a6ab0, 0xc0392b, 0xe8821e, 0x2a8a5a, 0x7a3a9a, 0xd8c030]; }
    else if (v === 2) {
      o.bed.push(bodyLoft2(polyV([[cL, 0.82], [cL, 1.0], [cR, 1.0], [cR, 0.82]]), cL, cR, 1.15, { N: 8, nTop: 8, nBot: 8, rF: 0.04, rR: 0.04, wheelsX: rearX, wr: 0.5, archK: 1.1, M: 20 }));
      [-1, 1].forEach(sd => { for (let k = 0; k < 7; k++) o.wood.push(bx(0.07, 0.9, 0.12, sd * 1.12, 1.45, -(cL + 0.3 + k * ((cR - cL - 0.6) / 6)))); });                                    // tiang pengaman bak
      for (let r = 0; r < 3; r++) for (let q = 0; q < (r === 2 ? 2 : 3 - (r === 1 ? 0 : 0)) + (r === 0 ? 1 : 0); q++) { const n = r === 0 ? 4 : r === 1 ? 3 : 2, lx = -((n - 1) * 0.62) / 2 + q * 0.62, ly = 1.3 + r * 0.55; if (q < n) o.wood.push(cyZ(0.3, cR - cL - 0.3, lx, ly, -(cL + cR) / 2)); }   // kayu gelondongan
    } else if (v === 3) {
      o.tank.push(bodyLoft2(polyV([[cL + 0.1, 0.85], [cL + 0.1, 3.05], [cR, 3.05], [cR, 0.85]]), cL + 0.1, cR, 1.1, { N: 40, nTop: 2.05, nBot: 2.05, rF: 0.35, rR: 0.35, wheelsX: rearX, wr: 0.5, archK: 1.05, M: 28 }));
      for (let k = 0; k < 5; k++) o.trim.push(cyZ(1.115, 0.07, 0, 1.95, -(cL + 0.7 + k * ((cR - cL - 1.4) / 4)))); o.chrome.push(cyY(0.28, 0.12, 0, 3.08, -(cL + cR) / 2)); o.trim.push(bx(0.5, 0.05, 0.4, 0, 3.1, -(cL + cR) / 2));
      o.trim.push(bx(0.3, 1.6, 0.05, 0.6, 1.9, -(cL - 0.05))); o.trim.push(bx(0.05, 0.05, 6.0, 0, 3.12, -((cL + cR) / 2)));
    } else {
      o.bed.push(bodyLoft2(polyV([[cL, 1.0], [cL + 0.2, 2.75], [cR - 0.6, 2.75], [cR + 0.05, 3.55], [cR + 0.05, 1.0]]), cL, cR + 0.05, 1.12, { N: 34, nTop: 6, nBot: 6, rF: 0.06, rR: 0.06, wheelsX: rearX, wr: 0.5, archK: 1.1, M: 26 }));
      o.soil.push(spE(1.0, 0.5, (cR - cL) * 0.42, 0, 2.8, -(cL + cR) / 2)); o.chrome.push(cylBetween([0, 1.0, -(cR - 1.2)], [0, 2.0, -(cR - 0.3)], 0.1)); o.trim.push(bx(2.1, 0.1, 6.2, 0, 0.95, -(cL + cR) / 2));
    }
  } else if (v === 0) {   // bak kayu (colt diesel): lantai + dinding papan + muatan karung/peti
    o.wood.push(bx(2.2, 0.12, cR - cL, 0, 0.9, -(cL + cR) / 2)); [-1, 1].forEach(sd => o.wood.push(bx(0.07, 0.75, cR - cL, sd * 1.12, 1.35, -(cL + cR) / 2))); o.wood.push(bx(2.2, 0.75, 0.07, 0, 1.35, -(cL + 0.03))); o.wood.push(bx(2.2, 0.8, 0.07, 0, 1.38, -(cR - 0.03)));
    for (let k = 0; k < 5; k++) { o.soil.push(bx(0.7, 0.5, 0.8, ((k % 2) - 0.5) * 0.9, 1.45 + (k > 3 ? 0.5 : 0), -(cL + 0.9 + k * 0.85))); }
  } else { o.cargo.push(bodyLoft2(polyV([[cL, 0.88], [cL, 2.8], [cR, 2.8], [cR, 0.88]]), cL, cR, 1.1, { N: 28, nTop: 9, nBot: 9, rF: 0.08, rR: 0.08, wheelsX: rearX, wr: 0.5, archK: 1.1, M: 24 })); }
  [-1, 1].forEach(sd => {
    o.head.push(bx(0.42, 0.22, 0.09, sd * 0.78, 1.05, -(xF - 0.01))); o.head.push(bx(0.2, 0.08, 0.07, sd * 0.95, 0.72, -xF));
    o.tail.push(bx(0.2, 0.3, 0.07, sd * 1.0, 1.0, -xR)); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.16, 0.09, 0.07, sd * 0.72, 0.62, -xR));
    o.trim.push(bx(0.2, 0.2, L - 0.3, sd * 0.55, 0.55, 0)); o.trim.push(bx(0.5, 0.4, 0.03, sd * 0.95, 0.48, -xR - 0.2)); o.trim.push(bx(0.3, 0.05, 0.35, sd * 1.2, 0.72, -(fx - 0.2)));
    o.chrome.push(cyX(0.27, 0.55, sd * 1.05, 0.66, -0.3)); o.trim.push(bx(0.5, 0.03, 0.03, sd * 1.4, 2.05, -(xF - 0.7))); o.chrome.push(bx(0.045, 0.42, 0.2, sd * 1.66, 1.98, -(xF - 0.7)));
    o.chrome.push(spE(0.03, 0.03, 0.03, sd * 1.18, 0.85, -(xF - 0.02))); o.trim.push(wheelLiner(sd, fx, 0.5, 1.16, 0.55)); rearX.forEach(wx => o.trim.push(wheelLiner(sd, wx, 0.5, 1.16, 0.6)));
    o.wheels.push({ x: sd * 0.95, z: -fx, front: true, side: sd }); rearX.forEach(wx => [0.95, 0.58].forEach(lx => o.wheels.push({ x: sd * lx, z: -wx, front: false, side: sd })));
  });
  o.trim.push(bx(1.3, 0.55, 0.06, 0, 1.02, -xF)); for (let i = 0; i < 4; i++) o.chrome.push(bx(1.25, 0.025, 0.07, 0, 0.82 + i * 0.12, -(xF + 0.005)));
  o.chrome.push(bx(2.2, 0.18, 0.2, 0, 0.58, -(xF + 0.04))); o.trim.push(bx(2.2, 0.18, 0.16, 0, 0.55, -(xR - 0.06))); o.trim.push(bx(2.1, 0.07, 0.34, 0, 2.12, -(xF - 0.15), 0.45, 0, 0));
  [-0.5, 0, 0.5].forEach(x => o.head.push(bx(0.14, 0.07, 0.07, x, 2.66, -(xF - 0.8)))); o.chrome.push(cyY(0.07, 1.9, 1.28, 2.1, -(cx + 0.1))); o.chrome.push(cyY(0.075, 0.12, 1.28, 3.08, -(cx + 0.1)));
  o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.6, -(xF + 0.15))); o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.6, -(xR - 0.17)));
  // gaya kabin (selain bentuk dasar): 0 polos · 1 deflektor atap + knalpot ganda · 2 bull bar + visor
  const cs = medium ? [2, 0][v % 2] : [1, 2, 0, 1, 2][v % 5];
  if (cs === 1) { o.paintRoof.push(bx(2.1, 0.07, 1.5, 0, 3.0, -(cx + 0.7), -0.34, 0, 0)); [-1, 1].forEach(sd => o.paintRoof.push(bx(0.06, 0.55, 1.3, sd * 1.04, 2.88, -(cx + 0.75)))); o.chrome.push(cyY(0.07, 1.9, -1.28, 2.1, -(cx + 0.1))); o.chrome.push(cyY(0.075, 0.12, -1.28, 3.08, -(cx + 0.1))); }
  if (cs === 2) { o.chrome.push(bx(1.9, 0.07, 0.07, 0, 0.92, -(xF + 0.13))); [-1, 1].forEach(sd => o.chrome.push(bx(0.06, 0.45, 0.06, sd * 0.85, 0.72, -(xF + 0.11)))); o.paintRoof.push(bx(2.2, 0.05, 0.5, 0, 2.5, -(cx + 1.55), 0.5, 0, 0)); [-0.8, -0.4, 0, 0.4, 0.8].forEach(x => o.head.push(bx(0.12, 0.07, 0.07, x, 2.72, -(cx + 0.6)))); }
  o.R = 0.5; o.L = L; o.W = W; return o;
}
// ======================= BUS =======================
const BUSCFG = {
  bus: [
    { L: 9.6, H: 3.08, nw: 8, base: [0xffffff, 0xffe8c0, 0xd8f0ff], st: [[0.95, 1.25, '#d8222a'], [1.3, 1.48, '#14449a']], wy: [[1.62, 2.7]] },                                  // bus kota
    { L: 10.8, H: 3.6, nw: 8, base: [0xffffff, 0xf0f0f4], st: [[0.95, 1.5, '#6a2a9a'], [1.55, 1.8, '#f08a1a'], [1.85, 2.0, '#6a2a9a']], wy: [[2.05, 3.1]], bays: true },       // bus AKAP (bagasi samping)
    { L: 11.0, H: 3.3, nw: 9, base: [0xf4f4f8], st: [[0.95, 1.75, '#1a6ab8'], [1.8, 1.92, '#d8222a']], wy: [[1.95, 3.0]] },                                                      // BRT
    { L: 10.4, H: 3.7, nw: 8, base: [0x6a2a9a, 0x1f8a8a, 0xd8501a, 0xc0204a], st: [[0.95, 1.3, '#f5d020'], [1.35, 1.6, '#ffffff'], [1.65, 1.9, '#f08ab8']], wy: [[2.0, 3.35]], tourist: true }   // bus wisata
  ],
  minibus: [{ L: 6.2, W: 2.0, H: 2.6, nw: 5, base: [0xffffff, 0xf2f2f2], st: [[0.95, 1.25, '#1a4a9a'], [1.3, 1.38, '#d8222a']], wy: [[1.4, 2.2]], fw: 1.35, rw: 1.35 }, { L: 6.2, W: 2.0, H: 2.6, nw: 5, base: [0xe8f0e8, 0xffffff], st: [[0.95, 1.3, '#1a8a4a'], [1.35, 1.45, '#f0c020']], wy: [[1.4, 2.2]], fw: 1.35, rw: 1.35 }],
  busdd: [{ L: 10.8, H: 4.3, nw: 8, base: [0xd8222a], st: [[0.95, 1.2, '#f5f5f5'], [2.55, 2.75, '#f5f5f5']], wy: [[1.55, 2.3], [3.0, 3.85]], dd: true }]
};
function busBody(v = 0, kind = 'bus') {
  const C = BUSCFG[kind][v % BUSCFG[kind].length], L = C.L, W = C.W || 2.5, H = C.H, xF = L / 2, xR = -L / 2, o = newOut(), fwx = xF - (C.fw || 1.55), rwx = xR + (C.rw || 1.7), hw = W / 2 - 0.02;
  const poly = polyV([[xR + 0.05, 0.6], [xR - 0.0, 1.0], [xR - 0.0, H - 0.18], [xR + 0.25, H], [xF - 0.3, H], [xF, H - 0.23], [xF + 0.05, 1.3], [xF, 0.6]]), nT = 5.2, nB = 4, yb = 0.6, yt = H;
  o.paintRoof.push(bodyLoft2(poly, xR, xF + 0.05, hw, { N: 72, nTop: nT, nBot: nB, rF: 0.2, rR: 0.2, wheelsX: [fwx, rwx], wr: 0.5, archK: 1.25, M: 32 }));
  const u = x => (x - xR) / (L + 0.05), win = [], x0 = xR + 0.8, x1 = xF - (C.dd ? 1.5 : 1.7), nw = C.nw, pitch = (x1 - x0) / nw, wd = pitch - 0.2;
  C.wy.forEach(([wa, wb]) => { const va = vAtY(wa, yb, yt, nT, nB), vb = vAtY(wb, yb, yt, nT, nB); for (let k = 0; k < nw; k++) win.push({ u0: u(x0 + k * pitch), u1: u(x0 + k * pitch + wd), v0: va, v1: vb }); });
  const dy0 = vAtY(0.95, yb, yt, nT, nB), dy1 = vAtY(C.wy[0][1], yb, yt, nT, nB); win.push({ u0: u(xF - 1.5), u1: u(xF - 0.45), v0: dy0, v1: dy1, sym: false });   // pintu depan (kanan)
  const sts = C.st.map(([ya, yb2, col]) => ({ v0: vAtY(ya, yb, yt, nT, nB), v1: vAtY(yb2, yb, yt, nT, nB), color: col })); o.zone = zoneMaps({ glass: win, stripes: sts, lines: [{ u: u(xF - 1.55), v0: dy0, v1: dy1, sym: false }] });
  o.base = C.base;
  [-1, 1].forEach(sd => {
    o.head.push(bx(0.3, 0.16, 0.07, sd * 0.95, 1.0, -(xF + 0.02))); o.tail.push(bx(0.3, 0.2, 0.07, sd * 0.95, 1.4, -(xR - 0.04))); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.14, 0.08, 0.07, sd * 1.1, 1.0, -(xR - 0.04)));
    o.trim.push(bx(0.55, 0.03, 0.03, sd * (W / 2 + 0.25), 2.5, -(xF - 0.3))); o.chrome.push(bx(0.05, 0.55, 0.25, sd * (W / 2 + 0.55), 2.35, -(xF - 0.4))); o.trim.push(bx(0.04, 0.6, 0.28, sd * (W / 2 + 0.53), 2.35, -(xF - 0.4)));
    [fwx, rwx].forEach((wx, i) => { o.trim.push(wheelLiner(sd, wx, 0.5, W / 2 + 0.01, 0.6)); o.wheels.push({ x: sd * (W / 2 - 0.2), z: -wx, front: i === 0, side: sd }); });
    if (C.bays) for (let k = 0; k < 3; k++) o.trim.push(bx(0.02, 0.75, 1.25, sd * (W / 2 + 0.002), 1.25, -(xR + 2.2 + k * 2.4)));       // pintu bagasi samping (AKAP)
  });
  const wsH = C.dd ? 1.15 : H * 0.4; o.glass.push(bx(W * 0.86, wsH, 0.04, 0, C.dd ? 3.0 : H * 0.66, -(xF + 0.06), -0.05, 0, 0)); if (C.dd) o.glass.push(bx(W * 0.86, 0.95, 0.04, 0, 1.75, -(xF + 0.06))); o.glass.push(bx(W * 0.74, C.dd ? 1.0 : H * 0.28, 0.04, 0, C.dd ? 3.2 : H * 0.7, -(xR - 0.07)));
  o.head.push(bx(1.5, 0.26, 0.05, 0, H - 0.3, -(xF + 0.03)));
  o.trim.push(bx(W * 0.96, 0.22, 0.15, 0, 0.7, -(xF + 0.07))); o.chrome.push(bx(1.2, 0.1, 0.06, 0, 0.95, -(xF + 0.09))); o.trim.push(bx(1.2, 0.5, 0.04, 0, 1.1, -(xR - 0.06)));
  if (!C.dd) { o.trim.push(bx(1.3, 0.22, L * 0.22, 0, H + 0.1, L * 0.16)); o.trim.push(bx(1.3, 0.22, L * 0.22, 0, H + 0.1, -L * 0.16)); }
  if (C.tourist) { o.trim.push(bx(0.7, 0.35, 3.2, 0.2, H + 0.18, 0.5)); }
  o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.9, -(xF + 0.12))); o.plate.push(bx(0.5, 0.11, 0.012, 0, 0.95, -(xR - 0.09)));
  o.R = 0.5; o.L = L; o.W = W; return o;
}
// ======================= MOTOR (v: 0 matic · 1 bebek · 2 sport · 3 ojol[kotak antar hijau]) ; motor2 = dengan pembonceng (v 0 matic, 1 bebek) =======================
function motorBody(style = 0, passenger = false) {
  const o = newOut(['jacket', 'jacket2', 'pants', 'helmet', 'helmet2', 'visor', 'skin', 'bag']), R = 0.3, matic = style === 0 || style === 3, sport = style === 2, rz = sport ? 0.3 : 0.38;
  if (style === 3) o.over = { jacket: [0x1fa84a], helmet: [0x1fa84a, 0x202228], bag: [0x1fa84a] };
  if (matic) {   // badan belakang + perisai kaki + jok
    o.paintPlain.push(bodyLoft2(polyV([[-0.98, 0.42], [-1.0, 0.64], [-0.8, 0.8], [0.02, 0.8], [0.1, 0.78], [0.12, 0.42]]), -1.0, 0.12, 0.2, { N: 26, nTop: 3, nBot: 2.6, rF: 0.06, rR: 0.1, wheelsX: [-0.55], wr: R, archK: 1.18, M: 24 }));
    o.paintPlain.push(bodyLoft2(polyV([[0.5, 0.36], [0.8, 0.34], [0.82, 0.96], [0.68, 1.12], [0.55, 1.1], [0.52, 0.72]]), 0.5, 0.82, 0.21, { N: 18, nTop: 2.8, nBot: 2.6, rF: 0.1, rR: 0.08, M: 24 }));
    o.trim.push(bodyLoft2(polyV([[-0.92, 0.8], [-0.9, 0.9], [-0.1, 0.94], [0.06, 0.89], [0.06, 0.8]]), -0.92, 0.06, 0.17, { N: 22, nTop: 2.6, nBot: 3, rF: 0.05, rR: 0.05, M: 20 }));
    o.trim.push(bx(0.46, 0.05, 0.42, 0, 0.34, -0.3)); o.trim.push(bx(0.52, 0.12, 0.24, 0, 1.12, -0.62)); o.trim.push(bx(0.3, 0.1, 0.5, 0, 0.45, 0.55)); o.head.push(spE(0.13, 0.1, 0.06, 0, 1.0, -0.83)); o.chrome.push(spE(0.145, 0.115, 0.04, 0, 1.0, -0.8));
  } else if (style === 1) {   // bebek: rangka terbuka, mesin terlihat, perisai kecil
    o.paintPlain.push(bodyLoft2(polyV([[-0.95, 0.5], [-0.97, 0.66], [-0.8, 0.78], [-0.25, 0.8], [-0.2, 0.5]]), -0.97, -0.2, 0.15, { N: 16, nTop: 3, nBot: 2.6, rF: 0.05, rR: 0.08, wheelsX: [-0.55], wr: R, archK: 1.18, M: 20 }));          // cover belakang
    o.paintPlain.push(bodyLoft2(polyV([[0.5, 0.46], [0.74, 0.44], [0.76, 0.98], [0.64, 1.1], [0.54, 1.08], [0.5, 0.7]]), 0.5, 0.76, 0.16, { N: 16, nTop: 2.8, nBot: 2.6, rF: 0.1, rR: 0.08, M: 20 }));   // perisai kaki sempit
    o.trim.push(bodyLoft2(polyV([[-0.9, 0.8], [-0.88, 0.9], [0.0, 0.93], [0.12, 0.88], [0.12, 0.8]]), -0.9, 0.12, 0.15, { N: 20, nTop: 2.6, nBot: 3, rF: 0.05, rR: 0.05, M: 18 }));
    o.trim.push(bx(0.26, 0.3, 0.42, 0, 0.5, 0.05)); o.trim.push(cyZ(0.1, 0.34, 0, 0.62, 0.15)); o.paintPlain.push(bodyLoft2(polyV([[-0.05, 0.72], [0.0, 0.88], [0.45, 0.86], [0.5, 0.72]]), -0.05, 0.5, 0.13, { N: 12, nTop: 2.8, nBot: 3, rF: 0.15, rR: 0.15, M: 16 }));   // blok mesin + penutup tangki
    o.trim.push(bx(0.4, 0.04, 0.36, 0, 0.36, -0.3)); o.trim.push(bx(0.42, 0.1, 0.2, 0, 1.12, -0.6)); o.chrome.push(spE(0.12, 0.12, 0.08, 0, 1.02, -0.82)); o.head.push(spE(0.1, 0.1, 0.05, 0, 1.02, -0.86));
  } else {   // sport: kerucut fairing, tangki, ekor
    o.paintPlain.push(bodyLoft2(polyV([[0.35, 0.55], [0.7, 0.5], [0.98, 0.85], [0.8, 1.08], [0.45, 1.05], [0.35, 0.8]]), 0.35, 0.98, 0.2, { N: 20, nTop: 2.8, nBot: 2.6, rF: 0.25, rR: 0.1, M: 24 }));           // fairing depan
    o.paintPlain.push(bodyLoft2(polyV([[-0.25, 0.74], [-0.2, 1.06], [0.4, 1.08], [0.45, 0.8], [0.3, 0.74]]), -0.25, 0.45, 0.19, { N: 18, nTop: 2.6, nBot: 3, rF: 0.1, rR: 0.1, M: 22 }));                        // tangki
    o.paintPlain.push(bodyLoft2(polyV([[-1.0, 0.78], [-0.98, 0.95], [-0.5, 1.0], [-0.25, 0.9], [-0.25, 0.76]]), -1.0, -0.25, 0.14, { N: 18, nTop: 2.8, nBot: 3, rF: 0.08, rR: 0.15, wheelsX: [-0.55], wr: R, archK: 1.15, M: 20 })); // ekor
    o.trim.push(bodyLoft2(polyV([[-0.55, 0.88], [-0.52, 0.96], [-0.2, 1.0], [-0.12, 0.92], [-0.15, 0.86]]), -0.55, -0.12, 0.15, { N: 12, nTop: 2.6, nBot: 3, rF: 0.05, rR: 0.05, M: 16 }));
    o.trim.push(bx(0.34, 0.34, 0.5, 0, 0.52, -0.02)); o.trim.push(bx(0.4, 0.2, 0.3, 0, 0.62, -0.3)); o.head.push(spE(0.13, 0.08, 0.06, 0, 0.92, -0.95)); o.chrome.push(spE(0.15, 0.1, 0.04, 0, 0.92, -0.92)); o.trim.push(bx(0.44, 0.04, 0.4, 0, 0.36, -0.2));
  }
  [-1, 1].forEach(sd => {
    const top = sport ? 0.98 : 1.08, hbY = sport ? 1.0 : 1.12, hbZ = sport ? -0.5 : -0.55;
    o.chrome.push(cylBetween([sd * 0.08, top, -0.62], [sd * 0.08, 0.3, -0.72], 0.022)); o.chrome.push(cylBetween([sd * 0.2, 0.7, 0.4], [sd * 0.2, 0.3, 0.7], 0.022));
    o.chrome.push(cylBetween([sd * 0.25, hbY + 0.02, hbZ], [sd * 0.33, hbY + 0.26, hbZ + 0.05], 0.01)); o.paintPlain.push(spE(0.07, 0.045, 0.02, sd * 0.34, hbY + 0.28, hbZ + 0.05)); o.trim.push(bx(0.07, 0.06, 0.22, sd * 0.3, hbY + 0.01, hbZ));
    o.trim.push(bx(0.06, 0.04, 0.2, sd * 0.2, 0.34, 0.42));
  });
  o.chrome.push(cylBetween([0.17, 0.3, -0.1], [0.17, 0.4, 0.95], 0.045)); o.chrome.push(cylBetween([0.17, 0.38, 0.55], [0.17, 0.42, 1.0], style === 1 ? 0.06 : 0.072));
  const fe = new THREE.CylinderGeometry(R + 0.05, R + 0.05, 0.14, 18, 1, true, 0, Math.PI * 0.95); fe.rotateZ(Math.PI / 2); fe.translate(0, R, -0.72); o.paintPlain.push(fe);
  o.tail.push(bx(0.24, 0.08, 0.06, 0, 0.7, 1.0)); o.plate.push(bx(0.26, 0.1, 0.012, 0, 0.52, 1.03)); o.blinkL.push(bx(0.07, 0.05, 0.05, -0.17, 0.7, 1.0)); o.blinkR.push(bx(0.07, 0.05, 0.05, 0.17, 0.7, 1.0));
  o.chrome.push(cylBetween([-0.22, 0.9, 0.9], [0.22, 0.9, 0.9], 0.014));
  // pengendara (sport: membungkuk ke depan)
  const lean = sport ? 0.14 : 0; o.pants.push(spE(0.2, 0.12, 0.17, 0, 1.0, rz)); o.skin.push(cylBetween([0, 1.55 - lean, rz - 0.02 - lean], [0, 1.62 - lean, rz - 0.03 - lean], 0.05));
  [-1, 1].forEach(sd => {
    o.pants.push(cylBetween([sd * 0.13, 0.99, rz + 0.04], [sd * 0.16, sport ? 0.98 : 0.86, -0.18], 0.078)); o.pants.push(cylBetween([sd * 0.16, sport ? 0.98 : 0.86, -0.18], [sd * 0.18, sport ? 0.55 : 0.42, sport ? 0.1 : -0.3], 0.062)); o.trim.push(bx(0.1, 0.07, 0.24, sd * 0.18, sport ? 0.5 : 0.37, sport ? 0.08 : -0.34));
    o.jacket.push(cylBetween([sd * 0.27, 1.5 - lean, rz - 0.03 - lean], [sd * 0.31, sport ? 1.12 : 1.27, sport ? -0.35 : -0.04], 0.052)); o.jacket.push(cylBetween([sd * 0.31, sport ? 1.12 : 1.27, sport ? -0.35 : -0.04], [sd * 0.28, sport ? 1.0 : 1.12, sport ? -0.5 : -0.5], 0.046)); o.trim.push(spE(0.05, 0.05, 0.05, sd * 0.28, sport ? 1.0 : 1.12, -0.54));
  });
  o.jacket.push(spE(0.215, 0.31, 0.14, 0, 1.3 - lean * 0.8, rz - lean * 0.7)); o.jacket.push(spE(0.29, 0.085, 0.115, 0, 1.52 - lean, rz - 0.02 - lean));
  o.helmet.push(spE(0.155, 0.165, 0.18, 0, 1.74 - lean, rz - 0.04 - lean)); o.visor.push(spE(0.125, 0.07, 0.1, 0, 1.73 - lean, rz - 0.15 - lean));
  if (style === 3) { o.bag.push(bx(0.5, 0.46, 0.5, 0, 1.28, rz + 0.55)); o.trim.push(bx(0.54, 0.05, 0.54, 0, 1.03, rz + 0.55)); }
  else if (!passenger && !sport && RG() < 0.5) o.bag.push(bx(0.34, 0.36, 0.17, 0, 1.3, rz + 0.2));
  if (passenger) {
    const pz = 0.8; o.pants.push(spE(0.19, 0.11, 0.16, 0, 1.0, pz)); [-1, 1].forEach(sd => { o.pants.push(cylBetween([sd * 0.14, 0.99, pz + 0.02], [sd * 0.22, 0.72, 0.4], 0.07)); o.pants.push(cylBetween([sd * 0.22, 0.72, 0.4], [sd * 0.22, 0.46, 0.34], 0.055)); o.jacket2.push(cylBetween([sd * 0.25, 1.46, pz - 0.02], [sd * 0.2, 1.22, rz + 0.18], 0.05)); });
    o.jacket2.push(spE(0.2, 0.29, 0.13, 0, 1.28, pz)); o.jacket2.push(spE(0.27, 0.08, 0.11, 0, 1.49, pz - 0.02)); o.helmet2.push(spE(0.145, 0.155, 0.17, 0, 1.69, pz - 0.03)); o.visor.push(spE(0.115, 0.065, 0.09, 0, 1.68, pz - 0.14));
  }
  o.wheels.push({ x: 0, z: -0.72, front: true, side: 0, wf: 0.5 }); o.wheels.push({ x: 0, z: 0.55, front: false, side: 0, wf: 0.58 });
  o.R = R; o.L = 2.05; o.W = 0.8; return o;
}
// pemanasan di latar belakang: bangun semua varian satu per satu setelah game dimuat, supaya tidak tersendat saat pertama kali muncul di jalan
(function prewarmVehicles() {
  const q = [['sedan', 0], ['hatch', 0], ['suv', 0], ['mpv', 0], ['coupe', 0], ['taxi', 0], ['angkot', 0]]; for (const k in NVAR) for (let v = 0; v < NVAR[k]; v++) q.push([k, v]);
  (function step() { if (window.__noPrewarm) return; const it = q.shift(); if (!it) return; try { kindParts(it[0], false, it[1]); } catch (e) { console.warn('prewarm gagal', it, e); } setTimeout(step, 60); })();
})();
