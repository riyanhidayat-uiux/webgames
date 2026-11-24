'use strict';
// ---------- pengaturan sensor ----------
const CS = [
  { k: 'lean', label: 'Kepekaan geser badan', min: 1, max: 10, step: 1, tip: 'Tinggi = cukup geser sedikit untuk pindah jalur' },
  { k: 'jump', label: 'Kepekaan lompat', min: 1, max: 10, step: 1, tip: 'Tinggi = lompat kecil sudah terbaca' },
  { k: 'duck', label: 'Kepekaan merunduk', min: 1, max: 10, step: 1, tip: 'Tinggi = cukup menunduk sedikit' }
];
const csInputs = [];
function buildSettings(box) {
  for (const c of CS) {
    const d = document.createElement('div'); d.className = 'cs';
    d.innerHTML = `<div class="row"><label>${c.label}</label><input type="range" min="${c.min}" max="${c.max}" step="${c.step}"><span class="val"></span></div><small>${c.tip}</small>`;
    const inp = d.querySelector('input'), val = d.querySelector('.val'); inp.value = settings[c.k]; val.textContent = settings[c.k];
    inp.oninput = () => { settings[c.k] = +inp.value; saveSettings(); syncSettings(); };
    csInputs.push({ c, inp, val }); box.appendChild(d);
  }
  const d = document.createElement('div'); d.className = 'cs';
  d.innerHTML = '<label class="chk">Tampilkan pratinjau kamera <input type="checkbox"></label>';
  const cb = d.querySelector('input'); cb.checked = settings.prev; cb.onchange = () => { settings.prev = cb.checked; saveSettings(); applyPreview(); syncSettings(); };
  csInputs.push({ cb }); box.appendChild(d);
  const b = document.createElement('button'); b.className = 'btn ghost tiny'; b.textContent = '↺ Kembalikan standar';
  b.onclick = () => { Object.assign(settings, SET_DEF); saveSettings(); syncSettings(); }; box.appendChild(b);
}
function syncSettings() { for (const x of csInputs) { if (x.cb) x.cb.checked = settings.prev; else { x.inp.value = settings[x.c.k]; x.val.textContent = settings[x.c.k]; } } }
function applyPreview() { $('camBox').style.opacity = settings.prev ? 1 : 0; }
buildSettings($('csMenu')); buildSettings($('csPause'));
