'use strict';
// ======================= PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const defs = [{ k: 'size', label: 'Ukuran target', min: 0.7, max: 1.5, step: 0.05, fmt: v => Math.round(v * 100) + '%', tip: 'Besar = target dan area sentuh lebih besar (lebih mudah)' }, { k: 'dim', label: 'Redup latar kamera', min: 0, max: 0.8, step: 0.05, fmt: v => Math.round(v * 100) + '%', tip: 'Naikkan kalau bola sulit terlihat di latar yang terang' }];
  for (const c of defs) { const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = `<div class="row"><label>${c.label}</label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"><span class="val"></span></div><small>${c.tip}</small>`;
    const inp = d.querySelector('input'), val = d.querySelector('.val'); inp.value = settings[c.k]; val.textContent = c.fmt(settings[c.k]); inp.oninput = () => { settings[c.k] = +inp.value; saveSettings(); sync(); applyDim(); }; csInputs.push({ c, inp, val }); box.appendChild(d); }
  const b = document.createElement('button'); b.className = 'btn ghost tiny'; b.textContent = '↺ Kembalikan standar'; b.onclick = () => { Object.assign(settings, SET_DEF); saveSettings(); sync(); applyDim(); }; box.appendChild(b);
}
function sync() { for (const x of csInputs) { x.inp.value = settings[x.c.k]; x.val.textContent = x.c.fmt(settings[x.c.k]); } }
const applyDim = () => { $('dim').style.opacity = settings.dim; };
buildSettings($('csMenu')); buildSettings($('csPause')); applyDim();
$('diffBox').querySelectorAll('button').forEach(b => { b.classList.toggle('on', +b.dataset.d === settings.diff); b.onclick = () => { settings.diff = +b.dataset.d; saveSettings(); $('diffBox').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; });
function setVersus(v) { versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); PL = (v ? [0, 1] : [0]).map(mkP); }
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
