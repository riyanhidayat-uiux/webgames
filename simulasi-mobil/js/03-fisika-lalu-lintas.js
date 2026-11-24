'use strict';
// ======================= FISIKA MOBIL, LALU LINTAS, SKOR =======================
const P = { x: 0, v: 0, vl: 0, yaw: 0, dist: 0, scoreAcc: 0, bonus: 0, lives: 3, invuln: 0, passed: 0, near: 0, vTop: 0, crashes: 0, off: false, braking: false };
const input = { steer: 0, throttle: 0 }, input2 = { steer: 0, throttle: 0 };      // input2 = pemain 2 (balapan layar terbelah)
let traffic = [], spawnD = 40, shake = 0, timeLeft = CHILL_TIME;
const vMax = () => V_MAX + Math.min(14, P.dist / 1800);          // kecepatan puncak naik seiring jarak
const LAT_MAX = 10;
function resetDrive() {
  traffic.forEach(c => scene.remove(c.g)); traffic = []; if (typeof resetEvents === 'function') resetEvents(); if (typeof damageClear === 'function') damageClear();
  Object.assign(P, { x: 0, v: 0, vl: 0, yaw: 0, dist: 0, scoreAcc: 0, bonus: 0, lives: 3, invuln: 0, passed: 0, near: 0, vTop: 0, crashes: 0, off: false, braking: false });
  input.steer = 0; input.throttle = 0; spawnD = 40; shake = 0; timeLeft = CHILL_TIME; PART.forEach(p => { p.life = 0; p.m.visible = false; });
  for (let i = 0; i < 4; i++) { if (spawnCar(-60 - i * 38)) { const c = traffic[traffic.length - 1]; c.speed = rr(16, 22); } }
}
const score = () => Math.floor(P.scoreAcc + P.bonus);
// --- lalu lintas ---
function laneFree(z) {
  const order = [0, 1, 2].sort(() => Math.random() - 0.5);
  for (const l of order) { let ok = true, near = 0; for (const c of traffic) { if (Math.abs(c.z - z) < 48) { near++; if (c.lane === l || (c.lc && c.lc.to === l)) ok = false; } } if (ok && near < 2) return l; }
  return -1;
}
const CAR_PAL = [0xf4f4f6, 0xf4f4f6, 0xf4f4f6, 0xf4f4f6, 0xf4f4f6, 0xc0c4cc, 0xc0c4cc, 0xc0c4cc, 0xc0c4cc, 0x1c1d22, 0x1c1d22, 0x1c1d22, 0x1c1d22, 0x8a8a96, 0x8a8a96, 0x8a8a96, 0xd8222a, 0xd8222a, 0x2a6ae0, 0x2a6ae0, 0x7a1a1a, 0xe87a1e, 0x2a9a4a, 0xd9c9a0, 0xf2b81c];   // dominan putih/perak/hitam seperti jalan sungguhan
const ROOFBOX = new THREE.BoxGeometry(0.95, 0.3, 1.5);
function spawnCar(z = -175) {
  const lane = laneFree(z); if (lane < 0) return false;
  const kind = pickKind(), vr = (Math.random() * (NVAR[kind] || 1)) | 0, big = isBigKind(kind), bike = kind.indexOf('motor') === 0, slow = kind === 'angkot';
  const c = makeCar(kind, pick(CAR_PAL), false, vr);
  if (['sedan', 'hatch', 'suv', 'mpv'].indexOf(kind) >= 0 && Math.random() < 0.1) { const b = new THREE.Mesh(ROOFBOX, PB.trim); b.position.set(0, c.roofY + 0.18, 0.3); b.castShadow = true; c.g.add(b); }   // kotak atap
  const hard = freeMode ? 0 : clamp(P.dist / 7000, 0, 1), v = big ? rr(12, 17) : slow ? rr(10, 16) : freeMode ? rr(14, 20) : bike ? rr(16, 26 + hard * 5) : rr(15, 24 + hard * 6);
  Object.assign(c, { vr, x: LANE_X[lane] + (bike ? rr(-0.9, 0.9) : 0), lane, z, speed: v, nm: false, passed: false, lc: null, blinkT: 0, canLC: !big && Math.random() < (bike ? 0.4 : slow ? 0.3 : 0.18) + hard * 0.2 });   // motor: menyelip sedikit di antara lajur
  c.g.position.set(c.x, 0, z); scene.add(c.g); traffic.push(c); return true;
}
function removeCar(i) { scene.remove(traffic[i].g); traffic.splice(i, 1); }
function updateTraffic(dt, collide) {
  const hard = freeMode ? 0 : clamp(P.dist / 7000, 0, 1);
  if (collide) { spawnD -= P.v * dt; if (spawnD <= 0 && traffic.length < Math.round((freeMode ? 9 : 15) * GFXC.traffic)) { spawnCar(); spawnD = rr(26, 48) * lerp(1, 0.55, hard) * (freeMode ? 1.7 : 1); } }
  for (let i = traffic.length - 1; i >= 0; i--) {
    const c = traffic[i];
    // mengikuti: bila mobil di depan (lajur sama) terlalu dekat, kurangi kecepatan agar tidak menembusnya
    let lead = null; if (!c.em && !c.stat) for (const o of traffic) { if (o === c || o.z >= c.z || !(o.lane === c.lane || (c.lc && o.lane === c.lc.to) || (o.lc && o.lc.to === c.lane))) continue; if (!lead || o.z > lead.z) lead = o; }
    if (lead) { const gap = c.z - lead.z - (c.l + lead.l) / 2; if (gap < 10 + c.speed * 0.9 && c.speed > lead.speed) c.speed = Math.max(lead.speed * 0.97, c.speed - 9 * dt); }
    c.z += (P.v - c.speed) * dt; c.g.position.z = c.z; if (!c.em && !c.stat) setCarLod(c, c.z < -LOD_DIST || c.z > LOD_DIST * 0.8);   // LOD: kendaraan jauh = 2 draw call
    for (const w of c.wheels) w.piv.rotation.x -= c.speed * dt / w.r;
    // pindah jalur: lampu sein menyala sebelum berpindah
    if (c.canLC && !c.lc && c.z > -85 && c.z < -25 && collide) {
      const to = c.lane + (c.lane === 0 ? 1 : c.lane === 2 ? -1 : (Math.random() < 0.5 ? -1 : 1));
      if (!traffic.some(o => o !== c && Math.abs(o.z - c.z) < 24 && (o.lane === to || (o.lc && o.lc.to === to)))) { c.lc = { to, t: 0, from: c.x }; c.canLC = false; }
    }
    if (c.lc) { c.lc.t += dt; const bl = c.lc.t < 1.0 ? (Math.floor(c.lc.t * 6) % 2 ? 1.6 : 0) : 0; c.blinkers.forEach(b => { b.material.emissiveIntensity = (b.userData.side === Math.sign(LANE_X[c.lc.to] - LANE_X[c.lane])) ? bl : 0; });
      if (c.lc.t > 1.0) { const u = clamp((c.lc.t - 1.0) / 1.6, 0, 1), e = u * u * (3 - 2 * u); c.x = lerp(c.lc.from, LANE_X[c.lc.to], e); c.g.position.x = c.x; c.g.rotation.y = -Math.sign(LANE_X[c.lc.to] - LANE_X[c.lane]) * Math.sin(e * Math.PI) * 0.12; if (u >= 1) { c.lane = c.lc.to; c.lc = null; c.blinkers.forEach(b => { b.material.emissiveIntensity = 0; }); c.g.rotation.y = 0; } } }
    if (collide) {
      const dx = Math.abs(c.x - P.x), dz = Math.abs(c.z);
      if (dx < (c.w + PW) / 2 * 0.88 && dz < (c.l + PL) / 2 * 0.92) crash(c);
      else if (!c.nm && dz < 2.4 && P.v > c.speed + 3 && dx - (c.w + PW) / 2 > 0 && dx - (c.w + PW) / 2 < 0.85) { c.nm = true; P.near++; const b = Math.round(25 * (P.v / 30)); P.bonus += b; say('NYARIS! +' + b, '#7fffd0'); sfx.near(); if (Math.random() < 0.6) sfx.hornKind(c.kind, clamp((c.x - P.x) / 5, -1, 1), i + (c.vr | 0)); }
    }
    if (!c.passed && c.z > 7) { c.passed = true; P.passed++; if (collide) P.bonus += 10; }
    if (collide && c.pz !== undefined && c.pz < 0 && c.z >= 0 && !c.em) { const dx = Math.abs(c.x - P.x), rel = P.v - c.speed; if (dx < 5.2 && rel > 4 && elapsed - lastWhoosh > 0.2) { lastWhoosh = elapsed; sfx.passKind(c.kind, clamp((c.x - P.x) / 4, -1, 1), clamp(1.2 - dx / 5.5, 0.2, 1) * clamp(rel / 20, 0.3, 1)); } }   // mobil melintas di sampingmu
    c.pz = c.z;
    if (c.em ? c.z < -45 : (c.z > 18 || c.z < -240)) removeCar(i);
  }
}
// --- tabrakan ---
function crash(car) {
  if (P.invuln > 0 || state !== 'play') return;
  P.invuln = freeMode ? 1.2 : 2.0; P.crashes++; shake = 1;
  if (car) { const side = Math.sign(P.x - car.x) || 1; P.v = Math.min(P.v, car.speed * 0.6 + 2); P.x += side * 0.5; P.vl += side * 4; if (!car.stat) car.speed += 3; if (car.em) car.hit = true; puff(P.x, 0.6, car.z * 0.5, 14, [0xffcc33, 0xff7a1f, 0xdddddd], 5); }
  else { P.v *= 0.6; puff(P.x, 0.6, -1, 12, [0xffcc33, 0xff7a1f, 0xffffff], 5); }
  if (timed) P.bonus = Math.max(-P.scoreAcc, P.bonus - 50); else if (!chill) P.lives--;
  if (typeof damageHit === 'function') { damageHit(car ? Math.sign(P.x - car.x) || 1 : (Math.random() < 0.5 ? -1 : 1)); if (car && car.g && !car.stat) damageHit(Math.sign(car.x - P.x) || 1, car); }
  sfx.crash(); try { navigator.vibrate && navigator.vibrate([60, 30, 120]); } catch (e) {}
  say(freeMode ? 'AWAS!' : timed ? 'TABRAKAN! -50' : 'TABRAKAN!', '#ff6a7a'); const v = $('vign'); v.classList.add('hit'); setTimeout(() => v.classList.remove('hit'), 220);
  if (!chill && P.lives <= 0) { state = 'dying'; dieT = 1.6; }
  updateLives();
}
// --- gerak mobil pemain ---
function updateDrive(dt) {
  const t = input.throttle, s = input.steer, gr = wxGrip();
  P.off = Math.abs(P.x) > ROAD_HALF + 0.35;               // di bahu jalan (di luar garis tepi): getar & melambat
  let tv = t >= 0 ? V_CRUISE + t * (vMax() - V_CRUISE) : V_CRUISE + t * (V_CRUISE - V_MIN);
  tv -= terrGrade(P.dist) * 40;                            // tanjakan memperlambat, turunan mempercepat
  if (P.off) tv = Math.min(tv, 20);
  if (P.v < tv) { P.v += 9 * (1 - 0.55 * P.v / (vMax() + 6)) * dt; if (P.v > tv) P.v = tv; }
  else { const dec = t < -0.15 ? 30 * gr : (P.off ? 20 : 4); P.v -= dec * dt; if (P.v < tv) P.v = tv; }
  P.braking = t < -0.15 && P.v > tv + 0.5;
  const sf = clamp(P.v / 14, 0, 1) * (1 - 0.3 * clamp((P.v - 30) / 26, 0, 1));
  P.vl += (s * LAT_MAX * sf - P.vl) * (1 - Math.exp(-dt * 7 * gr)); P.x += (P.vl + terrDrift(P.dist, P.v)) * dt;   // tikungan menarik mobil keluar; jalan licin memperlambat respons setir
  if (Math.abs(P.x) > RAIL_X - PW / 2 - 0.1) { const sd = Math.sign(P.x); P.x = sd * (RAIL_X - PW / 2 - 0.1); P.vl = -sd * 3; P.v *= 0.93; if (P.invuln <= 0) crash(null); else shake = Math.max(shake, 0.4); puff(P.x + sd * 0.9, 0.5, -1, 3, [0xffcc33, 0xffffff], 3, 0.6); }
  P.yaw += (-Math.atan2(P.vl, Math.max(P.v, 6)) * 1.5 - P.yaw) * (1 - Math.exp(-dt * 8));
  P.invuln = Math.max(0, P.invuln - dt);
  const d = P.v * dt; P.dist += d; P.scoreAcc += d * (0.6 + 0.6 * P.v / V_MAX); P.vTop = Math.max(P.vTop, P.v);
  if (P.off && P.v > 6) puff(P.x + rr(-1, 1), 0.2, 1.6, 1, [0x6a5a3a, 0x8a7a50], 2, 0.9);
  return d;
}
function updatePlayerVisual(dt) {
  const g = playerCar.g; g.position.x = P.x; g.rotation.y = P.yaw; g.rotation.z = -P.vl * 0.012; g.rotation.x = P.braking ? -0.025 : 0;
  g.visible = (P.invuln > 0 && settings.view !== 1) ? Math.floor(elapsed * 14) % 2 === 0 : true;
  for (const w of playerCar.wheels) { w.piv.rotation.x -= P.v * dt / w.r; if (w.front) w.yaw.rotation.y = -input.steer * 0.42; }
  playerCar.tailM.emissiveIntensity = P.braking ? 2.2 : 0.35;
  headlight.position.set(P.x, 1, -1.5); headlight.target.position.set(P.x + Math.sin(-P.yaw) * 30, 0, -30);
}
