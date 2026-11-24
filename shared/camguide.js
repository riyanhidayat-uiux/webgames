/* =====================================================================
   PANDUAN KAMERA SERAGAM (Al Games)
   Dipakai semua game berkamera. Layar pra-main yang memeriksa secara langsung:
   kamera aktif · cahaya · orang/tangan terdeteksi · bagian tubuh terlihat · jarak · posisi tengah,
   lalu mulai otomatis setelah posisi stabil.

   Pemakaian (di dalam alur startGame, setelah enableCamera() berhasil):
     if (!(await CamGuide.run({ cam, video, kind: 'full', game: 'Penalti' }))) { stopCamera(); return; }

   kind: 'finger' (satu tangan, jari) · 'upper' (kepala–tangan) · 'torso' (kepala–pinggang) · 'full' (kepala–kaki)
   Mengembalikan true = lanjut main, false = pemain membatalkan.
   ===================================================================== */
(function (global) {
  'use strict';
  const KINDS = {
    finger: { hand: true, title: 'Tunjukkan tanganmu', tip: 'Arahkan telapak tangan ke kamera, jari terbuka, jarak ±40–60 cm.', found: 'Tangan terdeteksi', parts: 'Seluruh jari terlihat' },
    upper: { need: [0, 11, 12, 13, 14, 15, 16], title: 'Berdiri di depan kamera', tip: 'Berdiri ±1,5–2,5 m. Kepala, bahu, siku, dan kedua tangan harus terlihat.', found: 'Tubuh terdeteksi', parts: 'Kepala sampai tangan terlihat', width: [0.2, 0.5] },
    torso: { need: [0, 11, 12, 23, 24], title: 'Berdiri di depan kamera', tip: 'Berdiri ±2 m. Kepala sampai pinggang harus terlihat (kaki boleh tidak).', found: 'Tubuh terdeteksi', parts: 'Kepala sampai pinggang terlihat', width: [0.17, 0.42] },
    full: { need: [0, 11, 12, 23, 24, 25, 26, 27, 28], title: 'Berdiri di depan kamera', tip: 'Berdiri ±2,5–3 m. Seluruh badan, kepala sampai kaki, harus terlihat.', found: 'Tubuh terdeteksi', parts: 'Kepala sampai kaki terlihat', span: [0.62, 0.93] }
  };
  const PART = { 0: 'kepala', 11: 'bahu', 12: 'bahu', 13: 'siku', 14: 'siku', 15: 'tangan', 16: 'tangan', 23: 'pinggul', 24: 'pinggul', 25: 'lutut', 26: 'lutut', 27: 'kaki', 28: 'kaki' };
  const POSE_LINES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];
  const HAND_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
  const inFrame = p => p && p.x > 0.01 && p.x < 0.99 && p.y > 0.01 && p.y < 0.99;
  const seen = p => inFrame(p) && (p.visibility == null || p.visibility > 0.5);

  // ---- penilaian murni (bisa diuji tanpa DOM) ----
  // lm: array landmark (atau null); luma: 0..255 atau null; dims: {w,h} piksel video
  function evaluate(kind, lm, luma, dims, camOk) {
    const K = KINDS[kind] || KINDS.upper, vw = (dims && dims.w) || 640, vh = (dims && dims.h) || 480, checks = [];
    const add = (id, label, ok, msg) => checks.push({ id, label, ok: !!ok, msg: ok ? '' : msg });
    add('cam', 'Kamera aktif', camOk !== false, 'Menunggu kamera…');
    const lightOk = luma == null || (luma >= 50 && luma <= 228);
    add('light', 'Cahaya cukup', lightOk, luma != null && luma < 50 ? 'Terlalu gelap — nyalakan lampu atau menghadap sumber cahaya' : 'Terlalu silau — jauhi cahaya langsung dari belakang/depan');
    const has = !!lm && lm.length >= (K.hand ? 21 : 29);
    add('found', K.found, has, K.hand ? 'Tangan belum terlihat — tunjukkan telapak tangan ke kamera' : 'Tubuh belum terlihat — berdirilah di depan kamera');
    let partsOk = false, partsMsg = '', distOk = false, distMsg = '', centerOk = false, centerMsg = '', cx = 0.5;
    if (has) {
      if (K.hand) {
        const miss = lm.filter(p => !inFrame(p)).length; partsOk = miss === 0; partsMsg = 'Seluruh jari harus masuk layar — jauhkan tangan sedikit';
        const size = Math.hypot((lm[0].x - lm[9].x) * vw, (lm[0].y - lm[9].y) * vh) / vw;
        distOk = size >= 0.09 && size <= 0.28; distMsg = size < 0.09 ? 'Dekatkan tanganmu ke kamera' : 'Jauhkan tanganmu sedikit';
        cx = 1 - lm[9].x; const cy = lm[9].y; centerOk = cx > 0.2 && cx < 0.8 && cy > 0.15 && cy < 0.85;
        centerMsg = cx <= 0.2 ? 'Geser tanganmu ke kanan' : cx >= 0.8 ? 'Geser tanganmu ke kiri' : cy <= 0.15 ? 'Turunkan tanganmu sedikit' : 'Naikkan tanganmu sedikit';
      } else {
        const miss = K.need.filter(i => !seen(lm[i])), names = [...new Set(miss.map(i => PART[i]))];
        partsOk = miss.length === 0;
        partsMsg = names.length ? (names.includes('kaki') || names.includes('lutut') ? 'Mundur sampai ' + names.join(', ') + ' terlihat' : 'Belum terlihat: ' + names.join(', ') + (names.includes('tangan') ? ' — angkat/rentangkan tanganmu' : '')) : '';
        const sw = Math.abs(lm[11].x - lm[12].x) * vw / vw;
        if (K.span) { const ay = Math.max(lm[27].y, lm[28].y), span = ay - lm[0].y; distOk = partsOk && span >= K.span[0] && span <= K.span[1]; distMsg = span < K.span[0] ? 'Mendekat sedikit' : 'Mundur sedikit'; }
        else { distOk = sw >= K.width[0] && sw <= K.width[1]; distMsg = sw < K.width[0] ? 'Mendekat sedikit' : 'Mundur sedikit'; }
        cx = 1 - (lm[11].x + lm[12].x) / 2; centerOk = cx > 0.3 && cx < 0.7; centerMsg = cx <= 0.3 ? 'Geser ke kanan' : 'Geser ke kiri';
      }
    }
    add('parts', K.parts, has && partsOk, has ? partsMsg : '');
    add('dist', 'Jarak pas', has && distOk, has ? distMsg : '');
    add('center', 'Posisi di tengah', has && centerOk, has ? centerMsg : '');
    const firstBad = checks.find(c => !c.ok);
    return { checks, ok: !firstBad, headline: firstBad ? firstBad.msg : 'Sempurna! Tahan posisi ini…', tip: K.tip, title: K.title };
  }

  // ---- UI ----
  const CSS = `.cg{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:16px;background:rgba(5,8,14,.86);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#e8edf5;-webkit-font-smoothing:antialiased}
.cg *{box-sizing:border-box}
.cg-card{width:min(980px,100%);max-height:100%;overflow:auto;border-radius:20px;background:#111826;border:1px solid rgba(255,255,255,.12);box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}
.cg-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08)}
.cg-t{font-family:Bungee,Impact,"Arial Black",sans-serif;font-size:18px;letter-spacing:.05em;color:#ffd23f;text-shadow:0 2px 0 #a33a00}
.cg-g{font-size:13px;color:#93a0b5}
.cg-body{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:20px;padding:20px}
.cg-view{position:relative;aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:#05070c;border:2px solid rgba(255,255,255,.14);transition:border-color .2s,box-shadow .2s}
.cg-view.ok{border-color:#34d399;box-shadow:0 0 0 4px rgba(52,211,153,.2)}
.cg-view video,.cg-view canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cg-view video{transform:scaleX(-1)}
.cg-frame{position:absolute;border:2px dashed rgba(255,255,255,.55);border-radius:16px;pointer-events:none;transition:border-color .2s}
.cg-view.ok .cg-frame{border-color:#34d399}
.cg-badge{position:absolute;left:10px;bottom:10px;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.6);color:#fff}
.cg-head{font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.25;margin:2px 0 6px;min-height:56px}
.cg-head.ok{color:#34d399}
.cg-tip{margin:0 0 14px;font-size:13.5px;color:#93a0b5}
.cg-list{list-style:none;margin:0 0 14px;padding:0;display:grid;gap:7px}
.cg-list li{display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 12px;border-radius:10px;background:#1a2333;border:1px solid rgba(255,255,255,.07)}
.cg-list li i{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-size:12px;font-weight:800;background:rgba(255,255,255,.1);color:#93a0b5}
.cg-list li.ok i{background:#34d399;color:#05261a}
.cg-list li.ok{color:#e8edf5}
.cg-list li:not(.ok){color:#93a0b5}
.cg-bar{height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin-bottom:14px}
.cg-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#5b8cff,#34d399);transition:width .12s linear}
.cg-btns{display:flex;flex-wrap:wrap;gap:10px}
.cg-btn{font:inherit;font-weight:700;font-size:14px;padding:11px 18px;border-radius:11px;border:1px solid rgba(255,255,255,.18);background:#1a2333;color:#e8edf5;cursor:pointer;transition:filter .15s,transform .1s}
.cg-btn:hover{filter:brightness(1.15)}
.cg-btn:active{transform:translateY(1px)}
.cg-btn.go{font-family:Bungee,Impact,"Arial Black",sans-serif;font-weight:400;letter-spacing:.05em;color:#2a1200;border:2px solid #2a1200;background:linear-gradient(180deg,#fff08a,#ffc933 45%,#ff9d1c);box-shadow:0 4px 0 #a33a00}
.cg-btn.go[disabled]{opacity:.4;cursor:not-allowed;filter:grayscale(.5)}
.cg-btn.ghost{background:transparent}
.cg-skip{display:flex;align-items:center;gap:8px;margin-top:12px;font-size:12.5px;color:#93a0b5;cursor:pointer}
@media (max-width:760px){.cg{padding:0;place-items:stretch}.cg-card{border-radius:0;width:100%;height:100%}.cg-body{grid-template-columns:minmax(0,1fr);gap:14px;padding:14px}.cg-view{aspect-ratio:16/10}.cg-head{font-size:19px;min-height:0}}
@media (prefers-reduced-motion:reduce){.cg *{transition:none!important}}`;

  function run(opts) {
    const cam = opts.cam, video = opts.video, kind = KINDS[opts.kind] ? opts.kind : 'upper', K = KINDS[kind], holdMs = opts.holdMs || 1200, help = !!opts.help;
    if (!help) attachHelp(opts);                                         // tombol "?" di dalam game
    try { if (!help && sessionStorage.getItem('camguide_skip') === '1') return Promise.resolve(true); } catch (e) {}
    if (!cam || !cam.lm || !video) return Promise.resolve(true);
    return new Promise(resolve => {
      if (!document.getElementById('cg-style')) { const st = document.createElement('style'); st.id = 'cg-style'; st.textContent = CSS; document.head.appendChild(st); }
      const el = document.createElement('div'); el.className = 'cg'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Panduan kamera');
      el.innerHTML = `<div class="cg-card"><div class="cg-top"><span class="cg-t">PANDUAN KAMERA</span><span class="cg-g">${(opts.game || '').replace(/[<>&]/g, '')}</span></div>
        <div class="cg-body"><div class="cg-view"><video playsinline muted autoplay></video><canvas></canvas><div class="cg-frame"></div><span class="cg-badge">Pratinjau cermin</span></div>
        <div><div class="cg-head" aria-live="polite"></div><p class="cg-tip"></p><ul class="cg-list"></ul><div class="cg-bar"><i></i></div>
        <div class="cg-btns"><button class="cg-btn go" ${help ? '' : 'disabled'}>${help ? 'LANJUT MAIN' : 'MULAI'}</button><button class="cg-btn"${help ? ' hidden' : ''}>Lewati panduan</button><button class="cg-btn ghost"${help ? ' hidden' : ''}>Batal</button></div>
        <label class="cg-skip"${help ? ' hidden' : ''}><input type="checkbox"> Jangan tampilkan lagi sampai tab ini ditutup</label>${help ? '<p class="cg-tip" style="margin:12px 0 0">Game dijeda selama panduan ini terbuka. Perbaiki posisimu sampai semua tanda ✓ hijau, lalu lanjut main.</p>' : ''}</div></div></div>`;
      document.body.appendChild(el);
      const $ = s => el.querySelector(s), view = $('.cg-view'), pv = $('video'), cv = $('canvas'), cx = cv.getContext('2d'), head = $('.cg-head'), list = $('.cg-list'), bar = $('.cg-bar i'), frame = $('.cg-frame'), btns = el.querySelectorAll('.cg-btn'), go = btns[0], skipB = btns[1], cancel = btns[2], chk = $('.cg-skip input');
      $('.cg-tip').textContent = K.tip; head.textContent = K.title;
      // bingkai panduan posisi
      const fr = K.hand ? { l: 26, t: 14, w: 48, h: 72 } : kind === 'full' ? { l: 30, t: 4, w: 40, h: 92 } : { l: 22, t: 8, w: 56, h: 84 };
      Object.assign(frame.style, { left: fr.l + '%', top: fr.t + '%', width: fr.w + '%', height: fr.h + '%' });
      try { pv.srcObject = cam.stream || video.srcObject; pv.play().catch(() => {}); } catch (e) {}
      const lc = document.createElement('canvas'); lc.width = 32; lc.height = 24; const lx = lc.getContext('2d', { willReadFrequently: true });
      let luma = null, lumaT = 0, lastDet = 0, lastVT = -1, lm = null, lmT = 0, okSince = 0, done = false, raf = 0, last = null, closeTimer = 0;
      const finish = v => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(closeTimer); removeEventListener('keydown', onKey); try { if (chk.checked && v) sessionStorage.setItem('camguide_skip', '1'); } catch (e) {} el.remove(); resolve(v); };
      const onKey = e => { if (e.key === 'Escape') finish(help); }; addEventListener('keydown', onKey);
      go.onclick = () => { if (!go.disabled) finish(true); }; if (help) el.addEventListener('mousedown', e => { if (e.target === el) finish(true); }); skipB.onclick = () => finish(true); cancel.onclick = () => finish(false);
      (help ? go : skipB).focus();
      const sizeCv = () => { const r = view.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); } };
      function draw(res) {
        sizeCv(); const W = cv.width, H = cv.height; cx.clearRect(0, 0, W, H);
        if (!lm) return; const vw = video.videoWidth || 640, vh = video.videoHeight || 480, s = Math.max(W / vw, H / vh), ox = (W - vw * s) / 2, oy = (H - vh * s) / 2;
        const P = p => [W - (ox + p.x * vw * s) - 0 + 0, oy + p.y * vh * s]; // mirror: x' = W - x
        const lines = K.hand ? HAND_LINES : POSE_LINES, col = res.ok ? '#34d399' : '#ffd23f';
        cx.lineWidth = Math.max(2, W / 200); cx.strokeStyle = col; cx.lineCap = 'round';
        for (const [a, b] of lines) { const p = lm[a], q = lm[b]; if (!p || !q || (p.visibility != null && (p.visibility < 0.3 || q.visibility < 0.3))) continue; const A = P(p), B = P(q); cx.beginPath(); cx.moveTo(A[0], A[1]); cx.lineTo(B[0], B[1]); cx.stroke(); }
        const need = K.need || [], bad = new Set(need.filter(i => !seen(lm[i])));
        (K.hand ? lm : [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].map(i => lm[i])).forEach((p, k) => { if (!p) return; const idx = K.hand ? k : [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28][k]; if (!K.hand && p.visibility != null && p.visibility < 0.3) return; const A = P(p); cx.fillStyle = bad.has(idx) ? '#ff5a5a' : col; cx.beginPath(); cx.arc(A[0], A[1], Math.max(3, W / 130), 0, 6.283); cx.fill(); });
      }
      function renderList(res) {
        if (!list.children.length) list.innerHTML = res.checks.map(c => `<li data-id="${c.id}"><i>•</i><span>${c.label}</span></li>`).join('');
        for (const c of res.checks) { const li = list.querySelector(`[data-id="${c.id}"]`); li.classList.toggle('ok', c.ok); li.firstChild.textContent = c.ok ? '✓' : '•'; }
      }
      function tick(now) {
        if (done) return; raf = requestAnimationFrame(tick);
        // cahaya (tiap 400 ms)
        if (now - lumaT > 400 && video.videoWidth > 0 && video.readyState >= 2) { lumaT = now; try { lx.drawImage(video, 0, 0, 32, 24); const d = lx.getImageData(0, 0, 32, 24).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; luma = sum / (d.length / 4); } catch (e) { luma = null; } }
        // deteksi (±14 fps)
        if (now - lastDet > 66 && video.readyState >= 2 && video.currentTime !== lastVT) {
          lastDet = now; lastVT = video.currentTime; cam.lastTs = Math.max((cam.lastTs || 0) + 1, (cam.lastDetect || 0) + 1, now); if (cam.lastDetect != null) cam.lastDetect = cam.lastTs;
          try { const r = cam.lm.detectForVideo(video, cam.lastTs); lm = (r && r.landmarks && r.landmarks[0]) || null; lmT = now; } catch (e) { lm = null; }
        } else if (lm && now - lmT > 600) lm = null;
        const res = evaluate(kind, lm, luma, { w: video.videoWidth, h: video.videoHeight }, video.readyState >= 2 && video.videoWidth > 0);
        last = res; renderList(res); draw(res); view.classList.toggle('ok', res.ok);
        if (help) { bar.style.width = res.ok ? '100%' : '0%'; head.classList.toggle('ok', res.ok); head.textContent = res.ok ? 'Posisimu sudah pas ✓' : res.headline; return; }
        if (res.ok) { if (!okSince) okSince = now; const p = Math.min(1, (now - okSince) / holdMs); bar.style.width = (p * 100) + '%'; go.disabled = false; head.textContent = p >= 1 ? 'Siap! Memulai…' : res.headline; head.classList.add('ok'); if (p >= 1 && !closeTimer) closeTimer = setTimeout(() => finish(true), 450); }
        else { okSince = 0; clearTimeout(closeTimer); closeTimer = 0; bar.style.width = '0%'; go.disabled = true; head.classList.remove('ok'); head.textContent = res.headline; }
      }
      raf = requestAnimationFrame(tick);
    });
  }
  // tombol "?" dalam game: jeda game, buka panduan, lalu lanjutkan
  let helpBusy = false;
  function attachHelp(opts) {
    const bar = document.getElementById('gameBtns'); if (!bar) return;
    let b = document.getElementById('btnCamGuide');
    if (!b) {
      const mute = document.getElementById('btnMute');
      b = document.createElement('button'); b.type = 'button'; b.id = 'btnCamGuide'; b.className = (mute ? mute.className : 'btn-sm') + ' cg-help'; b.textContent = '?'; b.title = 'Panduan kamera'; b.setAttribute('aria-label', 'Buka panduan kamera');
      bar.insertBefore(b, mute || bar.firstChild);
      b.addEventListener('click', async () => {
        if (helpBusy || !b._o) return; helpBusy = true; let paused = false;
        try { if (typeof pauseGame === 'function') { pauseGame(); paused = typeof state !== 'undefined' && state === 'paused'; } } catch (e) {}
        try { await run(Object.assign({}, b._o, { help: true })); } finally { try { if (paused && typeof resumeGame === 'function') resumeGame(); } catch (e) {} helpBusy = false; }
      });
      b._t = setInterval(() => { b.style.display = b._o && b._o.cam && b._o.cam.on ? '' : 'none'; }, 400);
    }
    b._o = { cam: opts.cam, video: opts.video, kind: opts.kind, game: opts.game }; b.style.display = '';
  }
  global.CamGuide = { run, evaluate, KINDS };
})(typeof window !== 'undefined' ? window : globalThis);
