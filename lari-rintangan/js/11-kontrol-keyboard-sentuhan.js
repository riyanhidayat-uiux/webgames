'use strict';
// ---------- kontrol: keyboard & sentuhan ----------
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === 'p' || k === 'escape') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); return; }
  if (k === 'arrowleft' || k === 'a') actLane(P.lane - 1);
  else if (k === 'arrowright' || k === 'd') actLane(P.lane + 1);
  else if (k === 'arrowup' || k === 'w' || k === ' ') actJump();
  else if (k === 'arrowdown' || k === 's') actDuck();
});
let sw = null;
addEventListener('pointerdown', e => { if (e.target.closest && e.target.closest('button,a,.overlay,details')) return; initAudio(); sw = { x: e.clientX, y: e.clientY }; });
addEventListener('pointermove', e => {
  if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (Math.hypot(dx, dy) < 30) return;
  if (Math.abs(dx) > Math.abs(dy)) actLane(P.lane + (dx > 0 ? 1 : -1)); else if (dy < 0) actJump(); else actDuck();
  sw = { x: e.clientX, y: e.clientY };
});
addEventListener('pointerup', () => sw = null); addEventListener('pointercancel', () => sw = null);
