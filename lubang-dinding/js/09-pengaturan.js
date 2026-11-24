'use strict';
// ======================= PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const d = document.createElement('div'); d.className = 'cs';
  d.innerHTML = '<div class="row"><label>Toleransi lubang</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = lubang lebih lebar (lebih mudah muat)</small>';
  const inp = d.querySelector('input'), val = d.querySelector('.val'); inp.value = settings.tol; val.textContent = settings.tol; inp.oninput = () => { settings.tol = +inp.value; saveSettings(); sync(); };
  csInputs.push({ inp, val }); box.appendChild(d);
  const d2 = document.createElement('div'); d2.className = 'cs'; d2.innerHTML = '<label class="chk">Tampilkan pratinjau kamera <input type="checkbox"></label>';
  const cb = d2.querySelector('input'); cb.checked = settings.prev; cb.onchange = () => { settings.prev = cb.checked; saveSettings(); applyPreview(); sync(); }; csInputs.push({ cb }); box.appendChild(d2);
  const d3 = document.createElement('div'); d3.className = 'cs'; d3.innerHTML = '<label class="chk">Musik latar <input type="checkbox"></label>';
  const cm = d3.querySelector('input'); cm.checked = settings.music !== false; cm.onchange = () => { settings.music = cm.checked; saveSettings(); sync(); }; csInputs.push({ cbm: cm }); box.appendChild(d3);
  const d4 = document.createElement('div'); d4.className = 'cs'; d4.innerHTML = '<label class="chk">Pose kaki (lutut / satu kaki) <input type="checkbox"></label><small>Butuh seluruh badan sampai kaki terlihat kamera. Matikan jika kakimu tidak terlihat.</small>';
  const cl = d4.querySelector('input'); cl.checked = settings.legs !== false; cl.onchange = () => { settings.legs = cl.checked; saveSettings(); sync(); }; csInputs.push({ cbl: cl }); box.appendChild(d4);
  const b = document.createElement('button'); b.className = 'btn ghost tiny'; b.textContent = '↺ Kembalikan standar'; b.onclick = () => { Object.assign(settings, SET_DEF); saveSettings(); sync(); }; box.appendChild(b);
}
function sync() { for (const x of csInputs) { if (x.cbl) x.cbl.checked = settings.legs !== false; else if (x.cbm) x.cbm.checked = settings.music !== false; else if (x.cb) x.cb.checked = settings.prev; else { x.inp.value = settings.tol; x.val.textContent = settings.tol; } } }
function applyPreview() { $('camBox').style.opacity = settings.prev ? 1 : 0; }
buildSettings($('csMenu')); buildSettings($('csPause'));
$('diffBox').querySelectorAll('button').forEach(b => { b.classList.toggle('on', +b.dataset.d === settings.diff); b.onclick = () => { settings.diff = +b.dataset.d; saveSettings(); if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); $('diffBox').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; });
function setChill(c) { chill = c; if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); store.set('chill', c); best = store.get(bestKey(), 0); $('modeBox').querySelectorAll('button').forEach(b => b.classList.toggle('on', (+b.dataset.c === 1) === c)); show('chillHelp', c); $('bestHud').textContent = 'TERBAIK ' + best; }

function setVersus(v) { versus = v; if (typeof lbMenuRefresh === 'function') lbMenuRefresh(); $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); PL = (v ? [0, 1] : [0]).map(mkPlayer); }
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
