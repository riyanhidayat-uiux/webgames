'use strict';
// ======================= MENU & PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = '<div class="row"><label>Toleransi gerak</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = gerakan yang kurang dalam/tinggi tetap dihitung. Turunkan untuk penilaian lebih ketat.</small>';
  const i1 = d.querySelector('input'), v1 = d.querySelector('.val'); i1.value = settings.tol; v1.textContent = settings.tol; i1.oninput = () => { settings.tol = +i1.value; saveSettings(); sync(); }; csInputs.push({ i1, v1 }); box.appendChild(d);
  const d2 = document.createElement('div'); d2.className = 'cs'; d2.innerHTML = '<label class="chk">Suara pelatih (hitung repetisi) <input type="checkbox"></label>'; const cb = d2.querySelector('input'); cb.checked = settings.voice; cb.onchange = () => { settings.voice = cb.checked; saveSettings(); sync(); }; csInputs.push({ cb }); box.appendChild(d2);
  const d3 = document.createElement('div'); d3.className = 'cs'; d3.innerHTML = '<div class="row"><label>Redup latar kamera</label><input type="range" min="0" max="0.8" step="0.05"><span class="val"></span></div>'; const i3 = d3.querySelector('input'), v3 = d3.querySelector('.val'); i3.value = settings.dim; v3.textContent = Math.round(settings.dim * 100) + '%'; i3.oninput = () => { settings.dim = +i3.value; saveSettings(); sync(); applyDim(); }; csInputs.push({ i3, v3 }); box.appendChild(d3);
}
function sync() { for (const x of csInputs) { if (x.cb) x.cb.checked = settings.voice; else if (x.i1) { x.i1.value = settings.tol; x.v1.textContent = settings.tol; } else { x.i3.value = settings.dim; x.v3.textContent = Math.round(settings.dim * 100) + '%'; } } }
const applyDim = () => { $('dim').style.opacity = settings.dim; };
buildSettings($('csMenu')); buildSettings($('csPause')); applyDim();
$('progBox').querySelectorAll('button').forEach(b => { b.classList.toggle('on', +b.dataset.p === settings.prog); b.onclick = () => { settings.prog = +b.dataset.p; saveSettings(); $('progBox').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; });
function setVersus(v) { versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); }
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
$('btnCam').onclick = () => startGame(true); $('btnDemo').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainDemo').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnCal').onclick = recalibrate; $('btnSkip').onclick = skip;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; }; $('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.5; saveSettings(); muteLabel(); }; muteLabel();
let best = store.get('best', 0);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
