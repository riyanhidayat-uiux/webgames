'use strict';
// ======================= KAMERA & DETEKSI AYUNAN =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, miss: 0, has: false };
const video = $('bgVideo'), skel = $('skel'), sctx = skel.getContext('2d');
const base = { ok: false, cx: 0.5, sw: 100 }, calib = { samples: [] }, hist = [[], []], swing = { on: false, t0: 0, peak: 0, pvx: 0, pvy: 0, hand: 0 };
let readyT = 0, slowT = 0, armed = false, lastT = 0, camSpeed = 0, fcx = null;
function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm); if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`), files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })(); cam.loading.catch(() => { cam.loading = null; }); return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Coba main tanpa kamera dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  $('toast').classList.remove('show'); return true;
}
function stopCamera() { cam.on = false; cam.has = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('camBox', false); show('calibBox', false); }
function readyReset() { fcx = null; readyT = 0; slowT = 0; armed = false; swing.on = false; hist[0].length = 0; hist[1].length = 0; camSpeed = 0; }
function startCalib() { calib.samples = []; show('calibBox', true); $('calS').textContent = 'Berdirilah tegak di depan kamera, kepala sampai lengan terlihat. Tahan sebentar…'; $('calBar').style.width = '0%'; }
// tubuh dalam piksel video; pergelangan dinyatakan dalam lebar bahu dari titik tengah bahu (x kanan+ pada tampilan cermin, y atas+)
function bodyFrom(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, vis = i => h[i].visibility == null ? 1 : h[i].visibility;
  if (vis(11) < 0.4 || vis(12) < 0.4) return null;
  const P = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh }), a = P(11), b = P(12), sw = Math.hypot(a.x - b.x, a.y - b.y); if (sw < 24) return null;
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, wr = i => { const p = P(i); return { x: (p.x - cx) / sw, y: -(p.y - cy) / sw, v: vis(i) }; };
  return { cx, cy, sw, w: [wr(15), wr(16)] };
}
function handSpeed(k, t) {
  const H = hist[k]; if (H.length < 2) return { s: 0, vx: 0, vy: 0 }; const L = H[H.length - 1]; if (t - L.t > 0.15) return { s: 0, vx: 0, vy: 0 };
  for (let i = H.length - 2; i >= 0; i--) if (L.t - H[i].t >= 0.09) { const d = L.t - H[i].t, vx = (L.x - H[i].x) / d, vy = (L.y - H[i].y) / d; return { s: Math.hypot(vx, vy), vx, vy }; }
  return { s: 0, vx: 0, vy: 0 };
}
const swingThr = () => 2.4 + (10 - settings.sens) * 0.25;     // sw/detik; peka 10 = 2.4, peka 1 = 4.65
const SKB = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]];
function drawSkel(h, sp) {
  const W = skel.width, H = skel.height; sctx.clearRect(0, 0, W, H); if (!h) return;
  sctx.strokeStyle = '#7fff6a'; sctx.lineWidth = 3; sctx.lineCap = 'round';
  for (const [a, b] of SKB) { const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; sctx.beginPath(); sctx.moveTo((1 - p.x) * W, p.y * H); sctx.lineTo((1 - q.x) * W, q.y * H); sctx.stroke(); }
  [15, 16].forEach((i, k) => { const p = h[i]; if (!p || (p.visibility != null && p.visibility < 0.3)) return; const hot = sp && sp[k] > swingThr(); sctx.fillStyle = hot ? '#ff5a3c' : '#ffd23f'; sctx.beginPath(); sctx.arc((1 - p.x) * W, p.y * H, hot ? 9 : 6, 0, 6.283); sctx.fill(); });
}
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  if (cam.skip > 0) { cam.skip--; return; }          // deteksi berat: lewati satu frame agar render tetap mulus
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  const t0 = performance.now(); let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  cam.cost = (cam.cost || 0) * 0.8 + (performance.now() - t0) * 0.2; cam.skip = cam.cost > 15 ? 1 : 0;
  const h = res && res.landmarks && res.landmarks[0], B = h ? bodyFrom(h) : null;
  if (!B) { if (++cam.miss > 8 && cam.has) { cam.has = false; $('camBox').classList.remove('has'); $('camLab').textContent = 'Tubuh tidak terlihat'; } drawSkel(null); return; }
  cam.miss = 0; if (!cam.has) { cam.has = true; $('camBox').classList.add('has'); }
  const t = now / 1000; [0, 1].forEach(k => { const w = B.w[k], H = hist[k]; if (w.v > 0.3) H.push({ t, x: w.x, y: w.y }); while (H.length && t - H[0].t > 0.7) H.shift(); });
  const sp = [handSpeed(0, t), handSpeed(1, t)]; drawSkel(h, [sp[0].s, sp[1].s]);
  if (state === 'calib') calibStep(B); else if (state === 'ready' || state === 'swing') playStep(B, t, sp);
}
function calibStep(B) {
  calib.samples.push({ cx: B.cx, sw: B.sw }); if (calib.samples.length > 20) calib.samples.shift();
  const n = calib.samples.length, xs = calib.samples.map(s => s.cx), stable = Math.max(...xs) - Math.min(...xs) < B.sw * 0.12;
  if (!stable) { calib.samples = calib.samples.slice(-3); $('calBar').style.width = '5%'; $('calS').textContent = 'Diam sebentar, berdiri tegak menghadap kamera…'; return; }
  $('calBar').style.width = Math.round(n / 20 * 100) + '%'; $('calS').textContent = 'Bagus! Tahan posisi ini…';
  if (n >= 20) { base.cx = xs.reduce((a, b) => a + b, 0) / n; base.sw = calib.samples.reduce((a, s) => a + s.sw, 0) / n; base.ok = true; show('calibBox', false); state = 'ready'; readyReset(); toast('Geser badan untuk memilih posisi, lalu AYUNKAN lengan dengan cepat!', 4000); }
}
function playStep(B, t, sp) {
  const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t; const thr = swingThr();
  const pick = settings.hand === 1 ? 1 : settings.hand === 2 ? 0 : (sp[0].s > sp[1].s ? 0 : 1);
  if (state === 'ready') {
    if (fcx === null) fcx = B.cx; fcx += (B.cx - fcx) * (1 - Math.exp(-dt * 14));          // saring getaran landmark
    const tx = clamp((fcx - base.cx) / base.sw * 0.55, -0.85, 0.85), err = tx - aimX;
    if (Math.abs(err) > 0.004) aimX += err * (1 - Math.exp(-dt * (4 + Math.abs(err) * 30)));   // pelan saat nyaris diam, cepat saat bergeser
    const s = sp[pick], mx = Math.max(sp[0].s, sp[1].s); camSpeed = s.s;
    if (mx < 1.5) { readyT += dt; slowT = 0; if (readyT > 0.5) armed = true; }                    // lengan diam cukup lama -> siap
    else if (mx < thr) { slowT += dt; if (slowT > 0.5) { armed = false; readyT = 0; } }           // gerakan pelan yang lama membatalkan siap
    $('camLab').textContent = armed ? 'SIAP — ayunkan lengan!' : 'Tahan lengan diam dulu…';
    if (armed && s.s > thr) { swing.on = true; swing.t0 = t; swing.peak = s.s; swing.pvx = s.vx; swing.pvy = s.vy; swing.hand = pick; state = 'swing'; }
  } else if (state === 'swing') {
    const s = sp[swing.hand]; camSpeed = s.s; if (s.s > swing.peak) { swing.peak = s.s; swing.pvx = s.vx; swing.pvy = s.vy; }
    $('camLab').textContent = 'Ayunan terbaca…';
    if (t - swing.t0 > 0.4) {
      const p = clamp((swing.peak - thr) / (thr * 1.5), 0, 1), ratio = clamp(swing.pvx / Math.max(0.1, swing.peak), -1, 1);
      launch(aimX, ratio * 0.03, ratio * 0.8, lerp(POWER_MIN, POWER_MAX, p)); readyReset(); $('camLab').textContent = '';
    }
  }
  $('spdFill').style.width = clamp(camSpeed / (thr * 2.5), 0, 1) * 100 + '%'; $('spdThr').style.left = (100 / 2.5) + '%';
}
