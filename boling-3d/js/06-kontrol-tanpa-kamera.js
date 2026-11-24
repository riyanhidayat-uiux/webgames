'use strict';
// ======================= KONTROL: KEYBOARD & SENTUH =======================
const keys = {}; let charging = false, chargeT = 0, chargeP = 0, ptr = null;
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (k === 'p' || k === 'escape') { if (state === 'paused') resumeGame(); else pauseGame(); return; }
  if (k === ' ' && state === 'ready' && !useCam && !charging && !e.repeat) { e.preventDefault(); charging = true; chargeT = 0; show('power', true); }
});
addEventListener('keyup', e => {
  const k = e.key.toLowerCase(); keys[k] = false;
  if (k === ' ' && charging) { charging = false; show('power', false); if (state === 'ready' && !useCam) launch(aimX, aimAngle, aimSpin, lerp(POWER_MIN, POWER_MAX, chargeP)); }
});
function updateKeyboardAim(dt) {
  if (useCam || state !== 'ready') { if (charging && state !== 'ready') { charging = false; show('power', false); } return; }
  const d = (keys['arrowright'] || keys['d'] ? 1 : 0) - (keys['arrowleft'] || keys['a'] ? 1 : 0);
  aimX = clamp(aimX + d * 1.3 * dt, -0.85, 0.85);
  aimAngle = clamp(aimAngle + ((keys['e'] ? 1 : 0) - (keys['q'] ? 1 : 0)) * 0.05 * dt, -0.05, 0.05);
  aimSpin = clamp(aimSpin + ((keys['x'] ? 1 : 0) - (keys['z'] ? 1 : 0)) * 1.4 * dt, -1, 1);
  if (charging) { chargeT += dt; chargeP = 0.5 - 0.5 * Math.cos(chargeT * Math.PI / 0.9); $('powerFill').style.height = Math.round(chargeP * 100) + '%'; }
}
const glc = $('gl');
glc.addEventListener('pointerdown', e => { if (useCam || state !== 'ready') return; ptr = { t: performance.now(), x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }; aimX = clamp((e.clientX / innerWidth - 0.5) * 1.9, -0.85, 0.85); });
glc.addEventListener('pointermove', e => { if (!ptr || useCam || state !== 'ready') return; ptr.x = e.clientX; ptr.y = e.clientY; if (Math.abs(e.clientY - ptr.y0) < 30) aimX = clamp((e.clientX / innerWidth - 0.5) * 1.9, -0.85, 0.85); });
glc.addEventListener('pointerup', e => {
  if (!ptr) return; const p = ptr; ptr = null; if (useCam || state !== 'ready') return;
  const dy = p.y0 - e.clientY, dx = e.clientX - p.x0, dt = Math.max(1, performance.now() - p.t);
  if (dy > 50 && dt < 900) { const spd = dy / dt, pw = clamp((spd - 0.4) / 1.6, 0, 1), r = clamp(dx / dy, -1, 1); launch(aimX, r * 0.03, r * 0.9, lerp(POWER_MIN, POWER_MAX, pw)); }
});
