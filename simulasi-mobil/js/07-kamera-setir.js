'use strict';
// ======================= KAMERA: SETIR TANGAN (1 atau 2 orang) =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, skip: 0, cost: 0 };
const video = $('bgVideo'), skel = $('skel'), sctx = skel.getContext('2d');
class OneEuro {
  constructor(minCut, beta) { this.minCut = minCut; this.beta = beta; this.f = null; this.dx = 0; this.t = 0; }
  reset() { this.f = null; this.dx = 0; }
  static alpha(cut, dt) { const tau = 1 / (2 * Math.PI * cut); return 1 / (1 + tau / dt); }
  filter(x, t) { if (this.f === null) { this.f = x; this.t = t; return x; } const dt = Math.max(0.004, t - this.t); this.t = t; const d = (x - this.f) / dt; this.dx += OneEuro.alpha(1.2, dt) * (d - this.dx); this.f += OneEuro.alpha(this.minCut + this.beta * Math.abs(this.dx), dt) * (x - this.f); return this.f; }
}
// satu "pemain kamera": filter, baseline kalibrasi, status terlihat
const mkCP = () => ({ fAng: new OneEuro(2.2, 1.6), fH: new OneEuro(1.5, 0.8), ang: 0, h: 0, sep: 0, seenAt: 0, has: false, miss: 0, lastCx: null, base: { ok: false, ang0: 0, h0: 0 }, calib: [] });
const CP = [mkCP(), mkCP()], base = CP[0].base;        // `base` = kalibrasi pemain 1 (nama lama)
let camPlayers = 1;
function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm); if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`), files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })(); cam.loading.catch(() => { cam.loading = null; }); return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Coba mode keyboard dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: camPlayers }); } catch (e) {}
  $('toast').classList.remove('show'); return true;
}
function stopCamera() { cam.on = false; cam.has = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('camBox', false); show('calibBox', false); }
function startCalib() {
  CP.forEach(c => { c.calib = []; c.fAng.reset(); c.fH.reset(); c.miss = 99; c.has = false; });
  $('calBar').style.width = '0%'; $('calBar2').style.width = '0%'; show('calibBox', true); show('calS2', camPlayers === 2); show('calBox2', camPlayers === 2);
  $('calS').textContent = useCam ? (camPlayers === 2 ? 'P1 (kiri) & P2 (kanan): berdiri berdampingan, angkat kedua tangan setinggi dada seperti memegang setir, tahan 1 detik…' : 'Angkat kedua tangan setinggi dada seperti memegang setir (jarak tangan ±1 lebar bahu lebih), lalu tahan 1 detik…') : 'Tahan ponsel tegak seperti memegang setir lalu diam sebentar…';
  $('calS2').textContent = camPlayers === 2 ? 'P2: menunggu…' : '';
}
// geometri setir: sudut garis pergelangan kiri→kanan, tinggi rata-rata tangan terhadap bahu, jarak antar-tangan (satuan lebar bahu)
function wheelFrom(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, vis = i => h[i].visibility == null ? 1 : h[i].visibility;
  if (vis(11) < 0.4 || vis(12) < 0.4 || vis(15) < 0.35 || vis(16) < 0.35) return null;
  const P = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh }), sL = P(11), sR = P(12), wL = P(15), wR = P(16), sw = Math.hypot(sL.x - sR.x, sL.y - sR.y); if (sw < 24) return null;
  const dxw = wR.x - wL.x, dyw = wR.y - wL.y, sy = (sL.y + sR.y) / 2;
  return { ang: Math.atan2(dyw, Math.max(8, dxw)), h: -((wL.y + wR.y) / 2 - sy) / sw, sep: Math.hypot(dxw, dyw) / sw, cx: (sL.x + sR.x) / 2, sw };
}
const SKC = ['#7fff6a', '#6fc8ff'], WLC = ['#ffd23f', '#ff9a3c'];
function drawSkel(items) {
  const w = skel.width, hh = skel.height; sctx.clearRect(0, 0, w, hh); if (!items) return;
  items.forEach(({ h, pi }) => {
    sctx.strokeStyle = SKC[pi]; sctx.lineWidth = 3; sctx.lineCap = 'round';
    for (const [a, b] of [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]]) { const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; sctx.beginPath(); sctx.moveTo((1 - p.x) * w, p.y * hh); sctx.lineTo((1 - q.x) * w, q.y * hh); sctx.stroke(); }
    const a = h[15], b = h[16]; sctx.strokeStyle = WLC[pi]; sctx.lineWidth = 5; sctx.beginPath(); sctx.moveTo((1 - a.x) * w, a.y * hh); sctx.lineTo((1 - b.x) * w, b.y * hh); sctx.stroke(); sctx.fillStyle = '#ff5a3c'; [a, b].forEach(p => { sctx.beginPath(); sctx.arc((1 - p.x) * w, p.y * hh, 6, 0, 6.283); sctx.fill(); });
  });
}
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  if (cam.skip > 0) { cam.skip--; return; }
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now); const t0 = performance.now(); let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  cam.cost = cam.cost * 0.8 + (performance.now() - t0) * 0.2; cam.skip = cam.cost > 15 ? 1 : 0;
  const items = ((res && res.landmarks) || []).map(h => ({ h, W: wheelFrom(h) })).filter(o => o.W), t = now / 1000, vw = video.videoWidth || 640;
  const asg = [null, null];
  if (camPlayers === 1) asg[0] = items.sort((a, b) => b.W.sw - a.W.sw)[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.W.cx - b.W.cx); asg[0] = items[0]; asg[1] = items[items.length - 1]; }
  else if (items.length === 1) { const q = items[0], d = k => CP[k].lastCx == null ? Infinity : Math.abs(q.W.cx - CP[k].lastCx), i = (d(0) === Infinity && d(1) === Infinity) ? (q.W.cx < vw / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q; }
  const drawn = [];
  for (let pi = 0; pi < camPlayers; pi++) {
    const c = CP[pi], a = asg[pi];
    if (!a) { if (++c.miss > 6) c.has = false; continue; }
    c.miss = 0; c.has = true; c.lastCx = a.W.cx; c.seenAt = now; c.ang = c.fAng.filter(a.W.ang, t); c.h = c.fH.filter(a.W.h, t); c.sep = a.W.sep; drawn.push({ h: a.h, pi });
    if (state === 'calib') calibStepCam(pi); else if (state === 'play' || state === 'count') applyCamInput(pi);
  }
  drawSkel(drawn);
  const all = CP.slice(0, camPlayers).every(c => c.has), any = CP.slice(0, camPlayers).some(c => c.has); $('camBox').classList.toggle('has', all);
  if (!all) $('camLab').textContent = camPlayers === 2 ? (any ? 'Salah satu pemain belum terlihat' : 'Kedua pemain & tangan harus terlihat') : 'Kedua tangan & bahu harus terlihat';
}
function calibStepCam(pi) {
  const c = CP[pi], bar = $(pi ? 'calBar2' : 'calBar'), txt = $(pi ? 'calS2' : 'calS'), who = camPlayers === 2 ? 'P' + (pi + 1) + ': ' : '';
  if (c.base.ok) { bar.style.width = '100%'; txt.textContent = who + 'Siap ✔'; return; }
  if (c.sep < 0.9 || c.sep > 4.5) { c.calib = []; bar.style.width = '0%'; txt.textContent = who + (c.sep < 0.9 ? 'Tangan terlalu dekat — pegang setir dengan kedua tangan agak terpisah.' : 'Tangan terlalu berjauhan — dekatkan seperti memegang setir.'); return; }
  c.calib.push({ a: c.ang, h: c.h }); if (c.calib.length > 22) c.calib.shift();
  const n = c.calib.length, as = c.calib.map(s => s.a), hs = c.calib.map(s => s.h);
  if (Math.max(...as) - Math.min(...as) > 0.14 || Math.max(...hs) - Math.min(...hs) > 0.22) { c.calib = c.calib.slice(-3); bar.style.width = '6%'; txt.textContent = who + 'Tahan tangan diam sebentar…'; return; }
  bar.style.width = Math.round(n / 22 * 100) + '%'; txt.textContent = who + 'Bagus! Tahan posisi setir ini…';
  if (n >= 22) {
    c.base.ang0 = as.reduce((a, b) => a + b, 0) / n; c.base.h0 = hs.reduce((a, b) => a + b, 0) / n; c.base.ok = true; bar.style.width = '100%'; txt.textContent = who + 'Siap ✔';
    if (CP.slice(0, camPlayers).every(q => q.base.ok)) { show('calibBox', false); startCountdown(); toast('Putar tangan = belok · angkat tangan = gas · turunkan = rem', 4500); }
  }
}
function applyCamInput(pi) {
  const c = CP[pi], I = pi ? input2 : input, maxA = (48 - 3 * settings.sens) * Math.PI / 180, inv = settings.invert ? -1 : 1;
  let s = clamp((c.ang - c.base.ang0) / maxA, -1, 1) * inv; if (Math.abs(s) < 0.07) s = 0;
  const dh = c.h - c.base.h0, DZ = 0.14; let th = Math.abs(dh) < DZ ? 0 : Math.sign(dh) * (Math.abs(dh) - DZ) / 0.7; th = clamp(th, -1, 1);
  I.steer += (s - I.steer) * 0.5; I.throttle += (th - I.throttle) * 0.35;
  if (pi === 0 || camPlayers === 1) $('camLab').textContent = (camPlayers === 2 ? 'P1: ' : '') + (th > 0.2 ? 'GAS' : th < -0.2 ? 'REM' : Math.abs(s) > 0.15 ? (s > 0 ? 'KANAN' : 'KIRI') : 'LURUS');
}
function camTick(dt) {   // dipanggil tiap frame: bila tangan hilang, setir kembali lurus & laju cruise
  if (!useCam || state !== 'play') return;
  for (let pi = 0; pi < camPlayers; pi++) { const lost = performance.now() - CP[pi].seenAt > 450, I = pi ? input2 : input; if (lost) { I.steer *= Math.exp(-dt * 5); I.throttle *= Math.exp(-dt * 5); } }
}
