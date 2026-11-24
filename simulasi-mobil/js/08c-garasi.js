'use strict';
// ======================= GARASI & KOIN =======================
// Koin didapat dari skor (mode menyetir) atau peringkat (balapan). Di Garasi koin ditukar warna, model, neon bawah mobil, dan klakson.
const GAR = {
  tabs: [['colors', '🎨 Warna'], ['models', '🚘 Model'], ['neon', '💡 Neon'], ['horns', '📯 Klakson']],
  items: {
    colors: CAR_COLORS.map((c, i) => ({ n: c.n, css: c.css, price: i < FREE_COLORS ? 0 : [80, 80, 120, 120, 250][i - FREE_COLORS] })),
    models: [{ n: 'Sedan', icon: '🚗', price: 0 }, { n: 'Hatchback', icon: '🚘', price: 150 }, { n: 'SUV', icon: '🚙', price: 300 }, { n: 'MPV', icon: '🚐', price: 200 }, { n: 'Coupe', icon: '🏎️', price: 350 }, { n: 'Pickup', icon: '🛻', price: 250 }],
    neon: [{ n: 'Mati', icon: '⚫', price: 0 }, { n: 'Biru', css: '#2ab8ff', price: 200 }, { n: 'Hijau', css: '#3aff8a', price: 200 }, { n: 'Ungu', css: '#b06aff', price: 200 }, { n: 'Merah', css: '#ff3a5a', price: 200 }],
    horns: HORNS.map((h, i) => ({ n: h.n, icon: ['📯', '🚛', '🎵'][i], price: [0, 100, 150][i] }))
  },
  key: { colors: 'carc', models: 'model', neon: 'neon', horns: 'horn' }
};
const GS = { coins: +store.get('coins', 0) || 0, owned: Object.assign({ colors: [0, 1, 2, 3, 4], models: [0], neon: [0], horns: [0] }, store.get('owned', {})), tab: 'colors' };
Object.keys(GAR.key).forEach(t => { const cur = settings[GAR.key[t]] | 0; if (!GS.owned[t].includes(cur)) { if (GAR.items[t][cur] && GAR.items[t][cur].price === 0) GS.owned[t].push(cur); else settings[GAR.key[t]] = 0; } });
const saveG = () => { store.set('coins', GS.coins); store.set('owned', GS.owned); };
function renderCoins() { document.querySelectorAll('.coinN').forEach(e => { e.textContent = GS.coins; }); }
function addCoins(n) { n = Math.max(0, Math.round(n)); if (!n) return 0; GS.coins += n; saveG(); renderCoins(); return n; }

// ---- menu utama: warna yang dimiliki + tombol Garasi ----
function renderCarBox() {
  const cb = $('carBox'); cb.innerHTML = '<span>Warna:</span>';
  GS.owned.colors.slice().sort((a, b) => a - b).forEach(k => { const e = document.createElement('div'); e.className = 'bb' + (k === settings.carc ? ' on' : ''); e.style.background = CAR_COLORS[k].css; e.title = CAR_COLORS[k].n; e.onclick = () => { settings.carc = k; saveSettings(); buildPlayer(); renderCarBox(); }; cb.appendChild(e); });
  const g = document.createElement('button'); g.className = 'btn mode'; g.innerHTML = '🔧 Garasi · 🪙 <b class="coinN">' + GS.coins + '</b>'; g.onclick = openGarage; cb.appendChild(g);
}
// ---- layar Garasi ----
let garageOpen = false;
function openGarage() { initAudio(); garageOpen = true; show('menu', false); show('garage', true); renderGarage(); }
function closeGarage() { garageOpen = false; show('garage', false); show('menu', true); renderCarBox(); }
function renderGarage() {
  const tb = $('gTabs'); tb.innerHTML = ''; GAR.tabs.forEach(([id, label]) => { const b = document.createElement('button'); b.className = 'btn mode' + (GS.tab === id ? ' on' : ''); b.textContent = label; b.onclick = () => { GS.tab = id; renderGarage(); }; tb.appendChild(b); });
  const grid = $('gGrid'); grid.innerHTML = ''; const t = GS.tab, cur = settings[GAR.key[t]] | 0;
  GAR.items[t].forEach((it, i) => {
    const owned = GS.owned[t].includes(i), b = document.createElement('div'); b.className = 'gitem' + (i === cur && owned ? ' on' : '') + (!owned ? ' lock' : '') + (!owned && GS.coins < it.price ? ' poor' : '');
    const vis = it.css ? `<i class="gsw" style="background:${it.css};box-shadow:0 0 ${t === 'neon' ? 14 : 0}px ${it.css}"></i>` : `<i class="gic">${it.icon}</i>`;
    b.innerHTML = `${vis}<div class="gn">${it.n}</div><div class="gp">${i === cur && owned ? '✔ DIPAKAI' : owned ? 'PAKAI' : '🪙 ' + it.price}</div>` + (t === 'horns' ? '<button class="gpv" title="Dengarkan">▶</button>' : '');
    b.onclick = () => pickItem(t, i);
    if (t === 'horns') b.querySelector('.gpv').onclick = e => { e.stopPropagation(); initAudio(); HORNS[i].play(); };
    grid.appendChild(b);
  });
  renderCoins();
}
function pickItem(t, i) {
  const it = GAR.items[t][i], owned = GS.owned[t].includes(i);
  if (!owned) {
    if (GS.coins < it.price) { toast('Koin belum cukup — kurang ' + (it.price - GS.coins) + ' 🪙. Main dulu untuk mengumpulkan koin!', 2600); return; }
    GS.coins -= it.price; GS.owned[t].push(i); saveG(); sfx.buy(); toast('Dibeli: ' + it.n + ' ✔', 1600);
  }
  settings[GAR.key[t]] = i; saveSettings();
  if (t === 'horns') { initAudio(); HORNS[i].play(); } else buildPlayer();
  renderGarage();
}
$('btnGarageBack').onclick = closeGarage;
renderCarBox(); renderCoins();
