#!/usr/bin/env node
/* Membuat halaman detail statis per game: detail/<nama-folder>.html
   Sumber data: games-data.js (GAMES + DETAILS).  Jalankan:  node tools/build-detail.js
   Setelah menambah/mengubah game atau teks detailnya, jalankan ulang skrip ini. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'detail');
const { GAMES, DETAILS } = new vm.Script(fs.readFileSync(path.join(ROOT, 'games-data.js'), 'utf8') + ';({GAMES,DETAILS})').runInNewContext({});
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const slug = g => g.path.replace(/\/$/, '');
const live = GAMES.filter(g => !g.soon), newest = live[live.length - 1];
const PLAY = '<svg viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.2v9.6L10.4 6z"/></svg>';
const list = a => (a || []).map(x => `<li>${esc(x)}</li>`).join('');
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT, f));
let n = 0;
for (const game of live) {
  const D = Object.assign({ tagline: game.desc, how: [], controls: [], modes: [], features: [], req: '' }, DETAILS[game.path] || {});
  const i = live.indexOf(game), others = [1, 2, 3, 4].map(k => live[(i + k) % live.length]).filter((g, k, a) => g !== game && a.indexOf(g) === k);
  const title = `${game.title} — AL GAMES by ACAKODE`, desc = `${D.tagline} ${game.desc || ''}`.trim();
  const tag0 = (game.tags || [])[0] || '-';
  const ld = { '@context': 'https://schema.org', '@type': 'VideoGame', name: game.title, description: game.more || game.desc, genre: (game.tags || []).filter(t => !/[^\x00-\u024f]/.test(t)), applicationCategory: 'Game', operatingSystem: 'Web browser', gamePlatform: 'Web browser', publisher: { '@type': 'Organization', name: 'ACAKODE' } };
  const html = `<!DOCTYPE html>
<html lang="id" style="--c1:${esc(game.colors[0])};--c2:${esc(game.colors[1])}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0f17">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(D.tagline)}"><meta property="og:image" content="../${esc(game.img || '')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Bungee&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../shared/detail.css">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
</head>
<body data-game="${esc(slug(game))}" data-path="${esc(game.path)}" data-best-key="${esc(game.bestKey || '')}" data-best-label="${esc(game.bestLabel || '')}">
<a class="skip" href="#isi">Lewati ke konten</a>
<header class="top" id="top"><div class="top-in pad">
  <a class="brand" href="../" aria-label="AL GAMES by ACAKODE"><span class="logo">AG</span><span class="t">AL GAMES <small class="by-s">by <b class="grad-ac">ACAKODE</b></small></span></a>
  <a class="back" href="../">← Semua game</a>
</div></header>
<section class="hero" style="margin:0"><div class="hero-bg"><img src="../${esc(game.img || '')}" alt="Cuplikan ${esc(game.title)}" fetchpriority="high"></div>
  <div class="hero-in pad"><div class="wrap">
    <div class="crumb"><a href="../">Semua game</a> › ${esc(game.title)}</div>
    <div class="badges" id="badges">${game === newest ? '<span class="bd new">BARU</span>' : ''}<span class="bd">${esc(game.emoji)} ${esc(tag0)}</span>${(game.tags || []).includes('3D') ? '<span class="bd">3D</span>' : ''}</div>
    <h1>${esc(game.title)}</h1>
    <p class="tagline">${esc(D.tagline)}</p>
    <div class="cta"><a class="play" id="playBtn" href="../${esc(game.path)}">MAIN SEKARANG ${PLAY}</a><div class="stats" id="stats"></div></div>
  </div></div></section>
<main class="pad" id="isi"><div class="wrap">
  <div class="grid2"><div>
    <section><h2>Tentang game</h2><p class="about">${esc(game.more || game.desc)}</p></section>
    ${D.how.length ? `<section><h2>Cara bermain</h2><ol class="steps">${D.how.map(h => `<li><span>${esc(h)}</span></li>`).join('')}</ol></section>` : ''}
    ${D.controls.length ? `<section><h2>Kontrol</h2><div class="ctl">${D.controls.map(c => `<div class="cc"><h3><i>${esc(c.icon)}</i>${esc(c.name)}</h3><ul>${list(c.items)}</ul></div>`).join('')}</div></section>` : ''}
    ${D.modes.length ? `<section><h2>Mode permainan</h2><div class="pills">${D.modes.map(m => `<span class="pill">${esc(m)}</span>`).join('')}</div></section>` : ''}
    ${D.boards ? `<section id="lbSec" data-boards='${esc(JSON.stringify(Object.fromEntries(Object.entries(D.boards).map(([k, v]) => [k, v[1]]))))}'><h2>Papan peringkat global</h2><div class="lbgrid">${Object.keys(D.boards).map(k => `<div class="lbc"><h3>${esc(D.boards[k][0])}</h3><ol id="lb_${esc(k)}"><li class="lb-empty">Memuat…</li></ol></div>`).join('')}</div></section>` : ''}
    ${D.features.length ? `<section><h2>Fitur unggulan</h2><ul class="feat">${list(D.features)}</ul></section>` : ''}
  </div>
  <aside>
    <div class="panel"><h3>Info singkat</h3><dl class="kv" id="kv">
      <div><dt>Pemain</dt><dd>${esc(tag0)}</dd></div>
      <div><dt>Platform</dt><dd>Browser (tanpa instal)</dd></div></dl>
      <div class="tagrow" style="margin-top:14px">${(game.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>
    <div class="panel"><h3>Sebelum mulai</h3><p class="req">${esc(D.req)}</p>
      <ul class="checklist"><li>Izinkan akses kamera saat diminta (jika memakai kamera)</li><li>Panduan kamera otomatis memeriksa posisi, jarak, dan cahayamu sebelum game dimulai</li><li>Ruangan cukup terang, latar tidak terlalu ramai</li><li>Nyalakan suara untuk pengalaman terbaik</li><li>Butuh internet untuk memuat Three.js &amp; pendeteksi tubuh</li></ul></div>
  </aside></div>
  <section style="margin-top:20px"><div class="more-h"><h2>Game lainnya</h2><a href="../">Lihat semua →</a></div>
    <div class="more">${others.map(g => `<a class="mc" href="${esc(slug(g))}.html" style="--c1:${esc(g.colors[0])}"><div class="im"><img src="../${esc(g.img || '')}" alt="" loading="lazy"></div><b>${esc(g.title)}</b></a>`).join('')}</div></section>
</div>
<footer class="pad"><div class="wrap">AL GAMES by <b class="grad-ac" style="font-weight:700">ACAKODE</b> · koleksi game gerak berbasis browser</div></footer>
</main>
<script src="../shared/leaderboard.js"></script>
<script src="../shared/detail.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, slug(game) + '.html'), html); n++;
}
console.log(`✓ ${n} halaman detail → detail/`);
