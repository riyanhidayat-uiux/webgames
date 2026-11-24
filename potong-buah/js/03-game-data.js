'use strict';
// ---------- game data ----------
const FRUITS = [
  { e: '🍉', c: '#ff3b4e', r: 44 }, { e: '🍎', c: '#fff1b8', r: 34 }, { e: '🍊', c: '#ffa21f', r: 34 },
  { e: '🍋', c: '#fff04a', r: 32 }, { e: '🍑', c: '#ffb07a', r: 34 }, { e: '🍍', c: '#ffd84a', r: 40 },
  { e: '🥝', c: '#8ad43b', r: 30 }, { e: '🍇', c: '#a64ae0', r: 36 }, { e: '🍓', c: '#ff2d4a', r: 29 },
  { e: '🥭', c: '#ffb703', r: 36 }, { e: '🍐', c: '#e4f58a', r: 33 }, { e: '🥥', c: '#ffffff', r: 35 },
  { e: '🍌', c: '#fff176', r: 34 }, { e: '🍒', c: '#e0143c', r: 28 }, { e: '🍈', c: '#c8f58a', r: 40 }, { e: '🍅', c: '#ff4d3a', r: 33 },
  { e: '🥑', c: '#9bd04a', r: 34 }, { e: '🍏', c: '#a6e34a', r: 34 }, { e: '🌶️', c: '#ff3b2f', r: 30 }, { e: '🫐', c: '#5b6fe0', r: 28 },
  { e: '🍆', c: '#8a4ae0', r: 34 }, { e: '🥕', c: '#ff8a1f', r: 32 }, { e: '🌽', c: '#ffe14a', r: 34 }, { e: '🍠', c: '#d0703a', r: 33 },
  { e: '🫑', c: '#6fd04a', r: 33 }, { e: '🍄', c: '#ff6b5a', r: 31 }, { e: '🥦', c: '#6fcf4a', r: 34 }, { e: '🧅', c: '#f0d0b0', r: 32 }
];
// skuisi: mainan empuk lucu, ukuran acak, bergoyang-goyang saat terbang
const SQUISH = [
  ['🧸','#d9a066',38],['🐙','#ff8fb1',38],['🐱','#ffd9a0',36],['🐼','#e8e8e8',36],['🐰','#ffd1e0',36],['🐥','#ffe45c',32],
  ['🦄','#e8b8ff',38],['🐸','#8fe36b',34],['🍩','#ff9fd0',36],['🍙','#ffffff',34],['🧁','#ffb3d9',34],['🐷','#ffb0c0',36],
  ['🐻','#c68a5a',38],['🐨','#c0c0d0',36],['🐡','#ffd24a',34],['🍥','#ffc0d9',34],['🐢','#7fd47f',36],['🐶','#e8c090',36],
  ['🦆','#ffe14a',34],['🐘','#b8c4d8',40],['🦊','#ff9a4a',36],['🐧','#9fb4d8',34]
].map(([e, c, r]) => ({ e, c, r, sq: 1 }));
let fruits = [], halves = [], parts = [], splats = [], texts = [], misses = [], queue = [];
let gm = 'classic';                                     // 'classic' | 'arcade' | 'boss' (lihat 09b-arcade-boss.js)
let state = 'menu', score = 0, best = store.get('best', 0), lives = 5;
let chill = false, missed = 0, bestC = store.get('bestChill', 0);
// ---- batas waktu pertandingan ----
const MATCH_T = 300;
const bests = { best: store.get('best', 0), bestChill: store.get('bestChill', 0), bestTimed: store.get('bestTimed', 0) };
let timeLeft = MATCH_T, timeUp = false, lastSec = -1;
const fmtT = t => { const s = Math.max(0, Math.ceil(t)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const bestKey = () => chill ? 'bestChill' : (settings.timed ? 'bestTimed' : 'best');
// ---- mode 2 player ----
let versus = false, winner = null, sudden = false, sdT = 0, vsHandicap = false, starT = 9, spawnZ = [0.7, 1.1];
const STAR = { e: '⭐', c: '#ffd23f', r: 36 };
const mkP = () => ({ score: 0, lives: 5, max: 5, missed: 0 });
let pl = [mkP(), mkP()];
const mkVc = i => ({ x: 0, y: 0, tx: 0, ty: 0, has: false, rawX: 0.5, rawY: 0.5, blade: makeBlade(380, i) });
let vc = [mkVc(0), mkVc(1)];
const PCOL = ['255,120,120', '110,170,255'];
// ---- buah spesial, beku, fever ----
const ICE = { e: '❄️', c: '#8fe3ff', r: 36 }, HEART = { e: '💖', c: '#ff6fae', r: 36 };
const FEVER_T = 8, FREEZE_T = 3;
let rings = [], freeze = [{ t: 0, a: 0 }, { t: 0, a: 0 }], fever = [{ c: 0, t: 0, a: 0 }, { c: 0, t: 0, a: 0 }];
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const fidx = o => (versus && o != null) ? o : 0;
const frozenIdx = f => f.star ? -1 : (!versus ? 0 : (f.zone >= 0 ? f.zone : -1));
function award(o, n) {
  n *= fever[fidx(o)].t > 0 ? 2 : 1;
  if (versus && o != null) pl[o].score += n; else score += n;
  return n;
}
function ringFx(x, y, r1, life, c, w = 6) { rings.push({ type: 'ring', x, y, r1, life, max: life, c, w }); }
function burst(x, y, n, cols, sp, life, extra) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = (0.3 + Math.random()) * sp * S, l = life * (0.6 + Math.random() * 0.8);
    parts.push(Object.assign({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: l, max: l, size: (2 + Math.random() * 4) * S, c: cols[(Math.random() * cols.length) | 0] }, extra));
  }
}
function addCharge(o, v) {
  const i = fidx(o), f = fever[i];
  if (f.t > 0) return;
  f.c = Math.min(1, f.c + v);
  if (f.c >= 1) startFever(i);
}
function startFever(i) {
  const f = fever[i]; f.t = FEVER_T; f.c = 1;
  const x0 = versus ? i * W / 2 : 0, w = versus ? W / 2 : W;
  for (let k = fruits.length - 1; k >= 0; k--) {
    const b = fruits[k];
    if (b.bomb && (!versus || b.zone === i)) {
      burst(b.x, b.y, 14, ['#ffcc33', '#fff6a0'], 260, 0.5, {});
      ringFx(b.x, b.y, b.r * 2.4, 0.35, '255,210,80', 4);
      fruits.splice(k, 1);
    }
  }
  texts.push({ x: x0 + w / 2, y: H * 0.3, s: 'FEVER x2!', sub: '8 detik · bom hilang', life: 1.8, color: '#ffb000', big: 1.7 });
  ringFx(x0 + w / 2, H * 0.5, Math.max(w, H) * 0.85, 0.75, '255,170,40', 16);
  ringFx(x0 + w / 2, H * 0.5, Math.max(w, H) * 0.5, 0.55, '255,240,160', 8);
  flash = Math.max(flash, 0.35); shake = Math.max(shake, 0.5);
  sfx.fever(); vibrate([40, 30, 80]);
}
function startFreeze(i, x, y) {
  freeze[i].t = FREEZE_T;
  ringFx(x, y, Math.max(W, H) * 0.6, 0.85, '140,225,255', 12);
  ringFx(x, y, Math.max(W, H) * 0.35, 0.55, '255,255,255', 5);
  burst(x, y, 28, ['#e6fbff', '#8fe3ff', '#bfeeff'], 440, 0.8, { shard: 1 });
  texts.push({ x, y: y - 40 * S, s: '❄ BEKU!', sub: 'waktu melambat 3 detik', life: 1.6, color: '#9fe7ff', big: 1.4 });
  flash = Math.max(flash, 0.22); sfx.ice(); vibrate(30);
}
function heal(o, f) {
  if (versus && o != null) { const p = pl[o]; if (p.lives < p.max) p.lives++; } else if (lives < 5) lives++;
  burst(f.x, f.y, 12, ['#ff6fae', '#ffd1e6', '#fff'], 280, 0.8, {});
  for (let i = 0; i < 9; i++) {
    const l = 1 + Math.random() * 0.6;
    parts.push({ x: f.x + (Math.random() - 0.5) * f.r * 2, y: f.y, vx: (Math.random() - 0.5) * 90 * S, vy: -(120 + Math.random() * 200) * S, life: l, max: l, size: (18 + Math.random() * 14) * S, c: '#fff', g: '💖', ng: 1 });
  }
  ringFx(f.x, f.y, f.r * 3.4, 0.6, '255,111,174', 8);
  texts.push({ x: f.x, y: f.y - f.r, s: '+1 ❤', sub: '', life: 1.3, color: '#ff7fb7', big: 1.3 });
  sfx.heal(); vibrate(25);
}
function setBar(id, f) {
  const el = $(id), w = Math.round(f.c * 100) + '%', on = f.t > 0;
  if (el._w !== w) { el.querySelector('i').style.width = w; el._w = w; }
  if (el._on !== on) { el.classList.toggle('on', on); el._on = on; }
}
function updateFeverHud() {
  if (versus) { setBar('fbV1', fever[0]); setBar('fbV2', fever[1]); } else setBar('fbS', fever[0]);
}
let spawnT = 0.5, elapsed = 0, shake = 0, flash = 0, dieT = 0, slowT = 0;         // slowT: efek gerak lambat (detik nyata)
const COMBO_NAME = ['', '', '', 'TRIPLE!', 'QUAD!', 'PENTA!'];
const comboBonus = n => n * (n - 1) / 2;                                   // 3→3, 4→6, 5→10, 6→15 ...
const SEEDY = { '🍉': '#1b1210', '🥝': '#2a2410', '🍅': '#e8d890', '🍈': '#e8e0a0', '🍆': '#e8e0b0', '🥑': '#4a3018' };
const grav = () => H * 1.2;
const TRAIL_MS = 150;
