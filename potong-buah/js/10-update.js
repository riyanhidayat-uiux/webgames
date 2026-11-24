'use strict';
// ---------- update ----------
function update(dt, now) {
  elapsed += dt;
  updateTimer(dt);
  if (state === 'play' && versus) {
    for (let z = 0; z < 2; z++) {
      spawnZ[z] -= dt;
      if (spawnZ[z] <= 0) { const ex = spawnWave(z); spawnZ[z] = Math.max(1.0, 2.0 - pl[z].score * 0.012) + Math.random() * 0.5 + ex; }
    }
    starT -= dt;
    if (starT <= 0) { queue.push({ t: elapsed, bomb: false, star: true, zone: -1 }); starT = 10 + Math.random() * 5; }
    if (sudden) { sdT -= dt; $('sdTimer').textContent = 'SUDDEN DEATH ' + Math.max(0, Math.ceil(sdT)); vsCheck(); }
  } else if (state === 'play' && gm !== 'classic') {
    campUpdate(dt);
  } else if (state === 'play') {
    spawnT -= dt;
    if (spawnT <= 0) { const ex = spawnWave(); spawnT = Math.max(0.8, 1.9 - score * 0.012) + Math.random() * 0.4 + ex; }
  } else if (state === 'menu' || state === 'over') {
    spawnT -= dt;
    if (spawnT <= 0) { queue.push({ t: elapsed, bomb: false }); spawnT = 1.1 + Math.random() * 0.6; }
  }
  for (let i = queue.length - 1; i >= 0; i--) if (elapsed >= queue[i].t) { const q = queue.splice(i, 1)[0]; if (q.bomb && fever[q.zone >= 0 ? q.zone : 0].t > 0) continue; spawnOne(q.bomb, q.zone, q.star, q.kind, q.o); }

  const g = grav();
  for (let i = fruits.length - 1; i >= 0; i--) {
    const f = fruits[i];
    const fz = frozenIdx(f), dk = dt * (fz >= 0 ? 1 - 0.65 * freeze[fz].a : 1);
    f.vy += g * dk; f.x += f.vx * dk; f.y += f.vy * dk; f.rot += f.vr * dk;
    if (f.bomb) {
      f.fuseT -= dt;
      if (f.fuseT <= 0) {
        f.fuseT = 0.03;
        const fx = f.x + Math.cos(f.rot - 0.8) * f.r * 0.95, fy = f.y + Math.sin(f.rot - 0.8) * f.r * 0.95;
        const a = Math.random() * 6.28, s = 40 + Math.random() * 90;
        parts.push({ x: fx, y: fy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: 0.25, max: 0.25, size: 2 * S, c: Math.random() < 0.5 ? '#fff6a0' : '#ffae00' });
      }
    }
    if (f.vy > 0 && f.y > H + f.r * 1.4) {
      fruits.splice(i, 1);
      if (!f.bomb && !f.star && !f.kind && state === 'play') loseLife(f.x, f.zone);
    }
  }
  for (let i = halves.length - 1; i >= 0; i--) {
    const h = halves[i];
    h.vy += g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt;
    if (h.y > H + h.r * 2) halves.splice(i, 1);
  }
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    if (!p.ng) p.vy += g * 0.5 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = splats.length - 1; i >= 0; i--) { splats[i].life -= dt / 6; if (splats[i].life <= 0) splats.splice(i, 1); }
  for (let i = texts.length - 1; i >= 0; i--) { const t = texts[i]; t.y -= 35 * dt; t.life -= dt; t.age = (t.age || 0) + dt; if (t.life <= 0) texts.splice(i, 1); }
  for (let i = rings.length - 1; i >= 0; i--) { rings[i].life -= dt; if (rings[i].life <= 0) rings.splice(i, 1); }
  for (let i = misses.length - 1; i >= 0; i--) { misses[i].life -= dt; if (misses[i].life <= 0) misses.splice(i, 1); }

  if (state === 'play' || state === 'dying') { updateSensor(dt, now); updateCamera(dt, now); }

  for (let i = 0; i < 2; i++) {
    const fz = freeze[i], fv = fever[i];
    if (state === 'menu' || state === 'over') { fz.t = 0; fv.t = 0; fv.c = 0; }
    if (state === 'play') {
      if (fz.t > 0) fz.t -= dt;
      if (fv.t > 0) { fv.t -= dt; fv.c = Math.max(0, fv.t / FEVER_T); if (fv.t <= 0) { fv.t = 0; fv.c = 0; } }
    }
    const lp = Math.min(1, dt * 6);
    fz.a += ((fz.t > 0 ? 1 : 0) - fz.a) * lp; fv.a += ((fv.t > 0 ? 1 : 0) - fv.a) * lp;
    if (!versus && i === 1) continue;
    const x0 = versus ? i * W / 2 : 0, w = versus ? W / 2 : W;
    if (fz.a > 0.3 && Math.random() < dt * 22) parts.push({ x: x0 + Math.random() * w, y: -10, vx: (Math.random() - 0.5) * 40 * S, vy: (50 + Math.random() * 90) * S, life: 3, max: 3, size: (14 + Math.random() * 12) * S, c: '#fff', g: '❄', ng: 1 });
    if (fv.t > 0) {
      const n = Math.floor(dt * 90 + Math.random());
      for (let q = 0; q < n; q++) {
        const l = 0.5 + Math.random() * 0.7;
        parts.push({ x: x0 + Math.random() * w, y: H + 6, vx: (Math.random() - 0.5) * 50 * S, vy: -(180 + Math.random() * 420) * S, life: l, max: l, size: (3 + Math.random() * 6) * S, c: Math.random() < 0.5 ? '#ffb000' : (Math.random() < 0.5 ? '#ff5a1f' : '#fff6a0'), ng: 1 });
      }
    }
  }
  updateFeverHud();

  const all = [sensorBlade, camBlade, vc[0].blade, vc[1].blade, ...touchBlades.values(), ...deadBlades];
  for (const b of all) {
    while (b.pts.length && now - b.pts[0].t > TRAIL_MS) b.pts.shift();
    if (b.comboT > 0) {
      b.comboT -= dt;
      if (b.comboT <= 0) {
        if (b.combo >= 3 && state === 'play') {
          const c = b.combo, bonus = comboBonus(c); let got;
          if (versus && b.owner != null) {
            got = award(b.owner, bonus); addCharge(b.owner, 0.25 + 0.05 * (c - 3));
            if (c >= 5) {
              queue.push({ t: elapsed, bomb: true, zone: 1 - b.owner });
              texts.push({ x: b.cx, y: b.cy - 50 * S, s: 'SERANG! 💣', sub: '', life: 1.3, color: '#ff8a5a' });
            }
          } else { got = award(undefined, bonus); addCharge(undefined, 0.25 + 0.05 * (c - 3)); }
          texts.push({ x: b.cx, y: b.cy, s: c >= 6 ? 'MEGA COMBO!' : COMBO_NAME[c], sub: c + ' buah · +' + got, life: 1.5, color: c >= 6 ? '#ff6a3c' : c >= 5 ? '#ff9f3a' : '#ffd23f', big: Math.min(2, 1.15 + 0.15 * (c - 3)) });
          if (c >= 4) { slowT = Math.max(slowT, 0.18 + 0.05 * Math.min(4, c - 4)); flash = Math.max(flash, 0.12); shake = Math.max(shake, 0.18); ringFx(b.cx, b.cy, Math.max(W, H) * 0.4, 0.5, '255,200,80', 8); }
          if (gm !== 'classic') campOnCombo();
          sfx.combo(); updateHud();
        }
        b.combo = 0;
      }
    }
  }
  deadBlades = deadBlades.filter(b => b.pts.length || b.comboT > 0);

  shake = Math.max(0, shake - dt * 1.8);
  flash = Math.max(0, flash - dt * 1.4);
  if (state === 'dying') { dieT -= dt; if (dieT <= 0) gameOver(); }
}
