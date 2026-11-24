'use strict';
// ======================= INPUT: KAMERA (POSE) =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, miss: 0, lastT: 0, lastCx: [null, null] };
const video = $('camVideo'), skel = $('skel'), sctx = skel.getContext('2d');
const mkBase = () => ({ cx: 0, cy: 0, sw: 1, ny: 0, ok: false }); const bases = [mkBase(), mkBase()], calibs = [{ samples: [] }, { samples: [] }], calDone = [false, false], pmiss = [0, 0]; const base = bases[0], calib = calibs[0];
const mkHand = () => ({ valid: false, w: { x: 0, y: -0.3, z: 0 }, prev: null, A: 1, vA: 0, cd: 0, vx: 0, vy: 0, hist: [] });
const HS = [[mkHand(), mkHand()], [mkHand(), mkHand()]]; const hands = HS[0];       // [kiri layar, kanan layar] per pemain
const th = () => 1.5 - 0.1 * settings.sens;        // pengali ambang (sens 5 = 1.0)
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
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode Keyboard dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show'); return true;
}
function stopCamera() { cam.on = false; cam.has = false; camStates.forEach(c => { c.guard = false; c.lean = 0; c.duck = false; }); HS.forEach(hh => hh.forEach(h => { h.valid = false; h.prev = null; })); if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('camBox', false); show('calibBox', false); }
const SKB = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]];
function drawSkeleton(list, asg) { const W = skel.width, H = skel.height; sctx.clearRect(0, 0, W, H); (list || []).forEach(h => { const idx = asg ? asg.findIndex(q => q && q.h === h) : -1, col = idx < 0 || !versus ? '#7fff6a' : (idx === 0 ? '#ffb35a' : '#6fc8ff'); sctx.strokeStyle = col; sctx.lineWidth = 3; sctx.lineCap = 'round'; for (const [a, b] of SKB) { const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; sctx.beginPath(); sctx.moveTo((1 - p.x) * W, p.y * H); sctx.lineTo((1 - q.x) * W, q.y * H); sctx.stroke(); } sctx.fillStyle = '#ffd23f'; [0, 15, 16].forEach(i => { const p = h[i]; if (p && (p.visibility == null || p.visibility > 0.3)) { sctx.beginPath(); sctx.arc((1 - p.x) * W, p.y * H, 5, 0, 6.283); sctx.fill(); } }); }); }
// ubah landmark -> fitur tubuh (satuan lebar bahu; z>0 = ke arah kamera)
function features(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, Q = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh, z: h[i].z * vw, v: h[i].visibility == null ? 1 : h[i].visibility });
  let sL = Q(11), sR = Q(12), eL = Q(13), eR = Q(14), wL = Q(15), wR = Q(16); const nose = Q(0);
  if (sL.x > sR.x) { [sL, sR] = [sR, sL]; [eL, eR] = [eR, eL]; [wL, wR] = [wR, wL]; }
  const sw = Math.hypot(sR.x - sL.x, sR.y - sL.y); if (sw < 20 || sL.v < 0.4 || sR.v < 0.4 || nose.v < 0.3) return null;
  const cx = (sL.x + sR.x) / 2, cy = (sL.y + sR.y) / 2, zc = (sL.z + sR.z) / 2, rel = p => ({ x: (p.x - cx) / sw, y: -(p.y - cy) / sw, z: -(p.z - zc) / sw, v: p.v });
  return { sw, cx, cy, nose: rel(nose), noseY: nose.y, wl: rel(wL), wr: rel(wR), el: rel(eL), er: rel(eR), sl: rel(sL), sr: rel(sR) };
}
function trackHand(hd, w, s, now, side, pi = 0) {
  if (w.v < 0.3) { hd.valid = false; hd.prev = null; return; }
  const dt = hd.prev ? Math.max(0.012, (now - hd.prev.t) / 1000) : 0.033;
  const A = Math.hypot(w.x - s.x, w.y - s.y, clamp(w.z, -1, 1.6)), sm = hd.prev ? hd.A + (A - hd.A) * 0.65 : A;
  const vA = hd.prev ? (sm - hd.A) / dt : 0, vx = hd.prev ? (w.x - hd.prev.x) / dt : 0, vy = hd.prev ? (w.y - hd.prev.y) / dt : 0;
  hd.valid = true; hd.w = { x: w.x, y: w.y, z: w.z }; hd.A = sm; hd.vA = vA; hd.vx = lerpV(hd.vx, vx); hd.vy = lerpV(hd.vy, vy); hd.cd = Math.max(0, hd.cd - dt); hd.prev = { x: w.x, y: w.y, t: now };
  hd.hist.push({ t: now, y: w.y }); while (hd.hist.length && now - hd.hist[0].t > 450) hd.hist.shift();
  if (state === 'fight' && hd.cd <= 0) {
    const T = th(), speed = Math.hypot(hd.vx, hd.vy, vA);
    const minY = Math.min(...hd.hist.map(q => q.y));
    const inward = side < 0 ? hd.vx > 0 : hd.vx < 0;
    let kind = null;
    if (hd.vy > 3.0 * T && Math.abs(hd.vx) < hd.vy * 0.9 && minY < w.y - 0.35 && w.y > -0.5) kind = 'upper';
    else if (Math.abs(hd.vx) > 3.4 * T && Math.abs(hd.vx) > 1.4 * Math.abs(hd.vy) && inward && Math.abs(w.y) < 1.1 && sm > 0.55) kind = 'hook';
    else if (vA > 2.8 * T && sm > 0.9 && hd.vy > -0.55 * vA) kind = 'jab';     // bukan gerakan menurunkan tangan
    if (kind) { hd.cd = kind === 'hook' ? 0.55 : 0.42; if (versus) vsPunch(pi, kind, side < 0 ? 0 : 1, clamp(speed / (5 * T), 0.6, 1.4)); else playerPunch(kind, side < 0 ? 0 : 1, clamp(speed / (5 * T), 0.6, 1.4)); }
  }
}
const lerpV = (a, b) => a + (b - a) * 0.6;
const NPc = () => versus ? 2 : 1;
function processPerson(i, f, now) {
  const cs = camStates[i], hs = HS[i], bs = bases[i], cal = calibs[i], bar = $(i ? 'calBar2' : 'calBar'), txt = $(i ? 'calS2' : 'calS'), who = versus ? 'P' + (i + 1) + ': ' : '';
  if (!f) { if (++pmiss[i] > 8) { cs.guard = false; hs.forEach(x => { x.valid = false; x.prev = null; }); if (state === 'calib') { cal.samples = []; calDone[i] = false; bar.style.width = '0%'; txt.textContent = who + 'Tubuh belum terlihat. Mundur sedikit sampai kepala, bahu, dan kedua tangan masuk layar.'; } } return; }
  pmiss[i] = 0;
  if (state === 'calib') {
    if (calDone[i]) { bar.style.width = '100%'; txt.textContent = who + 'Siap ✔'; return; }
    cal.samples.push({ cx: f.cx, cy: f.cy, sw: f.sw, ny: f.noseY }); if (cal.samples.length > 24) cal.samples.shift();
    const n = cal.samples.length, xs = cal.samples.map(q => q.cx), ys = cal.samples.map(q => q.cy), sws = cal.samples.map(q => q.sw);
    const dGuard = Math.max(Math.hypot(f.wl.x - f.nose.x, f.wl.y - f.nose.y), Math.hypot(f.wr.x - f.nose.x, f.wr.y - f.nose.y));
    const ok = f.wl.v > 0.4 && f.wr.v > 0.4 && dGuard < 1.6, stable = Math.max(...xs) - Math.min(...xs) < f.sw * 0.25 && Math.max(...ys) - Math.min(...ys) < f.sw * 0.25;
    if (!ok) { cal.samples = []; bar.style.width = '0%'; txt.textContent = who + 'Angkat kedua kepalan ke dekat wajah (posisi siap bertinju) agar terlihat kamera…'; return; }
    if (!stable) { cal.samples = cal.samples.slice(-3); bar.style.width = '5%'; txt.textContent = who + 'Diamlah sebentar dalam posisi siap bertinju…'; return; }
    txt.textContent = who + 'Bagus! Tahan posisi ini…'; bar.style.width = Math.round(n / 24 * 100) + '%';
    if (n >= 24) { const av = a => a.reduce((x, y) => x + y, 0) / a.length; bs.cx = av(xs); bs.cy = av(ys); bs.sw = av(sws); bs.ny = av(cal.samples.map(q => q.ny)); bs.ok = true; calDone[i] = true; }
    return;
  }
  if (!bs.ok) return;
  // tangkis: kedua kepalan dekat wajah
  const dl = Math.hypot(f.wl.x - f.nose.x, f.wl.y - f.nose.y), dr = Math.hypot(f.wr.x - f.nose.x, f.wr.y - f.nose.y), still = Math.abs(hs[0].vx) + Math.abs(hs[1].vx) < 6 * th();
  if (!cs.guard && dl < 1.0 && dr < 1.0 && f.wl.v > 0.3 && f.wr.v > 0.3 && still) cs.guard = true; else if (cs.guard && (dl > 1.4 || dr > 1.4)) cs.guard = false;
  // menghindar: bergeser samping / merunduk (dibanding posisi kalibrasi)
  const lx = (f.cx - bs.cx) / bs.sw, dd = (f.cy - bs.cy) / bs.sw;
  if (cs.lean === 0) { if (lx < -0.42) cs.lean = -1; else if (lx > 0.42) cs.lean = 1; } else if (Math.abs(lx) < 0.2) cs.lean = 0;
  if (!cs.duck && dd > 0.42) cs.duck = true; else if (cs.duck && dd < 0.2) cs.duck = false;
  trackHand(hs[0], f.wl, f.sl, now, -1, i); trackHand(hs[1], f.wr, f.sr, now, 1, i);
}
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const list = (res && res.landmarks) || [], items = list.map(h => ({ h, f: features(h) })).filter(o => o.f);
  let asg = [null, null];
  if (!versus) asg[0] = items.sort((a, b) => b.f.sw - a.f.sw)[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.f.cx - b.f.cx); asg = [items[0], items[items.length - 1]]; }
  else if (items.length === 1) { const q = items[0], vw = video.videoWidth || 640, d = k => cam.lastCx[k] == null ? Infinity : Math.abs(q.f.cx - cam.lastCx[k]); const i = (d(0) === Infinity && d(1) === Infinity) ? (q.f.cx < vw / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q; }
  drawSkeleton(list, asg);
  const any = asg.some(a => a); if (cam.has !== any) { cam.has = any; $('camBox').classList.toggle('has', any); }
  for (let i = 0; i < NPc(); i++) { if (asg[i]) cam.lastCx[i] = asg[i].f.cx; processPerson(i, asg[i] ? asg[i].f : null, now); }
  if (state === 'calib' && calDone.slice(0, NPc()).every(x => x)) { show('calibBox', false); if (versus) startVersus(); else startRounds(); }
}
