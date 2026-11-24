'use strict';
// ---------- touch ----------
function addPoint(b, e) { bladeMove(b, e.clientX, e.clientY, e.timeStamp || performance.now()); }
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  initAudio();
  const b = makeBlade(120, versus ? (e.clientX < W / 2 ? 0 : 1) : undefined);
  touchBlades.set(e.pointerId, b);
  addPoint(b, e);
});
cv.addEventListener('pointermove', e => {
  const b = touchBlades.get(e.pointerId);
  if (!b) return;
  const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
  if (list && list.length) for (const ce of list) addPoint(b, ce); else addPoint(b, e);
});
const endPointer = e => { const b = touchBlades.get(e.pointerId); if (b) { b.dead = true; deadBlades.push(b); touchBlades.delete(e.pointerId); } };
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('pointerleave', endPointer);
