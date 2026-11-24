'use strict';
// ---------- alur rally ----------
function resetPlayers() {
  clearPlayers();
  players = [mkPlayer(0), mkPlayer(1)];
  if (players[1].ai) { const d = DIFF[settings.diff]; Object.assign(players[1], { maxSp: d.sp, reach: d.reach }); }
}
function readyRally() {
  phase = 'ready'; phaseT = 1.3; rally = 0; lastHitter = -1; S.live = false;
  players.forEach(p => { p.cool = 0; });
  const sp = players[server];
  sp.tx = clamp(sp.x, -1.5, 1.5); sp.tz = sp.side * 5.0;
  say(versus ? `SERVIS P${server + 1}` : (server === 0 ? 'SIAP SERVIS!' : 'AI SERVIS'), '#ffd23f');
  updateHud();
}
function doServe() {
  const p = players[server], opp = players[1 - server];
  const tx = p.ai ? (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.0) : clamp(-p.x * 0.5 + (Math.random() - 0.5) * 0.6, -1.8, 1.8);
  const tz = -p.side * (4.0 + Math.random() * 1.0);
  S.x = p.x; S.y = 1.0; S.z = p.z - p.side * 0.4;
  const sol = solveShot(S.x, S.y, S.z, tx, tz, 42) || solveShot(S.x, S.y, S.z, 0, -p.side * 4.5, 55);
  if (sol) { [S.vx, S.vy, S.vz] = sol.v; } else { S.vx = 0; S.vy = 7; S.vz = -p.side * 6; }
  S.live = true; phase = 'rally'; lastHitter = p.i; p.swing = 1; p.cool = 0.4;
  sfx.hit(0.9); burst(S.x, S.y, S.z, 6, ['#ffffff'], 2);
}

function awardPoint(w, reason) {
  if (phase !== 'rally') return;
  phase = 'point'; phaseT = 1.7; S.live = false;
  players[w].score++; server = w;
  updateHud();
  const human = !players[w].ai;
  if (reason) say(reason, '#ff8a6a');
  setTimeout(() => say(versus ? `POIN P${w + 1}!` : (w === 0 ? 'POIN KAMU!' : 'POIN AI'), w === 0 ? '#ffb35a' : '#6fc8ff'), 650);
  (versus || w === 0 ? sfx.point : sfx.lose)();
  burst(S.x, 0.2, S.z, 10, ['#ffd23f', '#ffffff'], 3);
  const a = players[0].score, b = players[1].score;
  if ((a >= GOAL || b >= GOAL) && (Math.abs(a - b) >= 2 || a >= CAP || b >= CAP)) { winner = a > b ? 0 : 1; phase = 'end'; phaseT = 2.0; }
}
