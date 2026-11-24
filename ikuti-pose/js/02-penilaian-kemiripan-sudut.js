'use strict';
// ======================= PENILAIAN KEMIRIPAN (sudut tulang) =======================
// [dari, ke, bobot]; membandingkan ARAH tiap ruas tubuh pemain dengan pose target
const BONES = [['sL', 'eL', 1.2], ['eL', 'wL', 1.0], ['sR', 'eR', 1.2], ['eR', 'wR', 1.0], ['c', 'hc', 0.8], ['hL', 'kL', 0.6], ['kL', 'aL', 0.5], ['hR', 'kR', 0.6], ['kR', 'aR', 0.5]];
const angBetween = (u, v) => { const a = Math.hypot(u.x, u.y), b = Math.hypot(v.x, v.y); if (!a || !b) return null; return Math.acos(clamp((u.x * v.x + u.y * v.y) / (a * b), -1, 1)) * 180 / Math.PI; };
// kembalikan galat sudut rata-rata berbobot (derajat) atau null kalau tubuh tidak cukup terlihat
function poseError(Jp, Jt) {
  let sw = 0, se = 0, armW = 0;
  for (const [a, b, w] of BONES) {
    const p = Jp[a], q = Jp[b], ta = Jt[a], tb = Jt[b]; if (!p || !q || !ta || !tb || p.v < 0.3 || q.v < 0.3) continue;
    const vp = { x: q.x - p.x, y: q.y - p.y }, vt = { x: tb.x - ta.x, y: tb.y - ta.y };
    if (Math.hypot(vp.x, vp.y) < 0.12 || Math.hypot(vt.x, vt.y) < 0.12) continue;
    const e = angBetween(vp, vt); if (e == null) continue; sw += w; se += w * e * e; if (a[0] === 's' || a[0] === 'e') armW += w;
  }
  return armW < 2.0 ? null : Math.sqrt(se / sw);
}
const TOLM = () => 1 + (settings.tol - 5) * 0.08;
function gradeOf(err) { const f = TOLM(); if (err == null || err === Infinity) return 'miss'; if (err < 16 * f) return 'perfect'; if (err < 26 * f) return 'great'; if (err < 38 * f) return 'good'; if (err < 52 * f) return 'ok'; return 'miss'; }
const GP = { perfect: 100, great: 80, good: 50, ok: 20, miss: 0 }, GN = { perfect: 'SEMPURNA!', great: 'HEBAT!', good: 'BAGUS', ok: 'LUMAYAN', miss: 'MELESET' }, GC = { perfect: '#ffe36a', great: '#7fffd0', good: '#6fc8ff', ok: '#d8c8ff', miss: '#ff6a8a' };
const simPct = err => err == null ? 0 : clamp(1 - err / 60, 0, 1);
