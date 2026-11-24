'use strict';
// ---------- sensors ----------
const sens = { on: false, seen: false, g: 0, b: 0, g0: 0, b0: 0, recal: true, tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, lastFlick: 0, listening: false };

function screenAngle() {
  let a = 0;
  if (screen.orientation && typeof screen.orientation.angle === 'number') a = screen.orientation.angle;
  else if (typeof window.orientation === 'number') a = window.orientation;
  return ((a % 360) + 360) % 360;
}
// (u = kanan perangkat, v = bawah perangkat) -> koordinat layar
function mapAxes(u, v) {
  const a = screenAngle();
  if (a === 90) return [v, -u];
  if (a === 270) return [-v, u];
  if (a === 180) return [-u, -v];
  return [u, v];
}

function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  sens.seen = true;
  if (sens.recal) { sens.g0 = e.gamma; sens.b0 = e.beta; sens.recal = false; }
  sens.g = e.gamma; sens.b = e.beta;
}
function onMotion(e) {
  const r = e.rotationRate;
  if (!r || r.beta == null || r.gamma == null) return;
  sens.seen = true;
  if (!sens.on || state !== 'play') return;
  const rb = r.beta * (settings.invY ? -1 : 1), rg = r.gamma;
  const mag = Math.hypot(rb, rg);
  const now = performance.now();
  const thr = 230 / settings.flick;
  if (mag > thr && now - sens.lastFlick > 260) {
    sens.lastFlick = now;
    const [dx, dy] = mapAxes(rg, rb);
    const m = Math.hypot(dx, dy) || 1;
    const imp = Math.min(W, H) * 9 * Math.min(1.6, mag / thr);
    sens.vx += dx / m * imp; sens.vy += dy / m * imp;
  }
}

async function enableSensors() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      const res = await DeviceOrientationEvent.requestPermission();
      if (res !== 'granted') throw new Error('denied');
    }
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try { await DeviceMotionEvent.requestPermission(); } catch (e) {}
    }
  } catch (e) {
    toast('Izin sensor ditolak. Main pakai sentuhan dulu ya.');
    return false;
  }
  if (!sens.listening) {
    window.addEventListener('deviceorientation', onOrient);
    window.addEventListener('devicemotion', onMotion);
    sens.listening = true;
  }
  return true;
}

function updateSensor(dt, now) {
  if (!sens.on) return;
  const ppd = Math.min(W, H) / 2 / 22 * settings.sens; // piksel per derajat
  const [dx, dy] = mapAxes(sens.g - sens.g0, (sens.b - sens.b0) * (settings.invY ? -1 : 1));
  const tx = Math.max(-W * 0.05, Math.min(W * 1.05, W / 2 + dx * ppd));
  const ty = Math.max(-H * 0.05, Math.min(H * 1.05, H / 2 + dy * ppd * 1.15));
  const lp = Math.min(1, dt * 30);
  sens.tx += (tx - sens.tx) * lp; sens.ty += (ty - sens.ty) * lp;
  const k = 220, c = 2 * Math.sqrt(k) * 0.72;
  sens.vx += (k * (sens.tx - sens.x) - c * sens.vx) * dt;
  sens.vy += (k * (sens.ty - sens.y) - c * sens.vy) * dt;
  sens.x += sens.vx * dt; sens.y += sens.vy * dt;
  bladeMove(sensorBlade, sens.x, sens.y, now);
}

function calibrate() {
  sens.recal = true;
  sens.x = sens.tx = W / 2; sens.y = sens.ty = H / 2; sens.vx = sens.vy = 0;
  sensorBlade.pts = []; sensorBlade.prev = null;
}
