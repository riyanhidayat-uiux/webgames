'use strict';
// ---------- bantuan saat kamera gagal ----------
const UA = navigator.userAgent || '';
const isIOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(UA);
const isSamsung = /SamsungBrowser/i.test(UA);
const isFirefox = /Firefox|FxiOS/i.test(UA);
const inAppName = (() => {
  if (/Instagram/i.test(UA)) return 'Instagram';
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(UA)) return 'Facebook';
  if (/WhatsApp/i.test(UA)) return 'WhatsApp';
  if (/Line\//i.test(UA)) return 'LINE';
  if (/TikTok|musical_ly|BytedanceWebview/i.test(UA)) return 'TikTok';
  if (/Telegram/i.test(UA)) return 'Telegram';
  if (/Twitter/i.test(UA)) return 'X/Twitter';
  if (isAndroid && /; wv\)/.test(UA)) return 'aplikasi ini';
  if (isIOS && !/Safari\//.test(UA) && !/CriOS|FxiOS|EdgiOS/.test(UA)) return 'aplikasi ini';
  return '';
})();
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const pageUrl = location.origin + location.pathname;

function browserSteps() {
  if (isIOS) {
    return `<b>Cara mengizinkan kamera di iPhone/iPad:</b><ol>
      <li>Ketuk ikon <b>ᴀA</b> (atau ikon kiri) di kolom alamat Safari → <b>Pengaturan Situs Web</b>.</li>
      <li>Ubah <b>Kamera</b> menjadi <b>Izinkan</b> atau <b>Tanya</b>.</li>
      <li>Jika tidak ada: buka <b>Pengaturan iPhone → Safari → Kamera</b> → pilih <b>Tanya</b> atau <b>Izinkan</b>.</li>
      <li>Pakai Chrome di iPhone? Cek <b>Pengaturan iPhone → Chrome → Kamera</b> harus aktif.</li>
      <li>Muat ulang halaman, lalu tekan <b>Coba Lagi</b>.</li></ol>`;
  }
  if (isSamsung) {
    return `<b>Cara mengizinkan kamera di Samsung Internet:</b><ol>
      <li>Ketuk ikon <b>gembok 🔒</b> di kolom alamat → <b>Izin</b> → aktifkan <b>Kamera</b>.</li>
      <li>Atau menu <b>☰ → Pengaturan → Situs dan unduhan → Izin situs → Kamera</b>, hapus situs ini dari daftar blokir.</li>
      <li>Pastikan juga <b>Pengaturan HP → Aplikasi → Samsung Internet → Izin → Kamera</b> diizinkan.</li>
      <li>Muat ulang halaman, lalu tekan <b>Coba Lagi</b>.</li></ol>`;
  }
  if (isFirefox) {
    return `<b>Cara mengizinkan kamera di Firefox:</b><ol>
      <li>Ketuk ikon <b>gembok 🔒</b> di kolom alamat → ubah <b>Kamera</b> ke <b>Diizinkan</b> (atau hapus blokirnya).</li>
      <li>Pastikan izin kamera untuk aplikasi Firefox aktif di pengaturan HP.</li>
      <li>Muat ulang halaman, lalu tekan <b>Coba Lagi</b>.</li></ol>`;
  }
  if (isAndroid) {
    return `<b>Cara mengizinkan kamera di Chrome Android:</b><ol>
      <li>Ketuk ikon <b>pengaturan/gembok</b> di kiri kolom alamat → <b>Izin</b> → aktifkan <b>Kamera</b>.</li>
      <li>Kalau tidak ada: <b>⋮ → Setelan → Setelan situs → Kamera</b> → hapus situs ini dari <b>Diblokir</b>, dan pastikan saklar Kamera aktif.</li>
      <li>Cek juga <b>Pengaturan HP → Aplikasi → Chrome → Izin → Kamera</b> = <b>Izinkan</b>.</li>
      <li>Muat ulang halaman, lalu tekan <b>Coba Lagi</b>.</li></ol>`;
  }
  return `<b>Cara mengizinkan kamera di browser komputer:</b><ol>
    <li>Klik ikon <b>gembok 🔒 / kamera</b> di kolom alamat → ubah <b>Kamera</b> ke <b>Izinkan</b>.</li>
    <li>Pastikan izin kamera untuk browser aktif di pengaturan privasi sistem (Windows: Privasi → Kamera; macOS: Pengaturan Sistem → Privasi & Keamanan → Kamera).</li>
    <li>Muat ulang halaman, lalu tekan <b>Coba Lagi</b>.</li></ol>`;
}

function showCamHelp(kind) {
  let msg = '', steps = '';
  if (kind === 'inapp') {
    msg = `Kamu membuka game dari dalam <b>${inAppName}</b>. Browser bawaan aplikasi ini biasanya memblokir kamera.`;
    steps = `<b>Buka di browser biasa:</b><ol>
      <li>Ketuk menu <b>⋮</b> atau <b>…</b> di pojok kanan atas.</li>
      <li>Pilih <b>Buka di Chrome</b> / <b>Buka di Safari</b> / <b>Buka di browser</b>.</li>
      <li>Atau salin alamat di bawah dan tempel di Chrome/Safari.</li></ol><span class="url">${pageUrl}</span>`;
  } else if (kind === 'frame') {
    msg = 'Game sedang tampil di dalam bingkai/pratinjau halaman lain, dan bingkai itu tidak diberi izin kamera.';
    steps = `<b>Buka game di tab sendiri:</b><ol><li>Buka alamat ini langsung di Chrome/Safari:</li></ol><span class="url">${pageUrl}</span>`;
  } else if (kind === 'insecure') {
    msg = 'Halaman tidak dibuka lewat HTTPS, jadi browser selalu memblokir kamera.';
    steps = `<b>Buka lewat alamat HTTPS:</b><span class="url">https://${location.host}${location.pathname}</span>`;
  } else if (kind === 'unsupported') {
    msg = 'Browser ini tidak mendukung akses kamera dari halaman web.';
    steps = `Coba buka di <b>Chrome</b> (Android) atau <b>Safari</b> (iPhone) versi terbaru:<span class="url">${pageUrl}</span>`;
  } else if (kind === 'busy') {
    msg = 'Kamera tidak bisa dibuka. Biasanya karena kamera sedang dipakai aplikasi lain (video call, aplikasi kamera, tab lain).';
    steps = '<ol><li>Tutup aplikasi atau tab lain yang memakai kamera.</li><li>Tekan <b>Coba Lagi</b>.</li></ol>';
  } else if (kind === 'model') {
    msg = 'Kamera berhasil dibuka, tapi pendeteksi jari gagal diunduh.';
    steps = '<ol><li>Pastikan internet tersambung (pertama kali perlu mengunduh beberapa MB).</li><li>Matikan pemblokir iklan/VPN yang mungkin memblokir <i>cdn.jsdelivr.net</i> atau <i>storage.googleapis.com</i>.</li><li>Tekan <b>Coba Lagi</b>.</li></ol>';
  } else {
    msg = 'Browser menolak izin kamera untuk situs ini. Kalau sebelumnya pernah memilih <b>Blokir/Jangan izinkan</b>, browser tidak akan bertanya lagi sampai izinnya diubah manual.';
    steps = browserSteps();
  }
  $('camHelp').querySelector('h2').textContent = kind === 'model' ? 'GAGAL MEMUAT' : kind === 'busy' ? 'KAMERA SIBUK' : 'KAMERA DITOLAK';
  $('camHelpMsg').innerHTML = msg;
  $('camHelpSteps').innerHTML = steps;
  show('menu', false); show('over', false); hudOff(); show('gameBtns', false);
  state = 'menu';
  show('camHelp', true);
}

async function enableCamera() {
  if (window.isSecureContext === false) { showCamHelp('insecure'); return false; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCamHelp(inAppName ? 'inapp' : inFrame ? 'frame' : 'unsupported');
    return false;
  }
  toast('Menyiapkan kamera & pendeteksi jari…', 8000);
  try {
    if (!cam.stream) {
      cam.stream = await navigator.mediaDevices.getUserMedia({ audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } } });
    }
    video.srcObject = cam.stream;
    await video.play().catch(() => {});
  } catch (e) {
    stopCamera();
    toast('', 1);
    const name = e && e.name;
    if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
      showCamHelp(inAppName ? 'inapp' : inFrame ? 'frame' : 'denied');
    } else if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
      showCamHelp('unsupported');
      $('camHelpMsg').textContent = 'Tidak ada kamera yang ditemukan di perangkat ini.';
    } else {
      showCamHelp('busy');
    }
    return false;
  }
  try { await loadHandModel(); }
  catch (e) {
    stopCamera();
    toast('', 1);
    showCamHelp('model');
    return false;
  }
  try { await cam.lm.setOptions({ numHands: versus ? 2 : 1 }); } catch (e) {}
  return true;
}

function stopCamera() {
  cam.on = false;
  if (cam.stream) { for (const t of cam.stream.getTracks()) t.stop(); cam.stream = null; }
  video.srcObject = null;
}

// titik kamera (0..1, sudah dicerminkan) -> koordinat layar
function camToScreen(nx, ny) {
  const r = settings.camRange, m = (1 - r) / 2;
  return [((nx - m) / r) * W, ((ny - m) / r) * H];
}

function detectHand(now) {
  if (!cam.on || !cam.lm || video.readyState < 2) return;
  if (video.currentTime === cam.lastVT) return;
  if (cam.skip > 0) { cam.skip--; return; }           // deteksi berat: lewati satu frame agar render tetap mulus
  cam.lastVT = video.currentTime;
  const ts = Math.max(cam.lastDetect + 1, now);
  cam.lastDetect = ts;
  let res; const t0 = performance.now();
  try { res = cam.lm.detectForVideo(video, ts); } catch (e) { return; }
  cam.cost = (cam.cost || 0) * 0.8 + (performance.now() - t0) * 0.2; cam.skip = cam.cost > 15 ? 1 : 0;
  if (versus) { detectHandsVs(res, now); return; }
  const hand = res && res.landmarks && res.landmarks[0];
  if (!hand) {
    if (cam.has) { cam.has = false; cam.lostAt = now; }
    return;
  }
  const tip = hand[8]; // ujung jari telunjuk
  cam.seen = true;
  cam.rawX = 1 - tip.x; cam.rawY = tip.y;
  const [rx, ry] = camToScreen(cam.rawX, cam.rawY), first = !cam.has; cam.tr = cam.tr || makeTracker();
  const [sx, sy] = trackerFeed(cam.tr, rx, ry, now, first);
  if (first) {
    // jari baru terlihat lagi: lompat langsung tanpa menebas di sepanjang lompatan
    cam.x = cam.tx = sx; cam.y = cam.ty = sy;
    camBlade.prev = null; camBlade.pts = []; camBlade.sw = false;
  }
  cam.tx = sx; cam.ty = sy; cam.has = true;
}

function detectHandsVs(res, now) {
  const hs = (res && res.landmarks) || [];
  const pts = hs.map(h => { const rx = 1 - h[8].x, ry = h[8].y; const [sx, sy] = camToScreen(rx, ry); return [sx, sy, rx, ry]; });
  let asg = [null, null];
  if (pts.length >= 2) { pts.sort((a, b) => a[0] - b[0]); asg = [pts[0], pts[pts.length - 1]]; }
  else if (pts.length === 1) {
    const p = pts[0], d = k => vc[k].has ? Math.hypot(p[0] - vc[k].x, p[1] - vc[k].y) : Infinity;
    const i = (d(0) === Infinity && d(1) === Infinity) ? (p[0] < W / 2 ? 0 : 1) : (d(0) <= d(1) ? 0 : 1);
    asg[i] = p;
  }
  for (let k = 0; k < 2; k++) {
    const v = vc[k], p = asg[k];
    if (!p) { v.has = false; continue; }
    cam.seen = true;
    v.rawX = p[2]; v.rawY = p[3];
    const first = !v.has; v.tr = v.tr || makeTracker(); const [fx, fy] = trackerFeed(v.tr, p[0], p[1], now, first);
    if (first) { v.x = v.tx = fx; v.y = v.ty = fy; v.blade.prev = null; v.blade.pts = []; v.blade.sw = false; }
    v.tx = fx; v.ty = fy; v.has = true;
  }
}

function updateCamera(dt, now) {
  if (!cam.on) return;
  detectHand(now);
  if (versus) {
    const lp = 1 - Math.exp(-dt * 90);
    for (const v of vc) { if (!v.has || !v.tr) continue; const [px, py] = trackerPos(v.tr, now); v.x += (px - v.x) * lp; v.y += (py - v.y) * lp; bladeMove(v.blade, v.x, v.y, now); }
    return;
  }
  if (!cam.has || !cam.tr) return;
  const lp = 1 - Math.exp(-dt * 90), [px, py] = trackerPos(cam.tr, now);
  cam.x += (px - cam.x) * lp; cam.y += (py - cam.y) * lp;
  bladeMove(camBlade, cam.x, cam.y, now);
}

function drawCamPreview() {
  if (!cam.on || !settings.camPreview || video.readyState < 2 || !video.videoWidth) return;
  const vw = video.videoWidth, vh = video.videoHeight;
  const pw = Math.round(Math.min(W, H) * 0.3), ph = Math.round(pw * vh / vw);
  const px = 12, py = H - ph - 64;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, ph, 10) : ctx.rect(px, py, pw, ph); ctx.clip();
  ctx.translate(px + pw, py); ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, pw, ph);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // area jangkauan
  const r = settings.camRange, m = (1 - r) / 2;
  ctx.strokeStyle = 'rgba(255,210,63,.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.strokeRect(px + m * pw, py + m * ph, r * pw, r * ph); ctx.setLineDash([]);
  if (cam.has) {
    ctx.fillStyle = '#7fff6a';
    ctx.beginPath(); ctx.arc(px + cam.rawX * pw, py + cam.rawY * ph, 4, 0, Math.PI * 2); ctx.fill();
  }
  if (versus) for (let k = 0; k < 2; k++) if (vc[k].has) {
    ctx.fillStyle = `rgb(${PCOL[k]})`;
    ctx.beginPath(); ctx.arc(px + vc[k].rawX * pw, py + vc[k].rawY * ph, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = (cam.has || (versus && (vc[0].has || vc[1].has))) ? 'rgba(127,255,106,.9)' : 'rgba(255,90,60,.9)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, pw, ph, 10) : ctx.rect(px, py, pw, ph); ctx.stroke();
}
