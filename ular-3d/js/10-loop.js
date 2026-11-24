'use strict';
// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (state === 'play') {
    detectHand(now);
    acc += dt * 1000;
    let guard = 0;
    while (acc >= stepMs && state === 'play' && guard++ < 4) { acc -= stepMs; tick(); }
    if (goldCell) { goldT -= dt; if (goldT <= 0) { goldCell = null; sfx.miss(); } }
  } else if (state === 'dying') {
    dieT -= dt;
    if (dieT <= 0) gameOver();
  }
  render(dt);
  requestAnimationFrame(frame);
}

resize();
resetGame();
camera.position.set(0, 26, 16); camLook.set(0, 0, 1.2);
$('bestHud').textContent = 'TERBAIK ' + best;
requestAnimationFrame(frame);
