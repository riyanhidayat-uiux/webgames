'use strict';
// ======================= MODE PRATINJAU =======================
// Buka game dengan ?preview=1 → game menjalankan adegan otomatis lalu membeku pada satu bingkai.
// Dipakai tools/capture-thumbs.sh untuk membuat gambar kartu di halaman utama dari permainan sungguhan.
(function () {
  if (!/[?&]preview\b/.test(location.search)) return;
  const st = document.createElement('style'); st.textContent = '.overlay,#menu,#over,#paused,.toast,#gameBtns,#count,#camBox,#camHelp{display:none!important}'; document.head.appendChild(st);
  addEventListener('load', () => setTimeout(() => {
    resetGame(); state = 'play'; show('menu', false); show('hud', true);
    const D = Object.values(DIRS), p = players[0], ok = (nx, ny) => nx >= 0 && ny >= 0 && nx < N && ny < N && !p.snake.slice(0, -1).some(c => c.x === nx && c.y === ny);
    let guard = 0;
    while (p.apples < 11 && guard++ < 2500 && state === 'play') {            // bot rakus: kejar apel, hindari jalan buntu
      const h = p.snake[0]; let best = null, bd = 1e9;
      for (const d of D) {
        if (d.x === -p.dir.x && d.y === -p.dir.y) continue; const nx = h.x + d.x, ny = h.y + d.y; if (!ok(nx, ny)) continue;
        const free = D.filter(e => ok(nx + e.x, ny + e.y)).length, dist = Math.abs(nx - foodCell.x) + Math.abs(ny - foodCell.y) + (free < 2 ? 8 : 0) + Math.random() * 0.3;
        if (dist < bd) { bd = dist; best = d; }
      }
      if (best) p.dir = best; p.queue = []; tick();
    }
    if (!goldCell) { goldCell = freeCell(); goldT = 8; }
    acc = 0; updateHud(); setTimeout(() => { state = 'paused'; document.documentElement.dataset.previewReady = '1'; }, 1200);
  }, 400));
})();
