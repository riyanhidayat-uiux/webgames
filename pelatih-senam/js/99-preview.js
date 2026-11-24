'use strict';
// ======================= MODE PRATINJAU =======================
// ?preview=1 → demo latihan (lompat bintang) dengan kerangka peraga + beberapa repetisi, lalu dibekukan. Dipakai tools/capture-thumbs.sh.
(function () {
  if (!/[?&]preview\b/.test(location.search)) return;
  const st = document.createElement('style'); st.textContent = '.overlay,#menu,#over,#paused,.toast,#gameBtns,#count,#calibBox,#msg,#bigMsg{display:none!important}'; document.head.appendChild(st);
  addEventListener('load', () => setTimeout(() => {
    settings.prog = 1 in PROGS ? 1 : 0; startGame(false); show('menu', false); show('gameBtns', false);
    introT = 0.01; update(0.05); update(0.05);                                   // intro → work
    for (let i = 0; i < 9; i++) addRep(PLY[0], i % 3 ? 'perfect' : 'good');
    // kerangka peraga: koordinat dalam fraksi LAYAR → dibalik ke koordinat gambar kamera (kebalikan imgToScreen)
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480, sc = Math.max(SW / vw, SH / vh), dw = vw * sc, dh = vh * sc, P = {};
    const J = (n, fx, fy) => { const x = fx * SW, y = fy * SH; P[n] = { nx: 1 - (x - (SW - dw) / 2) / dw, ny: (y - (SH - dh) / 2) / dh, x: 0, y: 0, v: 1 }; };
    J('nose', 0.64, 0.2); J('sL', 0.585, 0.32); J('sR', 0.695, 0.32); J('eL', 0.53, 0.24); J('eR', 0.75, 0.24); J('wL', 0.49, 0.12); J('wR', 0.79, 0.12);
    J('hL', 0.61, 0.6); J('hR', 0.67, 0.6); J('kL', 0.55, 0.76); J('kR', 0.73, 0.76); J('aL', 0.5, 0.92); J('aR', 0.78, 0.92);
    useCam = true; PLY[0].valid = true; PLY[0].meter = 1.25; PLY[0].f = { T: 150, cx: 320, raw: P };
    coachT = 0.25 * 2.4; update(0.016); exT = 40;
    const keep = update; update = function () { cR.render(cS, cC); };                  // bekukan permainan, tetap gambar pelatih 3D
    document.documentElement.dataset.previewReady = '1';
  }, 500));
})();
