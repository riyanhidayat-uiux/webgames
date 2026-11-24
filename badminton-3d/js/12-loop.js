'use strict';
// ---------- loop ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  if (state === 'play') {
    detectHand(now); keyboardInput(dt);
    updatePlayers(dt);
    if (phase === 'ready') { phaseT -= dt; if (phaseT <= 0) doServe(); }
    else if (phase === 'rally') stepShuttle(dt);
    else if (phase === 'point') { phaseT -= dt; if (phaseT <= 0) readyRally(); }
    else if (phase === 'end') { phaseT -= dt; if (phaseT <= 0) gameOver(); }
  } else if (state === 'menu' && players.length) { updatePlayers(dt); }
  render(dt);
  requestAnimationFrame(frame);
}

resize();
setVersus(false);
resetPlayers(); players[0].x = -1; players[0].tx = -1;
camera.position.set(0, 10, 15); camLook.set(0, 0.4, 0.4);
S.x = 0; S.y = 1; S.z = 5;
requestAnimationFrame(frame);
