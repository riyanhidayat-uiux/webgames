'use strict';
// ======================= MENU & PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const mk = html => { const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = html; box.appendChild(d); return d; };
  let d = mk('<div class="row"><label>Kepekaan ayunan</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = ayunan lebih pelan sudah terbaca sebagai lemparan.</small>');
  let i = d.querySelector('input'), v = d.querySelector('.val'); i.oninput = () => { settings.sens = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.sens; v.textContent = settings.sens; });
  d = mk('<div class="row"><label>Tangan melempar</label><select><option value="0">Otomatis</option><option value="1">Kanan</option><option value="2">Kiri</option></select></div><small>Otomatis = tangan yang bergerak lebih cepat.</small>');
  const sel = d.querySelector('select'); sel.onchange = () => { settings.hand = +sel.value; saveSettings(); sync(); }; csInputs.push(() => { sel.value = settings.hand; });
  d = mk('<label class="chk">Garis bidik di lintasan <input type="checkbox"></label>'); const cb = d.querySelector('input'); cb.onchange = () => { settings.assist = cb.checked; saveSettings(); sync(); }; csInputs.push(() => { cb.checked = settings.assist; });
  d = mk('<div class="row"><label>Redupkan layar</label><input type="range" min="0" max="0.7" step="0.05"><span class="val"></span></div>'); i = d.querySelector('input'); v = d.querySelector('.val'); i.oninput = () => { settings.dim = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.dim; v.textContent = Math.round(settings.dim * 100) + '%'; $('dim').style.opacity = settings.dim; });
}
function sync() { csInputs.forEach(f => f()); }
buildSettings($('csMenu')); buildSettings($('csPause')); sync();
(() => { const box = $('ballBox'); box.innerHTML = '<span>Bola:</span>'; BALLS.forEach((b, k) => { const e = document.createElement('div'); e.className = 'bb' + (k === settings.ball ? ' on' : ''); e.style.background = `radial-gradient(circle at 32% 30%, #fff8 0, ${b.css} 55%, #000 130%)`; e.title = b.n; e.onclick = () => { settings.ball = k; saveSettings(); setBallStyle(k); [...box.querySelectorAll('.bb')].forEach((x, j) => x.classList.toggle('on', j === k)); }; box.appendChild(e); }); })();
function setVersus(v) { versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); }
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
$('btnCam').onclick = () => startGame(true); $('btnDemo').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainDemo').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
$('btnCal').onclick = () => { if (!useCam || (state !== 'ready' && state !== 'swing')) return; base.ok = false; state = 'calib'; startCalib(); };
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.6; if (settings.mute) sfx.rollStop(); saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
