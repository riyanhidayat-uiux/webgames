'use strict';
// ======================= KAMERA =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14', POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, lastCx: [null, null] };
const video = $('bgVideo'), fx = $('fx'), fctx = fx.getContext('2d'); let SW = innerWidth, SH = innerHeight;
function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm); if (cam.loading) return cam.loading;
  cam.loading = (async () => { const vision = await import(`${MP}/vision_bundle.mjs`), files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`); const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 2, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }); try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); } return cam.lm; })();
  cam.loading.catch(() => { cam.loading = null; }); return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Coba Mode Demo dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show'); show('bgVideo', true); show('bgGrad', false); return true;
}
function stopCamera() { cam.on = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('bgVideo', false); show('bgGrad', true); }
function imgToScreen(nx, ny) { const vw = video.videoWidth || 640, vh = video.videoHeight || 480, sc = Math.max(SW / vw, SH / vh), dw = vw * sc, dh = vh * sc; return { x: (SW - dw) / 2 + (1 - nx) * dw, y: (SH - dh) / 2 + ny * dh }; }
const LMI = { nose: 0, sL: 11, sR: 12, eL: 13, eR: 14, wL: 15, wR: 16, hL: 23, hR: 24, kL: 25, kR: 26, aL: 27, aR: 28 };
// landmark -> koordinat tubuh (satuan lebar bahu, asal tengah bahu, cermin, y atas +)
function bodyFrom(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, P = {}; for (const n in LMI) { const l = h[LMI[n]]; P[n] = { x: (1 - l.x) * vw, y: l.y * vh, v: l.visibility == null ? 1 : l.visibility, nx: l.x, ny: l.y }; }
  if (P.sL.x > P.sR.x) for (const a of ['s', 'e', 'w', 'h', 'k', 'a']) { const t = P[a + 'L']; P[a + 'L'] = P[a + 'R']; P[a + 'R'] = t; }
  const sw = Math.hypot(P.sR.x - P.sL.x, P.sR.y - P.sL.y); if (sw < 18 || P.sL.v < 0.4 || P.sR.v < 0.4) return null;
  const cx = (P.sL.x + P.sR.x) / 2, cy = (P.sL.y + P.sR.y) / 2, J = { c: { x: 0, y: 0, v: 1 } };
  for (const n in P) J[n] = { x: (P[n].x - cx) / sw, y: -(P[n].y - cy) / sw, v: P[n].v };
  J.hc = { x: (J.hL.x + J.hR.x) / 2, y: (J.hL.y + J.hR.y) / 2, v: Math.min(J.hL.v, J.hR.v) };
  return { J, raw: P, cx, sw };
}
const SKB = [['sL', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['sR', 'eR'], ['eR', 'wR'], ['sL', 'hL'], ['sR', 'hR'], ['hL', 'hR'], ['hL', 'kL'], ['kL', 'aL'], ['hR', 'kR'], ['kR', 'aR']];
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now); let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const items = ((res && res.landmarks) || []).map(h => ({ h, b: bodyFrom(h) })).filter(o => o.b); let asg = [null, null];
  if (!versus) asg[0] = items.sort((a, b) => b.b.sw - a.b.sw)[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.b.cx - b.b.cx); asg = [items[0], items[items.length - 1]]; }
  else if (items.length === 1) { const q = items[0], vw = video.videoWidth || 640, d = k => cam.lastCx[k] == null ? Infinity : Math.abs(q.b.cx - cam.lastCx[k]); const i = (d(0) === Infinity && d(1) === Infinity) ? (q.b.cx < vw / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q; }
  PLY.forEach((p, i) => { const a = asg[i]; if (a) { cam.lastCx[i] = a.b.cx; p.J = a.b.J; p.raw = a.b.raw; p.valid = true; p.miss = 0; } else if (++p.miss > 8) { p.valid = false; p.J = null; p.raw = null; } });
}
