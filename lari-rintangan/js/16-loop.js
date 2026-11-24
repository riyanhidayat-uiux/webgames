'use strict';
// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const raw = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
  dtS += (raw - dtS) * 0.35; const dt = Math.min(0.05, dtS);          // dt dihaluskan agar gerak tidak bergetar
  fpsAcc += raw; fpsN++; if (fpsAcc > 2) { adaptRes(fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
  detectPose(now);
  if (state === 'play') {
    updateWorld(dt); updatePlayer(dt); collide();
    if (state === 'play' && (Math.floor(dist) !== lastDist)) { lastDist = Math.floor(dist); updateHud(); }
  } else if (state === 'dying') {
    updatePlayer(dt); dieT -= dt; if (dieT <= 0) gameOver();
  } else if (state === 'menu') {
    scrollEnv(6 * dt);
  } else if (state === 'count' || state === 'calib') { updatePlayer(dt); }
  render(dt);
  requestAnimationFrame(frame);
}
let lastDist = -1, dtS = 1 / 60, fpsAcc = 0, fpsN = 0, resScale = 1; const maxPR = Math.min(devicePixelRatio || 1, 2);
function adaptRes(avg) {   // resolusi dinamis: turun saat berat, naik lagi saat ringan
  let n = resScale; if (avg > 0.024 && resScale > 0.6) n = Math.max(0.6, resScale - 0.15); else if (avg < 0.0185 && resScale < 1) n = Math.min(1, resScale + 0.1);
  if (n !== resScale) { resScale = n; renderer.setPixelRatio(maxPR * resScale); resize(); }
}

resize();
(() => { const tmp = [mkBlock(), mkBar('low', false), mkBar('low', true), mkBar('high', false), mkBar('high', true), mkCoin()]; tmp.forEach(m => { m.position.set(0, 0, -6); scene.add(m); }); try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (e) {} tmp.forEach(m => scene.remove(m)); })();
camera.position.set(0, 3.3, 6.4); camLook.set(0, 1.2, -9);
$('bestHud').textContent = 'TERBAIK ' + best;
requestAnimationFrame(frame);
