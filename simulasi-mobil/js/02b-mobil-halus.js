'use strict';
// ======================= MOBIL: BADAN LENGKUNG (LOFT), CAT PBR, RODA DETAIL =======================
// Menggantikan carBody/wheelGeos/kindParts/makeCar dari 02-model-mobil.js (truk & bus tetap memakai badan lama tapi bermaterial PBR).
//  - Badan = permukaan yang dilengkungkan sepanjang mobil: tiap potongan melintang berbentuk superelips (bahu membulat), lebarnya mengecil di ujung,
//    lengkung roda benar-benar "dipotong" ke bodi. Kabin = loft terpisah dengan tumblehome (menyempit ke atas); jendela & tiang digambar lewat tekstur.
//  - Cat = MeshPhysicalMaterial (clearcoat) yang memantulkan peta lingkungan PMREM (langit, matahari, siluet kota) sesuai siang/senja/malam/cuaca.
const spow = (v, e) => (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e), smoothS = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function silhouetteAt(poly, x) {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) { if (Math.abs(b.x - a.x) < 1e-6) { lo = Math.min(lo, a.y, b.y); hi = Math.max(hi, a.y, b.y); } else { const y = a.y + (x - a.x) / (b.x - a.x) * (b.y - a.y); lo = Math.min(lo, y); hi = Math.max(hi, y); } } }
  return [lo, hi];
}
// loft: stasiun sepanjang x (maju = -z dunia), tiap stasiun satu cincin M titik (closed = penuh, kalau tidak busur t0..t1)
function loftGeo(sts, M, t0, t1, closed, ringFn) {
  const pos = [], uv = [], idx = [], S = sts.length, cols = closed ? M : M + 1;
  for (let i = 0; i < S; i++) for (let k = 0; k < cols; k++) { const th = t0 + (t1 - t0) * k / M, r = ringFn(sts[i], th); pos.push(r[0], r[1], -sts[i].x); uv.push(sts[i].u, k / M); }
  for (let i = 0; i < S - 1; i++) for (let k = 0; k < M; k++) { const k2 = closed ? (k + 1) % M : k + 1, a = i * cols + k, b = i * cols + k2, c = (i + 1) * cols + k2, d = (i + 1) * cols + k; idx.push(a, c, b, a, d, c); }
  const addCap = (i, flip) => { const ci = pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < cols; k++) { const p = (i * cols + k) * 3; cx += pos[p]; cy += pos[p + 1]; cz += pos[p + 2]; } pos.push(cx / cols, cy / cols, cz / cols); uv.push(sts[i].u, 0.5); for (let k = 0; k < M; k++) { const k2 = closed ? (k + 1) % M : k + 1, a = i * cols + k, b = i * cols + k2; if (flip) idx.push(ci, b, a); else idx.push(ci, a, b); } };
  if (closed) { addCap(0, true); addCap(S - 1, false); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const n = g.attributes.normal, p = g.attributes.position, mid = Math.floor(S / 2) * cols + Math.floor(M * (closed ? 0.25 : 0.5)), c0 = new THREE.Vector3(0, 0, 0);   // pastikan normal menghadap keluar (atas di tengah badan)
  if (n.getY(mid) < 0 && closed) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  if (closed) {   // arah tutup ujung dipaksa menghadap keluar (ujung belakang = +z dunia, depan = -z), terlepas dari belitan sisi
    const ci0 = S * cols, ci1 = ci0 + 1, P = g.attributes.position; let fixed = false;
    for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2], cap = (a === ci0 || b === ci0 || c === ci0) ? 1 : (a === ci1 || b === ci1 || c === ci1) ? -1 : 0; if (!cap) continue;
      const ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), uz = P.getZ(b) - P.getZ(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a), vz = P.getZ(c) - P.getZ(a), nz = ux * vy - uy * vx;
      if (nz * cap < 0) { idx[i + 1] = c; idx[i + 2] = b; fixed = true; } }
    if (fixed) { g.setIndex(idx); g.computeVertexNormals(); }
  }
  return g;
}
// ---- tekstur badan: garis sambungan pintu/kap/bagasi; tekstur kabin: kaca vs tiang/atap ----
function bodyMaps(p) {
  const { L, belt, cabF, cabR, hatch } = p, xR = -L / 2, W = 1024, H = 256, c = mkCanvas(W, H), x = c.getContext('2d'), cb = mkCanvas(W, H), xb = cb.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); xb.fillStyle = '#808080'; xb.fillRect(0, 0, W, H);
  const U = xp => (xp - xR) / L * W, Y = v => (1 - v) * H, bxs = (p.cabFT + p.cabRT) / 2;
  const segV = (a, b) => b <= 0 ? [[a + 1, b + 1]] : a >= 0 ? [[a, b]] : [[a + 1, 1], [0, b]];             // rentang v yang melewati v=0 dipecah (tekstur melingkar)
  const vline = (u, v0, v1) => { for (const [a0, b0] of [[v0, v1], [0.5 - v1, 0.5 - v0]]) for (const [a, b] of segV(a0, b0)) [[x, 'rgba(10,10,12,.78)', 2.2], [xb, '#303030', 3]].forEach(([cx, col, w]) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(u, Y(b)); cx.lineTo(u, Y(a)); cx.stroke(); }); };
  const hline = (u0, u1, v) => { for (const vv of [v, 0.5 - v]) { const y = Y(((vv % 1) + 1) % 1); [[x, 'rgba(10,10,12,.55)', 1.6], [xb, '#404040', 2.4]].forEach(([cx, col, w]) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(u0, y); cx.lineTo(u1, y); cx.stroke(); }); } };
  [cabF - 0.42, bxs - 0.08, cabR + 0.32].forEach(xp => vline(U(xp), -0.075, 0.1));                       // sambungan pintu (kanan & kiri)
  hline(U(cabR - 0.15), U(cabF + 0.1), 0.108); hline(U(cabR + 0.2), U(cabF - 0.2), -0.088);             // lipatan bahu & sill
  [cabF + 0.12, hatch ? cabR - 0.05 : cabR - 0.55].forEach(xp => { const u = U(xp); [[x, 'rgba(10,10,12,.7)', 2], [xb, '#303030', 3]].forEach(([cx, col, w]) => { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(u, Y(0.14)); cx.lineTo(u, Y(0.36)); cx.stroke(); }); });   // kap mesin & bagasi
  const body = mkTex(c), bump = mkTex(cb); body.anisotropy = bump.anisotropy = 8;
  // kabin
  const c2 = mkCanvas(W, H), x2 = c2.getContext('2d'), c3 = mkCanvas(W, H), x3 = c3.getContext('2d'), cl = p.cabR, cr = p.cabF, uc = xp => (xp - cl) / (cr - cl) * W;
  x2.fillStyle = '#fff'; x2.fillRect(0, 0, W, H); x3.fillStyle = 'rgb(96,96,96)'; x3.fillRect(0, 0, W, H);
  const glassRect = (xa, xb_, va, vb) => { for (const [a0, b0] of [[va, vb], [0.5 - vb, 0.5 - va]]) for (const [a, b] of segV(a0, b0)) { const ya = Y(b), yb_ = Y(a); [[x2, null], [x3, 'rgb(14,14,14)']].forEach(([cx, rough]) => { if (rough) cx.fillStyle = rough; else { const g = cx.createLinearGradient(0, ya, 0, yb_); g.addColorStop(0, '#2a3b4a'); g.addColorStop(0.5, '#10181f'); g.addColorStop(1, '#080c10'); cx.fillStyle = g; } cx.fillRect(uc(xa), ya, uc(xb_) - uc(xa), yb_ - ya); }); } };
  const bx_ = (p.cabFT + p.cabRT) / 2;
  glassRect(bx_ + 0.07, cr - 0.12, -0.2, 0.095); glassRect(cl + 0.14, bx_ - 0.07, -0.2, 0.095);       // kaca samping depan & belakang
  glassRect(p.cabFT + 0.02, cr + 0.01, 0.13, 0.37); glassRect(cl - 0.01, p.cabRT - 0.02, 0.13, 0.37);   // kaca depan & belakang (lintas atas)
  const cab = mkTex(c2), rough = mkTex(c3); cab.anisotropy = rough.anisotropy = 8;
  return { body, bump, cab, rough };
}
function carBody(p) {
  const { L, W, y0, belt, hoodF, roof, cabF, cabFT, cabRT, cabR, hatch, wr, sporty } = p, xF = L / 2, xR = -L / 2, o = { paintLow: [], paintRoof: [], paintPlain: [], glass: [], trim: [], chrome: [], head: [], tail: [], plate: [], blinkL: [], blinkR: [], wheels: [], accent: [], wood: [], soil: [] };
  const bedY = belt - 0.34, ops = p.bed ? [['m', xR + 0.05, y0], ['l', xR, y0 + 0.2], ['l', xR, bedY], ['l', cabR - 0.05, bedY]] : [['m', xR + 0.05, y0], ['l', xR, y0 + 0.22], ['q', xR - 0.03, belt - 0.12, xR + 0.1, belt - 0.05]]; if (!hatch && !p.bed) ops.push(['l', cabR - 0.5, belt - 0.02]);
  ops.push(['l', cabR, belt], ['l', cabF - 0.35, belt], ['q', cabF + 0.15, belt + 0.01, cabF + 0.55, hoodF + 0.1], ['l', xF - 0.18, hoodF], ['q', xF, hoodF - 0.04, xF, hoodF - 0.24], ['l', xF - 0.03, y0 + 0.12], ['q', xF - 0.06, y0, xF - 0.22, y0], ['l', xR + 0.05, y0]);
  const poly = shapeFrom(ops).getPoints(18), wheelsX = [xF - (p.fw || 0.9), xR + (p.rw || 0.92)], sts = [], N = 96;
  for (let i = 0; i <= N; i++) {
    const x = xR + 0.012 + (L - 0.024) * (0.5 - 0.5 * Math.cos(Math.PI * i / N)), sl = silhouetteAt(poly, x); if (!(sl[1] > sl[0])) continue; let yb = sl[0];
    for (const wx of wheelsX) { const dx = x - wx, ra = wr * 1.2; if (Math.abs(dx) < ra) yb = Math.max(yb, wr + Math.sqrt(ra * ra - dx * dx) * 0.96); }
    yb = Math.min(yb, sl[1] - 0.1); const d = L / 2 - Math.abs(x); let f = 1 - 0.065 * Math.pow(clamp(1 - d / (L * 0.28), 0, 1), 2), re = 0.15;
    if (d < re) f *= 0.12 + 0.88 * Math.sqrt(Math.max(0, 1 - Math.pow((re - d) / re, 2))); for (const wx of wheelsX) f *= 1 + 0.028 * Math.exp(-Math.pow((x - wx) / 0.65, 2));
    sts.push({ x, yb, yt: sl[1], a: W / 2 * f * 0.995, u: (x - xR) / L });
  }
  o.paintLow.push(loftGeo(sts, 36, 0, Math.PI * 2, true, (st, th) => { const c = Math.cos(th), s = Math.sin(th), n = s >= 0 ? 4.6 : 3.4, cy = (st.yb + st.yt) / 2, b = (st.yt - st.yb) / 2; return [st.a * spow(c, 2 / n), cy + b * spow(s, 2 / n)]; }));
  // kabin (greenhouse) dengan tumblehome
  const top = [[cabR, belt - 0.02], [cabRT, roof - 0.03], [cabFT, roof - 0.03], [cabF, belt - 0.02]], topAt = x => { for (let i = 0; i < 3; i++) if (x >= top[i][0] && x <= top[i + 1][0]) return lerp(top[i][1], top[i + 1][1], (x - top[i][0]) / (top[i + 1][0] - top[i][0])); return belt; };
  const cst = [], CN = 64; let ys = []; for (let i = 0; i <= CN; i++) ys.push(topAt(cabR + (cabF - cabR) * i / CN));
  for (let pass = 0; pass < 4; pass++) ys = ys.map((v, i) => (ys[Math.max(0, i - 1)] + v * 2 + ys[Math.min(CN, i + 1)]) / 4);   // bulatkan sudut atap
  for (let i = 0; i <= CN; i++) { const x = cabR + (cabF - cabR) * i / CN; cst.push({ x, yb: belt - 0.07, yt: Math.max(belt - 0.01, ys[i]), u: i / CN }); }
  const ab = W * 0.425, at = W * 0.325;
  const cabin = loftGeo(cst, 36, 0, Math.PI * 2, true, (st, th) => { const c = Math.cos(th), s = Math.sin(th), n = 3.2, cy = (st.yb + st.yt) / 2, b = (st.yt - st.yb) / 2, y = cy + b * spow(s, 2 / n), a = lerp(ab, at, clamp((y - st.yb) / Math.max(0.01, st.yt - st.yb), 0, 1)); return [a * spow(c, 2 / n), y]; });
  o.paintRoof.push(cabin);
  const lat = W * 0.43 - 0.02, bxs = (cabFT + cabRT) / 2;
  [-1, 1].forEach(sd => {
    [bxs + 0.4, cabR + 0.62].forEach(xs => o.chrome.push(bx(0.022, 0.026, 0.16, sd * (W / 2 - 0.008), belt - 0.1, -xs)));                                         // gagang pintu
    o.paintPlain.push(spE(0.07, 0.055, 0.1, sd * (W / 2 + 0.1), belt + 0.08, -(cabF - 0.05))); o.trim.push(bx(0.12, 0.02, 0.05, sd * (W / 2 + 0.04), belt + 0.05, -(cabF - 0.05)));   // spion
    o.head.push(bx(0.3, 0.1, 0.08, sd * W * 0.285, hoodF - 0.18, -(xF - 0.1))); o.chrome.push(bx(0.33, 0.014, 0.09, sd * W * 0.285, hoodF - 0.125, -(xF - 0.1)));
    o.chrome.push(spE(0.04, 0.04, 0.03, sd * W * 0.31, y0 + 0.2, -(xF - 0.05)));
    o.tail.push(bx(0.36, 0.11, 0.08, sd * W * 0.3, belt - 0.14, -(xR + 0.09))); (sd < 0 ? o.blinkL : o.blinkR).push(bx(0.13, 0.07, 0.08, sd * W * 0.43, belt - 0.27, -(xR + 0.07)));
    o.chrome.push(cyZ(0.042, 0.14, sd * W * 0.28, y0 + 0.08, -(xR - 0.04)));
    wheelsX.forEach((wx, wi) => { o.wheels.push({ x: sd * (W / 2 - 0.1), z: -wx, front: wi === 0, side: sd }); const liner = new THREE.CylinderGeometry(wr * 1.17, wr * 1.17, W * 0.34, 20, 1, true, 0, Math.PI); liner.rotateZ(Math.PI / 2); liner.translate(sd * (W / 2 - 0.22), wr, -wx); o.trim.push(liner); });   // liner roda (setengah atas)
  });
  o.trim.push(bx(W * 0.46, 0.13, 0.04, 0, hoodF - 0.3, -(xF - 0.02))); for (let i = 0; i < 3; i++) o.chrome.push(bx(W * 0.46, 0.012, 0.044, 0, hoodF - 0.35 + i * 0.045, -(xF - 0.015)));
  o.trim.push(bx(W * 0.6, 0.1, 0.04, 0, y0 + 0.2, -(xF - 0.04))); o.trim.push(bx(W * 0.78, 0.08, L * 0.78, 0, y0 + 0.02, 0));
  o.tail.push(bx(W * 0.46, 0.03, 0.06, 0, belt - 0.14, -(xR + 0.04))); o.chrome.push(spE(0.05, 0.05, 0.02, 0, hoodF - 0.3, -(xF + 0.0)));
  o.plate.push(bx(0.5, 0.11, 0.012, 0, y0 + 0.17, -(xF + 0.0))); o.plate.push(bx(0.5, 0.11, 0.012, 0, belt - 0.38, -(xR - 0.0)));
  o.trim.push(cyY(0.008, 0.32, 0, roof + 0.16, -(cabRT + 0.25)));
  if (sporty) { o.paintPlain.push(bx(W * 0.82, 0.04, 0.3, 0, belt + 0.12, -(xR + 0.28))); [-1, 1].forEach(sd => { o.trim.push(bx(0.05, 0.2, 0.1, sd * W * 0.32, belt + 0.02, -(xR + 0.3))); o.trim.push(bx(0.1, 0.06, L * 0.5, sd * (W / 2 + 0.01), y0 + 0.08, 0)); }); }
  const bxm = -(cabFT + cabRT) / 2;
  if (p.bed) {   // bak pickup terbuka: dinding, pintu belakang, sekat + muatan (load 1 = peti & terpal, 2 = karung)
    const bl = cabR - 0.05 - xR, xc = -(xR + cabR - 0.05) / 2; [-1, 1].forEach(sd => o.paintPlain.push(bx(0.07, 0.34, bl, sd * (W / 2 - 0.05), bedY + 0.17, xc))); o.paintPlain.push(bx(W - 0.08, 0.34, 0.07, 0, bedY + 0.17, -(xR + 0.04))); o.paintPlain.push(bx(W - 0.08, 0.44, 0.07, 0, bedY + 0.22, -(cabR - 0.1)));
    if (p.load === 1) { [[-0.42, 0.7], [0.42, 0.7], [0, 1.5]].forEach(([lx, lz]) => o.wood.push(bx(0.8, 0.5, 0.75, lx, bedY + 0.3, -(xR + lz)))); o.trim.push(bx(1.5, 0.12, 1.3, 0, bedY + 0.62, -(xR + 1.55))); }
    else if (p.load === 2) { for (let k = 0; k < 6; k++) o.soil.push(bx(0.55, 0.3, 0.8, ((k % 2) - 0.5) * 0.6, bedY + 0.2 + (k > 3 ? 0.28 : 0), -(xR + 0.6 + (k >> 1) * 0.55))); }
  }
  if (p.sign) { o.head.push(bx(0.55, 0.17, 0.24, 0, roof + 0.12, bxm)); o.trim.push(bx(0.2, 0.06, 0.12, 0, roof + 0.03, bxm)); }
  if (p.accent) { [-1, 1].forEach(sd => o.accent.push(bx(0.012, 0.15, L * 0.72, sd * (W / 2 * 0.985), belt - 0.46, 0))); o.accent.push(bx(W * 0.62, 0.03, 0.06, 0, belt + 0.02, -(xF - 0.05))); o.trim.push(bx(W * 0.7, 0.04, (cabFT - cabRT) * 0.85, 0, roof + 0.05, bxm)); }
  o.roofY = roof; o.base = p.base || null;
  o.R = wr; o.L = L; o.W = W; o.maps = bodyMaps(p); return o;
}
const CAR_TYPES = {
  sedan: { L: 4.5, W: 1.8, y0: 0.31, belt: 1.03, hoodF: 0.84, roof: 1.57, cabF: 0.98, cabFT: 0.34, cabRT: -0.72, cabR: -1.2, hatch: false, wr: 0.33 },
  hatch: { L: 3.9, W: 1.75, y0: 0.31, belt: 1.02, hoodF: 0.84, roof: 1.6, cabF: 0.78, cabFT: 0.2, cabRT: -1.45, cabR: -1.82, hatch: true, wr: 0.31 },
  suv: { L: 4.7, W: 1.95, y0: 0.42, belt: 1.2, hoodF: 1.03, roof: 1.86, cabF: 1.05, cabFT: 0.5, cabRT: -1.75, cabR: -2.1, hatch: true, wr: 0.38 },
  mpv: { L: 4.45, W: 1.76, y0: 0.32, belt: 1.05, hoodF: 0.9, roof: 1.72, cabF: 1.15, cabFT: 0.55, cabRT: -1.5, cabR: -1.95, hatch: true, wr: 0.33, fw: 0.95, rw: 0.85 },
  coupe: { L: 4.3, W: 1.85, y0: 0.25, belt: 0.9, hoodF: 0.72, roof: 1.3, cabF: 0.7, cabFT: 0.2, cabRT: -0.6, cabR: -1.05, hatch: false, wr: 0.33, sporty: true },
  pickup: { L: 5.2, W: 1.85, y0: 0.4, belt: 1.18, hoodF: 1.0, roof: 1.78, cabF: 1.2, cabFT: 0.65, cabRT: -0.15, cabR: -0.45, bed: true, hatch: true, wr: 0.37, fw: 1.0, rw: 0.9 },
  taxi: { L: 4.5, W: 1.8, y0: 0.31, belt: 1.03, hoodF: 0.84, roof: 1.57, cabF: 0.98, cabFT: 0.34, cabRT: -0.72, cabR: -1.2, hatch: false, wr: 0.33, sign: true, base: [0x2a6ae0, 0xf2d21c, 0xf4f4f6] },
  angkot: { L: 4.2, W: 1.72, y0: 0.35, belt: 1.18, hoodF: 0.98, roof: 1.98, cabF: 1.0, cabFT: 0.65, cabRT: -1.7, cabR: -1.95, hatch: true, wr: 0.34, fw: 0.85, rw: 0.8, accent: true, sign: true, base: [0x1a8a4a, 0xe87a1e, 0x2a6ae0, 0xd8222a, 0xf2d21c, 0x7a3a9a] }
};
function kindParts(kind, sporty, v = 0) {
  const key = kind + (sporty ? 'S' : '') + '#' + v; if (KIND_CACHE[key]) return KIND_CACHE[key]; let o;
  if (CAR_TYPES[kind]) o = carBody(Object.assign({}, CAR_TYPES[kind], { sporty: kind === 'sedan' ? sporty : CAR_TYPES[kind].sporty, load: v }));
  else if (kind === 'truck') o = truckBody(v, false); else if (kind === 'truckm') o = truckBody(v, true); else if (kind === 'bus' || kind === 'minibus' || kind === 'busdd') o = busBody(v, kind);
  else o = motorBody(kind === 'motor2' ? (v ? 1 : 0) : v, kind === 'motor2');
  const g = {}; for (const k of ['paintLow', 'paintRoof', 'paintPlain', 'glass', 'trim', 'chrome', 'head', 'tail', 'plate', 'blinkL', 'blinkR', 'cargo', 'accent', 'tank', 'bed', 'wood', 'soil', 'jacket', 'jacket2', 'pants', 'helmet', 'helmet2', 'visor', 'skin', 'bag']) g[k] = o[k] && o[k].length ? mergeGeos(o[k]) : null;
  // LOD jauh: seluruh bodi → 1 mesh bercat + 1 mesh gelap (bumper, kaca, roda sederhana) = 2 draw call alih-alih ±25
  { const P = [].concat(o.paintLow || [], o.paintRoof || [], o.paintPlain || [], o.bed || [], o.accent || [], o.cargo || []), D = [].concat(o.trim || [], o.glass || [], o.tank || [], o.wood || []); (o.wheels || []).forEach(w => D.push(cyX(o.R, o.R * 0.5, w.x, o.R, w.z)));
    g.lodPaint = P.length ? mergeGeos(P) : null; g.lodDark = D.length ? mergeGeos(D) : null; }
  return (KIND_CACHE[key] = { g, wheels: o.wheels, R: o.R, L: o.L, W: o.W, maps: o.maps || null, zone: o.zone || null, cargoPal: o.cargoPal || null, over: o.over || null, base: o.base || null, roofY: o.roofY || 0 });
}

// ---------------- material PBR ----------------
let carEnvPM = null, carPMREM = null, carEnvRT = null; const ENVM = [];
const envMat = (m, i) => { m.envMapIntensity = i == null ? 1 : i; ENVM.push(m); if (carEnvPM) m.envMap = carEnvPM; return m; };
const PB = {
  glass: envMat(new THREE.MeshStandardMaterial({ color: 0x070d14, metalness: 0.95, roughness: 0.06 }), 1.2),
  trim: new THREE.MeshStandardMaterial({ color: 0x131419, roughness: 0.6, metalness: 0.15 }),
  chrome: envMat(new THREE.MeshStandardMaterial({ color: 0xe4e8ee, metalness: 1, roughness: 0.07 }), 1.3),
  head: envMat(new THREE.MeshStandardMaterial({ color: 0xe9e4d2, emissive: 0xfff0c0, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.08 }), 1),
  rim: envMat(new THREE.MeshStandardMaterial({ color: 0xc9ced8, metalness: 1, roughness: 0.16 }), 1.2),
  disc: new THREE.MeshStandardMaterial({ color: 0x4c4f55, metalness: 0.8, roughness: 0.5 })
};
const tireTex = (() => {
  const c = mkCanvas(64, 256), x = c.getContext('2d'); x.fillStyle = '#18181b'; x.fillRect(0, 0, 64, 256);
  x.fillStyle = '#26262b'; x.fillRect(0, 0, 64, 70); x.fillRect(0, 186, 64, 70);                                             // dinding samping
  for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, 84 + k * 30, 64, 4); }                          // alur memanjang
  x.fillStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 14; i++) { x.save(); x.translate(i * 4.6, 128); x.rotate(0.5); x.fillRect(0, -40, 1.6, 80); x.restore(); }   // sipe tapak
  x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(0, 40, 64, 2); x.fillRect(0, 214, 64, 2); x.fillRect(0, 22, 64, 1); x.fillRect(0, 234, 64, 1);
  const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); return t;
})();
const tireMatPB = new THREE.MeshStandardMaterial({ map: tireTex, bumpMap: tireTex, bumpScale: 1.1, roughness: 0.93, metalness: 0 });
const paintCache = {};
function paintBase(hex, hq) { const k = hex + '|' + (hq ? 1 : 0); return paintCache[k] || (paintCache[k] = envMat(new THREE.MeshPhysicalMaterial({ color: hex, metalness: 0.5, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.05 }), 1.15)); }
function bodyPaintMat(hex, maps) { const k = hex + '|b' + maps.body.id; return paintCache[k] || (paintCache[k] = envMat(new THREE.MeshPhysicalMaterial({ color: hex, map: maps.body, bumpMap: maps.bump, bumpScale: 0.22, metalness: 0.5, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide }), 1.15)); }
function cabinPaintMat(hex, maps) { const k = hex + '|c' + maps.cab.id; return paintCache[k] || (paintCache[k] = envMat(new THREE.MeshPhysicalMaterial({ color: hex, map: maps.cab, roughnessMap: maps.rough, metalness: 0.5, roughness: 1, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide }), 1.25)); }
// ---------------- roda detail ----------------
const wheelCache2 = {};
function wheelGeos(R, side, wf = 1) {
  const key = R + '|' + side + '|' + wf; if (wheelCache2[key]) return wheelCache2[key]; const Wd = R * 0.66 * wf, s = side;
  const prof = [[R * 0.58, -Wd / 2], [R * 0.7, -Wd / 2 - 0.004], [R * 0.86, -Wd * 0.5], [R * 0.95, -Wd * 0.46], [R * 0.99, -Wd * 0.34], [R, -Wd * 0.16], [R, Wd * 0.16], [R * 0.99, Wd * 0.34], [R * 0.95, Wd * 0.46], [R * 0.86, Wd * 0.5], [R * 0.7, Wd / 2 + 0.004], [R * 0.58, Wd / 2]].map(p => new THREE.Vector2(p[0], p[1]));
  const tire = new THREE.LatheGeometry(prof, 44); tire.rotateZ(Math.PI / 2);
  const rim = [new THREE.TorusGeometry(R * 0.6, R * 0.035, 8, 32).rotateY(Math.PI / 2).translate(s * Wd * 0.46, 0, 0), cyX(R * 0.58, 0.03, s * Wd * 0.34, 0, 0), cyX(R * 0.2, 0.045, s * Wd * 0.47, 0, 0)];
  for (let k = 0; k < 10; k++) { const a = k * Math.PI * 2 / 10; rim.push(place(BOXG, s * Wd * 0.44, Math.cos(a) * R * 0.36, Math.sin(a) * R * 0.36, a, 0, 0, Wd * 0.07, R * 0.5, R * 0.065)); }
  for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 + 0.3; rim.push(place(CYLG, s * Wd * 0.5, Math.cos(a) * R * 0.11, Math.sin(a) * R * 0.11, 0, 0, Math.PI / 2, R * 0.022, 0.02, R * 0.022)); }   // baut roda
  const disc = [cyX(R * 0.5, 0.025, s * Wd * 0.12, 0, 0)];
  return (wheelCache2[key] = { tire, rim: mergeGeos(rim), disc: mergeGeos(disc) });
}
const lodMatC = {}, lodMat = hex => lodMatC[hex] || (lodMatC[hex] = envMat(new THREE.MeshStandardMaterial({ color: hex, metalness: 0.4, roughness: 0.4 }), 0.9)), lodDarkMat = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.7 });
const LOD_DIST = 60;
function setCarLod(c, far) { if (!c.lod || far === c.lodOn) return; c.lodOn = far; c.detail.visible = !far; c.lod.visible = far; }
function makeCar(kind, colorHex, hq, v = 0) {
  const K = kindParts(kind, hq, v), G = K.g, grp = new THREE.Group(), tailM = new THREE.MeshStandardMaterial({ color: 0x661010, emissive: 0xff1a1a, emissiveIntensity: 0.4, roughness: 0.25 });
  const detail = new THREE.Group(); grp.add(detail);   // semua mesh detail di sini agar bisa disembunyikan sekaligus saat jauh (LOD)
  const mk = (geo, mat) => { if (!geo) return null; const m = new THREE.Mesh(geo, mat); detail.add(m); return m; };
  if (K.base) colorHex = pick(K.base);   // warna dasar khusus jenis (taksi, angkot, livery bus)
  const flat = paintBase(colorHex, hq); let paintLow, paintRoof, glass = null, paintPlain = null;
  if (K.maps) { paintLow = mk(G.paintLow, bodyPaintMat(colorHex, K.maps)); paintRoof = mk(G.paintRoof, cabinPaintMat(colorHex, K.maps)); paintPlain = mk(G.paintPlain, flat); }
  else if (K.zone) { const zm = zonePaintMat(colorHex, K.zone); paintLow = mk(G.paintLow, zm); paintRoof = mk(G.paintRoof, zm); paintPlain = mk(G.paintPlain, flat); glass = mk(G.glass, PB.glass); }   // truk & bus: badan lengkung + jendela bertekstur
  else { paintLow = mk(G.paintLow, flat); paintRoof = mk(G.paintRoof, flat); paintPlain = mk(G.paintPlain, flat); glass = mk(G.glass, PB.glass); }
  mk(G.trim, PB.trim); mk(G.chrome, PB.chrome); mk(G.head, PB.head); mk(G.tail, tailM); mk(G.plate, pick(plateMats));
  let cargoM = null; if (G.cargo) cargoM = mk(G.cargo, new THREE.MeshPhysicalMaterial({ map: cargoTex, bumpMap: cargoTex, bumpScale: 0.5, color: pick(K.cargoPal || [0xf2f2f6, 0xdad2c2, 0xc4d6ea, 0xe6c8c0, 0xd8e4d0]), roughness: 0.5, metalness: 0.15, clearcoat: 0.4 }));
  ['accent', 'tank', 'bed', 'wood', 'soil', 'jacket', 'jacket2', 'pants', 'helmet', 'helmet2', 'visor', 'skin', 'bag'].forEach(r => { if (G[r]) { const m = mk(G[r], roleMat(r, K.over)); m.castShadow = true; } });   // muatan, aksen, pengendara motor   // pengendara motor
  const blinkers = []; [['blinkL', -1], ['blinkR', 1]].forEach(([k, sd]) => { if (!G[k]) return; const m = new THREE.Mesh(G[k], new THREE.MeshStandardMaterial({ color: 0x664400, emissive: 0xffaa00, emissiveIntensity: 0 })); m.userData.side = sd; detail.add(m); blinkers.push(m); });
  const wheels = [], R = K.R;
  K.wheels.forEach(w => { const root = new THREE.Group(); root.position.set(w.x, R, w.z); const yaw = new THREE.Group(), spin = new THREE.Group(); root.add(yaw); yaw.add(spin); const wg = wheelGeos(R, w.side || 1, w.wf || 1); spin.add(new THREE.Mesh(wg.tire, tireMatPB)); spin.add(new THREE.Mesh(wg.rim, PB.rim)); spin.add(new THREE.Mesh(wg.disc, PB.disc)); if (w.side === 0) spin.add(new THREE.Mesh(wheelGeos(R, -1, w.wf || 1).rim, PB.rim)); detail.add(root); wheels.push({ piv: spin, yaw, r: R, front: w.front }); });
  [paintLow, paintRoof, paintPlain, cargoM].forEach(m => { if (m) m.castShadow = true; }); grp.traverse(m => { if (m.isMesh && m.geometry && m.geometry.type === 'LatheGeometry') m.castShadow = true; });
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), blobMat); blob.rotation.x = -Math.PI / 2; blob.scale.set(K.W * 1.5, K.L * 1.12, 1); blob.position.y = 0.01; grp.add(blob);
  const lod = new THREE.Group(); lod.visible = false; if (G.lodPaint) lod.add(new THREE.Mesh(G.lodPaint, lodMat(colorHex))); if (G.lodDark) lod.add(new THREE.Mesh(G.lodDark, lodDarkMat)); grp.add(lod);
  return { g: grp, kind, wheels, tailM, blinkers, paintLow, paintRoof, paintPlain, paintFlat: flat, glass, w: K.W, l: K.L, roofY: K.roofY, detail, lod, lodOn: false };
}
// ---------------- peta lingkungan PMREM: langit + matahari + siluet kota + tanah, mengikuti siang/senja/malam/cuaca ----------------
function updateCarEnv(E) {
  try {
    if (!carPMREM) carPMREM = new THREE.PMREMGenerator(renderer);
    const es = new THREE.Scene(), sg = new THREE.SphereGeometry(60, 32, 20), sp = sg.attributes.position, cols = new Float32Array(sp.count * 3), cT = skyMat.uniforms.top.value, cM = skyMat.uniforms.mid.value, cB = skyMat.uniforms.bot.value, cc = new THREE.Color();
    for (let i = 0; i < sp.count; i++) { const y = Math.max(0, sp.getY(i) / 60); cc.copy(cB).lerp(cM, smoothS(0, 0.3, y)).lerp(cT, smoothS(0.25, 0.9, y)); cols.set([cc.r, cc.g, cc.b], i * 3); }   // gradasi langit yang sama dengan shader langit
    sg.setAttribute('color', new THREE.BufferAttribute(cols, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));   // MeshBasic (bukan ShaderMaterial) agar ter-encode benar oleh PMREM
    const night = E.night > 0.9, W = WX ? WX() : { dark: 0 }, gnd = new THREE.Color(night ? 0x0b0d16 : 0x58604e).lerp(new THREE.Color(0x40444a), clamp(W.dark * 2, 0, 0.7)), gm = new THREE.Mesh(new THREE.CircleGeometry(58, 28), new THREE.MeshBasicMaterial({ color: gnd })); gm.rotation.x = -Math.PI / 2; gm.position.y = -0.8; es.add(gm);
    for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283, h = 4 + ((i * 7) % 11) * 1.4, b = new THREE.Mesh(new THREE.BoxGeometry(5 + (i % 3) * 2, h, 5), new THREE.MeshBasicMaterial({ color: night ? 0x151a2c : new THREE.Color(0x6c7684).lerp(new THREE.Color(E.fog), 0.35) })); b.position.set(Math.cos(a) * 40, h / 2 - 0.8, Math.sin(a) * 40); es.add(b); }
    if (!(W.rain || W.mist)) { const sc = new THREE.Color(E.sun[0]).multiplyScalar(night ? 2.5 : 16), sm = new THREE.Mesh(new THREE.SphereGeometry(night ? 2 : 3.4, 12, 8), new THREE.MeshBasicMaterial({ color: sc })); sm.position.set(-17, 33, 12).multiplyScalar(1.15); es.add(sm); }
    const rt = carPMREM.fromScene(es, 0.015); if (carEnvRT) carEnvRT.dispose(); carEnvRT = rt; carEnvPM = rt.texture;
    es.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    ENVM.forEach(m => { m.envMap = carEnvPM; m.needsUpdate = true; }); PB.head.emissiveIntensity = E.night > 0.2 ? 2.4 : 0.25; if (typeof applyBuildingEnv === 'function') applyBuildingEnv(E);
  } catch (e) { console.warn('PMREM gagal, pantulan dimatikan', e); }
}
for (const k in KIND_CACHE) delete KIND_CACHE[k];
updateCarEnv(ENVS[settings.env % ENVS.length]); buildPlayer();
