'use strict';
// ---------- state permainan ----------
let state = 'menu', versus = false, players = [], winner = null;
let foodCell = { x: 0, y: 0 }, goldCell = null, goldT = 0, best = store.get('best', 0);
let acc = 0, stepMs = 180, dieT = 0, shake = 0, useCam = false, elapsed = 0;
const LIVES_VS = 3;
const stepFor = n => Math.max(85, 180 - n * 3);
const totalApples = () => players.reduce((a, p) => a + p.apples, 0);
const mkPlayer = i => ({ i, snake: [], prev: [], dir: DIRS.R, queue: [], headAng: 0, pulseT: 99, score: 0, apples: 0, lives: versus ? LIVES_VS : 1,
  st: 'alive', rT: 0, inv: 0, hue: versus ? (i ? 0.56 : 0.07) : 0.33, headCol: versus ? (i ? 0x4fb8ff : 0xffa23c) : 0x7dff5a, head: heads[i] });

const occupied = (x, y) => players.some(p => p.snake.some(s => s.x === x && s.y === y)) || (foodCell && foodCell.x === x && foodCell.y === y) || (goldCell && goldCell.x === x && goldCell.y === y);
function freeCell() {
  for (let k = 0; k < 400; k++) {
    const x = (Math.random() * N) | 0, y = (Math.random() * N) | 0;
    if (!occupied(x, y)) return { x, y };
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!occupied(x, y)) return { x, y };
  return null;
}

function spawnSnake(p) {
  const mid = (N / 2) | 0;
  const heading = versus && p.i === 1 ? DIRS.L : DIRS.R;
  const rows = !versus ? [mid] : (p.i === 0 ? [mid - 3, mid - 5, mid - 1, 3, 2] : [mid + 2, mid + 4, mid, N - 4, N - 3]);
  const hx = !versus ? mid : (p.i === 0 ? 5 : N - 6);
  let cells = null;
  for (const y of rows) {
    const c = [0, 1, 2, 3].map(k => ({ x: hx - heading.x * k, y }));
    if (!c.some(q => occupied(q.x, q.y))) { cells = c; break; }
  }
  if (!cells) cells = [0, 1, 2, 3].map(k => ({ x: hx - heading.x * k, y: rows[0] }));
  p.snake = cells; p.prev = cells.map(q => ({ x: q.x, y: q.y }));
  p.dir = heading; p.queue = []; p.headAng = Math.atan2(heading.x, heading.y); p.pulseT = 99;
}

function resetGame() {
  players = (versus ? [0, 1] : [0]).map(mkPlayer);
  heads[0].visible = true; heads[1].visible = versus;
  foodCell = null; goldCell = null; goldT = 0; gold.visible = false;
  players.forEach(spawnSnake);
  foodCell = freeCell();
  winner = null; stepMs = stepFor(0); acc = -900; dieT = 0; shake = 0;
  PART.forEach(q => { q.life = 0; q.m.visible = false; });
  updateHud();
}

function turn(d, pi = 0) {
  if (state !== 'play') return;
  const p = players[pi]; if (!p || p.st !== 'alive') return;
  const last = p.queue.length ? p.queue[p.queue.length - 1] : p.dir;
  if (d.k === last.k || (d.x === -last.x && d.y === -last.y)) return;
  if (p.queue.length < 2) { p.queue.push(d); sfx.turn(); }
}

function crashPlayer(p) {
  p.lives--; p.st = p.lives > 0 ? 'dead' : 'out'; p.rT = 1.2; shake = 1;
  sfx.die(); try { navigator.vibrate && navigator.vibrate([80, 40, 200]); } catch (e) {}
  const cols = p.i === 0 && versus ? ['#ffa23c', '#ffe08a', '#ffffff'] : p.i === 1 ? ['#4fb8ff', '#b5e4ff', '#ffffff'] : ['#ff3b30', '#ffcc33', '#ffffff'];
  const n = p.snake.length;
  for (let k = 0; k < n; k += Math.max(1, (n / 7) | 0)) {
    const q = p.snake[k];
    burst(wx(Math.max(0, Math.min(N - 1, q.x))), 0.6, wz(Math.max(0, Math.min(N - 1, q.y))), 9, cols, 6);
  }
  p.snake = []; p.prev = []; p.queue = [];
  updateHud();
}

function endMatch() {
  const out = players.filter(p => p.st === 'out');
  if (!out.length) return false;
  if (versus) winner = out.length === players.length ? (players[0].score === players[1].score ? 'tie' : (players[0].score > players[1].score ? 0 : 1)) : (out[0].i === 0 ? 1 : 0);
  state = 'dying'; dieT = 1.2;
  return true;
}

function tick() {
  const act = players.filter(p => p.st === 'alive');
  const info = act.map(p => {
    if (p.queue.length) { const nd = p.queue.shift(); if (!(nd.x === -p.dir.x && nd.y === -p.dir.y)) p.dir = nd; }
    const h = p.snake[0];
    let nx = h.x + p.dir.x, ny = h.y + p.dir.y, wall = false;
    if (settings.wrap) { nx = (nx + N) % N; ny = (ny + N) % N; }
    else if (nx < 0 || ny < 0 || nx >= N || ny >= N) wall = true;
    const eatF = !wall && foodCell && nx === foodCell.x && ny === foodCell.y;
    const eatG = !wall && goldCell && nx === goldCell.x && ny === goldCell.y;
    return { p, nx, ny, eatF, eatG, grow: eatF || eatG, crash: wall };
  });
  // tabrakan (simultan)
  for (const a of info) {
    if (a.crash || a.p.inv > 0) continue;
    for (const q of info) {
      if (q.p.inv > 0) continue;
      const cells = q.grow ? q.p.snake : q.p.snake.slice(0, -1);
      if (cells.some(c => c.x === a.nx && c.y === a.ny)) { a.crash = true; break; }
      if (q !== a && q.nx === a.nx && q.ny === a.ny) { a.crash = true; break; }
    }
  }
  for (const a of info) {
    const p = a.p;
    if (a.crash) { crashPlayer(p); continue; }
    p.prev = p.snake.map(c => ({ x: c.x, y: c.y }));
    p.snake.unshift({ x: a.nx, y: a.ny });
    if (!a.grow) p.snake.pop();
    if (a.eatF) {
      p.apples++; p.score += 10; p.pulseT = 0; sfx.eat();
      burst(wx(a.nx), 0.5, wz(a.ny), 18, ['#ff3b30', '#ff8a8a', '#ffffff']);
      popText('+10', wx(a.nx), 0.9, wz(a.ny));
      foodCell = null; foodCell = freeCell();
      if (totalApples() % 5 === 0 && !goldCell) { goldCell = freeCell(); goldT = 8; }
      updateHud(true, p.i);
    } else if (a.eatG) {
      p.apples++; p.score += 30; p.pulseT = 0; sfx.gold();
      burst(wx(a.nx), 0.5, wz(a.ny), 30, ['#ffd23f', '#fff6a0', '#ffffff'], 6);
      popText('+30 ⭐', wx(a.nx), 0.9, wz(a.ny));
      goldCell = null; gold.visible = false;
      updateHud(true, p.i);
    }
  }
  stepMs = stepFor(versus ? totalApples() * 0.6 : totalApples());
  endMatch();
}
