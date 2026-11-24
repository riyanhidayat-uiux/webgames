'use strict';
// ======================= BOLA: MODEL, FISIKA (hambatan udara, Magnus, pantulan), TIANG, JARING, KIPER =======================
const ballTex = (() => {   // bola ikosahedron terpotong (12 segi lima hitam + 20 segi enam putih) lengkap dengan jahitan
  const W = 512, H = 256, c = mkCanvas(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), phi = (1 + Math.sqrt(5)) / 2, pent = [], hex = [], nz = v => { const l = Math.hypot(...v); return v.map(a => a / l); };
  [[0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi]].forEach(v => { pent.push(nz(v), nz([v[1], v[2], v[0]]), nz([v[2], v[0], v[1]])); });
  [1, -1].forEach(a => [1, -1].forEach(b => [1, -1].forEach(d => hex.push(nz([a, b, d]))))); [[0, 1 / phi, phi], [0, 1 / phi, -phi], [0, -1 / phi, phi], [0, -1 / phi, -phi]].forEach(v => { hex.push(nz(v), nz([v[1], v[2], v[0]]), nz([v[2], v[0], v[1]])); });
  const uniqP = [], uniqH = []; pent.forEach(v => { if (!uniqP.some(u => u[0] * v[0] + u[1] * v[1] + u[2] * v[2] > 0.99)) uniqP.push(v); }); hex.forEach(v => { if (!uniqH.some(u => u[0] * v[0] + u[1] * v[1] + u[2] * v[2] > 0.99)) uniqH.push(v); });
  for (let iy = 0; iy < H; iy++) { const th = (iy + 0.5) / H * Math.PI, st = Math.sin(th), ct = Math.cos(th); for (let ix = 0; ix < W; ix++) {
    const ph = (ix + 0.5) / W * Math.PI * 2, d = [-Math.cos(ph) * st, ct, Math.sin(ph) * st]; let bp = 0, b1 = 0, b2 = 0;
    for (const v of uniqP) bp = Math.max(bp, d[0] * v[0] + d[1] * v[1] + d[2] * v[2]); for (const v of uniqH) { const dd = d[0] * v[0] + d[1] * v[1] + d[2] * v[2]; if (dd > b1) { b2 = b1; b1 = dd; } else if (dd > b2) b2 = dd; }
    const dp = Math.acos(clamp(bp, -1, 1)), dh = Math.acos(clamp(b1, -1, 1)), dh2 = Math.acos(clamp(b2, -1, 1)); let r = 246, g = 246, b = 242; const isP = dp < dh * 0.8, edge = Math.min(Math.abs(dp - dh * 0.8), (dh2 - dh) * 0.9);
    if (isP) { r = g = b = 22; } if (edge < 0.035) { const f = edge / 0.035; const base = isP ? 22 : 246; r = g = b = Math.round(lerp(120, base, f)); } else if (!isP) { const sh = 1 - 0.07 * dh; r = g = Math.round(246 * sh); b = Math.round(242 * sh); }
    const k = (iy * W + ix) * 4; img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255; } }
  x.putImageData(img, 0, 0); return mkTex(c);
})();
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 36, 28), new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.42, metalness: 0.02 })); ballMesh.castShadow = true; scene.add(ballMesh);
const BALL = { p: new THREE.Vector3(0, BALL_R, SPOT_Z), v: new THREE.Vector3(), w: new THREE.Vector3(), q: new THREE.Quaternion(), mode: 'rest', holder: null, heldT: 0 };
const shot = { active: false, t: 0, touched: false, hitFrame: false, crossed: false, result: null, resultT: -1, cx: 0, cy: 0, speed: 0, touchT: -1, prevZ: SPOT_Z, bounces: 0, maxLateral: 0 };
const ballEvents = [];
const KEEP = { rig: null, spheres: [], catchV: 19, canCatch: true };
const NETD = 1.85, PXC = GOAL_W / 2 + POST_R, BARYC = GOAL_H + POST_R;
function resetBall() { BALL.p.set(0, BALL_R, SPOT_Z); BALL.v.set(0, 0, 0); BALL.w.set(0, 0, 0); BALL.q.identity(); BALL.mode = 'rest'; BALL.holder = null; Object.assign(shot, { active: false, t: 0, touched: false, hitFrame: false, crossed: false, result: null, resultT: -1, cx: 0, cy: 0, speed: 0, touchT: -1, prevZ: SPOT_Z, bounces: 0, maxLateral: 0 }); syncBallMesh(); }
function syncBallMesh() { ballMesh.position.copy(BALL.p); ballMesh.quaternion.copy(BALL.q); }
const _dq = new THREE.Quaternion(), _ax = new THREE.Vector3();
// --- satu langkah fisika (h detik) ---
function ballStep(h) {
  const v = BALL.v, p = BALL.p, w = BALL.w, sp = v.length();
  let ax = 0, ay = -GRAV, az = 0;
  if (sp > 0.01) {
    const cd = sp > 14 ? 0.24 : lerp(0.45, 0.24, smooth((sp - 4) / 10)), kd = 0.5 * 1.2 * cd * 0.038 / BALL_M; ax -= kd * sp * v.x; ay -= kd * sp * v.y; az -= kd * sp * v.z;
    if (p.y > BALL_R + 0.02) { const S = w.length() * BALL_R / sp, f = S > 0.3 ? 0.3 / S : 1, km = 0.00583 * f; ax += km * (w.y * v.z - w.z * v.y); ay += km * (w.z * v.x - w.x * v.z); az += km * (w.x * v.y - w.y * v.x); }
  }
  if (p.z < 0.1 && p.z > -NETD - 0.4 && Math.abs(p.x) < GOAL_W / 2 + 0.15 && p.y < GOAL_H + 0.15) { const k = 3.4; ax -= k * v.x; ay -= k * v.y * 0.6; az -= k * v.z; }
  v.x += ax * h; v.y += ay * h; v.z += az * h; p.x += v.x * h; p.y += v.y * h; p.z += v.z * h;
  // tanah
  if (p.y < BALL_R) {
    p.y = BALL_R;
    if (v.y < -0.4) {
      const vn = -v.y, e = vn > 3 ? 0.62 : vn > 1.4 ? 0.42 : 0.12, Jn = (1 + e) * vn * BALL_M, ux = v.x + w.z * BALL_R, uz = v.z - w.x * BALL_R, us = Math.hypot(ux, uz);
      if (us > 1e-3) { const Jt = Math.min(0.35 * Jn, us * BALL_M * 0.4), tx = -ux / us * Jt, tz = -uz / us * Jt, I = 2 / 3 * BALL_M * BALL_R * BALL_R; v.x += tx / BALL_M; v.z += tz / BALL_M; w.x += (-BALL_R * tz) / I; w.z += (BALL_R * tx) / I; }
      v.y = e * vn; shot.bounces++; if (vn > 1.5) ballEvents.push({ type: 'bounce', v: vn });
    } else {
      v.y = 0; const ux = v.x + w.z * BALL_R, uz = v.z - w.x * BALL_R, us = Math.hypot(ux, uz);
      if (us > 1e-3) { const ft = Math.min(0.3 * GRAV * h, us * 0.3), I = 2 / 3 * BALL_M * BALL_R * BALL_R; v.x -= ft * ux / us; v.z -= ft * uz / us; w.x += (BALL_R * ft * uz / us * BALL_M) / I; w.z += (-BALL_R * ft * ux / us * BALL_M) / I; }
      const hs = Math.hypot(v.x, v.z); if (hs > 0) { const ns = Math.max(0, hs - 0.5 * h); v.x *= ns / hs; v.z *= ns / hs; }   // hambatan gelinding rumput
      if (hs < 0.04) { v.x = v.z = 0; w.multiplyScalar(0.98); }
    }
  }
  // tiang & mistar (silinder Ø12 cm)
  const R2 = BALL_R + POST_R;
  [-PXC, PXC].forEach(sx => { if (p.y < BARYC + POST_R) { const dx = p.x - sx, dz = p.z, d = Math.hypot(dx, dz); if (d < R2 && d > 1e-6) hitCyl(dx / d, 0, dz / d, R2 - d, 'post'); } });
  if (Math.abs(p.x) < PXC + 0.05) { const dy = p.y - BARYC, dz = p.z, d = Math.hypot(dy, dz); if (d < R2 && d > 1e-6) hitCyl(0, dy / d, dz / d, R2 - d, 'bar'); }
  // jaring
  const inX = Math.abs(p.x) < GOAL_W / 2 + 0.05;
  if (p.z < -NETD + BALL_R && p.z > -NETD - 0.6 && inX && p.y < GOAL_H + 0.05) { p.z = -NETD + BALL_R; if (v.z < 0) { const s = -v.z; netImpulse(p.x, p.y, Math.min(14, s * 0.55)); ballEvents.push({ type: 'net', v: s }); v.z *= -0.1; v.x *= 0.45; v.y *= 0.5; w.multiplyScalar(0.4); } }
  if (p.z < -0.02 && p.z > -NETD && p.y < GOAL_H + 0.05 && Math.abs(p.x) > GOAL_W / 2 - BALL_R && Math.abs(p.x) < GOAL_W / 2 + 0.3) { const sd = sgn(p.x); if (p.x * sd < GOAL_W / 2 + 0.1) { p.x = sd * (GOAL_W / 2 - BALL_R); if (v.x * sd > 0) { ballEvents.push({ type: 'net', v: Math.abs(v.x) * 0.5 }); v.x *= -0.12; v.z *= 0.6; } } }
  if (p.z < -0.02 && p.z > -NETD && p.y > GOAL_H - BALL_R && p.y < GOAL_H + 0.3 && Math.abs(p.x) < GOAL_W / 2) { p.y = GOAL_H - BALL_R; if (v.y > 0) { ballEvents.push({ type: 'net', v: v.y * 0.5 }); v.y *= -0.1; v.z *= 0.7; } }
  // putaran visual
  const wl = w.length(); if (wl > 1e-3) { _ax.copy(w).divideScalar(wl); _dq.setFromAxisAngle(_ax, wl * h); BALL.q.premultiply(_dq); }
}
function hitCyl(nx, ny, nz, pen, type) {
  const v = BALL.v, p = BALL.p; p.x += nx * pen; p.y += ny * pen; p.z += nz * pen; const vn = v.x * nx + v.y * ny + v.z * nz;
  if (vn < 0) { const e = 0.55; v.x -= (1 + e) * vn * nx; v.y -= (1 + e) * vn * ny; v.z -= (1 + e) * vn * nz; v.multiplyScalar(0.96); BALL.w.multiplyScalar(0.7); shot.hitFrame = true; ballEvents.push({ type, v: -vn }); }
}
// --- kiper: bola vs bola-bola tubuh ---
function updateKeeperSpheres(dt) {
  const k = KEEP; if (!k.rig) { k.spheres = []; return; } k.rig.root.updateMatrixWorld(true); const m = k.rig.markers, W = new THREE.Vector3(), out = [], prev = k.spheres;
  const add = (name, obj, r, hand, off) => { obj.getWorldPosition(W); const pv = prev.find(s => s.name === name); const s = { name, p: W.clone(), r, hand: !!hand, v: pv && dt > 0 ? W.clone().sub(pv.p).divideScalar(dt) : new THREE.Vector3() }; out.push(s); };
  add('hdL', m.hdL, 0.13, true); add('hdR', m.hdR, 0.13, true); add('elL', m.elL, 0.09); add('elR', m.elR, 0.09); add('shL', m.shL, 0.12); add('shR', m.shR, 0.12); add('knL', m.knL, 0.11); add('knR', m.knR, 0.11); add('anL', m.anL, 0.1); add('anR', m.anR, 0.1);
  add('head', m.head, 0.12); const T = new THREE.Vector3(); [['pel', m.pelvis, 0, 0.0], ['mid', m.torso, 0.25, 0], ['chest', m.torso, 0.48, 0]].forEach(([n, o, y]) => { T.set(0, y, 0); o.localToWorld(T); const pv = prev.find(s => s.name === n); out.push({ name: n, p: T.clone(), r: n === 'pel' ? 0.21 : 0.22, hand: false, v: pv && dt > 0 ? T.clone().sub(pv.p).divideScalar(dt) : new THREE.Vector3() }); });
  // paha & lengan bawah (titik tengah)
  [['thL', m.knL, 0.2], ['thR', m.knR, 0.2], ['fL', m.hdL, 0.15], ['fR', m.hdR, 0.15]].forEach(([n, o, up]) => { const A = out.find(s => s.name === (n === 'thL' ? 'knL' : n === 'thR' ? 'knR' : n === 'fL' ? 'hdL' : 'hdR')), B = out.find(s => s.name === (n === 'thL' ? 'pel' : n === 'thR' ? 'pel' : n === 'fL' ? 'elL' : 'elR')); if (A && B) { const mid = A.p.clone().lerp(B.p, 0.5), pv = prev.find(s => s.name === n); out.push({ name: n, p: mid, r: n[0] === 't' ? 0.12 : 0.085, hand: false, v: pv && dt > 0 ? mid.clone().sub(pv.p).divideScalar(dt) : new THREE.Vector3() }); } });
  k.spheres = out;
}
const _rel = new THREE.Vector3(), _n = new THREE.Vector3();
function keeperCollide() {
  if (!KEEP.rig || BALL.mode !== 'fly') return;
  for (const s of KEEP.spheres) {
    _n.copy(BALL.p).sub(s.p); const d = _n.length(), R = BALL_R + s.r; if (d >= R || d < 1e-6) continue; _n.divideScalar(d); _rel.copy(BALL.v).sub(s.v); const vn = _rel.dot(_n);
    BALL.p.copy(s.p).addScaledVector(_n, R); if (vn >= 0) continue;
    const rs = _rel.length(); if (shot.touchT < 0) shot.touchT = shot.t; shot.touched = true;
    if (s.hand && KEEP.canCatch && rs < KEEP.catchV && !shot.crossed) { BALL.mode = 'held'; BALL.holder = s.name; BALL.heldT = 0; BALL.v.set(0, 0, 0); BALL.w.set(0, 0, 0); ballEvents.push({ type: 'catch', v: rs }); return; }
    const e = s.hand ? 0.42 : 0.26; BALL.v.copy(s.v).addScaledVector(_rel, 1).addScaledVector(_n, -(1 + e) * vn); BALL.w.multiplyScalar(0.35); ballEvents.push({ type: s.hand ? 'glove' : 'body', v: rs });
  }
}
// --- simulasi per frame: substep adaptif ---
function ballUpdate(dt) {
  if (BALL.mode === 'rest') { syncBallMesh(); return; }
  if (BALL.mode === 'held') {
    BALL.heldT += dt; const s = KEEP.spheres.find(q => q.name === BALL.holder); if (s) { BALL.p.copy(s.p); BALL.p.y = Math.max(BALL_R, BALL.p.y - 0.02); }
    if (BALL.heldT > 1.6) { BALL.mode = 'fly'; BALL.v.set(0, -0.5, 0.6); }
    syncBallMesh(); return;
  }
  if (!shot.active) { syncBallMesh(); return; }
  shot.t += dt; const speed = BALL.v.length(), n = clamp(Math.ceil(dt * speed / 0.03), 1, 24), h = dt / n;
  for (let i = 0; i < n; i++) { shot.prevZ = BALL.p.z; ballStep(h); if (KEEP.rig) keeperCollide(); judgeStep(); if (BALL.mode === 'held') break; }
  shot.maxLateral = Math.max(shot.maxLateral, Math.abs(BALL.p.x)); syncBallMesh();
}
// --- penilaian: gol / disimpan / tiang / melebar / melambung ---
function judgeStep() {
  const p = BALL.p;
  if (!shot.crossed && shot.prevZ >= 0 && p.z < 0) {
    shot.crossed = true; shot.cx = p.x; shot.cy = p.y;
    if (Math.abs(p.x) < GOAL_W / 2 && p.y < GOAL_H) { setResult('goal'); }
    else if (!shot.result) setResult(shot.hitFrame ? 'post' : (p.y >= GOAL_H && Math.abs(p.x) < GOAL_W / 2 + 0.4 ? 'over' : 'wide'));
  }
  if (!shot.result && BALL.mode === 'held') setResult('saved');
  if (!shot.result && shot.touched && !shot.crossed && p.z > 0.4 && BALL.v.z > 0.5 && shot.t - shot.touchT > 0.25) setResult('saved');
  if (!shot.result && shot.hitFrame && !shot.crossed && p.z > 0.6 && BALL.v.z > 0.5) setResult('post');
  if (!shot.result && shot.t > 4.5) setResult(shot.touched ? 'saved' : shot.hitFrame ? 'post' : 'wide');
}
function setResult(r) { shot.result = r; shot.resultT = shot.t; }
// --- lintasan: cari kecepatan awal supaya bola lewat titik (tx,ty) di garis gawang ---
function simTraj(v0, w0, maxT) {
  const p = new THREE.Vector3(0, BALL_R, SPOT_Z), v = v0.clone(), w = w0.clone(), h = 1 / 240; let t = 0;
  while (t < (maxT || 1.5)) { const sp = v.length(); let ax = 0, ay = -GRAV, az = 0; const cd = sp > 14 ? 0.24 : lerp(0.45, 0.24, smooth((sp - 4) / 10)), kd = 0.5 * 1.2 * cd * 0.038 / BALL_M; ax -= kd * sp * v.x; ay -= kd * sp * v.y; az -= kd * sp * v.z; const S = w.length() * BALL_R / sp, f = S > 0.3 ? 0.3 / S : 1, km = 0.00583 * f; ax += km * (w.y * v.z - w.z * v.y); ay += km * (w.z * v.x - w.x * v.z); az += km * (w.x * v.y - w.y * v.x); const pz = p.z; v.x += ax * h; v.y += ay * h; v.z += az * h; p.x += v.x * h; p.y += v.y * h; p.z += v.z * h; t += h; if (p.z <= 0) { const f2 = pz / (pz - p.z); return { x: p.x - v.x * h * (1 - f2), y: Math.max(BALL_R, p.y - v.y * h * (1 - f2)), t }; } if (p.y < BALL_R && v.y < 0) { p.y = BALL_R; v.y *= -0.6; } }
  return { x: p.x, y: p.y, t };
}
function launchTowards(ax, ay, speed) {
  const dx = ax, dz = SPOT_Z, D = Math.hypot(dx, dz), t = D / (speed * 0.96), vy = (ay - BALL_R + 0.5 * GRAV * t * t) / t, vh = Math.sqrt(Math.max(speed * speed - vy * vy, 1));
  return new THREE.Vector3(vh * dx / D, vy, -vh * dz / D);
}
function solveShot(speed, tx, ty, spin) {   // spin = Vector3 (rad/s); mengembalikan kecepatan awal sehingga bola (termasuk lengkungan) melewati (tx, ty)
  let ax = tx, ay = ty, v = launchTowards(ax, ay, speed);
  for (let i = 0; i < 7; i++) { const r = simTraj(v, spin); const ex = tx - r.x, ey = ty - r.y; if (Math.abs(ex) < 0.015 && Math.abs(ey) < 0.015) break; ax += ex * 0.9; ay += ey * 0.9; v = launchTowards(ax, ay, speed); }
  return v;
}
function kickBall(vel, spin) { BALL.v.copy(vel); BALL.w.copy(spin); BALL.mode = 'fly'; shot.active = true; shot.t = 0; shot.speed = vel.length(); shot.prevZ = BALL.p.z; ballEvents.push({ type: 'kick', v: vel.length() }); }
