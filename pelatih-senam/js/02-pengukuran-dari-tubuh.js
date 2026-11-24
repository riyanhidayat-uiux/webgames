'use strict';
// ======================= PENGUKURAN DARI TUBUH =======================
// f = fitur tubuh (satuan panjang badan T = bahu->pinggul, asal = tengah pinggul, y atas +); b = baseline berdiri tegak
function measure(f, b) {
  const vis = (...n) => n.every(k => f[k] && f[k].v > 0.35), m = {};
  const sy = (f.sL.y + f.sR.y) / 2;
  if (vis('wL', 'wR')) m.armsUp = clamp(((f.wL.y + f.wR.y) / 2 - sy) / 0.85, -0.5, 1.5);
  if (vis('aL', 'aR')) m.legsOpen = (Math.abs(f.aL.x - f.aR.x) - b.sep0) / 0.55; else if (vis('kL', 'kR')) m.legsOpen = (Math.abs(f.kL.x - f.kR.x) - b.ksep0) / 0.35;
  if (vis('hL', 'hR', 'kL', 'kR')) {
    const dy = (f.hL.y + f.hR.y) / 2 - (f.kL.y + f.kR.y) / 2;
    m.squat = (b.dy0 - dy) / (0.42 * b.dy0);
    m.kneeL = (f.kL.y - f.hL.y - b.krL) / 0.5; m.kneeR = (f.kR.y - f.hR.y - b.krR) / 0.5;
  }
  m.lean = ((f.sL.x + f.sR.x) / 2) / 0.28;
  m.jj = m.armsUp != null && m.legsOpen != null ? Math.min(m.armsUp, m.legsOpen) : null;
  m.press = m.armsUp != null ? m.armsUp : null;
  return m;
}
const mkRep = () => ({ phase: 0, max: 0, t: 0, last: -9, partial: 0, side: 0 });
// satu langkah mesin repetisi; kembalikan {rep: 'perfect'|'good'|null, partial: bool}
function stepRep(R, a, now) {
  if (a == null) return null; const hi = HI(); let out = null;
  if (R.phase === 0) { if (a >= hi) { R.phase = 1; R.max = a; } else R.partial = Math.max(R.partial, a); }
  else { R.max = Math.max(R.max, a); if (a <= LO) { if (now - R.last > 0.4) { out = { rep: R.max >= hi + 0.3 ? 'perfect' : 'good', max: R.max }; R.last = now; } R.phase = 0; R.partial = 0; } }
  if (R.phase === 0 && a <= LO && R.partial >= 0.5 && R.partial < hi && now - R.last > 1.5) { out = { partial: true }; R.partial = 0; R.last = now - 0.5; }
  if (R.phase === 0 && a <= LO) R.partial = 0;
  return out;
}
function stepSide(R, a, now) {
  if (a == null) return null; const hi = HI(), s = a >= hi ? 1 : a <= -hi ? -1 : 0; let out = null;
  if (s !== 0 && s !== R.side && now - R.last > 0.4) { R.side = s; R.last = now; out = { rep: Math.abs(a) >= hi + 0.3 ? 'perfect' : 'good', max: Math.abs(a) }; R.partial = 0; }
  else if (Math.abs(a) < LO) { R.partial = 0; }
  else { R.partial = Math.max(R.partial, Math.abs(a)); }
  return out;
}
