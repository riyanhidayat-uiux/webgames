'use strict';
// ---------- state ----------
const MAXLIVES = 3;
let state = 'menu', useCam = false, elapsed = 0, shake = 0, best = store.get('best', 0);
let dist = 0, coinCount = 0, lives = MAXLIVES, speed = 12, speedMul = 1, spawnT = 20, coinT = 12, invuln = 0, dieT = 0;
const P = { lane: 1, x: 0, vx: 0, y: 0, vy: 0, air: false, duckT: 0, jumpCd: 0, run: 0 };
const act = { jumpAt: 0 };

function resetRun() {
  clearWorld(); dist = 0; coinCount = 0; lives = MAXLIVES; speed = 12; speedMul = 1; spawnT = 22; coinT = 14; invuln = 0; dieT = 0; shake = 0;
  Object.assign(P, { lane: 1, x: 0, vx: 0, y: 0, vy: 0, air: false, duckT: 0, jumpCd: 0 });
  PART.forEach(p => { p.life = 0; p.m.visible = false; });
  updateHud();
}

// ---------- aksi pemain ----------
function actLane(l) { if (state !== 'play') return; l = clamp(l, 0, 2); if (l !== P.lane) { P.lane = l; sfx.lane(); } }
function actJump() { if (state !== 'play' || P.air || P.jumpCd > 0) return; P.vy = 9.2; P.air = true; P.duckT = 0; P.jumpCd = 0.35; sfx.jump(); burst(P.x, 0.1, 0, 6, ['#ffffff', '#cfe4ff'], 2); }
function actDuck(t = 0.75, fast = true) { if (state !== 'play') return; if (P.air) { if (!fast) return; P.vy = Math.min(P.vy, -6); } if (P.duckT <= 0) sfx.duck(); P.duckT = Math.max(P.duckT, t); }
