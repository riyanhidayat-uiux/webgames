'use strict';
// ---------- pengaturan responsivitas kamera ----------
const CS = [
  { k: 'sens', label: 'Kepekaan jari', min: 1, max: 10, step: 1, fmt: v => v, tip: 'Tinggi = jari yang ditekuk sedikit pun sudah dianggap menunjuk' },
  { k: 'confirm', label: 'Kecepatan respons', min: 1, max: 5, step: 1, fmt: v => v === 1 ? 'instan' : v + ' frame', tip: 'Kecil = ular cepat belok tapi mudah salah baca. Besar = lebih stabil' },
  { k: 'ratio', label: 'Ketegasan arah', min: 1, max: 1.8, step: 0.05, fmt: v => '×' + (+v).toFixed(2), tip: 'Kecil = arah diagonal tetap dipilih. Besar = jari harus lurus ke satu arah' }
];
const csInputs = [];
function buildCamSettings(box) {
  for (const c of CS) {
    const d = document.createElement('div'); d.className = 'cs';
    d.innerHTML = `<div class="row"><label>${c.label}</label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"><span class="val"></span></div><small>${c.tip}</small>`;
    const inp = d.querySelector('input'), val = d.querySelector('.val');
    inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]);
    inp.oninput = () => { settings[c.k] = +inp.value; saveSettings(); syncCamSettings(); };
    csInputs.push({ c, inp, val });
    box.appendChild(d);
  }
  const b = document.createElement('button'); b.className = 'btn ghost tiny'; b.textContent = '↺ Kembalikan standar';
  b.onclick = () => { Object.assign(settings, CAM_DEF); saveSettings(); syncCamSettings(); };
  box.appendChild(b);
}
function syncCamSettings() { for (const { c, inp, val } of csInputs) { inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]); } }
buildCamSettings($('csMenu'));
buildCamSettings($('csPause'));

function menuMsg(msg) { const m = $('menuMsg'); m.textContent = msg || ''; m.classList.toggle('hidden', !msg); }

async function enableCamera() {
  menuMsg('');
  if (window.isSecureContext === false || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    menuMsg('Kamera hanya bisa dipakai lewat HTTPS (atau localhost) di browser yang mendukung. Pakai mode Sentuhan/Keyboard dulu.');
    return false;
  }
  toast('Menyiapkan kamera & pendeteksi jari…', 8000);
  try {
    if (!cam.stream) cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    video.srcObject = cam.stream;
    await video.play().catch(() => {});
  } catch (e) {
    stopCamera(); $('toast').classList.remove('show');
    const n = e && e.name;
    menuMsg(n === 'NotAllowedError' || n === 'SecurityError' ? 'Izin kamera ditolak. Izinkan kamera untuk situs ini di pengaturan browser, lalu coba lagi.'
      : n === 'NotFoundError' ? 'Tidak ada kamera yang ditemukan di perangkat ini.'
      : 'Kamera tidak bisa dibuka (mungkin sedang dipakai aplikasi lain).');
    return false;
  }
  try { await loadHandModel(); }
  catch (e) {
    stopCamera(); $('toast').classList.remove('show');
    menuMsg('Pendeteksi jari gagal diunduh. Pastikan internet tersambung dan tidak ada pemblokir yang menghalangi cdn.jsdelivr.net / storage.googleapis.com.');
    return false;
  }
  try { await cam.lm.setOptions({ numHands: versus ? 2 : 1 }); } catch (e) {}
  $('toast').classList.remove('show');
  return true;
}
function stopCamera() {
  cam.on = false; cam.has = false;
  $('arrow0').textContent = ''; $('arrow1').textContent = '';
  if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; }
  video.srcObject = null;
  show('camBox', false);
}

function handDir(h) {
  // arah = dari pangkal telunjuk (5) ke ujung telunjuk (8); x dicerminkan seperti selfie
  const dx = -(h[8].x - h[5].x), dy = h[8].y - h[5].y, len = Math.hypot(dx, dy);
  if (len < 0.125 - settings.sens * 0.011) return { ext: false };
  let d = null;
  if (Math.abs(dx) > Math.abs(dy) * settings.ratio) d = dx > 0 ? DIRS.R : DIRS.L;
  else if (Math.abs(dy) > Math.abs(dx) * settings.ratio) d = dy > 0 ? DIRS.D : DIRS.U;
  return { ext: true, d };
}
function feedHand(pi, r) {
  const st = cam.pl[pi], el = $('arrow' + pi);
  if (!r) { el.textContent = ''; st.cand = null; return; }
  if (!r.ext) { el.textContent = '✋'; st.cand = null; return; }
  if (!r.d) return;
  el.textContent = ARROW[r.d.k];
  if (st.cand && st.cand.k === r.d.k) st.cnt++; else { st.cand = r.d; st.cnt = 1; }
  if (st.cnt >= settings.confirm) turn(r.d, pi);
}
function detectHand(now) {
  if (!cam.on || !cam.lm || video.readyState < 2 || video.currentTime === cam.lastVT) return;
  cam.lastVT = video.currentTime;
  cam.lastTs = Math.max(cam.lastTs + 1, now);
  let res;
  try { res = cam.lm.detectForVideo(video, cam.lastTs); } catch (e) { return; }
  const hs = (res && res.landmarks) || [];
  setHas(hs.length > 0);
  if (!versus) { feedHand(0, hs[0] ? handDir(hs[0]) : null); return; }
  // 2 pemain: tangan paling kiri di layar (setelah dicerminkan) = P1
  const pts = hs.map(h => ({ h, mx: 1 - h[0].x }));
  let asg = [null, null];
  if (pts.length >= 2) { pts.sort((a, b) => a.mx - b.mx); asg = [pts[0], pts[pts.length - 1]]; }
  else if (pts.length === 1) {
    const q = pts[0], d = k => cam.lastMx[k] == null ? Infinity : Math.abs(q.mx - cam.lastMx[k]);
    const i = (d(0) === Infinity && d(1) === Infinity) ? (q.mx < 0.5 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1);
    asg[i] = q;
  }
  for (let k = 0; k < 2; k++) {
    if (asg[k]) { cam.lastMx[k] = asg[k].mx; feedHand(k, handDir(asg[k].h)); } else feedHand(k, null);
  }
}
function setHas(v) { if (cam.has !== v) { cam.has = v; $('camBox').classList.toggle('has', v); } }
