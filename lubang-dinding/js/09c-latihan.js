'use strict';
// ======================= MODE LATIHAN =======================
// Tanpa nyawa & tanpa batas waktu: pilih pose yang mau dilatih, atur kecepatan dinding, panduan sendi selalu menyala.
// Dinding datang satu per satu; pose yang gagal diulang sampai lolos. Ringkasan per pose di akhir sesi.
let practice = false, pstat = {};                                      // pstat: id → { n, ok, best }
const pstore = () => store.get('pstats', {});
const SPEEDS = [['🐢 Pelan', 8.6], ['🚶 Sedang', 6.6], ['🏃 Cepat', 5.0]];
function pracReset() { pstat = {}; PL.forEach(p => { p.retry = null; }); }
function pracPool() { const sel = settings.pracPoses || []; const ok = POSES.filter(p => legsOn() || !p.foot), pool = sel.length ? ok.filter(p => sel.includes(p.id)) : ok; return pool.length ? pool : ok; }
function pracRecord(h, ok, acc) {
  const id = h.pose.id, s = pstat[id] || (pstat[id] = { n: 0, ok: 0, best: 0 }); s.n++; if (ok) s.ok++; s.best = Math.max(s.best, acc);
  const all = pstore(), a = all[id] || (all[id] = { n: 0, ok: 0 }); a.n++; if (ok) a.ok++; store.set('pstats', all);
}
function pracTotals() { let n = 0, ok = 0; for (const k in pstat) { n += pstat[k].n; ok += pstat[k].ok; } return { n, ok }; }
// ---- menu ----
function buildPracBox() {
  const box = $('pracBox'); if (!box) return;
  const sp = SPEEDS.map((s, i) => `<button class="btn mode${settings.pracSpeed === i ? ' on' : ''}" data-s="${i}">${s[0]}</button>`).join('');
  box.innerHTML = `<div class="lbt" style="color:#9fe7ff">🎓 PENGATURAN LATIHAN</div><div class="pl">Kecepatan dinding</div><div class="modes" id="pracSpeed">${sp}</div><div class="pl">Pose yang dilatih <button class="btn ghost tiny" id="pracAll" type="button">Pilih semua</button></div><div class="pchips" id="pracChips"></div><div class="pnote" id="pracNote"></div>`;
  const chips = $('pracChips'); POSES.forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pchip'; b.dataset.id = p.id; b.textContent = p.name; b.onclick = () => { const s = new Set(settings.pracPoses || []); if (s.has(p.id)) s.delete(p.id); else s.add(p.id); settings.pracPoses = [...s]; saveSettings(); pracSync(); }; chips.appendChild(b); });
  $('pracAll').onclick = () => { settings.pracPoses = []; saveSettings(); pracSync(); };
  $('pracSpeed').querySelectorAll('button').forEach(b => { b.onclick = () => { settings.pracSpeed = +b.dataset.s; saveSettings(); pracSync(); }; });
  pracSync();
}
function pracSync() {
  const sel = settings.pracPoses || [], all = !sel.length;
  $('pracChips').querySelectorAll('.pchip').forEach(b => b.classList.toggle('on', all || sel.includes(b.dataset.id)));
  $('pracSpeed').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.s === settings.pracSpeed));
  const st = pstore(), arr = Object.entries(st).filter(([, v]) => v.n >= 3).map(([id, v]) => ({ id, r: v.ok / v.n })).sort((a, b) => a.r - b.r), weak = arr[0] && arr[0].r < 0.8 ? POSES.find(p => p.id === arr[0].id) : null;
  $('pracNote').textContent = (all ? 'Semua pose' : sel.length + ' pose dipilih') + (weak ? ` · pose terlemahmu: ${weak.name} (${Math.round(arr[0].r * 100)}% lolos)` : '');
}
function setMode(m) {
  chill = m === 1; practice = m === 2; store.set('mode', m); store.set('chill', chill);
  best = store.get(bestKey(), 0);
  $('modeBox').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.c === m));
  show('chillHelp', chill); show('pracHelp', practice); show('pracBox', practice); show('diffBox', !practice);
  $('bestHud').textContent = 'TERBAIK ' + best; if (typeof lbMenuRefresh === 'function') lbMenuRefresh();
}
$('modeBox').querySelectorAll('button').forEach(b => { b.onclick = () => setMode(+b.dataset.c); });
buildPracBox(); setMode(store.get('mode', store.get('chill', false) ? 1 : 0));
// ---- ringkasan akhir sesi ----
function pracSummary() {
  const t = pracTotals(), acc = t.n ? Math.round(t.ok / t.n * 100) : 0, rows = Object.keys(pstat).map(id => ({ p: POSES.find(q => q.id === id), s: pstat[id] })).sort((a, b) => (a.s.ok / a.s.n) - (b.s.ok / b.s.n));
  let h = '';
  if (rows.length) {
    h = '<table class="sum"><tr><th>Pose</th><th>Lolos</th><th>Terbaik</th></tr>' + rows.map(r => `<tr><td>${r.p.name}</td><td>${r.s.ok}/${r.s.n}${r.s.ok === r.s.n ? ' ✔' : ''}</td><td>${Math.round(r.s.best * 100)}%</td></tr>`).join('') + '</table>';
    const w = rows[0]; if (w.s.n >= 2 && w.s.ok < w.s.n) h += `<div class="pnote">Perlu dilatih lagi: <b>${w.p.name}</b></div>`;
  }
  return { t, acc, html: h };
}
