'use strict';
// ======================= INPUT: POINTER (tanpa kamera) =======================
const ptrs = new Map();
function ptrPoints() {
  const byOwner = PL.map(() => []);
  ptrs.forEach(p => { const o = versus ? (p.x < SW / 2 ? 0 : 1) : 0; byOwner[o].push({ x: p.x, y: p.y, r: HR() * 1.15, kind: 'hand' }); });
  PL.forEach((pl, i) => { pl.pts = byOwner[i]; pl.valid = true; pl.bones = []; pl.nose = null; });
}
addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('button,a,.overlay,details')) return; initAudio(); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }); });
addEventListener('pointermove', e => { const p = ptrs.get(e.pointerId); if (p) { p.x = e.clientX; p.y = e.clientY; } else if (e.pointerType === 'mouse') ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, mouse: true }); });
const endPtr = e => { const p = ptrs.get(e.pointerId); if (p && !p.mouse) ptrs.delete(e.pointerId); };
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);
