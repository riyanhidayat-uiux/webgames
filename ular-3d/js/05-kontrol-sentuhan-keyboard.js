'use strict';
// ---------- kontrol: sentuhan + keyboard ----------
const swipes = new Map();
addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('button,a,.overlay,details')) return;
  initAudio();
  swipes.set(e.pointerId, { x: e.clientX, y: e.clientY, o: versus ? (e.clientX < innerWidth / 2 ? 0 : 1) : 0 });
});
addEventListener('pointermove', e => {
  const sw = swipes.get(e.pointerId); if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (Math.hypot(dx, dy) < 26) return;
  turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? DIRS.R : DIRS.L) : (dy > 0 ? DIRS.D : DIRS.U), sw.o);
  sw.x = e.clientX; sw.y = e.clientY;
});
const endSwipe = e => swipes.delete(e.pointerId);
addEventListener('pointerup', endSwipe);
addEventListener('pointercancel', endSwipe);
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  const wasd = { w: DIRS.U, s: DIRS.D, a: DIRS.L, d: DIRS.R }[k];
  const arr = { arrowup: DIRS.U, arrowdown: DIRS.D, arrowleft: DIRS.L, arrowright: DIRS.R }[k];
  if (wasd) { e.preventDefault(); turn(wasd, 0); }
  else if (arr) { e.preventDefault(); turn(arr, versus ? 1 : 0); }
  else if (k === ' ' || k === 'p') { e.preventDefault(); if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); }
});
