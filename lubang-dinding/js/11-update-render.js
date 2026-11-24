'use strict';
// ======================= UPDATE & RENDER =======================
function updateBodyFromPreset(pi, dt) {
  const pl = PL[pi]; if (!pl) return; const J = buildPose(POSES[pl.preset].spec, { arm: 1, torso: 1 });
  for (const n in J) { const t = J[n], o = pl.B.J[n]; if (!o) pl.B.J[n] = { x: t.x, y: t.y, v: 1 }; else { const a = Math.min(1, dt * 14); o.x += (t.x - o.x) * a; o.y += (t.y - o.y) * a; o.v = 1; } }
  pl.B.valid = true; pl.B.seen = elapsed; pl.px += (pl.pxT - pl.px) * Math.min(1, dt * 10);
}
const MORPH_Z = -13;
function morphWall(w) {
  w.morphPending = false;
  for (const h of w.holes) { if (!h.morph) continue; const p = PL[h.pl]; h.adapt = !!(p.B.valid && judgeFrac(p.B.J, h.J, w.rad, h.pose.spec) >= 0.78); h.pose = h.morph.pose; h.J = h.morph.J; h.morph = null; h.best = 0; fxRing(h.off, -0.5, w.z + 0.4, 0xff8a3c, 6, 0.5); }
  rebuildWallTex(w); sfx.morph(); say('BERUBAH!', '#ff8a5a', -1); shake = Math.max(shake, 0.35); floorGlow = 1; floorGlowCol = 0xff8a2a;
}
function updateWalls(dt) {
  for (let i = walls.length - 1; i >= 0; i--) {
    const w = walls[i]; w.z += w.speed * dt; w.g.position.z = w.z;
    if (w.slide) { const S = w.slide, t = clamp((w.z - S.z0) / (S.z1 - S.z0), 0, 1); w.hs = lerp(S.s0, S.s1, t * t * (3 - 2 * t)); w.planes[0].position.x = w.planes[1].position.x = w.hs; }
    if (!w.done && w.z > -0.9 && w.z < 0.9) for (const h of w.holes) { const p = PL[h.pl]; if (p.B.valid) { const Bw = bodyForWall(p, w), pv = h.best, f1 = judgeFrac(Bw, h.J, w.rad, h.pose.spec), f2 = h.alt ? judgeFrac(Bw, h.alt.J, w.rad, h.alt.pose.spec) : 0; h.bm = Math.max(h.bm || 0, f1); h.ba = Math.max(h.ba || 0, f2); h.best = Math.max(h.best, f1, f2); if (pv < 0.78 && h.best >= 0.78) sfx.lock(1); if (pv < 0.97 && h.best >= 0.97) sfx.lock(2); } }
    if (w.morphPending && !w.done && w.z > MORPH_Z) morphWall(w);
    if (!w.done && w.z >= 0.9) resolveWall(w);
    if (w.z > 9) { disposeWall(w); walls.splice(i, 1); }
  }
  spawnGap -= dt;
  const farthest = walls.length ? Math.min(...walls.map(w => w.z)) : -99;
  if (state === 'play' && spawnGap <= 0 && (walls.length === 0 || (!practice && farthest > -34 + 34 * spawnFrac))) { spawnWall(); spawnGap = 0.5; }
  for (let i = 0; i < 2; i++) { const nh = nearestHole(i); setHint(i, nh.w, nh.h); }
}
function render(dt) {
  elapsed += dt; fxUpdate(dt); themeFrame(dt); audioFrame(dt); coachUpdate(performance.now());
  floorTex.offset.y += (state === 'play' || state === 'dying' ? 7 : 1.2) * dt / 3; sideTex.offset.y = floorTex.offset.y;
  lamps.forEach(l => { l.position.z += (state === 'play' ? 7 : 1.2) * dt; if (l.position.z > 10) l.position.z -= 91; });
  for (const q of PART) { if (q.life <= 0) continue; q.life -= dt; if (q.life <= 0) { q.m.visible = false; continue; } q.vy -= 6 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.rotation.x += q.rx * dt; q.m.rotation.y += q.ry * dt; q.m.material.opacity = Math.min(1, q.life / q.max * 1.8); }
  for (let i = 0; i < NP(); i++) { const pl = PL[i]; let hole = null, rad = holeRad(); if (pl.alive) { const nw = walls.filter(w => !w.done && w.z > -7).sort((a, b) => b.z - a.z)[0]; hole = nw ? nw.holes.find(h => h.pl === i) || null : null; if (nw) rad = nw.rad; } const sw0 = pl.alive && !versus ? walls.filter(w => !w.done).sort((a, b) => b.z - a.z)[0] : null; pl.ax += ((sw0 && sw0.slide ? clamp(pl.px, -2.6, 2.6) : 0) - pl.ax) * Math.min(1, dt * 8); AVS[i].g.position.x = (OFFS()[i] || 0) + pl.ax;
    AVS[i].update(pl, hole && holeView(hole, pl.B.J), rad, elapsed); }
  shake = Math.max(0, shake - dt * 2.2); const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.5 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.4 : 0;
  const asp = camera.aspect, back = Math.max(12.5, (versus ? 16.5 : 11.5) / asp + 0.5); camera.position.set(sx, 0.7 + sy, back); camera.lookAt(0, -0.7, 0);
  const fv = 46 + fovKick * 3.5; if (Math.abs(camera.fov - fv) > 0.02) { camera.fov = fv; camera.updateProjectionMatrix(); }
  renderer.render(scene, camera);
}
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  detectPose(now);
  if (!useCam || state === 'menu') {
    if (state === 'menu') { menuT += dt; if (menuT > 1.8) { menuT = 0; PL.forEach((p, i) => { p.preset = (p.preset + 1 + i * 3) % POSES.length; }); } }
    if (state !== 'over') PL.forEach((p, i) => updateBodyFromPreset(i, dt));
  }
  if (state === 'play') { updateWalls(dt); if (chill) { timeLeft -= dt; updateTimerHud(); if (timeLeft <= 0) { timeLeft = 0; updateTimerHud(true); say('WAKTU HABIS!', '#ffd23f'); gameOver(); } } }
  else if (state === 'dying') { updateWalls(dt); dieT -= dt; if (dieT <= 0) gameOver(); }
  if (state === 'play' && useCam && PL.some(p => !p.B.valid && elapsed - p.B.seen > 0.8) && !window.__warned) { window.__warned = true; toast(versus ? 'Salah satu pemain tidak terdeteksi — pastikan badan atas kalian terlihat.' : 'Tubuhmu tidak terdeteksi — pastikan badan bagian atas terlihat di kamera.', 2500); setTimeout(() => { window.__warned = false; }, 6000); }
  render(dt); requestAnimationFrame(frame);
}

resize(); setVersus(false); toMenu();
$('bestHud').textContent = 'TERBAIK ' + best;
requestAnimationFrame(frame);
