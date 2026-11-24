'use strict';
// ======================= KAMERA (POSE, 1-2 ORANG) =======================
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const POSE_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, lastCx: [null, null] };
const video = $('camVideo'), skel = $('skel'), sctx = skel.getContext('2d');
const calib = { samples: [[], []], done: [false, false] };
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
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode tanpa kamera dulu.'); return false; }
  toast('Menyiapkan kamera & pendeteksi tubuh…', 9000);
  try { if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } }); video.srcObject = cam.stream; await video.play().catch(() => {}); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); const n = e && e.name; menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).'); return false; }
  try { await loadPose(); } catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tubuh gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numPoses: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show'); return true;
}
function stopCamera() { cam.on = false; cam.has = false; if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; } video.srcObject = null; show('camBox', false); show('calibBox', false); }

const LMI = { nose: 0, sL: 11, sR: 12, eL: 13, eR: 14, wL: 15, wR: 16, hL: 23, hR: 24, kL: 25, kR: 26, aL: 27, aR: 28 };
// landmark kamera -> koordinat tubuh (satuan lebar bahu, asal tengah bahu, tampilan cermin)
function bodyFromLandmarks(h) {
  const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
  const P = i => ({ x: (1 - h[i].x) * vw, y: h[i].y * vh, v: h[i].visibility == null ? 1 : h[i].visibility });
  const raw = {}; for (const n in LMI) raw[n] = P(LMI[n]);
  if (raw.sL.x > raw.sR.x) { for (const a of ['s', 'e', 'w', 'h', 'k', 'a']) { const t = raw[a + 'L']; raw[a + 'L'] = raw[a + 'R']; raw[a + 'R'] = t; } }
  const sw = Math.hypot(raw.sR.x - raw.sL.x, raw.sR.y - raw.sL.y); if (sw < 14 || raw.sL.v < 0.4 || raw.sR.v < 0.4) return null;
  const cx = (raw.sL.x + raw.sR.x) / 2, cy = (raw.sL.y + raw.sR.y) / 2, J = { c: { x: 0, y: 0, v: 1 } };
  for (const n in raw) J[n] = { x: (raw[n].x - cx) / sw, y: -(raw[n].y - cy) / sw, v: raw[n].v };
  for (const s of ['L', 'R']) { const w = J['w' + s], e = J['e' + s]; J['hd' + s] = { x: w.x + (w.x - e.x) * 0.38, y: w.y + (w.y - e.y) * 0.38, v: Math.min(w.v, e.v) }; }
  return { J, sw, cx, cxn: cx / vw };
}
// penyaring gerak One-Euro per sendi: halus saat diam (jitter hilang), responsif saat bergerak cepat (tanpa lag). Satuan: lebar bahu & detik.
const OE = { minCut: 1.3, beta: 1.2, dCut: 1.0 }, oeA = (fc, dt) => 1 / (1 + 1 / (6.283185 * fc) / dt);
function setBody(pi, J, now) {
  const B = PL[pi].B, t = (now == null ? performance.now() : now) / 1000, dt = B.t ? clamp(t - B.t, 0.008, 0.25) : 0.033; B.t = t;
  for (const n in J) {
    const g = J[n], o = B.J[n];
    if (!o || !B.valid) { B.J[n] = { x: g.x, y: g.y, v: g.v, dx: 0, dy: 0, gl: 0 }; continue; }
    if (g.v < 0.5 && g.v < o.v * 0.9) { o.v *= 0.9; continue; }                                   // sendi hilang sesaat: tahan posisi terakhir, kepercayaan turun pelan
    if (Math.hypot(g.x - o.x, g.y - o.y) > 2.5 && o.gl < 3) { o.gl++; continue; } o.gl = 0;         // lonjakan mustahil (glitch deteksi 1–3 frame): abaikan
    const da = oeA(OE.dCut, dt); o.dx += ((g.x - o.x) / dt - o.dx) * da; o.dy += ((g.y - o.y) / dt - o.dy) * da;
    const a = oeA(OE.minCut + OE.beta * Math.hypot(o.dx, o.dy), dt); o.x += (g.x - o.x) * a; o.y += (g.y - o.y) * a; o.v = g.v;
  }
  B.valid = true; B.seen = elapsed; PL[pi].miss = 0;
}
const SKB = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28]];
function drawSkeletons(list, asg) {
  const W = skel.width, H = skel.height; sctx.clearRect(0, 0, W, H);
  list.forEach(h => {
    const idx = asg ? asg.findIndex(a => a && a.h === h) : -1, col = idx < 0 || !versus ? '#7fff6a' : (idx === 0 ? '#ffb35a' : '#6fc8ff');
    sctx.strokeStyle = col; sctx.lineWidth = 3; sctx.lineCap = 'round';
    for (const [a, b] of SKB) { const p = h[a], q = h[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; sctx.beginPath(); sctx.moveTo((1 - p.x) * W, p.y * H); sctx.lineTo((1 - q.x) * W, q.y * H); sctx.stroke(); }
    sctx.fillStyle = '#ffd23f'; [0, 11, 12, 13, 14, 15, 16].forEach(i => { const p = h[i]; if (p && (p.visibility == null || p.visibility > 0.3)) { sctx.beginPath(); sctx.arc((1 - p.x) * W, p.y * H, 4, 0, 6.283); sctx.fill(); } });
  });
}
// kalibrasi satu pemain: ukur panjang lengan & badan (tangan lurus di samping)
function calibStep(pi, J, cx) {
  const bar = $(pi === 0 ? 'calBar' : 'calBar2'), txt = $(pi === 0 ? 'calS' : 'calS2'), who = versus ? `P${pi + 1}: ` : '';
  if (calib.done[pi]) { bar.style.width = '100%'; txt.textContent = who + 'Siap ✔'; return; }
  const armOK = ['wL', 'wR', 'eL', 'eR'].every(n => J[n].v > 0.4);
  if (!armOK) { calib.samples[pi] = []; bar.style.width = '0%'; txt.textContent = who + 'Lengan belum terlihat penuh. Turunkan tangan di samping badan dan mundur sedikit.'; return; }
  const aL = Math.hypot(J.wL.x - J.sL.x, J.wL.y - J.sL.y), aR = Math.hypot(J.wR.x - J.sR.x, J.wR.y - J.sR.y);
  const tor = (J.hL.v > 0.4 && J.hR.v > 0.4) ? Math.hypot((J.hL.x + J.hR.x) / 2, (J.hL.y + J.hR.y) / 2) : null, sm = calib.samples[pi];
  const legOK = ['hL', 'hR', 'kL', 'kR', 'aL', 'aR'].every(n => J[n] && J[n].v > 0.55), dd = (a, b) => Math.hypot(J[a].x - J[b].x, J[a].y - J[b].y), lg = legOK ? (dd('hL', 'kL') + dd('kL', 'aL') + dd('hR', 'kR') + dd('kR', 'aR')) / 2 : null;
  sm.push({ arm: (aL + aR) / 2, tor, wy: (J.wL.y + J.wR.y) / 2, cx, lg }); if (sm.length > 22) sm.shift();
  const n = sm.length, arms = sm.map(s => s.arm), stable = Math.max(...arms) - Math.min(...arms) < 0.35 && sm[n - 1].wy < -0.4;
  if (!stable) { calib.samples[pi] = sm.slice(-3); txt.textContent = who + 'Berdiri tegak, tangan lurus di samping badan, lalu diam sebentar…'; bar.style.width = '5%'; return; }
  txt.textContent = who + 'Bagus! Tahan posisi ini…'; bar.style.width = Math.round(n / 22 * 100) + '%';
  if (n >= 22) {
    const med = a => a.slice().sort((x, y) => x - y)[a.length >> 1]; PL[pi].k.arm = clamp(med(arms) / (LEN.arm1 + LEN.arm2), 0.75, 1.3);
    const ts = sm.map(s => s.tor).filter(v => v != null); PL[pi].k.torso = ts.length > 8 ? clamp(med(ts) / LEN.torso, 0.8, 1.25) : 1; const ls = sm.map(s => s.lg).filter(v => v != null); PL[pi].k.leg = ls.length > 8 ? clamp(med(ls) / (LEN.thigh + LEN.shin), 0.8, 1.3) : 1;
    PL[pi].cx0 = med(sm.map(s => s.cx)); PL[pi].px = PL[pi].pxT = 0; calib.done[pi] = true;
  }
}
function detectPose(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  if (cam.slow && (cam.fc = (cam.fc || 0) + 1) % 2) return;                                          // perangkat lambat: deteksi tiap 2 frame video supaya render tetap mulus
  let res; const t0 = performance.now(); try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  cam.ms = cam.ms ? cam.ms * 0.9 + (performance.now() - t0) * 0.1 : performance.now() - t0; if (cam.ms > 30) cam.slow = true; else if (cam.ms < 20) cam.slow = false;
  const hs = (res && res.landmarks) || [];
  const items = hs.map(h => ({ h, bd: bodyFromLandmarks(h) })).filter(o => o.bd);
  // tentukan siapa P1 (paling kiri di layar cermin) dan P2
  let asg = [null, null];
  if (!versus) asg[0] = items.sort((a, b) => Math.abs(a.bd.cxn - 0.5) - Math.abs(b.bd.cxn - 0.5))[0] || null;
  else if (items.length >= 2) { items.sort((a, b) => a.bd.cxn - b.bd.cxn); asg = [items[0], items[items.length - 1]]; }
  else if (items.length === 1) {
    const q = items[0], d = k => cam.lastCx[k] == null ? Infinity : Math.abs(q.bd.cxn - cam.lastCx[k]);
    const i = (d(0) === Infinity && d(1) === Infinity) ? (q.bd.cxn < 0.5 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1); asg[i] = q;
  }
  drawSkeletons(hs, asg);
  const any = asg.some(a => a); if (cam.has !== any) { cam.has = any; $('camBox').classList.toggle('has', any); }
  for (let i = 0; i < NP(); i++) {
    const a = asg[i], pl = PL[i];
    if (a) {
      cam.lastCx[i] = a.bd.cxn; const sw = a.bd.sw;
      if (pl.swAvg && sw < pl.swAvg * 0.55 && (pl.twist = (pl.twist || 0) + 1) <= 8) { pl.miss = 0; continue; }   // badan tiba-tiba terputar: lewati beberapa frame
      pl.twist = 0; pl.swAvg = pl.swAvg ? lerp(pl.swAvg, sw, 0.05) : sw; setBody(i, a.bd.J, now); if (pl.cx0 != null) pl.px += (clamp((a.bd.cx - pl.cx0) / a.bd.sw, -3, 3) - pl.px) * 0.5; if (state === 'calib') calibStep(i, a.bd.J, a.bd.cx); }
    else if (++pl.miss > 6) { pl.B.valid = false; if (state === 'calib') { calib.samples[i] = []; calib.done[i] = false; $(i === 0 ? 'calBar' : 'calBar2').style.width = '0%'; $(i === 0 ? 'calS' : 'calS2').textContent = (versus ? `P${i + 1}: ` : '') + 'Tubuh belum terlihat. Mundur sedikit sampai kepala, bahu, dan kedua lengan masuk layar.'; } }
  }
  if (state === 'calib' && PL.every((p, i) => i >= NP() || calib.done[i])) { show('calibBox', false); startCountdown(); }
}
