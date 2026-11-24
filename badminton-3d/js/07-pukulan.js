'use strict';
// ---------- pukulan ----------
function chooseShot(p) {
  const opp = players[1 - p.i], sy = S.y, near = Math.abs(S.z) < 2.6;
  let type, tx, theta;
  if (p.ai) {
    const d = DIFF[settings.diff], r = Math.random(), er = d.err * tired();
    type = sy > 1.9 && r < 0.25 + 0.3 * d.skill ? 'smash' : (near && r < 0.55 ? 'drop' : (r < 0.8 ? 'clear' : 'drive'));
    tx = -Math.sign(opp.x || (Math.random() < 0.5 ? -1 : 1)) * (1.0 + Math.random() * 1.4) + (Math.random() - 0.5) * 2 * er;
  } else {
    const fwd = -p.side * p.vzS;
    if (fwd > 3.2 && sy > 1.9) type = 'smash'; else if (fwd > 1.8) type = 'drive'; else if (fwd < -2.2) type = 'clear';
    else if (near && Math.abs(fwd) < 2) type = 'drop'; else type = 'clear';
    tx = Math.abs(p.vxS) < 0.8 ? -Math.sign(opp.x || 1) * 1.8 : p.vxS * 0.5;
    tx += (Math.random() - 0.5) * 0.5;
  }
  tx = clamp(tx, -2.5, 2.5);
  const depth = { clear: 5.4, drop: 1.5, smash: 3.0 + Math.random() * 2.6, drive: 4.3 }[type] + (Math.random() - 0.5) * (p.ai ? DIFF[settings.diff].err * tired() : 0.5);
  theta = { clear: 48, drop: 22, smash: -14, drive: 12 }[type];
  return { type, tx, tz: -p.side * depth, theta };
}
const LABEL = { smash: 'SMASH!', clear: 'CLEAR', drop: 'DROP', drive: 'DRIVE' };
function hit(p) {
  let sh = chooseShot(p);
  let sol = solveShot(S.x, S.y, S.z, sh.tx, sh.tz, sh.theta);
  if (!sol) { sh = { type: 'clear', tx: sh.tx * 0.6, tz: -p.side * 5.2, theta: 48 }; sol = solveShot(S.x, S.y, S.z, sh.tx, sh.tz, sh.theta); }
  if (!sol) { S.vx = 0; S.vy = 8; S.vz = -p.side * 7; } else { [S.vx, S.vy, S.vz] = sol.v; }
  lastHitter = p.i; p.cool = 0.3; p.swing = 1; rally++;
  if (sh.type === 'smash') { sfx.smash(); shake = 0.5; say('SMASH!', '#ff6a4a'); burst(S.x, S.y, S.z, 22, ['#ffd23f', '#ff6a4a', '#fff'], 5); }
  else { sfx.hit(sh.type === 'drop' ? 0.7 : 1); burst(S.x, S.y, S.z, 8, ['#ffffff', '#cfe4ff'], 2.5); if (sh.type !== 'clear' && !p.ai) say(LABEL[sh.type], '#cfe4ff'); }
  updateHud();
}
