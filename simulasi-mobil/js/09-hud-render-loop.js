'use strict';
// ======================= HUD, KAMERA 3D, LOOP =======================
let hudKmh = -1, hudScore = -1, hudDist = -1, hudTime = -2;
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function updateLives() { let h = ''; for (let i = 0; i < 3; i++) h += `<span class="${i >= P.lives ? 'lost' : ''}">❤</span>`; $('lives').innerHTML = h; }
function updateTimerHud(force) { if (!timed) return; const s = Math.ceil(timeLeft); if (s === hudTime && !force) return; hudTime = s; const e = $('timerHud'); e.textContent = fmtTime(s); e.classList.toggle('low', s <= 20); }
// penunjuk tikungan di depan (±80 m): ▶ kanan, ◀ kiri; makin banyak panah = makin tajam
function updateCurveHud(s) {
  const e = $('curveHud'); if (!e) return; const k = TERR.amt ? terrK(s + 80) : 0, a = Math.abs(k), lvl = a < 0.0009 ? 0 : a < 0.002 ? 1 : 2;
  e.classList.toggle('hidden', !lvl); if (lvl) { const t = (k > 0 ? '▶' : '◀').repeat(lvl); if (e.textContent !== t) { e.textContent = t; e.dataset.l = lvl; } }
}
function updateHud() {
  if (state === 'play') updateCurveHud(P.dist);
  const kmh = Math.round(P.v * 3.6); if (kmh !== hudKmh) { hudKmh = kmh; $('kmh').textContent = kmh; }
  const sc = score(); if (sc !== hudScore) { hudScore = sc; $('score').textContent = sc; $('bestHud').textContent = 'TERBAIK ' + Math.max(best, sc); }
  const dm = Math.floor(P.dist / 10) * 10; if (dm !== hudDist) { hudDist = dm; $('distHud').textContent = dm >= 1000 ? (dm / 1000).toFixed(2) + ' km' : dm + ' m'; }
  $('wheel').style.transform = `rotate(${(input.steer * 100).toFixed(1)}deg)`;
  const th = input.throttle; $('gasFill').style.height = Math.max(0, th) * 50 + '%'; $('brkFill').style.height = Math.max(0, -th) * 50 + '%';
}
// kamera pengejar
const _hoodEye = new THREE.Vector3(0, 1.12, -1.7), camPos = new THREE.Vector3(0, 3, 8), camLook = new THREE.Vector3(0, 1, -12), tgtPos = new THREE.Vector3(), tgtLook = new THREE.Vector3();
function cycleView() { if (typeof race2P !== 'undefined' && race2P) { toast('Layar terbelah memakai sudut pandang belakang.', 1800); return; } setView((settings.view + 1) % 3); saveSettings(); toast('Sudut pandang: ' + VIEWS[settings.view], 1600); $('dash').classList.toggle('cockpit', settings.view === 1); }
const _fwd = new THREE.Vector3(), _eye = new THREE.Vector3(), _look = new THREE.Vector3();
function updateCamera(dt) {
  const asp = camera.aspect, back = asp < 0.8 ? 10.5 : 7.8, up = asp < 0.8 ? 3.6 : 2.7, t = performance.now() / 1000;
  if (state !== 'menu' && settings.view !== 0) {   // sudut pandang pengemudi / kap mesin: kamera menempel di mobil
    const g = playerCar.g; g.updateMatrixWorld(true); _eye.copy(settings.view === 1 ? cockpit.eye : _hoodEye).applyMatrix4(g.matrixWorld);
    _fwd.set(0, -0.03, -1).applyQuaternion(g.quaternion); const sw = (Math.random() - 0.5) * (shake * 0.04 + clamp((P.v - 35) / 40, 0, 1) * 0.004 + (P.off ? 0.012 : 0));
    camera.position.set(_eye.x + sw, _eye.y + sw * 0.6, _eye.z); _look.copy(camera.position).addScaledVector(_fwd, 10); _look.y -= 0.18 + P.v * 0.001;
    camera.up.set(Math.sin(-P.vl * 0.012), 1, 0).normalize(); camera.lookAt(_look); camPos.copy(camera.position);
    const fv = (settings.view === 1 ? 70 : 66) + clamp(P.v, 0, 70) * 0.25 + shake * 2; if (Math.abs(camera.fov - fv) > 0.05) { camera.fov += (fv - camera.fov) * 0.1; camera.updateProjectionMatrix(); } return;
  }
  camera.up.set(0, 1, 0);
  if (state === 'menu') { if (typeof garageOpen !== 'undefined' && garageOpen) { tgtPos.set(Math.sin(t * 0.45) * 5.6, 1.3, Math.cos(t * 0.45) * 5.6 + 1); tgtLook.set(0, -1.0, 0); } else { tgtPos.set(Math.sin(t * 0.3) * 4, 2.2, 8.5); tgtLook.set(0, 0.9, -4); } }   // garasi: kamera mengitari mobil, mobil di bagian atas layar
  else { tgtPos.set(P.x * 0.62, up + P.v * 0.006, back); tgtLook.set(P.x * 0.8 + Math.sin(-P.yaw) * 4, 1.0 + terrGrade(P.dist) * 9, -13); }
  const k = 1 - Math.exp(-dt * 6); camPos.lerp(tgtPos, k); camLook.lerp(tgtLook, k);
  shake = Math.max(0, shake - dt * 2); const hs = clamp((P.v - 40) / 30, 0, 1) * 0.02 + (P.off ? 0.05 : 0);
  camera.position.copy(camPos); camera.position.x += (Math.random() - 0.5) * (shake * 0.35 + hs); camera.position.y += (Math.random() - 0.5) * (shake * 0.25 + hs * 0.8);
  camera.lookAt(camLook); const fov = 58 + clamp(P.v, 0, 70) * 0.38 + shake * 3; if (Math.abs(camera.fov - fov) > 0.05) { camera.fov += (fov - camera.fov) * 0.08; camera.updateProjectionMatrix(); }
}
function update(dt) {
  if (raceActive()) { raceUpdate(dt); return; }
  elapsed += dt; let d = 0;
  if (state === 'play') {
    updateManualInput(dt); updateTiltInput(); camTick(dt); d = updateDrive(dt); scrollWorld(d); updateTraffic(dt, true); updateEvents(dt);
    if (timed) { timeLeft -= dt; updateTimerHud(); if (timeLeft <= 0) { timeLeft = 0; updateTimerHud(true); say('WAKTU HABIS!', '#ffd23f'); gameOver(true); } }
    engineSet(P.v, input.throttle, P.vl, P.braking);
  } else if (state === 'dying') {
    P.v = Math.max(0, P.v - 24 * dt); d = P.v * dt; scrollWorld(d); P.x += P.vl * dt * 0.5; P.yaw += dt * 3; updateTraffic(dt, false); engineSet(P.v, 0, 0); dieT -= dt; if (dieT <= 0) gameOver(false);
  } else if (state === 'count') {
    updateManualInput(dt); updateTiltInput(); P.v = Math.min(P.v + 4 * dt, 6); d = P.v * dt; scrollWorld(d); updateTraffic(dt, false); engineSet(P.v, 0.4, 0);
    cdT -= dt; const n = Math.ceil(cdT - 0.5); if (n !== cdShown && n >= 0) { cdShown = n; const c = $('count'); if (n > 0) { show('count', true); c.textContent = n; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(); } else show('count', false); } if (cdT <= 0.5) beginPlay();
  } else if (state === 'calib') { updateManualInput(dt); if (useTilt) tiltCalibStep(); engineSet(0, 0, 0); }
  else if (state === 'menu') { P.v = 12; d = P.v * dt; scrollWorld(d); updateTraffic(dt, false); }
  updateParts(dt, d); updatePlayerVisual(dt); updateCockpit(); updateCamera(dt); if (state !== 'menu') updateHud();
}
function renderMirror() {   // kaca spion tengah: render pandangan belakang ke tekstur kecil (tiap 2 frame, hanya di tampilan pengemudi)
  if (!cockpit || settings.view !== 1 || state === 'menu' || state === 'paused') return; if (!GFXC.mirror || (cockpit.frame++ % GFXC.mirror) !== 0) return;
  const g = playerCar.g, vis = g.visible; g.visible = false; mirrorCam.position.set(P.x, 1.35, 0); mirrorCam.lookAt(P.x - P.vl * 0.15, 1.15, 60); renderer.setRenderTarget(mirrorRT); mirrorBegin(), renderer.render(scene, mirrorCam), mirrorEnd(); renderer.setRenderTarget(null); g.visible = vis;
}
function updateCockpit() {
  if (!cockpit || settings.view !== 1) return; const h = raceActive() ? race.humans[0] : null, st = h ? h.steer : input.steer, sp = h ? h.v : P.v; cockpit.spin.rotation.z = -st * 1.5;
  if ((cockpit.frame & 3) === 0) drawCluster(sp * 3.6, st > 0.25 ? 1 : st < -0.25 ? -1 : 0, Math.floor(elapsed * 2.5) % 2 === 0);
}
let last = performance.now(), dtS = 1 / 60, fpsAcc = 0, fpsN = 0, resScale = 1; let maxPR = Math.min(devicePixelRatio || 1, GFXC.pr);
function setMaxPR(m) { maxPR = Math.min(devicePixelRatio || 1, m); renderer.setPixelRatio(maxPR * resScale); resize(); }
// governor FPS: tiap ±2 dtk. Terlalu lambat → turunkan resolusi dulu (sampai 0.7×), lalu tingkat grafis (resolusi dikembalikan 0.85×). Stabil cepat → naikkan lagi.
const GOV = { bad: 0, good: 0 };
function adaptRes(avg) {
  if (avg > 0.024) { GOV.bad++; GOV.good = 0; } else if (avg < 0.0175) { GOV.good++; GOV.bad = 0; } else { GOV.bad = Math.max(0, GOV.bad - 1); GOV.good = Math.max(0, GOV.good - 1); }
  if (GOV.bad >= 2) {
    GOV.bad = 0;
    if (resScale > 0.71) { resScale = Math.max(0.7, resScale - 0.15); renderer.setPixelRatio(maxPR * resScale); resize(); }
    else if (settings.gfxAuto && gfxNow > 0) { resScale = 0.85; applyGfxLevel(gfxNow - 1); toast('Performa berat — grafis diturunkan otomatis ke ' + GFXC.label + '.', 3500); }
    else if (resScale > 0.6) { resScale = 0.6; renderer.setPixelRatio(maxPR * resScale); resize(); }
  } else if (GOV.good >= 5) {
    GOV.good = 0;
    if (resScale < 1) { resScale = Math.min(1, resScale + 0.1); renderer.setPixelRatio(maxPR * resScale); resize(); }
    else if (settings.gfxAuto && gfxNow < settings.gfx) { applyGfxLevel(gfxNow + 1, true); }
  }
}
let LODREG = null, LODN = -1;
function sceneryLod() {
  if (!LODREG || LODN !== scen.length) { LODREG = []; LODN = scen.length; for (const s of scen) { const lp = s.o.userData.lodParts; if (lp) lp.forEach(([obj, d]) => LODREG.push([s, obj, d])); } }
  for (const [s, obj, d] of LODREG) if (s.o.visible) obj.visible = s.o.position.z > -d;
}
// ---- statistik performa (tekan F3) ----
const perfEl = document.createElement('pre'); perfEl.id = 'perfHud'; perfEl.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:30;margin:0;padding:6px 8px;background:rgba(0,0,0,.6);color:#9fff9f;font:11px/1.35 ui-monospace,Menlo,monospace;border-radius:6px;pointer-events:none;display:none;white-space:pre'; document.body.appendChild(perfEl);
let perfOn = false, perfT = 0, fpsSm = 60; addEventListener('keydown', e => { if (e.key === 'F3') { perfOn = !perfOn; perfEl.style.display = perfOn ? 'block' : 'none'; e.preventDefault(); } });
function perfUpdate(raw) { fpsSm += (1 / Math.max(raw, 0.001) - fpsSm) * 0.05; if (!perfOn) return; perfT -= raw; if (perfT > 0) return; perfT = 0.4; const I = renderer.info, vis = scen.reduce((a, s) => a + (s.o.visible ? 1 : 0), 0); perfEl.textContent = `FPS ${fpsSm.toFixed(0)}  (${(1000 / Math.max(fpsSm, 1)).toFixed(1)} ms)\ngrafis ${GFXC.label}${settings.gfxAuto ? ' (otomatis)' : ''} · resolusi ${(resScale * 100) | 0}% · PR ${(maxPR * resScale).toFixed(2)}\ndraw call ${I.render.calls}  segitiga ${(I.render.triangles / 1000).toFixed(0)}k\ngeometri ${I.memory.geometries}  tekstur ${I.memory.textures}\nbayangan ${SH.on ? GFXC.shadow : 'mati'} · peta ${MAP.id} · objek pemandangan ${vis}\nlalu lintas ${traffic.length} · suara ${VS.voices.filter(v => v.car).length}`; }
function frame(now) {
  const raw = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; dtS += (raw - dtS) * 0.35; const dt = Math.min(0.05, dtS);
  fpsAcc += raw; fpsN++; if (fpsAcc > 2) { adaptRes(fpsAcc / fpsN); fpsAcc = 0; fpsN = 0; }
  renderer.info.reset(); detectPose(now); if (state !== 'paused') update(dt); sceneryLod(); if (raceActive() && state !== 'menu') renderRace(); else { setBend(state === 'menu' ? elapsed * 12 : P.dist, 0); shadowFollow(0, 0); rainAt(camera); renderMirror(); renderer.render(scene, camera); }
  if (state !== 'play') sirenMute();
  try { carFxFrame(raw); } catch (e) { window.__fxErr = e; } try { ambFrame(raw, state === 'play' || state === 'count'); } catch (e) {} perfUpdate(raw); mapFrame(raw); if (raceActive()) vsMute(); else vehicleSoundFrame(raw);
  weatherFrame(raw, raceActive() ? race.humans[0].v : P.v); requestAnimationFrame(frame);
}
resize(); focusWorld(0); toMenu(); camera.position.copy(camPos);
try { renderer.compile(scene, camera); renderer.render(scene, camera); } catch (e) {}
requestAnimationFrame(frame);
