'use strict';
// ---------- camera (pelacakan jari) ----------
const MP_VER = '0.10.14';
const MP_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VER}`;
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, seen: false, has: false, lostAt: 0,
              tx: 0, ty: 0, x: 0, y: 0, rawX: 0.5, rawY: 0.5, lastDetect: 0 };
const video = $('camVideo');
// Filter One-Euro: meredam getaran saat jari diam, tetapi nyaris tanpa lag saat jari bergerak cepat
class OneEuro {
  constructor(minCut, beta) { this.minCut = minCut; this.beta = beta; this.f = null; this.dx = 0; this.t = 0; }
  reset() { this.f = null; this.dx = 0; }
  static alpha(cut, dt) { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); }
  filter(x, t) {
    if (this.f === null) { this.f = x; this.t = t; this.dx = 0; return x; }
    const dt = Math.max(0.004, t - this.t); this.t = t;
    const d = (x - this.f) / dt; this.dx += OneEuro.alpha(1.2, dt) * (d - this.dx);
    this.f += OneEuro.alpha(this.minCut + this.beta * Math.abs(this.dx), dt) * (x - this.f); return this.f;
  }
}
// pelacak satu jari: filter posisi + perkiraan kecepatan (untuk prediksi antar-deteksi)
function makeTracker() { return { fx: new OneEuro(1.4, 0.016), fy: new OneEuro(1.4, 0.016), vx: 0, vy: 0, tT: 0, lx: 0, ly: 0 }; }
function trackerFeed(tr, sx, sy, now, first) {
  const t = now / 1000, k = 400 / Math.min(W, H);                  // beta dinormalkan terhadap ukuran layar
  tr.fx.beta = tr.fy.beta = 0.016 * k;
  if (first) { tr.fx.reset(); tr.fy.reset(); tr.vx = tr.vy = 0; }
  const x = tr.fx.filter(sx, t), y = tr.fy.filter(sy, t);
  if (!first && tr.tT) { const dt = Math.max(0.008, (now - tr.tT) / 1000); tr.vx += 0.6 * ((x - tr.lx) / dt - tr.vx); tr.vy += 0.6 * ((y - tr.ly) / dt - tr.vy); }
  tr.lx = x; tr.ly = y; tr.tT = now; return [x, y];
}
// posisi untuk frame render ini: filter + prediksi pendek (menutup lag kamera & selang antar-deteksi)
function trackerPos(tr, now) {
  const age = Math.min(0.075, Math.max(0, (now - tr.tT) / 1000) + 0.015), lim = 70 * S;
  let ox = tr.vx * age, oy = tr.vy * age; const m = Math.hypot(ox, oy); if (m > lim) { ox *= lim / m; oy *= lim / m; }
  return [tr.lx + ox, tr.ly + oy];
}

function loadHandModel() {
  if (cam.lm) return Promise.resolve(cam.lm);
  if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP_URL}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP_URL}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: HAND_MODEL, delegate: d }, runningMode: 'VIDEO', numHands: 1,
      minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('GPU')); }
    catch (e) { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })();
  cam.loading.catch(() => { cam.loading = null; });
  return cam.loading;
}
