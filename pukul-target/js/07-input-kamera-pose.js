'use strict';
// ======================= INPUT: KAMERA (POSE 1-2 ORANG) =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, lastCx: [null, null] };
const video = $('bgVideo'), fx = $('fx'), fctx = fx.getContext('2d');
function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm); if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`), files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })();
  cam.loading.catch(() => { cam.loading = null; }); return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode Mouse/Sentuhan dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show'); show('bgVideo', true); show('bgGrad', false); return true;
}
function stopCamera() { cam.on = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('bgVideo', false); show('bgGrad', true); }
// koordinat gambar kamera (dicerminkan, object-fit: cover) -> piksel layar
function imgToScreen(nx, ny) { const vw = video.videoWidth || 640, vh = video.videoHeight || 480, sc = Math.max(SW / vw, SH / vh), dw = vw * sc, dh = vh * sc; return { x: (SW - dw) / 2 + (1 - nx) * dw, y: (SH - dh) / 2 + ny * dh }; }
function personFromLandmarks(h) {
  const P = i => { const q = imgToScreen(h[i].x, h[i].y); q.v = h[i].visibility == null ? 1 : h[i].visibility; return q; }, ok = (q, v = 0.3) => q.v > v;
  const L = {}; for (const i of [0, 11, 12, 13, 14, 15, 16, 19, 20, 23, 24, 25, 26, 27, 28]) L[i] = P(i);
  if (!ok(L[11], 0.4) || !ok(L[12], 0.4)) return null;
  const sww = Math.hypot(L[11].x - L[12].x, L[11].y - L[12].y); if (sww < SH * 0.04) return null;
  const hr = HR() * settings.size, pts = [], add = (q, r, kind) => pts.push({ x: q.x, y: q.y, r, kind }), mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  if (ok(L[0])) add(L[0], hr * 1.2, 'head');
  for (const s of [[13, 15, 19], [14, 16, 20]]) { const e = L[s[0]], w = L[s[1]], ix = L[s[2]];
    if (ok(e)) add(e, hr * 0.95, 'elbow'); if (ok(w)) { add(w, hr, 'hand'); if (ok(e)) add(mid(e, w), hr * 0.8, 'arm'); }
    if (ok(ix) && ok(w)) { add(ix, hr, 'hand'); add({ x: w.x + (ix.x - w.x) * 1.9, y: w.y + (ix.y - w.y) * 1.9 }, hr, 'hand'); } }
  for (const i of [25, 26, 27, 28]) if (ok(L[i], 0.55)) add(L[i], hr * 1.15, 'foot');
  const bones = [[11, 12], [11, 13], [13, 15], [15, 19], [12, 14], [14, 16], [16, 20], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]].filter(([a, b]) => L[a] && L[b] && ok(L[a]) && ok(L[b])).map(([a, b]) => [L[a], L[b]]);
  return { pts, bones, cx: (L[11].x + L[12].x) / 2, cy: (L[11].y + L[12].y) / 2, sww, nose: ok(L[0]) ? L[0] : null };
}
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const items = ((res && res.landmarks) || []).map(h => ({ h, p: personFromLandmarks(h) })).filter(o => o.p);
  let asg = [null, null];
  if (!versus) asg[0] = items.sort((a, b) => b.p.sww - a.p.sww)[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.p.cx - b.p.cx); asg = [items[0], items[items.length - 1]]; }
  else if (items.length === 1) { const q = items[0], d = k => cam.lastCx[k] == null ? Infinity : Math.abs(q.p.cx - cam.lastCx[k]); const i = (d(0) === Infinity && d(1) === Infinity) ? (q.p.cx < SW / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q; }
  for (let i = 0; i < NP(); i++) {
    const pl = PL[i], a = asg[i];
    if (a) { cam.lastCx[i] = a.p.cx; const k = 0.6; pl.cx = pl.valid ? lerp(pl.cx, a.p.cx, k) : a.p.cx; pl.cy = pl.valid ? lerp(pl.cy, a.p.cy, k) : a.p.cy; pl.sww = pl.valid ? lerp(pl.sww, a.p.sww, k) : a.p.sww; pl.pts = a.p.pts; pl.bones = a.p.bones; pl.nose = a.p.nose; pl.valid = true; pl.seen = elapsed; pl.miss = 0; }
    else if (++pl.miss > 8) { pl.valid = false; pl.pts = []; pl.bones = []; pl.nose = null; }
  }
}
