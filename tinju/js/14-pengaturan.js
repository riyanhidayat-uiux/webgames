'use strict';
// ======================= PENGATURAN =======================
const csInputs = [];
function buildSettings(box) {
  const d = document.createElement('div'); d.className = 'cs'; d.innerHTML = '<div class="row"><label>Kepekaan pukulan</label><input type="range" min="1" max="10" step="1"><span class="val"></span></div><small>Tinggi = gerakan pelan pun terhitung pukulan. Turunkan kalau sering memukul sendiri.</small>';
  const inp = d.querySelector('input'), val = d.querySelector('.val'); inp.value = settings.sens; val.textContent = settings.sens; inp.oninput = () => { settings.sens = +inp.value; saveSettings(); sync(); }; csInputs.push({ inp, val }); box.appendChild(d);
  const d2 = document.createElement('div'); d2.className = 'cs'; d2.innerHTML = '<label style="display:flex;justify-content:space-between;align-items:center">Tampilkan pratinjau kamera <input type="checkbox" style="width:20px;height:20px;accent-color:#ffb000"></label>'; const cb = d2.querySelector('input'); cb.checked = settings.prev; cb.onchange = () => { settings.prev = cb.checked; saveSettings(); applyPrev(); sync(); }; csInputs.push({ cb }); box.appendChild(d2);
}
function sync() { for (const x of csInputs) { if (x.cb) x.cb.checked = settings.prev; else { x.inp.value = settings.sens; x.val.textContent = settings.sens; } } }
function applyPrev() { $('camBox').style.opacity = settings.prev ? 1 : 0; }
buildSettings($('csMenu')); buildSettings($('csPause'));
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
$('diffBox').querySelectorAll('button').forEach(b => { b.classList.toggle('on', +b.dataset.d === settings.diff); b.onclick = () => { settings.diff = +b.dataset.d; saveSettings(); $('diffBox').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }; });
