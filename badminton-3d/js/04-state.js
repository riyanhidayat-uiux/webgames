'use strict';
// ---------- state ----------
let state = 'menu', phase = 'ready', phaseT = 0, versus = false, useCam = false, elapsed = 0, shake = 0;
let server = 0, rally = 0, lastHitter = -1, winner = null;
const S = { x: 0, y: 1, z: 5, vx: 0, vy: 0, vz: 0, live: false };
let players = [];
const DIFF = [{ sp: 4.0, rt: 0.18, err: 0.8, reach: 1.05, skill: 0.4 }, { sp: 5.6, rt: 0.1, err: 0.45, reach: 1.2, skill: 0.7 }, { sp: 7.4, rt: 0.05, err: 0.2, reach: 1.35, skill: 0.95 }];
const tired = () => 1 + rally * 0.05;       // AI makin ceroboh kalau rally panjang
const GOAL = 11, CAP = 15;

function mkPlayer(i) {
  const side = i === 0 ? 1 : -1;
  return { i, side, x: 0, z: side * 5.2, tx: 0, tz: side * 5.2, vx: 0, vz: 0, vxS: 0, vzS: 0, maxSp: 9, ai: !versus && i === 1,
    score: 0, cool: 0, swing: 0, reach: 1.3, aiT: 0, aiX: 0, aiZ: side * 4.2, run: 0,
    mesh: makePlayerMesh(i === 0 ? 0xff9a3c : 0x4fb8ff) };
}
function clearPlayers() { players.forEach(p => scene.remove(p.mesh)); players = []; }
