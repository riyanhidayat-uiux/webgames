'use strict';
// ======================= UPDATE =======================
function update(dt) {
  elapsed += dt;
  if (state === 'wait') {
    const ok = PL.every((p, i) => i >= NP() || p.valid); waitT = ok ? waitT + dt : 0;
    $('waitS').textContent = ok ? 'Terdeteksi! Tahan sebentar…' : (versus ? `Pemain terdeteksi: ${PL.filter(p => p.valid).length}/2 — berdirilah berdampingan, badan atas terlihat.` : 'Tubuhmu belum terdeteksi. Mundur sedikit sampai kepala, bahu, dan lengan terlihat.');
    if (waitT > 0.9) startCountdown(); return;
  }
  if (state !== 'play' && state !== 'dying') return;
  if (state === 'play') {
    tPlay += dt; const d = DIFF[settings.diff];
    if (versus) { timeLeft -= dt; $('timer').textContent = fmtT(timeLeft); $('timer').classList.toggle('low', timeLeft <= 10); if (timeLeft <= 0) endGame(); }
    if (fever.t > 0) { fever.t -= dt; if (fever.t <= 0) { fever.t = 0; say('Selesai!', '#cfd8ff'); } updateFever(); }
    spawnT -= dt; if (spawnT <= 0) { spawnBubble(); spawnT = Math.max(0.3, d.iv - tPlay * 0.008) * (fever.t > 0 ? 0.45 : 1) * rr(0.8, 1.2) * (versus ? 0.75 : 1); }
  } else { dieT -= dt; if (dieT <= 0) gameOver(); }
  // gerak target + tabrakan
  for (const b of bubbles) {
    if (b.dead) continue;
    b.t += dt / b.dur; b.cool = Math.max(0, b.cool - dt); b.z = -40 + b.t * 42; const f = Math.min(1, (b.z + 40) / 40);
    b.x = lerp(b.sx, b.ex, f) + Math.sin(elapsed * 3 + b.wob) * 0.15 * (1 - f); b.y = lerp(b.sy, b.ey, f) + Math.cos(elapsed * 2.4 + b.wob) * 0.12 * (1 - f);
    b.g.position.set(b.x, b.y, b.z); const pul = 1 + 0.05 * Math.sin(elapsed * 6 + b.wob); b.g.scale.setScalar(b.size * pul); b.body.rotation.y += dt;
    b.g.children.forEach(c => { if (c.isSprite && c.userData.glow) c.material.opacity = (b.type === 'bomb' ? 0.55 + 0.3 * Math.sin(elapsed * 14) : 0.55) * Math.min(1, (b.z + 38) / 14); });
    if (b.ring) b.ring.rotation.z += dt * 2;
    if (state === 'play' && b.z >= -9 && b.z <= 2) {
      const sc = bubbleScreen(b); let best = null, bd = Infinity;
      for (const p of PL) for (const q of p.pts) { const d = Math.hypot(q.x - sc.x, q.y - sc.y) - (sc.r + q.r * 0.6); if (d < 0 && d < bd) { bd = d; best = p.i; } }
      if (best != null) hitBubble(b, best);
    }
    if (!b.dead && b.t >= 1) missBubble(b);
  }
  bubbles = bubbles.filter(b => !b.dead);
  for (const q of PART) { if (q.life <= 0) continue; q.life -= dt; if (q.life <= 0) { q.m.visible = false; continue; } q.vy -= 5 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.material.opacity = Math.min(1, q.life / q.max * 1.8); }
  for (const r of RINGS) { if (r.life <= 0) continue; r.life -= dt; if (r.life <= 0) { r.m.visible = false; continue; } const k = 1 - r.life / r.max; r.m.scale.setScalar(r.r * (0.4 + k * 1.2)); r.m.material.opacity = 1 - k; }
}
