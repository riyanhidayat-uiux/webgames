'use strict';
// ======================= STATE =======================
let chill = store.get('chill', false), timeLeft = 0, timeShown = -1;      // mode santai: tanpa nyawa, 5 menit
const CHILL_TIME = 300, bestKey = () => chill ? 'bestChill' : 'best';
const noLives = () => chill || (typeof practice !== 'undefined' && practice);   // santai & latihan: tanpa nyawa
let state = 'menu', useCam = false, elapsed = 0, shake = 0, best = store.get(bestKey(), 0);
let walls = [], wallNo = 0, spawnGap = 0, dieT = 0, menuT = 0, winner = null;
const TRAVEL0 = 5.0, TRAVEL_MIN = 2.6;
const travelTime = () => (typeof practice !== 'undefined' && practice) ? SPEEDS[settings.pracSpeed][1] : Math.max(TRAVEL_MIN, TRAVEL0 - wallNo * 0.1 - settings.diff * 0.25);
const PCOLS = [[0xffa23c, 0x7a3a00], [0x38b8ff, 0x0a3a7a]], PTXT = ['#ffb35a', '#6fc8ff'];

const legsOn = () => settings.legs !== false;
function pickPose(pl) {
  if (practice) { if (pl.retry) return pl.retry; const pool = pracPool(); let i = 0, g = 0; do { i = (Math.random() * pool.length) | 0; } while (pool.length > 1 && pool[i] === pl.lastP && g++ < 8); pl.lastP = pool[i]; return pool[i]; }
  const n = Math.max(...PL.map(p => p.cleared)), tier = n < 4 ? 1 : n < 10 ? 2 : n < 18 ? 3 : 4;
  const foot = legsOn() ? POSES.filter(p => p.foot && p.tier <= tier) : [];          // pose kaki: kuota terpisah supaya tidak mendominasi
  let pool = POSES.filter(p => p.tier <= tier && !p.foot);
  if (n >= 4 && Math.random() < 0.65) pool = pool.filter(p => p.tier === tier);
  if (foot.length && n >= 4 && Math.random() < Math.min(0.3, 0.1 * foot.length)) pool = foot;
  let i, guard = 0; do { i = POSES.indexOf(pool[(Math.random() * pool.length) | 0]); } while (i === pl.lastPose && guard++ < 8);
  pl.lastPose = i; return POSES[i];
}
// ---- rantai & pose berubah ----
let chainSeq = 0, chain = null, chainState = {}, spawnFrac = 0.55;           // spawnFrac: seberapa jauh dinding terakhir harus melaju sebelum dinding berikutnya muncul
function pickMorph(pl, A) {
  const n = Math.max(...PL.map(p => p.cleared)), tier = n < 10 ? 2 : 3, pool = POSES.filter(p => p.tier <= tier && p !== A && p.id !== 'tegak' && !p.foot);
  return pool[(Math.random() * pool.length) | 0];
}
// ---- level, bos, pilihan, power-up ----
const POWERS = { wide: { icon: '⭕', name: 'LUBANG BESAR', note: '3 dinding berikutnya lubangnya lebih lebar', n: 3 }, slow: { icon: '⏳', name: 'WAKTU MELAMBAT', note: '4 dinding berikutnya lebih lambat', n: 4 }, life: { icon: '💖', name: '+1 NYAWA', note: '', n: 0 } };
let pw = { wide: 0, slow: 0 };
const BOSS_COLS = [0xffd23f, 0xa06a00], BOSS_EVERY = 10;
const levelOf = n => Math.floor(n / BOSS_EVERY) + 1;
function pickPowerKind() { const k = []; if (!noLives() && PL[0] && PL[0].lives < 3) k.push('life', 'life'); k.push('wide', 'slow'); return k[(Math.random() * k.length) | 0]; }
function spawnWall() {
  const n = wallNo, poses = PL.map(pl => pl.alive ? pickPose(pl) : null), opts = {}, solo = !versus && !practice, plain = !practice;
  const isBoss = solo && n >= BOSS_EVERY - 1 && (n + 1) % BOSS_EVERY === 0;
  if (plain && n > 0 && n % BOSS_EVERY === 0) { const ch = themeForLevel(levelOf(n)); say('LEVEL ' + levelOf(n) + (ch ? ' · ' + THEME.name : '') + '!', '#9fe7ff', -1); sfx.level(); fxRing(0, 0, 0.5, 0x9fe7ff, 12, 0.7); }
  if (practice) { spawnFrac = 0; }
  else if (isBoss) {                                                              // dinding BOS: pose paling sulit, warna emas, hadiah ×3
    const pool = POSES.filter(p => p.tier === 4 && (legsOn() || !p.foot)); poses[0] = pool[(Math.random() * pool.length) | 0]; opts.boss = true; opts.cols = BOSS_COLS; spawnFrac = 0.62;
    setTimeout(() => { if (state === 'play') { say('⚠ DINDING BOS ⚠', '#ffd23f', -1); sfx.boss(); } }, 150);
  } else if (chain) {
    opts.chain = { id: chain.id, idx: chain.idx, len: chain.len }; chain.idx++; spawnFrac = chain.idx < chain.len ? 0.42 : 0.55; if (chain.idx >= chain.len) chain = null;
  } else if (n >= 5 && Math.random() < 0.2) {
    const len = n >= 14 ? 4 : 3; chain = { id: ++chainSeq, idx: 1, len }; opts.chain = { id: chain.id, idx: 0, len }; spawnFrac = 0.42; chainState[chain.id] = { ok: true, n: 0 };
    say('RANTAI ' + len + ' DINDING!', '#9fe7ff', -1);
  } else {
    spawnFrac = 0.55; const r = Math.random();
    if (solo && n >= 7 && Math.random() < 0.16) {                                  // lubang BERGESER: pemain harus melangkah ke samping
      const L = SLIDE_LANE, e = Math.random() < 0.2 ? 0 : (Math.random() < 0.5 ? -L : L), s0 = e === 0 ? (Math.random() < 0.5 ? -L : L) : (Math.random() < 0.5 ? -e : 0); opts.slide = { s0, s1: e };
    } else if (n >= 8 && r < 0.18) opts.morph = poses.map((p, i) => p ? pickMorph(PL[i], p) : null);
    else if (solo && n >= 6 && r < 0.36) {                                        // 'pilih salah satu': dua pose, lolos dengan salah satunya
      let b = poses[0], g = 0; while (b === poses[0] && g++ < 10) b = pickPose(PL[0]); opts.alt = [b];
    } else if (solo && n >= 5 && r < 0.5 && !(pw.wide || pw.slow)) { opts.power = pickPowerKind(); opts.icon = POWERS[opts.power].icon; }
  }
  const radB = pw.wide > 0 ? 0.16 : 0, spdM = pw.slow > 0 ? 1.4 : 1; if (plain) { if (pw.wide > 0) pw.wide--; if (pw.slow > 0) pw.slow--; if (typeof powHud === 'function') powHud(); }
  const w = makeWall(poses, holeRad() + radB, wallNo++, opts); w.speed = 34 / (travelTime() * spdM); if (opts.slide) setTimeout(() => { if (state === 'play') say('LUBANG BERGESER!', '#9fe7ff', -1); }, 200);
  if (opts.alt) { w.alt = true; setTimeout(() => { if (state === 'play') say('PILIH SALAH SATU!', '#ffb36a', -1); }, 200); } walls.push(w);
}
const nearestHole = (pi) => { let bw = null; for (const w of walls) { if (w.done) continue; if (!bw || w.z > bw.z) bw = w; } return bw ? { w: bw, h: bw.holes.find(h => h.pl === pi) || null } : { w: null, h: null }; };
