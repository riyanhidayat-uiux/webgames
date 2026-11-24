'use strict';
// ======================= MODE PRATINJAU =======================
// ?preview=1 → bot menggerakkan "tangan" memukul bola-bola, lalu bingkai dibekukan. Dipakai tools/capture-thumbs.sh.
(function () {
  if (!/[?&]preview\b/.test(location.search)) return;
  const st = document.createElement('style'); st.textContent = '.overlay,#menu,#over,#paused,#camHelp,.toast,#gameBtns,#count,#waitBox,#msg{display:none!important}'; document.head.appendChild(st);
  addEventListener('load', () => setTimeout(() => {
    settings.diff = 1; resetRun(); show('menu', false); show('hud', true); show('fever', true); state = 'play'; tPlay = 22;      // tPlay besar → ada emas, bola besar, bom
    ptrs.set(1, { x: SW * 0.5, y: SH * 0.55, mouse: true });
    let k = 0, kept = 0;
    const chase = b => { const sc = bubbleScreen(b); const p = ptrs.get(1); p.x = sc.x; p.y = sc.y; };
    for (let i = 0; i < 60 * 30; i++) {
      update(1 / 60); ptrPoints(); if (fever.t > 0) { fever.t = 0; }
      const live = bubbles.filter(b => !b.dead && b.z > -30), near = live.filter(b => b.z > -13 && b.z < -2);
      const tgt = near.filter(b => b.type !== 'bomb' && b.z > -7).sort((a, c) => c.z - a.z)[0];
      if (tgt && k++ % 3 === 0) chase(tgt);                                    // hanya sebagian bola yang dipukul
      if (i > 60 * 6 && near.length >= 4 && PART.some(q => q.life > 0.25)) { if (++kept > 1) break; }
    }
    fever = { c: 0.72, t: 0 }; updateFever(); updateHud(); ptrPoints();
    // kerangka pemain (seperti yang digambar game saat kamera aktif) mengarah ke bola terdekat; hanya untuk tampilan pratinjau
    const live = bubbles.filter(b => !b.dead && b.type !== 'bomb').sort((a, c) => c.z - a.z), tg = live[0] ? bubbleScreen(live[0]) : { x: SW * 0.6, y: SH * 0.4 };
    const u = SH / 720, cx = SW * 0.2, cy = SH * 0.58, J = (x, y) => ({ x: cx + x * u * 1.5, y: cy + y * u * 1.5 });
    const hand = { x: tg.x - tg.r * 1.1, y: tg.y + tg.r * 0.2 }, sh = [J(-60, -80), J(60, -80)], el = [J(-95, -20), { x: (sh[1].x + hand.x) / 2, y: (sh[1].y + hand.y) / 2 + 20 * u }], wr = [J(-110, 40), hand];
    const hip = [J(-40, 60), J(40, 60)], kn = [J(-50, 160), J(50, 160)], an = [J(-55, 250), J(55, 250)], nose = J(0, -150);
    PL[0].valid = true; PL[0].nose = nose; PL[0].cx = cx; PL[0].cy = cy; PL[0].sww = 120 * u;
    PL[0].bones = [[sh[0], sh[1]], [sh[0], el[0]], [el[0], wr[0]], [sh[1], el[1]], [el[1], wr[1]], [sh[0], hip[0]], [sh[1], hip[1]], [hip[0], hip[1]], [hip[0], kn[0]], [kn[0], an[0]], [hip[1], kn[1]], [kn[1], an[1]], [J(0, -80), nose]];
    PL[0].pts = [{ x: wr[1].x, y: wr[1].y, r: HR() * 1.15, kind: 'hand' }, { x: wr[0].x, y: wr[0].y, r: HR() * 1.15, kind: 'hand' }, { x: nose.x, y: nose.y, r: HR() * 0.9, kind: 'head' }];
    useCam = true;                                                              // jangan biarkan ptrPoints() menimpa kerangka

    state = 'paused'; document.documentElement.dataset.previewReady = '1';
  }, 500));
})();
