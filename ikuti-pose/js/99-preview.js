'use strict';
// ======================= MODE PRATINJAU =======================
// ?preview=1 → demo lagu: penari 3D di jalur ketukan + beberapa tap tepat waktu, lalu dibekukan. Dipakai tools/capture-thumbs.sh.
(function () {
  if (!/[?&]preview\b/.test(location.search)) return;
  const st = document.createElement('style'); st.textContent = '.overlay,#menu,#over,#paused,.toast,#gameBtns,#waitBox{display:none!important}'; document.head.appendChild(st);
  addEventListener('load', () => setTimeout(() => {
    startGame(false); show('menu', false); show('gameBtns', false);
    const target = (INTRO + 20) * beatDur; let guard = 0;
    while (songT < target && state === 'play' && guard++ < 60 * 60) {
      update(1 / 60);
      for (const m of choreo) { if (m.done) continue; const d = songT - m.beat * beatDur; if (d > -0.03 && d < 0.04 && m.best[0] > 20) { tapTiming(0); } }
    }
    show('count', false); update(0.016);
    update = function () { dR.render(dS, dC); };                                  // bekukan lagu, tetap gambar penari 3D
    document.documentElement.dataset.previewReady = '1';
  }, 500));
})();
