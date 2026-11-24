'use strict';
// ---------- update rally ----------
function stepShuttle(dt) {
  const n = Math.ceil(dt / (1 / 120)), h = dt / n;
  for (let i = 0; i < n && S.live; i++) {
    const sp = Math.hypot(S.vx, S.vy, S.vz);
    S.vx -= CD * sp * S.vx * h; S.vy += (-G - CD * sp * S.vy) * h; S.vz -= CD * sp * S.vz * h;
    const z0 = S.z; S.x += S.vx * h; S.y += S.vy * h; S.z += S.vz * h;
    if (z0 !== S.z && z0 * S.z <= 0 && S.y < NET_H + 0.04 && Math.abs(S.x) < HW + 0.5) {   // nyangkut net
      S.z = z0; S.vz *= -0.15; S.vx *= 0.3; S.vy = Math.min(S.vy, 0); sfx.net(); say('NET!', '#ffd23f');
      burst(S.x, S.y, S.z, 8, ['#ffffff'], 2);
    }
    if (S.y <= 0.02) { S.y = 0.02; S.live = false; sfx.floor(); landed(); break; }
  }
}
function landed() {
  const h = lastHitter, inX = Math.abs(S.x) <= HW + 0.04, inZ = Math.abs(S.z) <= HL + 0.04;
  const oppSide = S.z * players[h].side < 0;
  if (inX && inZ && oppSide) awardPoint(h, 'MASUK!');
  else awardPoint(1 - h, inX && inZ ? 'JATUH DI AREA SENDIRI' : 'OUT!');
}

function predict() {
  let x = S.x, y = S.y, z = S.z, vx = S.vx, vy = S.vy, vz = S.vz;
  const h = 1 / 60;
  for (let i = 0; i < 400; i++) {
    const sp = Math.hypot(vx, vy, vz);
    vx -= CD * sp * vx * h; vy += (-G - CD * sp * vy) * h; vz -= CD * sp * vz * h;
    x += vx * h; y += vy * h; z += vz * h;
    if (y <= 1.2 && vy < 0) break;
  }
  return { x, z };
}

function updatePlayers(dt) {
  for (const p of players) {
    if (p.ai && (phase === 'rally' || phase === 'ready')) {
      const d = DIFF[settings.diff];
      p.aiT -= dt;
      if (p.aiT <= 0) {
        p.aiT = d.rt;
        const toward = S.live && S.vz * p.side > 0 && lastHitter !== p.i;
        if (phase === 'ready' && server === p.i) { p.aiX = clamp(p.x, -1, 1); p.aiZ = p.side * 5; }
        else if (toward) { const pr = predict(); const er = d.err * tired(); p.aiX = pr.x + (Math.random() - 0.5) * 2 * er; p.aiZ = pr.z * p.side > 0.3 ? pr.z + p.side * (Math.random() - 0.5) * 2 * er : p.side * 1.0; }
        else { p.aiX = lerp(p.aiX, 0, 0.5); p.aiZ = p.side * 4.3; }
      }
      p.tx = p.aiX; p.tz = p.aiZ;
    }
    p.tx = clamp(p.tx, -HW - 0.3, HW + 0.3);
    p.tz = p.side > 0 ? clamp(p.tz, 0.7, HL - 0.2) : clamp(p.tz, -(HL - 0.2), -0.7);
    const dx = p.tx - p.x, dz = p.tz - p.z, dist = Math.hypot(dx, dz), step = p.maxSp * dt;
    const k = dist > step ? step / dist : 1;
    p.vx = dx * k / dt; p.vz = dz * k / dt;
    p.x += dx * k; p.z += dz * k;
    const a = Math.min(1, dt * 9);
    p.vxS += (p.vx - p.vxS) * a; p.vzS += (p.vz - p.vzS) * a;
    p.cool = Math.max(0, p.cool - dt); p.swing = Math.max(0, p.swing - dt * 4);
  }
  // kontak raket-kok
  if (S.live && phase === 'rally') {
    for (const p of players) {
      if (p.cool > 0 || lastHitter === p.i) continue;
      if (S.z * p.side < -0.5) continue;
      if (S.y > 3.3 || S.y < 0.12) continue;
      if (Math.hypot(S.x - p.x, S.z - p.z) < p.reach) { hit(p); break; }
    }
  }
}
