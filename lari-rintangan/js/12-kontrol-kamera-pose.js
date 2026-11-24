'use strict';
// ---------- kontrol: kamera (pose tubuh) ----------
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, miss: 0 };
const video = $('camVideo'), skel = $('skel'), sctx = skel.getContext('2d');
const base = { cx: 0.5, cy: 0.5, sw: 0.25, ok: false };
const calib = { samples: [], t: 0 };
const sm = { mx: 0.5, my: 0.5, init: false };
let jumpArmed = true, duckHeld = false, lastJumpT = -9999, lastFlashT = -9999;
const hist = [];

function loadPose() {
  if (cam.lm) return Promise.resolve(cam.lm);
  if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: POSE_MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('GPU')); }
    catch (e) { cam.lm = await vision.PoseLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })();
  cam.loading.catch(() => { cam.loading = null; });
  return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode Keyboard/Sentuhan dulu.'); return false;
  }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try {
    if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    video.srcObject = cam.stream; await video.play().catch(() => {});
  } catch (e) {
    stopCamera(); $('toast').classList.remove('show');
    const n = e && e.name;
    menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).');
    return false;
  }
  try { await loadPose(); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  $('toast').classList.remove('show');
  return true;
}
function stopCamera() {
  cam.on = false; cam.has = false;
  if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; }
  video.srcObject = null; show('camBox', false); show('calibBox', false);
}

const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]];
function drawSkeleton(h) {
  const W = skel.width, H = skel.height;
  sctx.clearRect(0, 0, W, H);
  if (base.ok) {   // garis panduan
    sctx.setLineDash([6, 5]); sctx.lineWidth = 1.5;
    const yJ = (base.cy - thrJump() * base.sw) * H, yD = (base.cy + thrDuck() * base.sw) * H, xL = (base.cx - thrLean() * base.sw) * W, xR = (base.cx + thrLean() * base.sw) * W;
    sctx.strokeStyle = 'rgba(255,210,63,.9)'; sctx.beginPath(); sctx.moveTo(0, yJ); sctx.lineTo(W, yJ); sctx.stroke();
    sctx.strokeStyle = 'rgba(160,120,255,.9)'; sctx.beginPath(); sctx.moveTo(0, yD); sctx.lineTo(W, yD); sctx.stroke();
    sctx.strokeStyle = 'rgba(120,220,255,.9)'; sctx.beginPath(); sctx.moveTo(xL, 0); sctx.lineTo(xL, H); sctx.moveTo(xR, 0); sctx.lineTo(xR, H); sctx.stroke();
    sctx.setLineDash([]);
  }
  if (!h) return;
  sctx.strokeStyle = '#7fff6a'; sctx.lineWidth = 3; sctx.lineCap = 'round';
  for (const [a, b] of BONES) {
    const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.4 || q.visibility < 0.4))) continue;
    sctx.beginPath(); sctx.moveTo((1 - p.x) * W, p.y * H); sctx.lineTo((1 - q.x) * W, q.y * H); sctx.stroke();
  }
  sctx.fillStyle = '#ffd23f';
  [0, 11, 12, 13, 14, 15, 16].forEach(i => { const p = h[i]; if (p && (p.visibility == null || p.visibility > 0.4)) { sctx.beginPath(); sctx.arc((1 - p.x) * W, p.y * H, 4, 0, 6.283); sctx.fill(); } });
}
function poseOK(h, relaxed) {
  const a = h[11], b = h[12];
  if (!a || !b) return false;
  const vmin = relaxed ? 0.2 : 0.5;     // saat bermain lebih toleran (gambar buram saat lompat)
  if ((a.visibility != null && a.visibility < vmin) || (b.visibility != null && b.visibility < vmin)) return false;
  if (relaxed) return a.x > -0.1 && a.x < 1.1 && b.x > -0.1 && b.x < 1.1 && a.y > -0.15 && b.y > -0.15 && a.y < 1 && b.y < 1;
  return a.x > 0.03 && a.x < 0.97 && b.x > 0.03 && b.x < 0.97 && a.y > 0.03 && b.y > 0.03 && a.y < 0.9 && b.y < 0.9;
}
function setPoseInd(l, u, d, r) { $('pL').classList.toggle('on', l); $('pU').classList.toggle('on', u); $('pD').classList.toggle('on', d); $('pR').classList.toggle('on', r); }

function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  if (cam.skip > 0) { cam.skip--; return; }          // deteksi berat: lewati satu frame agar render tetap mulus
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  const t0 = performance.now(); let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  cam.cost = (cam.cost || 0) * 0.8 + (performance.now() - t0) * 0.2; cam.skip = cam.cost > 15 ? 1 : 0;
  const h = res && res.landmarks && res.landmarks[0];
  const has = !!h && poseOK(h, state === 'play');
  if (!has && state === 'play' && ++cam.miss < 8) { drawSkeleton(h || null); return; }   // abaikan frame hilang sesaat
  if (has) cam.miss = 0;
  if (cam.has !== has) { cam.has = has; $('camBox').classList.toggle('has', has); }
  drawSkeleton(h || null);
  if (!h || !has) { if (state === 'calib') { calib.samples = []; $('calBar').style.width = '0%'; $('calS').textContent = 'Tubuhmu belum terlihat. Mundur sedikit sampai kedua bahu masuk layar.'; } setPoseInd(0, 0, 0, 0); return; }
  const ls = h[11], rs = h[12];
  const mx = 1 - (ls.x + rs.x) / 2, my = (ls.y + rs.y) / 2, sw = Math.hypot(ls.x - rs.x, ls.y - rs.y);
  if (!sm.init) { sm.mx = mx; sm.my = my; sm.init = true; } else { sm.mx += (mx - sm.mx) * 0.6; sm.my += (my - sm.my) * (state === 'play' ? 0.85 : 0.6); }
  if (state === 'calib') {
    calib.samples.push({ mx: sm.mx, my: sm.my, sw });
    if (calib.samples.length > 24) calib.samples.shift();
    const n = calib.samples.length, xs = calib.samples.map(s => s.mx), ys = calib.samples.map(s => s.my);
    const stable = Math.max(...xs) - Math.min(...xs) < 0.05 && Math.max(...ys) - Math.min(...ys) < 0.05;
    if (!stable) { calib.samples = calib.samples.slice(-3); $('calS').textContent = 'Diamlah sebentar, berdiri tegak menghadap kamera…'; $('calBar').style.width = '5%'; return; }
    $('calS').textContent = 'Bagus! Tahan posisi ini…'; $('calBar').style.width = Math.round(n / 24 * 100) + '%';
    if (n >= 24) {
      base.cx = xs.reduce((a, b) => a + b, 0) / n; base.cy = ys.reduce((a, b) => a + b, 0) / n; base.sw = Math.max(0.1, calib.samples.reduce((a, s) => a + s.sw, 0) / n); base.ok = true;
      show('calibBox', false); startCountdown();
    }
    return;
  }
  if (state !== 'play' || !base.ok) return;
  const dx = (sm.mx - base.cx) / base.sw, dy = (sm.my - base.cy) / base.sw;
  const tl = thrLean();
  let lane = P.lane;
  if (dx < -tl) lane = 0; else if (dx > tl) lane = 2; else if (Math.abs(dx) < tl * 0.5) lane = 1;
  actLane(lane);
  // --- LOMPAT: naik cepat (dari posisi mana pun, termasuk setelah jongkok) ATAU bahu jauh di atas netral ---
  hist.push({ t: now, y: sm.my }); while (hist.length && now - hist[0].t > 700) hist.shift();
  let bestV = 0, bestD = 0;
  for (const q of hist) {
    const age = now - q.t; if (age < 40 || age > 340) continue;
    const d = (q.y - sm.my) / base.sw; if (d <= 0.04) continue;
    const v = d / (age / 1000); if (v > bestV) { bestV = v; bestD = d; }
  }
  const jumpNow = (bestV > thrVel() && bestD > thrRise()) || dy < -thrJump();
  if (jumpNow && jumpArmed && now - lastJumpT > 450) { actJump(); lastJumpT = now; jumpArmed = false; }
  else if (!jumpNow && dy > -0.12 && now - lastJumpT > 450) jumpArmed = true;
  // --- MERUNDUK: tidak aktif sesaat setelah lompat dan tidak pernah membatalkan lompatan ---
  duckHeld = dy > thrDuck() && !jumpNow && !P.air && now - lastJumpT > 700;
  if (duckHeld) actDuck(0.2, false);
  setPoseInd(P.lane === 0, P.air || now - lastJumpT < 400, duckHeld, P.lane === 2);
}
