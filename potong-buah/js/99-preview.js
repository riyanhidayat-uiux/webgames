'use strict';
// ======================= MODE PRATINJAU =======================
// ?preview=1 → adegan otomatis (gelombang buah + sapuan combo) lalu membeku. Dipakai tools/capture-thumbs.sh.
(function () {
  if (!/[?&]preview\b/.test(location.search)) return;
  const st = document.createElement('style'); st.textContent = '.overlay,#menu,#over,#paused,#camHelp,.toast,#gameBtns,#btnInf{display:none!important}'; document.head.appendChild(st);
  addEventListener('load', () => setTimeout(() => {
    setGm('classic'); startGame(false, false); show('menu', false); show('gameBtns', false);
    score = 46; fruits.length = 0; updateHud();
    let now = 1000; const step = n => { for (let i = 0; i < n; i++) { now += 16.7; update(1 / 60, now); } };
    PATTERNS.cross().slice(0, 2).forEach(s => spawnOne(false, undefined, false, undefined, s)); step(14);
    PATTERNS.stairs(5).forEach((s, i) => { s.d = 0; s.h = 0.6 + (i % 3) * 0.08; spawnOne(false, undefined, false, undefined, s); }); step(34);
    fruits.forEach((f, i) => { if (f.y < H * 0.62 && i % 2 === 0 && !f.t.sq) { f.t = Object.assign({}, f.t, { e: '🍉', c: '#ff3b4e' }); f.e = '🍉'; } });
    const cand = fruits.filter(f => f.y < H * 0.6 && f.y > H * 0.14 && f.vy > -H * 0.5).sort((a, c) => a.x - c.x), mid = cand.length > 3 ? [cand[1], cand[cand.length >> 1], cand[cand.length - 2]] : cand;
    if (mid.length >= 2) {                                                          // satu sapuan lewat 3 buah di tengah
      const b = sensorBlade, P = [[mid[0].x - 90, mid[0].y + 40], ...mid.map(f => [f.x, f.y]), [mid[mid.length - 1].x + 90, mid[mid.length - 1].y - 40]];
      for (let k = 1; k < P.length; k++) { for (let j = 0; j < 6; j++) { const t0 = j / 6, t1 = (j + 1) / 6, ax = P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t0, ay = P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t0, bx = P[k - 1][0] + (P[k][0] - P[k - 1][0]) * t1, by = P[k - 1][1] + (P[k][1] - P[k - 1][1]) * t1; trySlice(ax, ay, bx, by, b); b.pts.push({ x: bx, y: by, t: now - (P.length - k) * 18 + j * 3 }); } }
    }
    step(7); state = 'paused'; document.documentElement.dataset.previewReady = '1';
  }, 400));
})();
