'use strict';
// ======================= KAMERA: BIDIK DENGAN TANGAN, TENDANG DENGAN KAKI, SELAM DENGAN BADAN =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, skip: 0, cost: 0, miss: 0 };
const video = $('bgVideo'), skel = $('skel'), sctx = skel.getContext('2d');
const base = { ok: false, cx: 0, sw: 100, T: 150 }, calib = { samples: [] };
const hist = { aL: [], aR: [] }, aimHist = [], kick = { armed: false, readyT: 0, on: false, t0: 0, peak: 0, vx: 0, vy: 0, foot: 0, lockAim: null }, dv = { n: 0, last: 0 };
let camSpeed = 0, lastT = 0;
function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm); if (cam.loading) return cam.loading;
  cam.loading = (async () => { const vision = await import(`${MP}/vision_bundle.mjs`), files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`); const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 }); try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); } return cam.lm; })();
  cam.loading.catch(() => { cam.loading = null; }); return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Coba main pakai mouse dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  $('toast').classList.remove('show'); return true;
}
function stopCamera() { cam.on = false; cam.has = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('camBox', false); show('calibBox', false); }
function startCalib() { calib.samples = []; hist.aL.length = hist.aR.length = 0; aimHist.length = 0; $('calBar').style.width = '0%'; show('calibBox', true); $('calS').textContent = 'Berdiri tegak ±2,5–3 meter dari kamera sampai seluruh badan (kepala sampai kaki) terlihat, tangan turun di samping badan. Tahan sebentar…'; }
// tubuh: panjang badan T = bahu→pinggul (piksel). koordinat relatif terhadap pinggul, satuan T, y atas +, x kanan + (tampilan cermin)
function bodyFrom(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480, vis = i => h[i].visibility == null ? 1 : h[i].visibility, P = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh });
  if (vis(11) < 0.4 || vis(12) < 0.4 || vis(23) < 0.4 || vis(24) < 0.4) return null;
  const sL = P(11), sR = P(12), hL = P(23), hR = P(24), S = { x: (sL.x + sR.x) / 2, y: (sL.y + sR.y) / 2 }, H = { x: (hL.x + hR.x) / 2, y: (hL.y + hR.y) / 2 }, T = Math.hypot(S.x - H.x, S.y - H.y), sw = Math.hypot(sL.x - sR.x, sL.y - sR.y); if (T < 40) return null;
  const rel = i => { const p = P(i); return { x: (p.x - H.x) / T, y: -(p.y - H.y) / T, v: vis(i) }; };
  return { S, H, T, sw, rel: { sS: { x: (S.x - H.x) / T, y: -(S.y - H.y) / T, v: 1 }, wL: rel(15), wR: rel(16), aL: rel(27), aR: rel(28), kL: rel(25), kR: rel(26) }, ankOk: vis(27) > 0.35 && vis(28) > 0.35 };
}
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
function drawSkel(h, hot) {
  const w = skel.width, hh = skel.height; sctx.clearRect(0, 0, w, hh); if (!h) return; sctx.strokeStyle = '#7fff6a'; sctx.lineWidth = 3; sctx.lineCap = 'round';
  for (const [a, b] of BONES) { const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; sctx.beginPath(); sctx.moveTo((1 - p.x) * w, p.y * hh); sctx.lineTo((1 - q.x) * w, q.y * hh); sctx.stroke(); }
  [[27, 0], [28, 1], [15, 2], [16, 3]].forEach(([i, k]) => { const p = h[i]; if (!p || (p.visibility != null && p.visibility < 0.3)) return; sctx.fillStyle = (k < 2 && hot === k) ? '#ff5a3c' : '#ffd23f'; sctx.beginPath(); sctx.arc((1 - p.x) * w, p.y * hh, (k < 2 && hot === k) ? 9 : 5, 0, 6.283); sctx.fill(); });
}
function footSpeed(H, t) { if (H.length < 2) return { s: 0, vx: 0, vy: 0 }; const L = H[H.length - 1]; if (t - L.t > 0.15) return { s: 0, vx: 0, vy: 0 }; for (let i = H.length - 2; i >= 0; i--) if (L.t - H[i].t >= 0.07) { const d = L.t - H[i].t, vx = (L.x - H[i].x) / d, vy = (L.y - H[i].y) / d; return { s: Math.hypot(vx, vy), vx, vy }; } return { s: 0, vx: 0, vy: 0 }; }
const kickThr = () => 2.6 + (10 - settings.sens) * 0.32;
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  if (cam.skip > 0) { cam.skip--; return; }
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now); const t0 = performance.now(); let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  cam.cost = cam.cost * 0.8 + (performance.now() - t0) * 0.2; cam.skip = cam.cost > 15 ? 1 : 0;
  const h = res && res.landmarks && res.landmarks[0], B = h ? bodyFrom(h) : null;
  if (!B) { if (++cam.miss > 8 && cam.has) { cam.has = false; $('camBox').classList.remove('has'); $('camLab').textContent = 'Badan tidak terlihat'; } drawSkel(null); return; }
  cam.miss = 0; if (!cam.has) { cam.has = true; $('camBox').classList.add('has'); }
  const t = now / 1000; [['aL', B.rel.aL], ['aR', B.rel.aR]].forEach(([k, a]) => { if (a.v > 0.3) hist[k].push({ t, x: a.x, y: a.y }); while (hist[k].length && t - hist[k][0].t > 0.7) hist[k].shift(); });
  const sL = footSpeed(hist.aL, t), sR = footSpeed(hist.aR, t); drawSkel(h, kick.on ? kick.foot : (sL.s > sR.s ? 0 : 1));
  if (state === 'calib') calibStep(B); else if (state === 'ready' && A) { if (A.role === 'kick' && A.phase === 'ready') kickStep(B, t, sL, sR); else if (A.role === 'defend' && (A.phase === 'ready' || A.phase === 'approach')) defendStep(B); }
}
function calibStep(B) {
  if (!B.ankOk) { calib.samples = []; $('calBar').style.width = '0%'; $('calS').textContent = 'Kakimu belum terlihat. Mundur sampai seluruh badan, termasuk kaki, masuk layar.'; return; }
  calib.samples.push({ cx: B.S.x, T: B.T, sw: B.sw }); if (calib.samples.length > 22) calib.samples.shift(); const n = calib.samples.length, xs = calib.samples.map(s => s.cx), ts = calib.samples.map(s => s.T);
  if (Math.max(...xs) - Math.min(...xs) > B.sw * 0.2 || Math.max(...ts) - Math.min(...ts) > B.T * 0.15) { calib.samples = calib.samples.slice(-3); $('calBar').style.width = '6%'; $('calS').textContent = 'Diam sebentar, berdiri tegak…'; return; }
  $('calBar').style.width = Math.round(n / 22 * 100) + '%'; $('calS').textContent = 'Bagus! Tahan posisi ini…';
  if (n >= 22) { base.cx = xs.reduce((a, b) => a + b, 0) / n; base.T = ts.reduce((a, b) => a + b, 0) / n; base.sw = calib.samples.reduce((a, s) => a + s.sw, 0) / n; base.ok = true; show('calibBox', false); toast('Siap! Tunjuk sasaran dengan satu tangan lalu tendang.', 4000); beginAttempt(); }
}
// --- menendang: bidik dengan tangan terentang, tendang dengan ayunan kaki ---
function kickStep(B, t, sL, sR) {
  const dt = Math.min(0.1, Math.max(0, t - lastT)); lastT = t; const thr = kickThr(), R = B.rel;
  // 1) bidik: tangan yang paling terentang dari bahu
  const arm = w => ({ x: w.x - R.sS.x, y: w.y - R.sS.y, v: w.v }), aL = arm(R.wL), aR = arm(R.wR), eL = aL.v > 0.3 ? Math.hypot(aL.x, aL.y) : 0, eR = aR.v > 0.3 ? Math.hypot(aR.x, aR.y) : 0, best = eR >= eL ? aR : aL, e = Math.max(eL, eR);
  if (e > 0.7 && !kick.on) { const tx = clamp(best.x / 1.0, -1.15, 1.15) * 3.5, ty = lerp(0.3, 2.3, clamp((best.y + 0.9) / 1.8, 0, 1)); AIM.x += (tx - AIM.x) * 0.3; AIM.y += (ty - AIM.y) * 0.3; }
  aimHist.push({ t, x: AIM.x, y: AIM.y }); while (aimHist.length && t - aimHist[0].t > 1.0) aimHist.shift();
  // 2) siap bila kedua kaki diam
  const mx = Math.max(sL.s, sR.s); camSpeed = mx;
  if (!kick.on) {
    if (mx < 1.6) { kick.readyT += dt; if (kick.readyT > 0.45 && A.t > 1.0) kick.armed = true; } else if (mx < thr) { kick.readyT = 0; } 
    $('camLab').textContent = kick.armed ? (e > 0.7 ? 'Siap — tendang!' : 'Rentangkan tangan ke sasaran') : 'Berdiri diam sebentar…';
    if (kick.armed && mx > thr) { kick.on = true; kick.t0 = t; kick.peak = mx; const s = sL.s >= sR.s ? sL : sR; kick.foot = sL.s >= sR.s ? 0 : 1; kick.vx = s.vx; kick.vy = s.vy; const lk = aimHist.find(a => a.t >= t - 0.35) || aimHist[0]; kick.lockAim = lk ? { x: lk.x, y: lk.y } : { x: AIM.x, y: AIM.y }; }
  } else {
    const s = kick.foot ? sR : sL; if (s.s > kick.peak) { kick.peak = s.s; kick.vx = s.vx; kick.vy = s.vy; }
    if (t - kick.t0 > 0.28) {
      const p = clamp((kick.peak - thr) / (thr * 1.4), 0, 1), r = Math.hypot(kick.vx, kick.vy) || 1, curve = clamp(kick.vx / r * 1.3, -1, 1), loft = clamp((kick.vy / r - 0.6) * 1.5, -1, 1), a = kick.lockAim || { x: AIM.x, y: AIM.y };
      userKick({ aimX: a.x, aimY: a.y, power: Math.max(0.15, p), curve: kick.foot === 1 ? curve : curve, loft, left: kick.foot === 0, quick: true }); kick.on = false; kick.armed = false; kick.readyT = 0; hist.aL.length = hist.aR.length = 0;
    }
  }
  $('spdFill').style.width = clamp(mx / (thr * 2.6), 0, 1) * 100 + '%'; $('spdThr').style.left = (100 / 2.6) + '%';
}
// --- bertahan: miringkan badan ke samping untuk menyelam ---
function defendStep(B) {
  if (A.userDive) { $('camLab').textContent = 'Menyelam!'; return; }
  const lean = (B.S.x - base.cx) / base.sw, R = B.rel, wy = Math.min(R.wL.v > 0.3 ? R.wL.y - R.sS.y : -9, R.wR.v > 0.3 ? R.wR.y - R.sS.y : -9), wyMax = Math.max(R.wL.y - R.sS.y, R.wR.y - R.sS.y), bothUp = wy > 0.25;
  let dir = 0, hi = 0.45; if (Math.abs(lean) > 0.55) { dir = sgn(lean); hi = wyMax > 0.5 ? 1 : (R.wL.y < -0.7 && R.wR.y < -0.7 && wyMax < -0.2 ? 0.2 : 0.45); }
  else if (bothUp && wy > 0.9) { dir = 0; hi = 1; } else { dv.n = 0; $('camLab').textContent = 'Miringkan badan untuk menyelam'; return; }
  if (++dv.n >= 2 && A.t > 0.6) { userDive(dir, hi); dv.n = 0; }
}
