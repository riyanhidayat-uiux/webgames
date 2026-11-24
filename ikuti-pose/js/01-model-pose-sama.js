'use strict';
// ======================= MODEL POSE (sama dengan Lubang di Dinding) =======================
// satuan: 1 = lebar bahu; asal = tengah bahu; x kanan(+) layar cermin; y atas(+). sudut lengan: 0 = ke bawah, 90 = mendatar keluar, 180 = ke atas
const LEN = { arm1: 0.75, arm2: 0.62, torso: 1.25, hipW: 0.7, thigh: 1.1, shin: 1.05, head: 0.58 };
const dirArm = (side, a) => side < 0 ? { x: -Math.sin(rad(a)), y: -Math.cos(rad(a)) } : { x: Math.sin(rad(a)), y: -Math.cos(rad(a)) };
function buildPose(spec) {
  const lean = rad(spec.lean || 0), ax = { x: Math.cos(lean), y: -Math.sin(lean) }, up = { x: Math.sin(lean), y: Math.cos(lean) }, J = { c: { x: 0, y: 0 } };
  J.sL = { x: -0.5 * ax.x, y: -0.5 * ax.y }; J.sR = { x: 0.5 * ax.x, y: 0.5 * ax.y }; J.nose = { x: up.x * LEN.head, y: up.y * LEN.head };
  const hc = { x: -up.x * LEN.torso, y: -up.y * LEN.torso }; J.hc = hc;
  J.hL = { x: hc.x - LEN.hipW / 2 * ax.x, y: hc.y - LEN.hipW / 2 * ax.y }; J.hR = { x: hc.x + LEN.hipW / 2 * ax.x, y: hc.y + LEN.hipW / 2 * ax.y };
  const arm = (side, s, a1, a2) => { const d1 = dirArm(side, a1), d2 = dirArm(side, a2), e = { x: s.x + d1.x * LEN.arm1, y: s.y + d1.y * LEN.arm1 }; return { e, w: { x: e.x + d2.x * LEN.arm2, y: e.y + d2.y * LEN.arm2 } }; };
  const aL = arm(-1, J.sL, spec.a[0], spec.a[1]), aR = arm(1, J.sR, spec.a[2], spec.a[3]); J.eL = aL.e; J.wL = aL.w; J.eR = aR.e; J.wR = aR.w;
  const leg = (side, h, deg) => { const d = { x: side * Math.sin(rad(deg)), y: -Math.cos(rad(deg)) }, kn = { x: h.x + d.x * LEN.thigh, y: h.y + d.y * LEN.thigh }; return { kn, an: { x: kn.x + d.x * LEN.shin, y: kn.y + d.y * LEN.shin } }; };
  const lL = leg(-1, J.hL, spec.legL != null ? spec.legL : (spec.leg || 0)), lR = leg(1, J.hR, spec.legR != null ? spec.legR : (spec.leg || 0)); J.kL = lL.kn; J.aL = lL.an; J.kR = lR.kn; J.aR = lR.an;
  return J;
}
const POSES = [
  { id: 'tegak', name: 'TEGAK', tier: 1, spec: { a: [8, 8, 8, 8] } },
  { id: 't', name: 'PESAWAT T', tier: 1, spec: { a: [90, 90, 90, 90] } },
  { id: 'y', name: 'HURUF Y', tier: 1, spec: { a: [130, 130, 130, 130] } },
  { id: 'hore', name: 'HORE!', tier: 1, spec: { a: [175, 175, 175, 175] } },
  { id: 'kiriatas', name: 'TUNJUK KIRI', tier: 1, spec: { a: [175, 175, 8, 8] } },
  { id: 'kananatas', name: 'TUNJUK KANAN', tier: 1, spec: { a: [8, 8, 175, 175] } },
  { id: 'pinggang', name: 'TANGAN PINGGANG', tier: 2, spec: { a: [50, -50, 50, -50] } },
  { id: 'otot', name: 'PAMER OTOT', tier: 2, spec: { a: [90, 180, 90, 180] } },
  { id: 'disko1', name: 'DISKO KIRI', tier: 2, spec: { a: [175, 175, 50, -50] } },
  { id: 'disko2', name: 'DISKO KANAN', tier: 2, spec: { a: [50, -50, 175, 175] } },
  { id: 'robot', name: 'ROBOT', tier: 2, spec: { a: [90, 180, 90, 0] } },
  { id: 'silang', name: 'SILANG', tier: 3, spec: { a: [40, -115, 40, -115] } },
  { id: 'mirkiri', name: 'MIRING KIRI', tier: 3, spec: { a: [20, 20, 120, 120], lean: -28 } },
  { id: 'mirkanan', name: 'MIRING KANAN', tier: 3, spec: { a: [120, 120, 20, 20], lean: 28 } },
  { id: 'kuda', name: 'KUDA-KUDA', tier: 3, spec: { a: [90, 0, 90, 0], leg: 24 } },
  { id: 'tendang1', name: 'TENDANG KIRI', tier: 3, spec: { a: [90, 90, 50, -50], legL: 40, legR: 0 } },
  { id: 'tendang2', name: 'TENDANG KANAN', tier: 3, spec: { a: [50, -50, 90, 90], legL: 0, legR: 40 } },
  { id: 'zigzag', name: 'ZIGZAG', tier: 3, spec: { a: [120, 30, 60, 170] } }
];
POSES.forEach(p => { p.J = buildPose(p.spec); });
