'use strict';
// ======================= KONTROL: MOUSE / KEYBOARD / SENTUH =======================
const keys = {}; let charging = false, chargeT = 0, chargeP = 0, curveLvl = 0, loftLvl = 0, ptrDown = false;
const glc = $('gl'), _ray = new THREE.Raycaster(), _ndc = new THREE.Vector2(), _plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), _hit = new THREE.Vector3();
function setAimFromPointer(cx, cy) {
  _ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1); _ray.setFromCamera(_ndc, camera);
  if (_ray.ray.intersectPlane(_plane, _hit)) { AIM.x = clamp(_hit.x, -4.4, 4.4); AIM.y = clamp(_hit.y, 0.12, 3.1); }
}
function canAimManual() { return state === 'ready' && A && A.role === 'kick' && A.phase === 'ready' && !useCam; }
glc.addEventListener('pointermove', e => { if (canAimManual()) setAimFromPointer(e.clientX, e.clientY); });
glc.addEventListener('pointerdown', e => {
  if (state === 'replay') { endReplay(); return; } if (state === 'ready' && A && A.role === 'defend' && !useCam) { const f = e.clientX / innerWidth, h = e.clientY / innerHeight; userDive(f < 0.38 ? -1 : f > 0.62 ? 1 : 0, h < 0.4 ? 1 : h > 0.65 ? 0 : 0.5); return; }
  if (!canAimManual()) return; setAimFromPointer(e.clientX, e.clientY); initAudio(); startCharge();
});
glc.addEventListener('pointerup', () => { if (charging) releaseCharge(); });
function startCharge() { if (charging || !A || A.t < 0.9) return; charging = true; chargeT = 0; show('power', true); }
function releaseCharge() { if (!charging) return; charging = false; show('power', false); userKick({ aimX: AIM.x, aimY: AIM.y, power: Math.max(0.12, chargeP), curve: curveLvl, loft: loftLvl, left: false, quick: false }); curveLvl = 0; loftLvl = 0; }
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); if (!keys[k] || e.repeat === false) keys[k] = true;
  if (k === 'p' || k === 'escape') { if (state === 'paused') resumeGame(); else pauseGame(); return; }
  if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  if (state === 'replay' && (k === ' ' || k === 'enter')) { endReplay(); return; }
  if (state !== 'ready' || !A || e.repeat) return;
  if (A.phase !== 'ready' && !(A.role === 'defend' && A.phase === 'approach')) return;
  if (A.role === 'kick' && !useCam) {
    if (k === ' ') { initAudio(); startCharge(); } else if (k === 'q') curveLvl = clamp(curveLvl - 0.5, -1, 1); else if (k === 'e') curveLvl = clamp(curveLvl + 0.5, -1, 1); else if (k === 'r') loftLvl = clamp(loftLvl + 0.5, -1, 1); else if (k === 'f') loftLvl = clamp(loftLvl - 0.5, -1, 1);
    else if (k === 'arrowleft' || k === 'a') AIM.x = clamp(AIM.x - 0.5, -4.4, 4.4); else if (k === 'arrowright' || k === 'd') AIM.x = clamp(AIM.x + 0.5, -4.4, 4.4); else if (k === 'arrowup' || k === 'w') AIM.y = clamp(AIM.y + 0.3, 0.12, 3.1); else if (k === 'arrowdown' || k === 's') AIM.y = clamp(AIM.y - 0.3, 0.12, 3.1);
  } else if (A.role === 'defend' && !useCam) {
    const hi = keys['arrowup'] || keys['w'] ? 1 : keys['arrowdown'] || keys['s'] ? 0 : 0.5;
    if (k === 'arrowleft' || k === 'a') userDive(-1, hi === 0.5 ? 0.45 : hi); else if (k === 'arrowright' || k === 'd') userDive(1, hi === 0.5 ? 0.45 : hi); else if (k === 'arrowup' || k === ' ' || k === 'w') userDive(0, 1); else if (k === 'arrowdown' || k === 's') userDive(0, 0);
  }
});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (k === ' ' && charging) releaseCharge(); });
function updateCharge(dt) { if (!charging) return; chargeT += dt; chargeP = 0.5 - 0.5 * Math.cos(chargeT * Math.PI / 0.85); $('powerFill').style.height = Math.round(chargeP * 100) + '%'; }
