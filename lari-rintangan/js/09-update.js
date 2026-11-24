'use strict';
// ---------- update ----------
function hurt(o) {
  o.hit = true; lives--; invuln = 1.8; speedMul = 0.6; shake = 1; hitT = 0.45;
  sfx.hit(); try { navigator.vibrate && navigator.vibrate([60, 30, 120]); } catch (e) {}
  burst(P.x, 1.0, 0, 22, ['#ff5a3c', '#ffd23f', '#ffffff'], 5);
  say(lives > 0 ? 'AUW!' : 'HABIS!', '#ff6a4a');
  updateHud();
  if (lives <= 0) { state = 'dying'; dieT = 1.1; sfx.over(); }
}
function updateWorld(dt) {
  const v = speed * speedMul;
  dist += v * dt / 1;
  speed = Math.min(30, 12 + dist * 0.012);
  speedMul = Math.min(1, speedMul + dt * 0.18);
  spawnT -= v * dt; coinT -= v * dt;
  if (spawnT <= 0) { spawnRow(); spawnT = 17 + Math.random() * 9 + speed * 0.35; }
  if (coinT <= 0) { spawnCoins(); coinT = 26 + Math.random() * 14; }
  for (const o of obstacles) { o.z += v * dt; o.mesh.position.z = o.z; }
  for (const c of coins) { c.z += v * dt; c.mesh.position.z = c.z; c.mesh.rotation.y += dt * 4; c.mesh.position.y = c.y + Math.sin(elapsed * 5 + c.z * 0.5) * 0.07; }
  scrollEnv(v * dt);
  updateStreaks(v * dt, clamp((v - 15) / 12, 0, 1));
}
function updatePlayer(dt) {
  { const w = 22, d = LANES[P.lane] - P.x, ac = w * w * d - 2 * w * P.vx; P.vx += ac * dt; P.x += P.vx * dt; if (Math.abs(d) < 0.001 && Math.abs(P.vx) < 0.01) { P.x = LANES[P.lane]; P.vx = 0; } }
  P.jumpCd = Math.max(0, P.jumpCd - dt);
  if (P.air) { P.vy -= 28 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.air = false; } }
  P.duckT = Math.max(0, P.duckT - dt);
  invuln = Math.max(0, invuln - dt);
}
function collide() {
  const head = P.y + (P.duckT > 0 ? 0.9 : 1.78), feet = P.y;
  for (const o of obstacles) {
    if (o.hit || Math.abs(o.z) > 0.75) continue;
    const sameLane = o.lane < 0 || o.lane === P.lane || Math.abs(LANES[o.lane] - P.x) < 1.0;
    if (!sameLane) continue;
    let c = false;
    if (o.type === 'block') c = feet < 2.2;
    else if (o.type === 'low') c = feet < 0.7;
    else c = head > 1.1 && feet < 1.6;
    if (c && invuln <= 0 && state === 'play') hurt(o);
  }
  for (let i = coins.length - 1; i >= 0; i--) {
    const c = coins[i];
    if (c.z > 3) { scene.remove(c.mesh); coins.splice(i, 1); continue; }
    if (Math.abs(c.z) < 0.8 && Math.abs(LANES[c.lane] - P.x) < 0.9 && Math.abs(c.y - (P.y + 0.9)) < 1.1) {
      coinCount++; sfx.coin(); burst(c.mesh.position.x, c.y, 0, 5, ['#ffd23f', '#fff6a0'], 2); scene.remove(c.mesh); coins.splice(i, 1); updateHud();
    }
  }
  for (let i = obstacles.length - 1; i >= 0; i--) if (obstacles[i].z > 6) { scene.remove(obstacles[i].mesh); obstacles.splice(i, 1); }
}
