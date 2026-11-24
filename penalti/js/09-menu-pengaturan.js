'use strict';
// ======================= MENU & PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const mk = html => { const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = html; box.appendChild(d); return d; };
  let d = mk('<div class="row"><label>Kepekaan tendangan</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = ayunan kaki lebih pelan sudah terbaca sebagai tendangan.</small>');
  let i = d.querySelector('input'), v = d.querySelector('.val'); i.oninput = () => { settings.sens = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.sens; v.textContent = settings.sens; });
  d = mk('<div class="row"><label>Redupkan layar</label><input type="range" min="0" max="0.7" step="0.05"><span class="val"></span></div>'); i = d.querySelector('input'); v = d.querySelector('.val'); i.oninput = () => { settings.dim = +i.value; saveSettings(); sync(); }; csInputs.push(() => { i.value = settings.dim; v.textContent = Math.round(settings.dim * 100) + '%'; $('dim').style.opacity = settings.dim; });
}
function sync() { csInputs.forEach(f => f()); }
buildSettings($('csMenu')); buildSettings($('csPause')); sync();
function optRow(id, label, items, key, onSet) { const box = $(id); box.innerHTML = label ? `<span class="lab">${label}</span>` : ''; items.forEach((n, k) => { const b = document.createElement('button'); b.className = 'btn mode' + (k === settings[key] ? ' on' : ''); b.textContent = n; b.onclick = () => { settings[key] = k; saveSettings(); [...box.querySelectorAll('button')].forEach((x, j) => x.classList.toggle('on', j === k)); if (onSet) onSet(k); }; box.appendChild(b); }); }
optRow('modeBox', '', MODES, 'mode'); optRow('skillBox', 'Kiper:', SKILLS.map(s => s.n), 'skill'); optRow('atmoBox', 'Suasana:', ATMO.map(a => a.n), 'atmo', k => applyAtmo(k));
(() => { const box = $('teamBox'); box.innerHTML = '<span class="lab">Seragam:</span>'; TEAMS.forEach((t, k) => { const e = document.createElement('div'); e.className = 'kit' + (k === settings.team ? ' on' : ''); e.style.background = `linear-gradient(135deg,#${t.c1.toString(16).padStart(6, '0')} 62%,#${t.c2.toString(16).padStart(6, '0')} 62%)`; e.title = t.n; e.onclick = () => { settings.team = k; saveSettings(); [...box.querySelectorAll('.kit')].forEach((x, j) => x.classList.toggle('on', j === k)); }; box.appendChild(e); }); })();
$('btnCam').onclick = () => startGame(true); $('btnKey').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainKey').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
$('btnCal').onclick = () => { if (!useCam || state !== 'ready') return; base.ok = false; state = 'calib'; startCalib(); };
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.65; saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
