'use strict';
// ---------- input ----------
const keys = new Set();
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (k === ' ' || k === 'p') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); return; }
  keys.add(k);
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function keyboardInput(dt) {
  if (state !== 'play') return;
  const sp = 6.5 * dt;
  const k = n => keys.has(n);
  const p0 = players[0], p1 = players[1];
  if (p0 && !p0.ai) {
    let dx = (k('d') || (!versus && k('arrowright')) ? 1 : 0) - (k('a') || (!versus && k('arrowleft')) ? 1 : 0);
    let dz = (k('s') || (!versus && k('arrowdown')) ? 1 : 0) - (k('w') || (!versus && k('arrowup')) ? 1 : 0);
    if (dx || dz) { p0.tx += dx * sp; p0.tz += dz * sp; }
  }
  if (versus && p1) {
    const dx = (k('arrowright') ? 1 : 0) - (k('arrowleft') ? 1 : 0), dz = (k('arrowup') ? 1 : 0) - (k('arrowdown') ? 1 : 0);
    if (dx || dz) { p1.tx += dx * sp; p1.tz += dz * sp; }
  }
}
// sentuhan / mouse: posisi layar -> sasaran raket
const ptrs = new Map();
function setFromScreen(slot, cx, cy) {
  const p = players[slot]; if (!p || p.ai || state !== 'play') return;
  const ux = clamp(cx / innerWidth, 0, 1);
  let uy;
  if (!versus) uy = clamp((cy / innerHeight - 0.3) / 0.7, 0, 1);
  else uy = slot === 0 ? clamp((cy / innerHeight - 0.5) / 0.5, 0, 1) : clamp(cy / innerHeight / 0.5, 0, 1);
  setTarget(p, ux, uy, false);
}
function setTarget(p, ux, uy, smooth) {
  const tx = (ux - 0.5) * 2 * 2.75;
  const tz = p.side > 0 ? lerp(0.9, 6.3, uy) : -lerp(6.3, 0.9, uy);
  if (smooth) { const a = 1 - settings.smooth * 0.9; p.tx += (tx - p.tx) * a; p.tz += (tz - p.tz) * a; }
  else { p.tx = tx; p.tz = tz; }
}
addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('button,a,.overlay,details')) return;
  initAudio();
  const slot = versus ? (e.clientY > innerHeight / 2 ? 0 : 1) : 0;
  ptrs.set(e.pointerId, slot); setFromScreen(slot, e.clientX, e.clientY);
});
addEventListener('pointermove', e => {
  if (ptrs.has(e.pointerId)) setFromScreen(ptrs.get(e.pointerId), e.clientX, e.clientY);
  else if (e.pointerType === 'mouse' && !versus && state === 'play') setFromScreen(0, e.clientX, e.clientY);
});
const endPtr = e => ptrs.delete(e.pointerId);
addEventListener('pointerup', endPtr); addEventListener('pointercancel', endPtr);

// kamera (telunjuk)
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, lastMx: [null, null] };
const video = $('camVideo');
function loadHandModel() {
  if (cam.lm) return Promise.resolve(cam.lm);
  if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: HAND_MODEL, delegate: d }, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('GPU')); }
    catch (e) { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })();
  cam.loading.catch(() => { cam.loading = null; });
  return cam.loading;
}
const menuMsg = m => { const e = $('menuMsg'); e.textContent = m || ''; e.classList.toggle('hidden', !m); };
async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode Sentuhan/Mouse dulu.'); return false;
  }
  toast('Menyiapkan kamera & pendeteksi tangan…', 8000);
  try {
    if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    video.srcObject = cam.stream; await video.play().catch(() => {});
  } catch (e) {
    stopCamera(); $('toast').classList.remove('show');
    const n = e && e.name;
    menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.' : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.' : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).');
    return false;
  }
  try { await loadHandModel(); }
  catch (e) { stopCamera(); $('toast').classList.remove('show'); menuMsg('Pendeteksi tangan gagal diunduh. Pastikan internet tersambung dan cdn.jsdelivr.net / storage.googleapis.com tidak diblokir.'); return false; }
  try { await cam.lm.setOptions({ numHands: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show');
  return true;
}
function stopCamera() {
  cam.on = false; cam.has = false;
  if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; }
  video.srcObject = null; show('camBox', false);
}
function mapHand(mx, my, slot) {
  let ux = mx;
  if (versus) ux = slot === 0 ? mx / 0.5 : (mx - 0.5) / 0.5;
  const r = settings.range, m = (1 - r) / 2;
  return [clamp((ux - m) / r, 0, 1), clamp((my - m) / r, 0, 1)];
}
function detectHand(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime; cam.lastTs = Math.max(cam.lastTs + 1, now);
  let res; try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const hs = (res && res.landmarks) || [];
  if (cam.has !== hs.length > 0) { cam.has = hs.length > 0; $('camBox').classList.toggle('has', cam.has); }
  const pts = hs.map(h => ({ mx: 1 - h[8].x, my: h[8].y }));
  let asg = [null, null];
  if (!versus) asg[0] = pts[0] || null;
  else if (pts.length >= 2) { pts.sort((a, b) => a.mx - b.mx); asg = [pts[0], pts[pts.length - 1]]; }
  else if (pts.length === 1) {
    const q = pts[0], d = k => cam.lastMx[k] == null ? Infinity : Math.abs(q.mx - cam.lastMx[k]);
    const i = (d(0) === Infinity && d(1) === Infinity) ? (q.mx < 0.5 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1);
    asg[i] = q;
  }
  for (let k = 0; k < 2; k++) {
    const dot = $('dot' + k), q = asg[k];
    if (!q || !players[k] || players[k].ai) { dot.style.display = 'none'; continue; }
    cam.lastMx[k] = q.mx;
    const [ux, uy] = mapHand(q.mx, q.my, k);
    setTarget(players[k], ux, uy, true);
    dot.style.display = 'block'; dot.style.left = (q.mx * 100) + '%'; dot.style.top = (q.my * 100) + '%';
  }
}

// pengaturan kamera
const CS = [
  { k: 'range', label: 'Jangkauan tangan', min: 0.5, max: 1, step: 0.05, fmt: v => Math.round(v * 100) + '%', tip: 'Kecil = tangan cukup bergerak sedikit untuk menjangkau seluruh lapangan' },
  { k: 'smooth', label: 'Penghalusan', min: 0, max: 0.9, step: 0.05, fmt: v => v === 0 ? 'mati' : Math.round(v * 100) + '%', tip: 'Besar = raket lebih stabil tapi agak lambat mengikuti tangan' }
];
const csInputs = [];
function buildCamSettings(box) {
  for (const c of CS) {
    const d = document.createElement('div'); d.className = 'cs';
    d.innerHTML = `<div class="row"><label>${c.label}</label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"><span class="val"></span></div><small>${c.tip}</small>`;
    const inp = d.querySelector('input'), val = d.querySelector('.val');
    inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]);
    inp.oninput = () => { settings[c.k] = +inp.value; saveSettings(); sync(); };
    csInputs.push({ c, inp, val }); box.appendChild(d);
  }
  const b = document.createElement('button'); b.className = 'btn ghost tiny'; b.textContent = '↺ Kembalikan standar';
  b.onclick = () => { Object.assign(settings, CAM_DEF); saveSettings(); sync(); }; box.appendChild(b);
}
function sync() { for (const { c, inp, val } of csInputs) { inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]); } }
buildCamSettings($('csMenu')); buildCamSettings($('csPause'));
