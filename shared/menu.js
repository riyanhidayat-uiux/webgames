/* Merapikan layar menu sebelum masuk game (Al Games): membungkus isi #menu ke dalam kartu bertingkat
   (judul → pilihan → tombol main → pengaturan → tautan) tanpa mengubah urutan, id, atau gaya tombol game. */
(function () {
  'use strict';
  const m = document.getElementById('menu'); if (!m || m.dataset.mn) return; m.dataset.mn = '1';
  const el = (t, c) => { const e = document.createElement(t); e.className = c; return e; };
  const card = el('div', 'mn-card'), head = el('header', 'mn-head'), opts = el('div', 'mn-opts'), acts = el('div', 'mn-actions'), more = el('div', 'mn-more'), foot = el('div', 'mn-foot');
  let stage = 0;
  for (const c of [...m.children]) {
    if (c.matches('a.btn')) { foot.appendChild(c); continue; }
    if (c.matches('button.btn')) { stage = 2; acts.appendChild(c); continue; }
    if (stage === 0) { if (c.matches('h1,p,.tips,.hint')) head.appendChild(c); else { stage = 1; opts.appendChild(c); } continue; }
    (stage === 1 ? opts : more).appendChild(c);
  }
  // label kecil di atas tiap baris pilihan
  const IDS = { gmBox: 'Mode permainan', chillBox: 'Aturan', vsBox: 'Pemain', diffBox: 'Kesulitan', modeBox: 'Mode', typeBox: 'Jenis permainan', envBox: 'Suasana', viewBox: 'Sudut pandang', carBox: 'Mobil', songBox: 'Lagu', ballBox: 'Bola', progBox: 'Program', skillBox: 'Kiper', teamBox: 'Seragam', atmoBox: 'Suasana' };
  opts.querySelectorAll(':scope > .modes, :scope > .songs, :scope > .balls').forEach(r => {
    if (r.querySelector('.lab')) return;
    let t = IDS[r.id]; const txt = r.textContent;
    if (!t) t = /player/i.test(txt) ? 'Pemain' : /mudah|sedang|normal|sulit/i.test(txt) ? 'Kesulitan' : '';
    if (t) r.dataset.label = t;
  });
  // tautan tambahan: halaman detail game
  const folder = location.pathname.split('/').filter(Boolean).filter(s => !/\.html?$/i.test(s)).pop();
  if (folder) { const a = document.createElement('a'); a.className = 'btn ghost'; a.href = '../detail/' + encodeURIComponent(folder) + '.html'; a.textContent = 'ℹ️ Tentang game'; a.style.textDecoration = 'none'; a.style.minWidth = '0'; foot.appendChild(a); }
  [head, opts, acts, more, foot].forEach(s => { if (s.children.length) card.appendChild(s); });
  m.appendChild(card);
})();
