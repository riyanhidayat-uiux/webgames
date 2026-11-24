'use strict';
// ======================= KAMERA 3D, EFEK, LOOP =======================
const camPos = new THREE.Vector3(0, 1.4, 5), camLook = new THREE.Vector3(0, 0.3, -12), tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3();
const _aimPos = new THREE.Vector3(), _aimLook = new THREE.Vector3();
let shake = 0, conf = [], fxDirty = false, dtS = 1 / 60, fpsAcc = 0, fpsN = 0, resScale = 1; const maxPR = Math.min(devicePixelRatio || 1, 2);
const smooth01 = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const fctx = $('fx').getContext('2d');
// garis bidik
const aimGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]);
const aimLine = new THREE.Line(aimGeo, new THREE.LineDashedMaterial({ color: 0xffd23f, dashSize: 0.4, gapSize: 0.3, transparent: true, opacity: 0.8 })); aimLine.frustumCulled = false; scene.add(aimLine);
function updateAim() {
  const vis = settings.assist && state === 'ready'; aimLine.visible = vis; if (!vis) return;
  const a = aimGeo.attributes.position, L = 26; a.setXYZ(0, ballVisX, 0.03, Z_START - 0.4); a.setXYZ(1, ballVisX + Math.tan(aimAngle) * L, 0.03, Z_START - L); a.needsUpdate = true; aimLine.computeLineDistances();
}
function confettiBurst(n) { for (let i = 0; i < n; i++) conf.push({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 900, vy: -Math.random() * 700 - 100, c: ['#ff4aa8', '#ffd24a', '#4aa8ff', '#7fffd0'][i % 4], life: 1.4, s: 6 + Math.random() * 7 }); }
function drawFx(dt) {
  if (!conf.length) { if (fxDirty) { fctx.clearRect(0, 0, innerWidth, innerHeight); fxDirty = false; } return; }
  fxDirty = true; fctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const c of conf) { c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 1100 * dt; if (c.life > 0) { fctx.globalAlpha = Math.min(1, c.life * 2); fctx.fillStyle = c.c; fctx.fillRect(c.x, c.y, c.s, c.s * 0.6); } }
  conf = conf.filter(c => c.life > 0); fctx.globalAlpha = 1;
}
function updateCamera(dt) {
  const asp = camera.aspect, back = asp < 0.8 ? 4.2 : 3.4, up = asp < 0.8 ? 1.9 : 1.45;
  if (state === 'roll' || state === 'resolve') {
    const s = state === 'resolve' ? 1 : smooth01((-ball.z - 9) / 7);       // peralihan halus dari kamera pengikut ke kamera pin
    tgtPos.set(lerp(ball.x * 0.5, ball.x * 0.12, s), lerp(up + 0.1, 1.25, s), lerp(Math.min(Z_START + back, ball.z + back), -18.9, s)); tgtLook.set(lerp(ball.x * 0.4, 0, s), lerp(0.3, 0.32, s), lerp(ball.z - 12, -24.7, s));
    if (state === 'resolve' && resolveT < 0.7) { const r = smooth01(1 - resolveT / 0.7); tgtPos.lerp(_aimPos.set(0, up, Z_START + back), r); tgtLook.lerp(_aimLook.set(0, 0.3, -12), r); }
  } else { tgtPos.set(ballVisX * 0.55, up, Z_START + back); tgtLook.set(ballVisX * 0.3, 0.3, -12); }
  const k = 1 - Math.exp(-dt * (state === 'roll' ? 7 : 3.2)); camPos.lerp(tgtPos, k); camLook.lerp(tgtLook, k);
  shake = Math.max(0, shake - dt * 2.2); camera.position.copy(camPos); if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.18; camera.position.y += (Math.random() - 0.5) * shake * 0.12; }
  camera.lookAt(camLook);
}
function updateRoll(dt) {
  const px = ball.x, pz = ball.z; physicsStep(dt); if (ballG.visible) rollVisual(ball.x - px, ball.z - pz);
  sfx.rollSet(ball.active ? (ball.gut ? Math.abs(ball.vz) * 0.5 : Math.hypot(ball.vx, ball.vz)) : 0);
  if (hitEvents.length) { sfx.crash(hitEvents.length, Math.max(...hitEvents)); hitEvents = []; }
  if (!ball.active && !pinsMoving()) { settleT += dt; if (settleT > 0.8) endRoll(); } else settleT = 0;
  if (elapsed - rollStartT > 9) endRoll();
}
function update(dt) {
  elapsed += dt;
  if (state === 'ready' || state === 'swing' || state === 'calib') { updateKeyboardAim(dt); ballVisX += (aimX - ballVisX) * (1 - Math.exp(-dt * 16)); ball.x = ballVisX; ballG.position.set(ballVisX, BALL_R, Z_START); ballBlob.position.set(ballVisX, 0.006, Z_START); ballBlob.visible = true; ballG.visible = true; }
  if (state === 'roll') updateRoll(dt);
  else if (state === 'resolve') { physicsStep(dt); resolveT -= dt; if (resolveT <= 0) nextTurn(); }
  updateAim(); pinVisuals(dt, elapsed); updateCamera(dt);
}
function adaptRes(avg) {   // resolusi dinamis: turun saat berat, naik lagi saat ringan
  let n = resScale; if (avg > 0.024 && resScale > 0.6) n = Math.max(0.6, resScale - 0.15); else if (avg < 0.0185 && resScale < 1) n = Math.min(1, resScale + 0.1);
  if (n !== resScale) { resScale = n; renderer.setPixelRatio(maxPR * resScale); resize(); }
}
let last = performance.now();
function frame(now) {
  const raw = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
  dtS += (raw - dtS) * 0.35; const dt = Math.min(0.05, dtS);          // dt dihaluskan agar gerak tidak bergetar
  fpsAcc += raw; fpsN++; if (fpsAcc > 2) { adaptRes(fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
  detectPose(now); if (state !== 'paused') update(dt); drawFx(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
}
resize(); setVersus(false); toMenu(); camera.position.copy(camPos);
try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (e) {}      // siapkan shader & tekstur sebelum main
requestAnimationFrame(frame);
