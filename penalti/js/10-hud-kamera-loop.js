'use strict';
// ======================= KAMERA SINEMATIK, HUD, LOOP =======================
const camPos = new THREE.Vector3(0, 1.85, 18.2), camLook = new THREE.Vector3(0, 1.15, 0), tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3(); let camFov = 38;
function updateCamera(dt) {
  let fov = 38, k = 4;
  if (state === 'menu' || !A) { const t = elapsed * 0.12; tgtPos.set(Math.sin(t) * 5, 1.9, 17.5 + Math.cos(t) * 1.5); tgtLook.set(0, 1.1, 2); }
  else if (state === 'replay') { const f = replayData[Math.min(replayData.length - 1, Math.floor(repT / (replayData[replayData.length - 1].t || 1) * replayData.length))] || replayData[0]; const side = A.role === 'kick' ? 1 : -1; tgtPos.set(side * 8.5, 1.05, 4.5); tgtLook.set(BALL.p.x * 0.6, 0.9 + BALL.p.y * 0.2, BALL.p.z * 0.5 + 0.5); fov = 34; k = 6; }
  else if (A.role === 'kick') {
    const b = A.phase === 'flight' || A.phase === 'done' ? smooth((A.flightT - 0.3) / 0.9) : 0;
    if (A.phase === 'ready') { tgtPos.set(0.4, 2.15, SPOT_Z + 8.6); tgtLook.set(0, 1.05, 0); fov = 34; }
    else if (A.phase === 'approach') { tgtPos.set(0.3, 2.1, SPOT_Z + 8.2); tgtLook.set(0, 1.05, 0); fov = 33; }
    else { const sd = BALL.p.x < 0 ? -1 : 1; tgtPos.set(lerp(0, sd * 6.5, b), lerp(1.8, 1.35, b), lerp(SPOT_Z + 8.2, 5.5, b)); tgtLook.set(lerp(0, BALL.p.x * 0.5, b), lerp(1.1, 0.9, b), lerp(0, BALL.p.z * 0.35, b)); fov = lerp(33, 34, b); k = 5; }
  } else {
    if (A.phase === 'flight' || A.phase === 'done') { const b = smooth((A.flightT - 0.5) / 0.9); tgtPos.set(lerp(0, 6.0, b), lerp(2.4, 1.5, b), lerp(-3.8, 5.5, b)); tgtLook.set(lerp(BALL.p.x * 0.3, 0.5, b), 1.0, lerp(Math.min(BALL.p.z, 9) * 0.8 + 1, 0.5, b)); fov = 38; k = 6; }
    else { tgtPos.set(0, 2.4, -3.8); tgtLook.set(0, 0.95, 9); fov = 41; }
  }
  const kk = 1 - Math.exp(-dt * k); camPos.lerp(tgtPos, kk); camLook.lerp(tgtLook, kk); camFov += (fov - camFov) * 0.1; shake = Math.max(0, shake - dt * 2.4);
  camera.position.copy(camPos); if (shake > 0) { camera.position.x += (Math.random() - 0.5) * shake * 0.12; camera.position.y += (Math.random() - 0.5) * shake * 0.09; } camera.lookAt(camLook);
  if (Math.abs(camera.fov - camFov) > 0.02) { camera.fov = camFov; camera.updateProjectionMatrix(); }
}
const _rp = new THREE.Vector3();
function updateReticle() {
  const show_ = state === 'ready' && A && A.role === 'kick' && AIM.show; $('reticle').classList.toggle('hidden', !show_); if (!show_) return;
  _rp.set(AIM.x, AIM.y, 0).project(camera); const r = $('reticle'); r.style.left = ((_rp.x * 0.5 + 0.5) * innerWidth) + 'px'; r.style.top = ((-_rp.y * 0.5 + 0.5) * innerHeight) + 'px';
}
function update(dt) {
  elapsed += dt; updateNet(dt); crowdMat.uniforms.uTime.value = elapsed; excite = Math.max(state === 'menu' ? 0.12 : 0.18, excite - dt * 0.22); crowdMat.uniforms.uExc.value = excite; crowdSet(excite);
  if (state === 'menu') { keeperUpdate(dt, -1, 1); }
  else if (state === 'calib') { keeperUpdate(dt, -1, 1); }
  else if (state === 'replay') { replayUpdate(dt); }
  else if (A && (state === 'ready')) { flowUpdate(dt); }
  updateCharge(dt); updateCamera(dt); updateReticle();
  if (A && state === 'ready' && A.phase === 'ready' && !useCam && A.role === 'kick') $('help').classList.remove('hidden');
}
let last = performance.now(), dtS = 1 / 60, fpsAcc = 0, fpsN = 0, resScale = 1; const maxPR = Math.min(devicePixelRatio || 1, 2);
function adaptRes(avg) { let n = resScale; if (avg > 0.026 && resScale > 0.6) n = Math.max(0.6, resScale - 0.15); else if (avg < 0.02 && resScale < 1) n = Math.min(1, resScale + 0.1); if (n !== resScale) { resScale = n; renderer.setPixelRatio(maxPR * resScale); resize(); } }
function frame(now) {
  const raw = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; dtS += (raw - dtS) * 0.35; const dt = Math.min(0.05, dtS);
  fpsAcc += raw; fpsN++; if (fpsAcc > 2) { adaptRes(fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
  detectPose(now); if (state !== 'paused') update(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
}
resize(); toMenu(); camera.position.copy(camPos);
try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (e) {}
requestAnimationFrame(frame);
