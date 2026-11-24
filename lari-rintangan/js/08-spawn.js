'use strict';
// ---------- spawn ----------
const rnd = n => (Math.random() * n) | 0;
function spawnRow() {
  const d = dist, z = -75, opts = [['block1', 3], ['block2', 2], ['lowLane', 2], ['highLane', 2]];
  if (d > 120) opts.push(['lowWide', 2]); if (d > 200) opts.push(['highWide', 2]);
  if (d > 350) opts.push(['mixLow', 2]); if (d > 500) opts.push(['mixHigh', 2]);
  let tot = opts.reduce((a, o) => a + o[1], 0), r = Math.random() * tot, kind = opts[0][0];
  for (const o of opts) { r -= o[1]; if (r <= 0) { kind = o[0]; break; } }
  const l = rnd(3), others = [0, 1, 2].filter(i => i !== l);
  switch (kind) {
    case 'block1': addObstacle('block', l, z); break;
    case 'block2': addObstacle('block', others[0], z); addObstacle('block', others[1], z); break;
    case 'lowLane': addObstacle('low', l, z); break;
    case 'highLane': addObstacle('high', l, z); break;
    case 'lowWide': addObstacle('low', -1, z); break;
    case 'highWide': addObstacle('high', -1, z); break;
    case 'mixLow': addObstacle('low', l, z); others.forEach(o => addObstacle('block', o, z)); break;
    case 'mixHigh': addObstacle('high', l, z); others.forEach(o => addObstacle('block', o, z)); break;
  }
}
function spawnCoins() {
  const z0 = -75, kinds = ['line', 'line', 'zig'];
  if (dist > 60) kinds.push('arc', 'arc'); if (dist > 150) kinds.push('wall');
  const kind = pick(kinds), l = rnd(3);
  if (kind === 'line') { for (let i = 0; i < 6; i++) addCoin(l, z0 - i * 2.2); }
  else if (kind === 'zig') { let cl = l; for (let i = 0; i < 9; i++) { addCoin(cl, z0 - i * 2); if (i % 2) cl = cl === 0 ? 1 : cl === 2 ? 1 : (Math.random() < 0.5 ? 0 : 2); } }
  else if (kind === 'arc') { for (let i = 0; i < 7; i++) addCoin(l, z0 - i * 1.9, 0.9 + 1.25 * Math.sin(Math.PI * i / 6)); }
  else { for (let r = 0; r < 3; r++) for (let ln = 0; ln < 3; ln++) addCoin(ln, z0 - r * 2.6); }
}
