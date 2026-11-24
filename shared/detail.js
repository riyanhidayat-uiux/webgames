/* Penyempurnaan halaman detail game (data dinamis): jumlah dimainkan global, rekor pribadi, label, papan peringkat, tema, header.
   Konten utama sudah ada di HTML statis (dibuat oleh tools/build-detail.js), jadi halaman tetap terbaca tanpa skrip ini. */
(function () {
  'use strict';
  const B = document.body.dataset, $ = id => document.getElementById(id);
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmtN = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace('.0', '') + ' jt' : n >= 1e4 ? (n / 1e3).toFixed(0) + 'rb' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.0', '') + 'rb' : String(n);
  const th = ls.get('hub_theme'); if (th) document.documentElement.dataset.theme = th;
  const top = $('top'), onScroll = () => top.classList.toggle('solid', scrollY > 24); addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const play = $('playBtn'); if (play) play.addEventListener('click', () => ls.set('hub_last', B.path));
  // rekor pribadi
  let best = null; if (B.bestKey) { try { const v = ls.get(B.bestKey); best = v === null ? null : JSON.parse(v); } catch (e) {} }
  const stats = $('stats'), kv = $('kv'), badges = $('badges');
  const put = (plays, ok) => {
    let h = '';
    if (ok) h += `<div class="stat"><b>${fmtN(plays[B.path] || 0)}×</b><span>dimainkan semua pemain</span></div>`;
    if (best != null) h += `<div class="stat"><b>${esc(best)}</b><span>${esc(B.bestLabel || 'Rekor')}mu</span></div>`;
    stats.innerHTML = h;
    kv.querySelectorAll('.dyn').forEach(e => e.remove());
    const add = (k, v) => { const d = document.createElement('div'); d.className = 'dyn'; d.innerHTML = `<dt>${k}</dt><dd>${v}</dd>`; kv.insertBefore(d, kv.lastElementChild); };
    if (ok) add('Dimainkan', (plays[B.path] || 0).toLocaleString('id-ID') + '×');
    if (best != null) add(esc(B.bestLabel || 'Rekor') + 'mu', esc(best));
    if (ok && (plays[B.path] || 0) > 0 && !badges.querySelector('.hot') && !Object.keys(plays).some(k => plays[k] > plays[B.path])) badges.insertAdjacentHTML('afterbegin', '<span class="bd hot">🔥 TERPOPULER</span>');
  };
  put({}, false);
  fetch('../api/plays', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject()).then(d => put(d.plays || {}, true)).catch(() => {});
  // papan peringkat
  const sec = $('lbSec');
  if (sec && window.Leaderboard) {
    const units = JSON.parse(sec.dataset.boards || '{}');
    Leaderboard.top(B.game).then(b => { for (const k of Object.keys(units)) { const ol = $('lb_' + k); if (!ol) continue; if (b) Leaderboard.renderList(ol, b[k], Leaderboard.name(), units[k]); else ol.innerHTML = '<li class="lb-empty">Peringkat tidak tersedia</li>'; } });
  }
})();
