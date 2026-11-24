'use strict';
// ======================= KAMERA (POSE 1-2 ORANG) =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, lastCx: [null, null] };
const video = $('bgVideo'), fx = $('fx'), fctx = fx.getContext('2d');
let SW = innerWidth, SH = innerHeight;
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
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Coba Mode Demo dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show'); show('bgVideo', true); show('bgGrad', false); return true;
}
function stopCamera() { cam.on = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('bgVideo', false); show('bgGrad', true); show('calibBox', false); }
function imgToScreen(nx, ny) { const vw = video.videoWidth || 640, vh = video.videoHeight || 480, sc = Math.max(SW / vw, SH / vh), dw = vw * sc, dh = vh * sc; return { x: (SW - dw) / 2 + (1 - nx) * dw, y: (SH - dh) / 2 + ny * dh }; }
// fitur tubuh: satuan T (panjang bahu->pinggul), asal tengah pinggul; scr = posisi layar (untuk gambar)
function features(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, Q = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh, v: h[i].visibility == null ? 1 : h[i].visibility, nx: h[i].x, ny: h[i].y });
  const P = {}; const names = { nose: 0, sL: 11, sR: 12, eL: 13, eR: 14, wL: 15, wR: 16, hL: 23, hR: 24, kL: 25, kR: 26, aL: 27, aR: 28 }; for (const n in names) P[n] = Q(names[n]);
  if (P.sL.x > P.sR.x) for (const a of ['s', 'e', 'w', 'h', 'k', 'a']) { const t = P[a + 'L']; P[a + 'L'] = P[a + 'R']; P[a + 'R'] = t; }
  if (!(P.sL.v > 0.4 && P.sR.v > 0.4 && P.hL.v > 0.4 && P.hR.v > 0.4)) return null;
  const S = { x: (P.sL.x + P.sR.x) / 2, y: (P.sL.y + P.sR.y) / 2 }, H = { x: (P.hL.x + P.hR.x) / 2, y: (P.hL.y + P.hR.y) / 2 }, T = Math.hypot(S.x - H.x, S.y - H.y); if (T < 25) return null;
  const f = { T, cx: H.x, raw: P }; for (const n in P) f[n] = { x: (P[n].x - H.x) / T, y: -(P[n].y - H.y) / T, v: P[n].v };
  const sc = imgToScreen(((P.sL.nx + P.sR.nx) / 2 + (P.hL.nx + P.hR.nx) / 2) / 2, ((P.sL.ny + P.sR.ny) / 2 + (P.hL.ny + P.hR.ny) / 2) / 2), s2 = imgToScreen(1 - 0, 0), s3 = imgToScreen(0, 0); f.scr = { x: sc.x, y: sc.y, T: Math.abs(s2.x - s3.x) / vw * T }; return f;
}
function calibStep(p, f) {
  const bar = $(p.i ? 'calBar2' : 'calBar'), txt = $(p.i ? 'calS2' : 'calS'), who = versus ? 'P' + (p.i + 1) + ': ' : '';
  if (p.calOk) { bar.style.width = '100%'; txt.textContent = who + 'Siap ✔'; return; }
  const kneesOk = f.kL.v > 0.5 && f.kR.v > 0.5, ankOk = f.aL.v > 0.4 && f.aR.v > 0.4, armsDown = f.wL.v > 0.3 && f.wR.v > 0.3 && Math.max(f.wL.y, f.wR.y) < 0.6;
  if (!kneesOk) { p.cal = []; bar.style.width = '0%'; txt.textContent = who + 'Badan bawahmu belum terlihat. Mundur sampai lutut dan kaki masuk layar.'; return; }
  if (!armsDown) { p.cal = []; bar.style.width = '5%'; txt.textContent = who + 'Berdiri tegak dengan tangan lurus di samping badan.'; return; }
  p.cal.push({ sep: Math.abs(f.aL.x - f.aR.x), ksep: Math.abs(f.kL.x - f.kR.x), dy: (f.hL.y + f.hR.y) / 2 - (f.kL.y + f.kR.y) / 2, krL: f.kL.y - f.hL.y, krR: f.kR.y - f.hR.y, ank: ankOk }); if (p.cal.length > 22) p.cal.shift();
  const n = p.cal.length, dys = p.cal.map(q => q.dy), stable = Math.max(...dys) - Math.min(...dys) < 0.12;
  if (!stable) { p.cal = p.cal.slice(-3); bar.style.width = '8%'; txt.textContent = who + 'Diam sebentar sambil berdiri tegak…'; return; }
  txt.textContent = who + (ankOk ? 'Bagus! Tahan posisi ini…' : 'Bagus (kaki belum terlihat penuh — gerakan kaki dinilai dari lutut). Tahan…'); bar.style.width = Math.round(n / 22 * 100) + '%';
  if (n >= 22) { const av = k => p.cal.reduce((a, q) => a + q[k], 0) / p.cal.length; Object.assign(p.base, { sep0: av('sep'), ksep0: av('ksep'), dy0: av('dy'), krL: av('krL'), krR: av('krR'), ok: true }); p.calOk = true; }
}
function processPerson(p, f, now) {
  if (!f) { if (++p.miss > 8) { p.valid = false; p.f = null; if (state === 'calib') { p.cal = []; p.calOk = false; $(p.i ? 'calBar2' : 'calBar').style.width = '0%'; $(p.i ? 'calS2' : 'calS').textContent = (versus ? 'P' + (p.i + 1) + ': ' : '') + 'Tubuh belum terlihat. Mundur sampai seluruh badan masuk layar.'; } } return; }
  p.miss = 0; p.valid = true; p.f = f; if (state === 'calib') { calibStep(p, f); return; }
  if (state === 'work' && p.base.ok && !p.done) judge(p, f, now);
}
const pmFns = {};
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const items = ((res && res.landmarks) || []).map(h => ({ h, f: features(h) })).filter(o => o.f);
  let asg = [null, null];
  if (!versus) asg[0] = items.sort((a, b) => b.f.T - a.f.T)[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.f.cx - b.f.cx); asg = [items[0], items[items.length - 1]]; }
  else if (items.length === 1) { const q = items[0], vw = video.videoWidth || 640, d = k => cam.lastCx[k] == null ? Infinity : Math.abs(q.f.cx - cam.lastCx[k]); const i = (d(0) === Infinity && d(1) === Infinity) ? (q.f.cx < vw / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q; }
  PLY.forEach((p, i) => { if (asg[i]) cam.lastCx[i] = asg[i].f.cx; processPerson(p, asg[i] ? asg[i].f : null, now / 1000); });
  if (state === 'calib' && PLY.every(p => p.calOk)) { show('calibBox', false); startProgram(); }
}
