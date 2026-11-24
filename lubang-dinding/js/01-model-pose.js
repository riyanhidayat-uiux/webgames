'use strict';
// ======================= MODEL POSE =======================
// satuan: 1 = lebar bahu; titik asal = tengah bahu; x kanan(+) di layar cermin, y atas(+)
const LEN = { arm1: 0.75, arm2: 0.62, hand: 0.24, torso: 1.25, hipW: 0.7, thigh: 1.1, shin: 1.05, head: 0.58 };
const rad2 = d => d * Math.PI / 180;
const dirArm = (side, a) => side < 0 ? { x: -Math.sin(rad2(a)), y: -Math.cos(rad2(a)) } : { x: Math.sin(rad2(a)), y: -Math.cos(rad2(a)) };   // a: 0 = ke bawah, 90 = mendatar keluar, 180 = ke atas
function buildPose(spec, k) {
  const L1 = LEN.arm1 * k.arm, L2 = LEN.arm2 * k.arm, T = LEN.torso * k.torso, lean = rad2(spec.lean || 0);
  const ax = { x: Math.cos(lean), y: -Math.sin(lean) }, up = { x: Math.sin(lean), y: Math.cos(lean) };
  const J = { c: { x: 0, y: 0 } };
  J.sL = { x: -0.5 * ax.x, y: -0.5 * ax.y }; J.sR = { x: 0.5 * ax.x, y: 0.5 * ax.y };
  J.nose = { x: up.x * LEN.head, y: up.y * LEN.head };
  const hc = { x: -up.x * T, y: -up.y * T };
  J.hL = { x: hc.x - LEN.hipW / 2 * ax.x, y: hc.y - LEN.hipW / 2 * ax.y }; J.hR = { x: hc.x + LEN.hipW / 2 * ax.x, y: hc.y + LEN.hipW / 2 * ax.y };
  const arm = (side, s, a1, a2) => {
    const d1 = dirArm(side, a1), d2 = dirArm(side, a2), e = { x: s.x + d1.x * L1, y: s.y + d1.y * L1 }, w = { x: e.x + d2.x * L2, y: e.y + d2.y * L2 };
    return { e, w, h: { x: w.x + d2.x * LEN.hand, y: w.y + d2.y * LEN.hand } };
  };
  const aL = arm(-1, J.sL, spec.a[0], spec.a[1]), aR = arm(1, J.sR, spec.a[2], spec.a[3]);
  J.eL = aL.e; J.wL = aL.w; J.hdL = aL.h; J.eR = aR.e; J.wR = aR.w; J.hdR = aR.h;
  const sp = rad2(spec.leg || 0), TH = LEN.thigh * (k.leg || 1), SH = LEN.shin * (k.leg || 1);
  const lg = spec.legs;                                                                            // sudut kaki per ruas, sama seperti lengan
  const leg = (side, h) => { if (lg) { const o = side < 0 ? 0 : 2, d1 = dirArm(side, lg[o]), d2 = dirArm(side, lg[o + 1]), kn = { x: h.x + d1.x * TH, y: h.y + d1.y * TH }; return { kn, an: { x: kn.x + d2.x * SH, y: kn.y + d2.y * SH } }; } const d = { x: side * Math.sin(sp), y: -Math.cos(sp) }, kn = { x: h.x + d.x * TH, y: h.y + d.y * TH }; return { kn, an: { x: kn.x + d.x * SH, y: kn.y + d.y * SH } }; };
  const lL = leg(-1, J.hL), lR = leg(1, J.hR);
  J.kL = lL.kn; J.aL = lL.an; J.kR = lR.kn; J.aR = lR.an;
  return J;
}
const POSES = [
  { id: 'tegak', name: 'TEGAK', tier: 1, spec: { a: [8, 8, 8, 8] } },
  { id: 't', name: 'T', tier: 1, spec: { a: [90, 90, 90, 90] } },
  { id: 'y', name: 'Y', tier: 1, spec: { a: [145, 145, 145, 145] } },
  { id: 'hore', name: 'HORE!', tier: 1, spec: { a: [175, 175, 175, 175] } },
  { id: 'kiriatas', name: 'KIRI ATAS', tier: 2, spec: { a: [175, 175, 8, 8] } },
  { id: 'kananatas', name: 'KANAN ATAS', tier: 2, spec: { a: [8, 8, 175, 175] } },
  { id: 'pinggang', name: 'PINGGANG', tier: 2, spec: { a: [50, -50, 50, -50] } },
  { id: 'otot', name: 'OTOT', tier: 2, spec: { a: [90, 180, 90, 180] } },
  { id: 'kepala', name: 'DI KEPALA', tier: 2, spec: { a: [100, -150, 100, -150] } },
  { id: 'silang', name: 'SILANG', tier: 3, spec: { a: [40, -115, 40, -115] } },
  { id: 'mirkiri', name: 'MIRING KIRI', tier: 3, spec: { a: [8, 8, 160, 160], lean: -24 } },
  { id: 'mirkanan', name: 'MIRING KANAN', tier: 3, spec: { a: [160, 160, 8, 8], lean: 24 } },
  { id: 'bintang', name: 'BINTANG', tier: 3, spec: { a: [140, 140, 140, 140], leg: 18 } },
  // ---- konten tambahan ----
  { id: 'tkiri', name: 'T KIRI', tier: 2, spec: { a: [90, 90, 8, 8] } },
  { id: 'tkanan', name: 'T KANAN', tier: 2, spec: { a: [8, 8, 90, 90] } },
  { id: 'diagkiri', name: 'DIAGONAL KIRI', tier: 2, spec: { a: [150, 150, 40, 40] } },
  { id: 'diagkanan', name: 'DIAGONAL KANAN', tier: 2, spec: { a: [40, 40, 150, 150] } },
  { id: 'zigkiri', name: 'ZIGZAG KIRI', tier: 3, spec: { a: [175, 175, 90, 90] } },
  { id: 'zigkanan', name: 'ZIGZAG KANAN', tier: 3, spec: { a: [90, 90, 175, 175] } },
  { id: 'kuda', name: 'KUDA-KUDA', tier: 3, spec: { a: [90, 90, 90, 90], leg: 24 } },
  { id: 'hurufa', name: 'HURUF A', tier: 3, spec: { a: [40, 40, 40, 40], leg: 20 } },
  { id: 'pesawatkiri', name: 'PESAWAT KIRI', tier: 3, spec: { a: [90, 90, 90, 90], lean: -24 } },
  { id: 'pesawatkanan', name: 'PESAWAT KANAN', tier: 3, spec: { a: [90, 90, 90, 90], lean: 24 } },
  { id: 'horekiri', name: 'HORE MIRING KIRI', tier: 4, spec: { a: [175, 175, 175, 175], lean: -24 } },
  { id: 'horekanan', name: 'HORE MIRING KANAN', tier: 4, spec: { a: [175, 175, 175, 175], lean: 24 } },
  { id: 'bintanglebar', name: 'BINTANG LEBAR', tier: 4, spec: { a: [155, 155, 155, 155], leg: 30 } },
  { id: 'zigkuda', name: 'ZIGZAG KUDA-KUDA', tier: 4, spec: { a: [175, 175, 90, 90], leg: 22 } },
  { id: 'silangkuda', name: 'SILANG KUDA-KUDA', tier: 4, spec: { a: [40, -115, 40, -115], leg: 20 } },
  // ---- pose kaki (lutut ditekuk / satu kaki): sudut kaki = [paha kiri, betis kiri, paha kanan, betis kanan] ----
  { id: 'sumo', name: 'SUMO', tier: 2, spec: { a: [50, -50, 50, -50], legs: [55, 0, 55, 0] } },
  { id: 'sumohore', name: 'SUMO HORE', tier: 3, spec: { a: [175, 175, 175, 175], legs: [55, 0, 55, 0] } },
  { id: 'lungekiri', name: 'LUNGE KIRI', tier: 3, spec: { a: [90, 90, 90, 90], legs: [60, 0, 30, 30] } },
  { id: 'lungekanan', name: 'LUNGE KANAN', tier: 3, spec: { a: [90, 90, 90, 90], legs: [30, 30, 60, 0] } },
  { id: 'bangaukiri', name: 'BANGAU KIRI', tier: 3, spec: { a: [90, 90, 90, 90], legs: [70, -75, 0, 0] } },
  { id: 'bangaukanan', name: 'BANGAU KANAN', tier: 3, spec: { a: [90, 90, 90, 90], legs: [0, 0, 70, -75] } },
  { id: 'pohonkiri', name: 'POHON KIRI', tier: 4, spec: { a: [175, 175, 175, 175], legs: [70, -75, 0, 0] } },
  { id: 'pohonkanan', name: 'POHON KANAN', tier: 4, spec: { a: [175, 175, 175, 175], legs: [0, 0, 70, -75] } }
];
POSES.forEach(p => { p.foot = !!p.spec.legs; });                      // pose yang butuh kaki terlihat (bisa dimatikan di Pengaturan)
const hasLeg = spec => !!(spec && (spec.leg || spec.legs));
const BONES = [['sL', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['wL', 'hdL'], ['sR', 'eR'], ['eR', 'wR'], ['wR', 'hdR'], ['sL', 'hL'], ['sR', 'hR'], ['hL', 'hR'], ['hL', 'kL'], ['kL', 'aL'], ['hR', 'kR'], ['kR', 'aR'], ['c', 'nose']];
const KDEF = { arm: 1, torso: 1 };

// jarak titik ke bentuk lubang (0 = di dalam siluet inti)
const dSeg = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy; let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0; t = clamp(t, 0, 1); return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)); };
function inQuad(p, q) { let s = 0; for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4], c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x); if (c !== 0) { const sg = c > 0 ? 1 : -1; if (s === 0) s = sg; else if (s !== sg) return false; } } return true; }
function distToPose(p, J) {
  let d = Math.max(0, Math.hypot(p.x - J.nose.x, p.y - J.nose.y) - 0.3);
  if (inQuad(p, [J.sL, J.sR, J.hR, J.hL])) return 0;
  for (const [a, b] of BONES) d = Math.min(d, dSeg(p, J[a], J[b]));
  return d;
}
const holeRad = () => [0.52, 0.44, 0.36][settings.diff] + (settings.tol - 5) * 0.03;

// titik sampel tubuh pemain, dikelompokkan per bagian tubuh (kepala, badan, lengan kiri/kanan, kaki)
function samplePoints(B) {
  const parts = { head: [], torso: [], armL: [], armR: [], leg: [] }, ok = n => B[n] && B[n].v > 0.3;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), cp = p => ({ x: p.x, y: p.y });
  if (ok('nose')) parts.head.push(cp(B.nose));
  for (const s of ['L', 'R']) {
    const arm = parts['arm' + s];
    if (ok('s' + s)) parts.torso.push(cp(B['s' + s]));
    if (ok('e' + s)) { arm.push(cp(B['e' + s])); if (ok('s' + s)) arm.push(mid(B['s' + s], B['e' + s])); }
    if (ok('w' + s)) { arm.push(cp(B['w' + s])); if (ok('e' + s)) { arm.push(mid(B['e' + s], B['w' + s])); arm.push({ x: B['w' + s].x + (B['w' + s].x - B['e' + s].x) * 0.3, y: B['w' + s].y + (B['w' + s].y - B['e' + s].y) * 0.3 }); } }
    if (ok('h' + s)) { parts.torso.push(cp(B['h' + s])); if (ok('s' + s)) parts.torso.push(mid(B['s' + s], B['h' + s])); }
    if (ok('k' + s) && B['k' + s].v > 0.55) parts.leg.push(cp(B['k' + s]));
    if (ok('a' + s) && B['a' + s].v > 0.55) parts.leg.push(cp(B['a' + s]));
  }
  return parts;
}
// jarak titik ke kerangka pemain (0 jika di dalam badan)
function distToBody(p, B) {
  const ok = n => B[n] && B[n].v > 0.3; let d = Infinity;
  if (['sL', 'sR', 'hL', 'hR'].every(ok) && inQuad(p, [B.sL, B.sR, B.hR, B.hL])) return 0;
  const segs = [['sL', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['wL', 'hdL'], ['sR', 'eR'], ['eR', 'wR'], ['wR', 'hdR'], ['sL', 'hL'], ['sR', 'hR'], ['hL', 'hR'], ['hL', 'kL'], ['kL', 'aL'], ['hR', 'kR'], ['kR', 'aR']];
  for (const [a, b] of segs) if (ok(a) && ok(b)) d = Math.min(d, dSeg(p, B[a], B[b]));
  if (ok('nose')) d = Math.min(d, Math.hypot(p.x - B.nose.x, p.y - B.nose.y) - 0.15);
  return Math.max(0, d);
}
// titik kunci pose target per bagian: harus terisi tubuh pemain (siku, pergelangan, ujung tangan, kepala, kaki bila melebar)
function targetParts(J, spec) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), parts = { head: [J.nose], armL: [], armR: [], leg: [] };
  for (const s of ['L', 'R']) { parts['arm' + s].push(J['e' + s], J['w' + s], J['hd' + s], mid(J['s' + s], J['e' + s]), mid(J['e' + s], J['w' + s])); if (hasLeg(spec)) parts.leg.push(J['k' + s], J['a' + s]); }
  return parts;
}
// nilai kecocokan = bagian tubuh TERBURUK dari: (a) bagian itu muat di lubang, (b) titik kunci pose target di bagian itu terisi tubuh
function judgeFrac(B, J, rad, spec) {
  const sp = samplePoints(B), tp = targetParts(J, spec); let worst = 1, n = 0;
  for (const k in sp) n += sp[k].length; if (n < 6) return 0;
  const lowerOK = ['kL', 'kR', 'aL', 'aR'].every(q => B[q] && B[q].v > 0.55);
  if (spec && spec.legs && !lowerOK) return 0;                                   // pose kaki wajib memperlihatkan kaki
  for (const k in sp) { const pts = sp[k]; if (!pts.length) continue; let inn = 0; for (const p of pts) if (distToPose(p, J) <= rad * 1.05) inn++; worst = Math.min(worst, inn / pts.length); }
  for (const k in tp) { if (k === 'leg' && !lowerOK) continue; const pts = tp[k]; if (!pts.length) continue; let cov = 0; for (const t of pts) if (distToBody(t, B) <= rad * 1.1) cov++; worst = Math.min(worst, cov / pts.length); }
  return worst;
}
