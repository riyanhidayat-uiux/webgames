'use strict';
// ======================= KONTROL: KEYBOARD, SENTUH, SENSOR MIRING HP =======================
const keys = {}, touch = { l: false, r: false, g: false, b: false };
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (k === 'p' || k === 'escape') { if (state === 'paused') resumeGame(); else pauseGame(); return; }
  if (k === 'h' && (state === 'play' || state === 'count')) sfx.horn();
  if (k === 'c' && state !== 'menu' && state !== 'over') cycleView();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
[['tbL', 'l'], ['tbR', 'r'], ['tbG', 'g'], ['tbB', 'b']].forEach(([id, k]) => { const el = $(id); const set = v => e => { e.preventDefault(); touch[k] = v; el.classList.toggle('on', v); initAudio(); }; el.addEventListener('pointerdown', set(true)); ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, set(false))); });
$('btnHorn').onclick = () => { initAudio(); sfx.horn(); };
const two = () => typeof race2P !== 'undefined' && race2P;      // balapan 2 pemain: P1 = panah, P2 = WASD
function keyThrottle() { const t2 = two(), up = keys['arrowup'] || (!t2 && keys['w']) || touch.g, dn = keys['arrowdown'] || (!t2 && keys['s']) || touch.b; return (up ? 1 : 0) - (dn ? 1 : 0); }
function updateManualInput(dt) {
  if (!useCam && !useTilt) {   // setir dari keyboard / tombol sentuh
    const t2 = two(), tgt = ((keys['arrowright'] || (!t2 && keys['d']) || touch.r) ? 1 : 0) - ((keys['arrowleft'] || (!t2 && keys['a']) || touch.l) ? 1 : 0);
    input.steer += (tgt - input.steer) * (1 - Math.exp(-dt * (tgt ? 6 : 10)));
  }
  if (!useCam) input.throttle += (keyThrottle() - input.throttle) * (1 - Math.exp(-dt * 7));
  if (two() && !useCam) {   // pemain 2: A/D belok, W/S gas & rem
    const t2 = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0), g2 = (keys['w'] ? 1 : 0) - (keys['s'] ? 1 : 0);
    input2.steer += (t2 - input2.steer) * (1 - Math.exp(-dt * (t2 ? 6 : 10))); input2.throttle += (g2 - input2.throttle) * (1 - Math.exp(-dt * 7));
  }
}
// --- sensor miring HP: setir = memutar ponsel seperti roda kemudi (gravitasi pada bidang layar) ---
const tilt = { on: false, seen: false, ang: 0, ang0: 0, ok: false, samples: [], listening: false };
const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function screenAngle() { let a = 0; if (screen.orientation && typeof screen.orientation.angle === 'number') a = screen.orientation.angle; else if (typeof window.orientation === 'number') a = window.orientation; return ((a % 360) + 360) % 360; }
function onMotion(e) {
  const g = e.accelerationIncludingGravity; if (!g || g.x == null || g.y == null) return; tilt.seen = true;
  let gx = g.x, gy = g.y; const a = screenAngle();
  if (a === 90) { [gx, gy] = [-gy, gx]; } else if (a === 270) { [gx, gy] = [gy, -gx]; } else if (a === 180) { gx = -gx; gy = -gy; }
  if (isIOS) { gx = -gx; gy = -gy; }                    // iOS membalik tanda percepatan
  if (Math.hypot(gx, gy) < 3) return;                     // ponsel terlalu rebah: sudut tidak bermakna
  tilt.ang = Math.atan2(-gx, gy);                         // putar ponsel searah jarum jam => sudut positif => belok kanan
}
async function enableTilt() {
  try { if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') { const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') throw new Error('denied'); } }
  catch (e) { toast('Izin sensor ditolak. Izinkan akses sensor gerak lalu coba lagi.', 4500); return false; }
  if (!tilt.listening) { addEventListener('devicemotion', onMotion); tilt.listening = true; }
  await new Promise(r => setTimeout(r, 400));
  if (!tilt.seen) { toast('Sensor gerak tidak terdeteksi di perangkat ini. Coba di ponsel (Chrome/Safari) lewat HTTPS.', 5000); return false; }
  return true;
}
function tiltCalibStep() {
  tilt.samples.push(tilt.ang); if (tilt.samples.length > 25) tilt.samples.shift(); const n = tilt.samples.length, mx = Math.max(...tilt.samples), mn = Math.min(...tilt.samples);
  if (mx - mn > 0.12) { tilt.samples = tilt.samples.slice(-3); $('calBar').style.width = '5%'; $('calS').textContent = 'Tahan ponsel diam, tegak seperti memegang setir…'; return; }
  $('calBar').style.width = Math.round(n / 25 * 100) + '%'; $('calS').textContent = 'Bagus! Tahan posisi ini…';
  if (n >= 25) { tilt.ang0 = tilt.samples.reduce((a, b) => a + b, 0) / n; tilt.ok = true; show('calibBox', false); startCountdown(); toast('Putar ponsel ke kiri/kanan untuk membelok. Tombol ⛽ / 🛑 untuk gas & rem.', 4500); }
}
function updateTiltInput() {
  if (!useTilt || state === 'calib') return; const maxA = (46 - 3.5 * settings.sens) * Math.PI / 180;
  const s = clamp((tilt.ang - tilt.ang0) / maxA, -1, 1) * (settings.invert ? -1 : 1), a = Math.abs(s) < 0.06 ? 0 : s;
  input.steer += (a - input.steer) * 0.35;
}
