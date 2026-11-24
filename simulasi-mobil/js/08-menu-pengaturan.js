'use strict';
// ======================= MENU & PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const mk = html => { const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = html; box.appendChild(d); return d; };
  let d = mk('<div class="row"><label>Kepekaan setir</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = cukup memutar tangan sedikit untuk belok penuh.</small>');
  let i = d.querySelector('input'), v = d.querySelector('.val'); i.oninput = () => { settings.sens = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.sens; v.textContent = settings.sens; });
  d = mk('<label class="chk">Balik arah setir <input type="checkbox"></label><small>Aktifkan bila mobil membelok berlawanan dengan putaran tangan/ponselmu.</small>'); const cb = d.querySelector('input'); cb.onchange = () => { settings.invert = cb.checked; saveSettings(); sync(); }; csInputs.push(() => { cb.checked = settings.invert; });
  d = mk('<label class="chk">Tikungan & tanjakan <input type="checkbox"></label><small>Jalan berkelok & berbukit; tikungan menarik mobil keluar sehingga harus dilawan dengan setir. Matikan untuk jalan lurus.</small>'); const ct = d.querySelector('input'); ct.onchange = () => { settings.terrain = ct.checked; saveSettings(); terrSetup(); sync(); }; csInputs.push(() => { ct.checked = settings.terrain !== false; });
  d = mk('<div class="row"><label>Kualitas grafis</label><select><option value="auto">Otomatis</option><option value="0">Rendah</option><option value="1">Sedang</option><option value="2">Tinggi</option></select></div><small>Otomatis menyesuaikan dengan kecepatan perangkat. Tinggi = bayangan lunak & pantulan; Rendah = tanpa bayangan. Tekan F3 untuk statistik performa. (Jumlah daun pohon baru berubah setelah memuat ulang.)</small>'); const cg = d.querySelector('select');
  cg.onchange = () => { if (cg.value === 'auto') { settings.gfxAuto = true; settings.gfx = settings.gfxDetected == null ? 2 : Math.max(settings.gfxDetected, 1); } else { settings.gfxAuto = false; settings.gfx = +cg.value; } settings.quality = settings.gfx >= 1 ? 1 : 0; saveSettings(); applyGfxLevel(settings.gfx); sync(); }; csInputs.push(() => { cg.value = settings.gfxAuto ? 'auto' : String(settings.gfx); });
  d = mk('<div class="row"><label>Redupkan layar</label><input type="range" min="0" max="0.7" step="0.05"><span class="val"></span></div>'); i = d.querySelector('input'); v = d.querySelector('.val'); i.oninput = () => { settings.dim = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.dim; v.textContent = Math.round(settings.dim * 100) + '%'; $('dim').style.opacity = settings.dim; });
}
function sync() { csInputs.forEach(f => f()); }
buildSettings($('csMenu')); buildSettings($('csPause')); sync();
(() => {
  const eb = $('envBox'); ENVS.forEach((E, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (k === settings.env ? ' on' : ''); b.textContent = E.n; b.onclick = () => { settings.env = k; saveSettings(); applyEnv(k); [...eb.children].forEach((x, j) => x.classList.toggle('on', j === k)); }; eb.appendChild(b); });
  const wb = $('weatherBox'), wh = $('wxHelp'), wxSel = k => { settings.weather = k; saveSettings(); applyEnv(settings.env); [...wb.children].forEach((x, j) => x.classList.toggle('on', j === k)); wh.textContent = WEATHERS[k].help; };
  WEATHERS.forEach((W, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (k === settings.weather ? ' on' : ''); b.textContent = W.n; b.onclick = () => wxSel(k); wb.appendChild(b); }); wh.textContent = WEATHERS[settings.weather | 0].help;

})();
const MODE_HELP = ['Tabrakan mengurangi 1 dari 3 nyawa. Makin jauh, makin ramai & cepat.', 'Tanpa nyawa: tabrakan hanya memperlambat dan memotong 50 poin. Waktu 3 menit, kejar skor tertinggi.', 'Tanpa nyawa, tanpa waktu, lalu lintas lebih sepi & pelan. Menyetir santai sepuasnya, akhiri lewat menu Jeda (⏸).'];
function setMode(m) { mode = m; chill = m >= 1; timed = m === 1; freeMode = m === 2; settings.mode = m; settings.chill = chill; saveSettings(); best = store.get(bestKey(), 0); $('modeBox').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.m === m)); $('modeHelp').textContent = MODE_HELP[m]; terrSetup(); if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); }
$('modeBox').querySelectorAll('button').forEach(b => { b.onclick = () => setMode(+b.dataset.m); }); setMode(mode);
(() => { const vb = $('viewBox'); VIEWS.forEach((n, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (k === settings.view ? ' on' : ''); b.textContent = n; b.onclick = () => { setView(k); saveSettings(); [...vb.children].forEach((x, j) => x.classList.toggle('on', j === k)); }; vb.appendChild(b); }); })();
$('btnView').onclick = () => cycleView(); $('btnFinish').onclick = () => { show('paused', false); gameOver(false); };
// --- pilihan jenis permainan: Menyetir bebas / Balapan ---
function setGType(g) { gameType = g; terrSetup(); settings.gtype = g === 'race' ? 1 : 0; saveSettings(); $('typeBox').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.g === g)); show('raceBox', g === 'race'); show('modeBox', g !== 'race'); show('modeHelp', g !== 'race'); updateStartButtons(); }
function updateStartButtons() { const r = gameType === 'race', two = r && settings.players === 2; $('btnCam').textContent = r ? (two ? '📷 Balapan 2 Player (Kamera)' : '📷 Balapan (Kamera)') : '📷 Main Pakai Kamera (Setir Tangan)'; $('btnKey').textContent = r ? (two ? '⌨️ Balapan 2 Player (Keyboard)' : '⌨️ Balapan (Keyboard / Sentuh)') : '⌨️ Main Keyboard / Sentuh'; show('btnTilt', !two); $('raceHelp').textContent = two ? 'Layar terbelah: P1 di kiri, P2 di kanan. Kamera: berdiri berdampingan, masing-masing memegang setir. Keyboard: P1 = ← → ↑ ↓, P2 = A D W S.' : 'Kalahkan 3 pembalap AI sampai garis finis! Lewati bantalan 🚀 nitro dan menempellah di belakang mobil lain (slipstream) untuk lebih cepat.';  if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); }
const optBtns = (id, labels, key) => { const box = $(id); box.innerHTML = ''; labels.forEach((n, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (k === settings[key] ? ' on' : ''); b.textContent = n; b.onclick = () => { settings[key] = k; saveSettings(); [...box.children].forEach((x, j) => x.classList.toggle('on', j === k)); updateStartButtons(); }; box.appendChild(b); }); };
$('typeBox').querySelectorAll('button').forEach(b => { b.onclick = () => setGType(b.dataset.g); });
optBtns('plBox', ['👤 1 Player (lawan AI)', '👥 2 Player (layar terbelah)'], 'players');
optBtns('lenBox', RACE_LENS.map(l => '📏 ' + (l / 1000) + ' km'), 'rlen'); optBtns('diffBox', RDIFF.map(d => d.n), 'rdiff');
$('plBox').querySelectorAll('button').forEach((b, k) => { b.onclick = () => { settings.players = k + 1; saveSettings(); [...$('plBox').children].forEach((x, j) => x.classList.toggle('on', j === k)); updateStartButtons(); }; });
[...$('plBox').children].forEach((x, j) => x.classList.toggle('on', j + 1 === settings.players));
setGType(gameType);
$('btnCam').onclick = () => startGame('cam'); $('btnKey').onclick = () => startGame('key'); $('btnTilt').onclick = () => startGame('tilt');
$('btnAgainCam').onclick = () => startGame('cam'); $('btnAgainKey').onclick = () => startGame('key');
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
$('btnCal').onclick = () => { if ((!useCam && !useTilt) || state !== 'play') return; CP.forEach(c => { c.base.ok = false; }); tilt.ok = false; state = 'calib'; startCalib(); };
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.55; saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
