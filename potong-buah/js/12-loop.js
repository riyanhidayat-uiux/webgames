'use strict';
// ---------- loop ----------
let last = performance.now(), dtS = 1 / 60, fpsAcc = 0, fpsN = 0;
function adaptRes(avg) {   // resolusi dinamis: turun saat berat, naik lagi saat ringan
  let n = resScale; if (avg > 0.024 && resScale > 0.6) n = Math.max(0.6, resScale - 0.15); else if (avg < 0.0185 && resScale < 1) n = Math.min(1, resScale + 0.1);
  if (n !== resScale) { resScale = n; resize(); }
}
function frame(now) {
  const raw = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  dtS += (raw - dtS) * 0.35; const dt = Math.min(1 / 30, dtS);        // dt dihaluskan agar gerak buah tidak bergetar
  if (state === 'play') { fpsAcc += raw; fpsN++; if (fpsAcc > 2) { adaptRes(fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; } }
  slowT = Math.max(0, slowT - raw); musicFrame(dt);
  if (state !== 'paused') update(slowT > 0 ? dt * 0.35 : dt, now);          // gerak lambat sesaat saat combo besar / bom
  draw(now);
  requestAnimationFrame(frame);
}

resize();
$('bestHud').textContent = 'TERBAIK ' + best;
requestAnimationFrame(frame);
