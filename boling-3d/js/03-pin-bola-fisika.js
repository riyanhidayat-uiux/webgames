'use strict';
// ======================= PIN, BOLA, FISIKA =======================
const PIN_PROFILE = [[0, 0], [1.12, 0], [1.45, 0.4], [1.95, 1.5], [2.38, 2.9], [2.1, 4.5], [1.6, 5.5], [1.2, 6.5], [0.95, 7.6], [0.9, 8.7], [1.25, 10], [1.6, 11.2], [1.75, 12.2], [1.6, 13.2], [1.1, 14.2], [0.5, 15], [0, 15]];
const PS = PIN_H / 15;
const pinGeo = new THREE.LatheGeometry(PIN_PROFILE.map(([r, y]) => new THREE.Vector2(r * PS, y * PS)), 22);
const pinMat = new THREE.MeshStandardMaterial({ color: 0xfaf7f0, roughness: 0.28, metalness: 0.02 }), stripeMat = new THREE.MeshStandardMaterial({ color: 0xd8222a, roughness: 0.4 });
const pins = PIN_SPOTS.map((s, i) => {
  const g = new THREE.Group(), body = new THREE.Mesh(pinGeo, pinMat); g.add(body);
  [[10.15, 1.3], [11.05, 1.55]].forEach(([y, r]) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * PS + 0.002, r * PS + 0.002, 0.42 * PS, 18, 1, true), stripeMat); b.position.y = y * PS; g.add(b); });
  scene.add(g);
  return { id: i + 1, hx: s.x, hz: s.z, x: s.x, z: s.z, y: 0, vx: 0, vz: 0, vy: 0, down: false, out: false, gone: false, fallT: 0, dx: 0, dz: -1, wob: 0, mesh: g, blob: makeBlob(0.5) };
});
function resetPins() { pins.forEach(p => { Object.assign(p, { x: p.hx, z: p.hz, y: 0, vx: 0, vz: 0, vy: 0, down: false, out: false, gone: false, fallT: 0, wob: 0 }); p.mesh.visible = true; p.mesh.quaternion.identity(); p.blob.visible = true; }); }
const standingPins = () => pins.filter(p => !p.down && !p.out && !p.gone);
function sweepPins() { pins.forEach(p => { if (p.down || p.out) { p.gone = true; p.mesh.visible = false; p.blob.visible = false; p.vx = p.vz = 0; } }); }

// --- bola ---
const ballG = new THREE.Group(), ballM = new THREE.Group(); ballG.add(ballM); scene.add(ballG);
const ballBlob = makeBlob(0.95);
let ballBody = null;
function setBallStyle(i) {
  const B = BALLS[i % BALLS.length]; while (ballM.children.length) ballM.remove(ballM.children[0]);
  const c = mkCanvas(256, 128), x = c.getContext('2d'), css = n => '#' + n.toString(16).padStart(6, '0'); x.fillStyle = css(B.c); x.fillRect(0, 0, 256, 128);
  for (let k = 0; k < 26; k++) { x.strokeStyle = k % 2 ? css(B.c2) : 'rgba(0,0,0,.35)'; x.globalAlpha = 0.5; x.lineWidth = rr(3, 12); x.beginPath(); const y0 = rr(0, 128); x.moveTo(0, y0); x.bezierCurveTo(80, y0 + rr(-40, 40), 170, y0 + rr(-40, 40), 256, y0 + rr(-30, 30)); x.stroke(); }
  x.globalAlpha = 1; ballBody = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 36, 26), new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.12, metalness: 0.25 })); ballM.add(ballBody);
  [[-0.26, 0.9, 0.34], [0.06, 0.95, 0.3], [-0.1, 0.83, 0.55]].forEach(([a, b, d]) => { const h = new THREE.Mesh(new THREE.CircleGeometry(0.03, 14), new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide })); const v = new THREE.Vector3(a, b, d).normalize(); h.position.copy(v.clone().multiplyScalar(BALL_R * 1.003)); h.lookAt(v.clone().multiplyScalar(5)); ballM.add(h); });
}
const ball = { x: 0, z: Z_START, y: BALL_R, vx: 0, vz: 0, spin: 0, active: false, gut: false, gutSide: 0, hits: 0, t: 0 };
function placeBall(x) { ball.x = x; ball.z = Z_START; ball.y = BALL_R; ball.vx = ball.vz = 0; ball.active = false; ball.gut = false; ballG.visible = true; ballG.position.set(x, BALL_R, Z_START); }
function launchBall(x, angle, spin, speed) { Object.assign(ball, { x, z: Z_START, y: BALL_R, vx: Math.sin(angle) * speed, vz: -Math.cos(angle) * speed, spin, active: true, gut: false, hits: 0, t: 0 }); }
const _ax = new THREE.Vector3(), _q = new THREE.Quaternion();
function rollVisual(dx, dz) { const d = Math.hypot(dx, dz); if (d < 1e-5) return; _ax.set(dz / d, 0, -dx / d); _q.setFromAxisAngle(_ax, d / BALL_R); ballM.quaternion.premultiply(_q); }

function knock(p, dx, dz, sp) {
  if (p.down) return; p.down = true; p.fallT = 0; const l = Math.hypot(dx, dz) || 1; p.dx = dx / l; p.dz = dz / l; if (l < 1e-6) { p.dx = rr(-1, 1); p.dz = -1; }
  p.vy = Math.min(3.2, sp * 0.14 + 0.3); onPinHit(sp);
}
let hitEvents = [];
function onPinHit(sp) { hitEvents.push(sp); }
function stepBall(dt) {
  if (!ball.active) return;
  ball.t += dt;
  if (!ball.gut) {
    const k = clamp((-ball.z - 8) / 9, 0, 1); ball.vx += ball.spin * PHYS.hook * k * dt;
    if (Math.abs(ball.x) > LANE_W / 2 - 0.02 && ball.z < Z_START - 0.2) { ball.gut = true; ball.gutSide = Math.sign(ball.x); ball.vx = 0; onGutter(); }
  }
  if (ball.gut) { const tx = ball.gutSide * (LANE_W / 2 + GUT_W / 2); ball.x += (tx - ball.x) * Math.min(1, dt * 9); ball.y = lerp(ball.y, BALL_R - 0.19, Math.min(1, dt * 9)); } else ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  if (!ball.gut) {
    for (const p of pins) {
      if (p.gone || p.out) continue; const dx = p.x - ball.x, dz = p.z - ball.z, d = Math.hypot(dx, dz), mn = BALL_R + PIN_R;
      if (d < mn && d > 1e-6) {
        const nx = dx / d, nz = dz / d, rv = (p.vx - ball.vx) * nx + (p.vz - ball.vz) * nz;
        if (rv < 0) { const e = PHYS.eBall, mb = PHYS.mb, mp = PHYS.mp, j = -(1 + e) * rv / (1 / mb + 1 / mp); p.vx += j / mp * nx; p.vz += j / mp * nz; ball.vx -= j / mb * nx; ball.vz -= j / mb * nz; ball.hits++; knock(p, nx, nz, Math.hypot(p.vx, p.vz)); }
        const ov = mn - d; p.x += nx * ov * 0.8; p.z += nz * ov * 0.8; ball.x -= nx * ov * 0.2; ball.z -= nz * ov * 0.2;
      }
    }
  }
  if (ball.z < Z_PIT) { ball.y = lerp(ball.y, -0.4, Math.min(1, dt * 6)); }
  if (ball.z < Z_BACK + 0.25) { ball.active = false; ballG.visible = false; }
  const sp = Math.hypot(ball.vx, ball.vz); if (sp < 1.2 && !ball.gut && ball.z > Z_PIT) { ball.active = false; }
}
function pinSpeed(p) { return Math.hypot(p.vx, p.vz); }
const PHYS = { eBall: 0.7, mb: 7, mp: 1.5, drag: 1.5, ePin: 0.8, knock: 0.3, reach: 1.08, lying: 1.8, hook: 3.6 };   // setelan fisika (disetel lewat simulasi)
const rad = p => p.down ? PIN_R * PHYS.lying : PIN_R;
function stepPins(dt) {
  for (const p of pins) {
    if (p.gone) continue;
    if (p.down || p.out) {
      p.x += p.vx * dt; p.z += p.vz * dt; const dr = Math.exp(-PHYS.drag * dt); p.vx *= dr; p.vz *= dr;
      p.vy -= 22 * dt; p.y += p.vy * dt; if (p.y < 0 && !p.out) { p.y = 0; p.vy = 0; }
      if (!p.out && (Math.abs(p.x) > LANE_W / 2 + 0.1 || p.z < Z_PIT)) { p.out = true; p.vy = Math.max(p.vy, 0.5); p.vx *= 0.5; }
      if (p.out && p.y < -1.2) { p.gone = true; p.mesh.visible = false; p.blob.visible = false; }
    }
  }
  for (let i = 0; i < pins.length; i++) for (let j = i + 1; j < pins.length; j++) {
    const a = pins[i], b = pins[j]; if (a.gone || b.gone || a.out || b.out) continue;
    const aM = a.down && pinSpeed(a) > 0.05, bM = b.down && pinSpeed(b) > 0.05; if (!aM && !bM) continue;
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz), mn = (rad(a) + rad(b)) * PHYS.reach; if (d >= mn || d < 1e-6) continue;
    const nx = dx / d, nz = dz / d, rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz; if (rv >= 0) continue;
    const e = PHYS.ePin, j2 = -(1 + e) * rv / 2, imp = -rv;
    if (!a.down && imp > PHYS.knock) knock(a, -nx, -nz, imp); if (!b.down && imp > PHYS.knock) knock(b, nx, nz, imp);
    if (a.down || imp > PHYS.knock) { a.vx -= j2 * nx; a.vz -= j2 * nz; } if (b.down || imp > PHYS.knock) { b.vx += j2 * nx; b.vz += j2 * nz; }
    if (!a.down && imp <= PHYS.knock) a.wob = 0.35; if (!b.down && imp <= PHYS.knock) b.wob = 0.35;
    const ov = (mn - d) / 2; if (a.down) { a.x -= nx * ov; a.z -= nz * ov; } if (b.down) { b.x += nx * ov; b.z += nz * ov; }
  }
}
function physicsStep(dt) { const n = Math.ceil(dt / (1 / 180)), h = dt / n; for (let i = 0; i < n; i++) { stepBall(h); stepPins(h); } }
const _pa = new THREE.Vector3(), _pq = new THREE.Quaternion();
function pinVisuals(dt, t) {
  for (const p of pins) {
    if (p.gone) continue;
    if (p.down) { p.fallT = Math.min(1, p.fallT + dt / 0.38); const ang = Math.sin(p.fallT * Math.PI / 2) * (Math.PI / 2 * 0.97); _pa.set(p.dz, 0, -p.dx).normalize(); _pq.setFromAxisAngle(_pa, ang); p.mesh.quaternion.copy(_pq); p.mesh.position.set(p.x, p.y + Math.sin(ang) * PIN_R, p.z); }
    else { p.wob = Math.max(0, p.wob - dt * 1.4); const w = Math.sin(t * 26) * p.wob * 0.12; p.mesh.rotation.set(w, 0, w * 0.7); p.mesh.position.set(p.x, 0, p.z); }
    p.blob.position.set(p.x, 0.006, p.z); p.blob.scale.setScalar(p.down ? 0.7 : 0.45); p.blob.visible = !p.out;
  }
  if (ballG.visible) { ballG.position.set(ball.x, ball.y, ball.z); ballBlob.position.set(ball.x, 0.006, ball.z); ballBlob.visible = ball.y > 0 && !ball.gut; } else ballBlob.visible = false;
}
const pinsMoving = () => pins.some(p => !p.gone && !p.out && p.down && pinSpeed(p) > 0.15);
setBallStyle(settings.ball);
