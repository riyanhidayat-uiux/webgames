'use strict';
// ---------- blades ----------
let sensorBlade = makeBlade(450);
let camBlade = makeBlade(380);
const touchBlades = new Map();
let deadBlades = [];

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
  let t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const x = ax + t * dx - px, y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}

// kecepatan sepanjang jalur ±70 ms terakhir (px/detik): stabil terhadap selang frame yang tidak rata
function bladeSpeed(b, x, y, t) {
  const pts = b.pts; let len = Math.hypot(x - (b.prev ? b.prev.x : x), y - (b.prev ? b.prev.y : y)), t0 = b.prev ? b.prev.t : t, px = b.prev ? b.prev.x : x, py = b.prev ? b.prev.y : y;
  for (let i = pts.length - 1; i >= 1 && t - t0 < 70; i--) { len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); t0 = pts[i - 1].t; }
  return len / Math.max(24, t - t0) * 1000;
}
function bladeMove(b, x, y, t) {
  if (b.prev) {
    const speed = bladeSpeed(b, x, y, t), thr = b.minSpeed * S;
    if (speed > thr) b.sw = true; else if (speed < thr * 0.55) b.sw = false;      // histeresis: tebasan tidak putus di puncak lengkungan
    if (state === 'play' && b.sw) trySlice(b.prev.x, b.prev.y, x, y, b);
    if (state === 'play' && speed > thr * 2.5) { b.lastSwoosh = t; }
    if (state === 'play' && speed > thr * 1.7 && t - (b.lastSwooshSnd || 0) > 170) { b.lastSwooshSnd = t; sfx.swoosh(Math.min(2, speed / (thr * 3))); }
  }
  b.prev = { x, y, t };
  b.pts.push({ x, y, t });
  if (b.pts.length > 60) b.pts.shift();
}

function trySlice(ax, ay, bx, by, b) {
  const ang = Math.atan2(by - ay, bx - ax);
  if (gm !== 'classic' && boss) bossTrySlice(ax, ay, bx, by, b);
  for (let i = fruits.length - 1; i >= 0; i--) {
    const f = fruits[i];
    if (!f || f.y > H + f.r) continue;
    if (versus && b.owner != null && !f.star && f.zone !== b.owner) continue;
    if (segDist(f.x, f.y, ax, ay, bx, by) < f.r * 0.95) {
      fruits.splice(i, 1);
      if (f.bomb) { explode(f, b); return; }
      sliceFruit(f, ang, b);
    }
  }
}

function sliceFruit(f, ang, b) {
  const nx = -Math.sin(ang), ny = Math.cos(ang);
  const sp = 70 * S;
  for (const side of [-1, 1]) {
    halves.push({
      x: f.x + nx * side * 2, y: f.y + ny * side * 2,
      vx: f.vx * 0.6 + nx * side * sp + Math.cos(ang) * 50 * S,
      vy: Math.min(f.vy * 0.4, 0) + ny * side * sp + Math.sin(ang) * 50 * S,
      rot: f.rot, vr: f.vr + side * (1.5 + Math.random() * 2.5),
      cut: ang - f.rot, side, e: f.e, r: f.r, c: f.t.c
    });
  }
  for (let i = 0; i < 10; i++) {                                              // percikan bulat
    const a = Math.random() * Math.PI * 2, s = (60 + Math.random() * 260) * S;
    const life = 0.4 + Math.random() * 0.5;
    parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s + Math.cos(ang) * 140 * S, vy: Math.sin(a) * s + Math.sin(ang) * 140 * S, life, max: life, size: (2 + Math.random() * 4.5) * S, c: f.t.c });
  }
  for (let i = 0; i < 16; i++) {                                              // tetesan jus memanjang, menyembur searah sabetan
    const a = ang + (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.3, s = (280 + Math.random() * 560) * S, life = 0.45 + Math.random() * 0.55;
    parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60 * S, life, max: life, size: (1.6 + Math.random() * 2.6) * S, c: f.t.c, drop: 1 });
  }
  const sc = f.t && SEEDY[f.t.e];
  if (sc) for (let i = 0; i < 7; i++) {                                       // biji
    const a = Math.random() * 6.283, s = (90 + Math.random() * 300) * S, life = 0.8 + Math.random() * 0.6;
    parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s + Math.cos(ang) * 80 * S, vy: Math.sin(a) * s - 120 * S, life, max: life, size: (2.4 + Math.random() * 1.8) * S, c: sc, seed: 1, rot: Math.random() * 6 });
  }
  splats.push({ x: f.x, y: f.y, r: f.r * (0.9 + Math.random() * 0.5), c: f.t.c, life: 1, seed: (Math.random() * 1e6) | 0, drip: { dx: (Math.random() - 0.5) * f.r * 0.9, len: 0.8 + Math.random() * 1.3 } });
  if (splats.length > 30) splats.shift();
  const o = (versus && b.owner != null) ? b.owner : undefined;
  if (f.star) {
    const n = award(o, 5);
    texts.push({ x: f.x, y: f.y - f.r, s: '⭐ +' + n, sub: '', life: 1.2, color: '#ffd23f', big: 1.2 });
    ringFx(f.x, f.y, f.r * 3.5, 0.6, '255,210,63', 8);
    burst(f.x, f.y, 14, ['#ffd23f', '#fff6a0'], 340, 0.7, {});
  } else {
    award(o, 1); if (gm !== 'classic') campOnSlice();
    b.combo++; b.comboT = 0.28; b.cx = f.x; b.cy = f.y;
    if (b.combo >= 2) texts.push({ x: f.x, y: f.y - f.r * 1.15, s: '×' + b.combo, sub: '', life: 0.55, color: b.combo >= 4 ? '#ff9f3a' : '#fff3a0', big: 0.75 + Math.min(0.5, b.combo * 0.08) });
    addCharge(o, 0.05);
    if (f.t && f.t.sq) { burst(f.x, f.y, 18, [f.t.c, '#ffffff', f.t.c], 320, 0.75, {}); ringFx(f.x, f.y, f.r * 2.5, 0.4, '255,200,230', 6); sfx.squeak(); }
    if (f.kind === 'ice') startFreeze(fidx(o), f.x, f.y);
    else if (f.kind === 'heart') heal(o, f);
  }
  rings.push({ type: 'slash', x: f.x, y: f.y, ang, len: f.r * 3, life: 0.2, max: 0.2 });
  ringFx(f.x, f.y, f.r * 1.9, 0.35, fever[fidx(o)].t > 0 ? '255,190,60' : '255,255,255', 4);
  updateHud();
  sfx.slice(f, b.combo);
  vibrate(12);
}

function explode(f, b) {
  const vs = versus && b && b.owner != null;
  const ch = chill && !versus;
  if (vs) {
    const p = pl[b.owner];
    p.score = Math.max(0, p.score - 10); if (!chill) p.lives--; b.combo = 0;
    flash = 0.5; shake = 0.6;
  } else if (ch) {
    score = Math.max(0, score - 10); if (b) b.combo = 0;
    flash = 0.45; shake = 0.55;
  } else if (gm !== 'classic') {                                              // arcade/bos: bom = −1 ❤ (bukan langsung kalah)
    lives = Math.max(0, lives - 1); if (b) b.combo = 0; flash = 0.6; shake = 0.7; updateHud();
    if (lives <= 0) { state = 'dying'; dieT = 1.3; camp.phase = 'dead'; }
  } else {
    state = 'dying'; dieT = 1.3;
    flash = 1; shake = 1;
  }
  slowT = Math.max(slowT, vs || ch ? 0.25 : 0.55);
  sfx.bomb(); vibrate([80, 40, 220]);
  for (let i = 0; i < (vs || ch ? 35 : 60); i++) {
    const a = Math.random() * Math.PI * 2, s = (100 + Math.random() * 600) * S, life = 0.5 + Math.random() * 0.8;
    parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, size: (3 + Math.random() * 6) * S, c: Math.random() < 0.5 ? '#ffcc33' : (Math.random() < 0.5 ? '#ff5a1f' : '#555') });
  }
  texts.push({ x: f.x, y: f.y - f.r, s: vs || ch ? 'DUAR! -10' : 'DUAR!', sub: '', life: 1.3, color: '#ff5a3c' });
  if (vs || ch) updateHud();
}

function spawnOne(bomb, zone, star, kind, o) {
  const t = bomb ? null : star ? STAR : kind === 'ice' ? ICE : kind === 'heart' ? HEART : (pool => pool[(Math.random() * pool.length) | 0])(Math.random() < 0.28 ? SQUISH : FRUITS);
  const r = (bomb ? 34 : t.r) * S * (t && t.sq ? 0.9 + Math.random() * 0.35 : 1);
  const zoned = versus && zone !== undefined && zone >= 0;
  const x0 = zoned ? zone * W / 2 : 0, zw = zoned ? W / 2 : W;
  o = o || {};
  let x = o.x != null ? x0 + zw * o.x : x0 + zw * (0.12 + Math.random() * 0.76), yS = H + r;
  if (o.side) { x = o.side < 0 ? x0 - r : x0 + zw + r; yS = H * (o.y0 != null ? o.y0 : 0.7); }
  const h = H * (o.h != null ? o.h : star ? 0.62 : 0.5 + Math.random() * 0.36);
  const g = grav();
  const vy = -Math.sqrt(2 * g * h);
  const yEnd = H + r * 1.4, tAir = (-vy + Math.sqrt(vy * vy - 2 * g * (yS - yEnd))) / g;   // waktu sampai jatuh keluar layar
  let targetX = o.tx != null ? x0 + zw * o.tx : x0 + zw * (0.2 + Math.random() * 0.6);
  if (star) { x = W / 2; targetX = W / 2; }
  const vx = (targetX - x) / tAir;
  fruits.push({ x, y: yS, vx, vy, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 5, t, r, bomb, star: !!star, kind, ph: Math.random() * 6.28, zone: star ? -1 : (zoned ? zone : undefined), e: bomb ? '💣' : t.e, fuseT: 0 });
  if (state === 'play') sfx.toss();
}

// ---- gelombang berpola: tiap pola = daftar slot { d: jeda (dtk), x/tx: posisi awal/tujuan 0..1, h: tinggi lambung, side: -1/+1 dari sisi layar } ----
const rnd01 = () => Math.random(), lerpv = (a, b, t) => a + (b - a) * t;
const PATTERNS = {
  fan(n) { n = Math.max(3, n); return Array.from({ length: n }, (_, i) => ({ d: i * 0.07, x: 0.5 + (rnd01() - 0.5) * 0.06, tx: lerpv(0.14, 0.86, i / (n - 1)), h: 0.6 + rnd01() * 0.2 })); },
  cross() { const h = 0.62 + rnd01() * 0.12, sw = rnd01() < 0.5; return [{ d: 0, x: 0.14, tx: 0.86, h }, { d: sw ? 0.08 : 0, x: 0.86, tx: 0.14, h: h * 0.92 }, { d: 0.55, x: 0.14, tx: 0.86, h: h * 0.96 }, { d: 0.55, x: 0.86, tx: 0.14, h: h * 0.88 }]; },
  sides(n) { n = Math.max(3, n); return Array.from({ length: n }, (_, i) => ({ d: i * 0.34, side: i % 2 ? 1 : -1, y0: 0.62 + rnd01() * 0.2, h: 0.28 + rnd01() * 0.14, tx: 0.3 + rnd01() * 0.4 })); },
  stairs(n) { n = Math.max(4, n); const up = rnd01() < 0.5; return Array.from({ length: n }, (_, i) => { const k = i / (n - 1), p = up ? k : 1 - k; return { d: i * 0.17, x: lerpv(0.14, 0.86, p), tx: lerpv(0.14, 0.86, p) + (up ? 0.04 : -0.04), h: lerpv(0.56, 0.84, k) }; }); },
  tower(n) { n = Math.max(3, Math.min(4, n)); const x = 0.28 + rnd01() * 0.44; return Array.from({ length: n }, (_, i) => ({ d: i * 0.22, x, tx: x + (rnd01() - 0.5) * 0.06, h: 0.58 + i * 0.09 })); }
};
const PATTERN_UNLOCK = [['fan', 6], ['cross', 12], ['sides', 18], ['stairs', 24], ['tower', 30]];
function pickKind(z, bomb) {
  if (bomb) return undefined; const rr = Math.random();
  if (rr < 0.05) return 'ice';
  if (rr < 0.085 && (z !== undefined ? pl[z].lives < pl[z].max : lives < 5)) return 'heart';
}
// mengembalikan tambahan jeda sebelum gelombang berikutnya (detik)
function spawnWave(z) {
  const sc = z !== undefined ? pl[z].score : (gm !== 'classic' ? camp.level * 6 + camp.kills : score);
  const fvOn = fever[z === undefined ? 0 : z].t > 0;
  const bombP = fvOn || sc < 5 ? 0 : Math.min(0.25, 0.08 + sc * 0.002);
  const avail = PATTERN_UNLOCK.filter(p => sc >= p[1]).map(p => p[0]);
  if (avail.length && Math.random() < Math.min(0.62, 0.3 + avail.length * 0.08)) {
    const name = avail[(Math.random() * avail.length) | 0], n = 3 + Math.floor(Math.random() * Math.min(3, 1 + sc / 20)), slots = PATTERNS[name](n);
    const bi = slots.length >= 3 && Math.random() < bombP * 1.6 ? 1 + ((Math.random() * (slots.length - 1)) | 0) : -1;   // satu bom disisipkan (bukan di slot pertama)
    slots.forEach((sl, i) => queue.push({ t: elapsed + sl.d, bomb: i === bi, zone: z, kind: pickKind(z, i === bi), o: sl }));
    const lastD = slots[slots.length - 1].d;
    return lastD * 0.7 + (slots.length >= 4 ? 0.7 : 0.3);                  // napas setelah pola besar
  }
  const maxN = Math.min(z !== undefined ? 4 : 6, 1 + Math.floor(sc / 10));
  const n = 1 + Math.floor(Math.random() * maxN);
  const burst = Math.random() < 0.45;
  let bombs = 0;
  for (let i = 0; i < n; i++) {
    const bomb = n > 1 && bombs < 2 && Math.random() < bombP || (n === 1 && sc > 15 && Math.random() < bombP * 0.5);
    if (bomb) bombs++;
    queue.push({ t: elapsed + (burst ? Math.random() * 0.12 : i * 0.28), bomb, zone: z, kind: pickKind(z, bomb) });
  }
  return 0;
}

function loseLife(x, z) {
  if (gm !== 'classic' && camp.phase !== 'run') return;
  if (chill) {
    if (versus && z !== undefined && z >= 0) pl[z].missed++; else missed++;
    misses.push({ x: Math.max(30, Math.min(W - 30, x)), life: 1.2 });
    sfx.miss();
    updateHud();
    return;
  }
  if (versus && z !== undefined && z >= 0) pl[z].lives--; else lives--;
  { const fv = fever[versus && z >= 0 ? z : 0]; if (fv.t <= 0) fv.c = 0; }
  misses.push({ x: Math.max(30, Math.min(W - 30, x)), life: 1.2 });
  sfx.miss(); vibrate(60);
  updateHud();
  if (!versus && lives <= 0) { state = 'dying'; dieT = 0.9; }
}
