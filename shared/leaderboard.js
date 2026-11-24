/* Papan peringkat global Al Games (butuh server.js). Dipakai game & halaman detail.
   Leaderboard.submit(game, board, value) → {ok, rank, board} | {error}
   Leaderboard.top(game) → { board: [{name,value}] ... }
   Leaderboard.renderList(ol, rows, me) · Leaderboard.name() / setName() */
(function (g) {
  'use strict';
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const pid = () => { let p = ls.get('lb_pid'); if (!/^[A-Za-z0-9_-]{8,40}$/.test(p || '')) { p = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now().toString(36)).replace(/[^A-Za-z0-9_-]/g, ''); ls.set('lb_pid', p); } return p; };
  const api = p => new URL('../api/' + p, location.href).href;
  const L = {
    name: () => ls.get('lb_name') || '',
    setName: n => ls.set('lb_name', String(n || '').trim().slice(0, 16)),
    async top(game) { try { const r = await fetch(api('scores?game=' + encodeURIComponent(game)), { cache: 'no-store' }); if (!r.ok) return null; return (await r.json()).boards || {}; } catch (e) { return null; } },
    async submit(game, board, value, name) {
      name = (name || L.name()).trim(); if (!name) return { error: 'Isi nama dulu' };
      try { const r = await fetch(api('score'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ game, board, name, value, pid: pid() }) }); const d = await r.json().catch(() => ({})); if (!r.ok) return { error: d.error || 'Gagal mengirim skor' }; L.setName(name); return d; }
      catch (e) { return { error: 'Server peringkat tidak tersedia' }; }
    },
    renderList(ol, rows, me, unit) {
      ol.innerHTML = ''; me = (me || '').toLowerCase();
      if (!rows || !rows.length) { const li = document.createElement('li'); li.className = 'lb-empty'; li.textContent = 'Belum ada skor — jadilah yang pertama!'; ol.appendChild(li); return; }
      rows.slice(0, 10).forEach((r, i) => { const li = document.createElement('li'); if (me && r.name.toLowerCase() === me) li.className = 'me'; const a = document.createElement('span'), b = document.createElement('b'); a.textContent = (i < 3 ? ['🥇', '🥈', '🥉'][i] : (i + 1) + '.') + ' ' + r.name; b.textContent = r.value + (unit ? ' ' + unit : ''); li.append(a, b); ol.appendChild(li); });
    }
  };
  g.Leaderboard = L;
})(window);
