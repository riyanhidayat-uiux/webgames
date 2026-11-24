'use strict';
// ======================= MENU & PENGATURAN =======================
(() => { const box = $('songBox'); SONGS.forEach((sg, i) => { const b = document.createElement('button'); b.className = 'songbtn' + (i === settings.song ? ' on' : ''); b.innerHTML = `<span class="e">${sg.e}</span><span><div class="n">${sg.name}</div><div class="d">${sg.desc}</div></span><span class="bt">${sg.bpm} BPM</span>`; b.onclick = () => { settings.song = i; saveSettings(); [...box.children].forEach((x, k) => x.classList.toggle('on', k === i)); }; box.appendChild(b); }); })();
const csInputs = [];
function buildSettings(box) {
  const defs = [{ k: 'tol', label: 'Toleransi pose', min: 1, max: 10, step: 1, fmt: v => v, tip: 'Tinggi = pose yang kurang mirip tetap dihitung bagus' }, { k: 'dim', label: 'Redup latar kamera', min: 0, max: 0.8, step: 0.05, fmt: v => Math.round(v * 100) + '%', tip: '' }];
  for (const c of defs) { const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = `<div class="row"><label>${c.label}</label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"><span class="val"></span></div>${c.tip ? `<small>${c.tip}</small>` : ''}`; const inp = d.querySelector('input'), val = d.querySelector('.val'); inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]); inp.oninput = () => { settings[c.k] = +inp.value; saveSettings(); sync(); applyDim(); }; csInputs.push({ c, inp, val }); box.appendChild(d); }
}
function sync() { for (const x of csInputs) { x.inp.value = settings[x.c.k]; x.val.textContent = x.c.fmt(settings[x.c.k]); } }
const applyDim = () => { $('dim').style.opacity = settings.dim; };
buildSettings($('csMenu')); buildSettings($('csPause')); applyDim();
function setVersus(v) { versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); }
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
$('btnCam').onclick = () => startGame(true); $('btnDemo').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainDemo').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; }; $('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.55; saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
