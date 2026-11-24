'use strict';
// ======================= MODE BALAPAN (1 atau 2 pemain, layar terbelah) =======================
const RV_CRUISE = 38, RV_MAX = 64, RV_MIN = 8, RACE_LENS = [1500, 3000, 5000];
const RDIFF = [{ n: '😊 Mudah', base: 46 }, { n: '😎 Normal', base: 54 }, { n: '🔥 Sulit', base: 60 }];
const AI_NAMES = ['Budi', 'Sari', 'Raka', 'Dewi'], AI_COLORS = [0xe87a1e, 0x2a9a4a, 0x7a3ad8, 0xf0f0f0], P_COLORS = ['#ffb35a', '#6fc8ff', '#ff8a8a', '#9aff8a', '#ffe36a'];
let race = null, race2P = false, raceObjs = [];
const raceActive = () => !!race;
const fmtRT = t => { t = Math.max(0, t); const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
// --- lintasan: garis start/finis (gantri bertulisan), ubin kotak-kotak, bantalan nitro ---
const checkTex = (() => { const c = mkCanvas(128, 32), x = c.getContext('2d'); for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 8, j * 8, 8, 8); } return mkTex(c); })();
function bannerTex(text) { const c = mkCanvas(512, 96), x = c.getContext('2d'); for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 8, j * 8, 8, 8); x.fillRect(i * 8, 80 + j * 8, 8, 8); } x.fillStyle = '#1a2a6a'; x.fillRect(0, 16, 512, 64); x.fillStyle = '#ffd23f'; x.font = 'bold 54px Impact,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 50); return mkTex(c); }
const padTex = (() => { const c = mkCanvas(128, 256), x = c.getContext('2d'); x.fillStyle = '#0a1a3a'; x.fillRect(0, 0, 128, 256); x.fillStyle = '#ffd23f'; for (let k = 0; k < 4; k++) { const y = 30 + k * 58; x.beginPath(); x.moveTo(64, y); x.lineTo(118, y + 34); x.lineTo(118, y + 52); x.lineTo(64, y + 18); x.lineTo(10, y + 52); x.lineTo(10, y + 34); x.closePath(); x.fill(); } x.strokeStyle = '#7fd0ff'; x.lineWidth = 6; x.strokeRect(3, 3, 122, 250); return mkTex(c); })();
function clearRaceTrack() { raceObjs.forEach(o => scene.remove(o)); raceObjs = []; }
function buildRaceTrack(len) {
  clearRaceTrack(); const pads = [];
  const gantry = (z, text) => { const g = new THREE.Group(); [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 7.2, 8), poleMat); p.position.set(sd * 7.4, 3.6, 0); g.add(p); }); const b = new THREE.Mesh(new THREE.BoxGeometry(15.4, 1.5, 0.4), new THREE.MeshStandardMaterial({ map: bannerTex(text), emissive: 0x222222 })); b.position.y = 6.8; g.add(b); const st = new THREE.Mesh(new THREE.PlaneGeometry(PAVED * 2, 2.4), new THREE.MeshBasicMaterial({ map: rep(checkTex.clone(), 6, 1) })); st.rotation.x = -Math.PI / 2; st.position.y = 0.025; g.add(st); g.position.z = z; scene.add(g); raceObjs.push(g); };
  gantry(0, 'START'); gantry(-len, 'FINISH');
  for (let s = 260; s < len - 200; s += 300 + Math.random() * 80) { const lane = (Math.random() * 3) | 0, m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 7), new THREE.MeshBasicMaterial({ map: padTex, transparent: true, opacity: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.set(LANE_X[lane], 0.03, -s); scene.add(m); raceObjs.push(m); pads.push({ s, x: LANE_X[lane], m }); }
  return pads;
}
// --- persiapan balapan ---
function mkRC(id, human, name, car, slot) {
  return { id, human, name, car, s: -(3 + slot[1] * 9.5), x: LANE_X[slot[0]], v: 0, vl: 0, yaw: 0, thr: 0, steer: 0, boostT: 0, padCool: 0, draft: 0, bumpT: 0, finished: false, finishT: 0, rank: 0, vTop: 0, braking: false, off: false, targetX: LANE_X[slot[0]], cool: rr(1, 3), aiBase: 40, wob: rr(0, 6) };
}
function setupRace() {
  terrSeed((Math.random() * 1e9) | 0); terrSetup();
  traffic.forEach(c => scene.remove(c.g)); traffic.length = 0; clearRaceTrack(); if (typeof damageClear === 'function') damageClear();
  race2P = settings.players === 2; const nAI = race2P ? 2 : 3, D = RDIFF[settings.rdiff], len = RACE_LENS[settings.rlen]; if (!playerCar) buildPlayer(); setView(race2P ? 0 : settings.view); $('dash').classList.remove('cockpit');
  const slots = race2P ? [[0, 0], [2, 0], [1, 0], [1, 1]] : [[1, 0], [0, 0], [2, 0], [1, 1]], cars = [], humans = [];
  const p1 = mkRC(0, 0, race2P ? 'P1' : 'KAMU', playerCar, slots[0]); cars.push(p1); humans.push(p1); scene.add(playerCar.g);
  if (race2P) { const c2 = makeCar('sedan', CAR_COLORS[(settings.carc + 2) % FREE_COLORS].c, true); scene.add(c2.g); const p2 = mkRC(1, 1, 'P2', c2, slots[1]); cars.push(p2); humans.push(p2); }
  for (let i = 0; i < nAI; i++) { const c = makeCar(pick(['sedan', 'sedan', 'hatch']), AI_COLORS[i], true); scene.add(c.g); const rc = mkRC(cars.length, -1, AI_NAMES[i], c, slots[cars.length]); rc.aiBase = D.base + rr(-2.5, 2.5); cars.push(rc); }
  cars.forEach(rc => { rc.car.g.visible = true; rc.car.g.rotation.set(0, 0, 0); });
  race = { len, D, cars, humans, t: 0, going: false, order: [], pads: buildRaceTrack(len), endT: -1, firstFinish: -1, cams: humans.map(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 62, init: false, shake: 0 })), hudT: 0, rbarDots: [] };
  Object.assign(input, { steer: 0, throttle: 0 }); Object.assign(input2, { steer: 0, throttle: 0 });
  buildRaceHud(); applyEnv(settings.env);
}
function buildRaceHud() {
  show('hud', false); show('dash', false); show('rhud', true); show('splitLine', race2P); show('rp1', race2P); show('timerHud', false);
  const wh = $('wheel').innerHTML; [0, 1].forEach(i => { $('rwh' + i).innerHTML = wh; const p = $('rp' + i); p.style.left = race2P ? (i ? '75%' : '25%') : '50%'; });
  const bar = $('rbar'); bar.querySelectorAll('i').forEach(e => e.remove()); race.cars.forEach(rc => { const d = document.createElement('i'); d.style.background = rc.human >= 0 ? P_COLORS[rc.human] : '#' + AI_COLORS[rc.id - race.humans.length].toString(16).padStart(6, '0'); d.title = rc.name; bar.appendChild(d); race.rbarDots.push(d); });
  $('rn0').textContent = race.cars.length; $('rn1').textContent = race.cars.length; $('raceTime').textContent = '0:00.0';
  show('btnView', !race2P); show('camBox', useCam); show('curveHud', false);
}
function raceCleanup() { if (race) { race.cars.forEach(rc => { if (rc.car !== playerCar) scene.remove(rc.car.g); }); } race = null; race2P = false; clearRaceTrack(); show('rhud', false); show('splitLine', false); focusWorld(0); renderer.setScissorTest(false); renderer.setViewport(0, 0, innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (playerCar) { playerCar.g.position.set(0, 0, 0); playerCar.g.rotation.set(0, 0, 0); } camera.up.set(0, 1, 0); }
function startRace() {   // dipanggil dari startGame setelah kamera/sensor siap
  setupRace(); show('hud', false); show('menu', false); show('over', false); show('paused', false); show('gameBtns', true); show('btnCal', useCam); show('touchBtns', !useCam && !race2P); show('camBox', useCam); startEngine();
  if (useCam || useTilt) { state = 'calib'; startCalib(); } else startCountdown();
}
// --- AI ---
const tFromV = vt => vt >= RV_CRUISE ? clamp((vt - RV_CRUISE) / (RV_MAX - RV_CRUISE), 0, 1) : clamp((vt - RV_CRUISE) / (RV_CRUISE - RV_MIN), -1, 0);
function laneClear(rc, x) { return !race.cars.some(o => o !== rc && Math.abs(o.x - x) < 2.3 && Math.abs(o.s - rc.s) < 15); }
function aiControl(rc, dt) {
  const R = race; let vt;
  if (rc.finished) { vt = 24; rc.targetX = clamp(rc.targetX, -3.6, 3.6); }
  else {
    const lead = Math.max(...R.humans.map(h => h.s)); vt = rc.aiBase + clamp((lead - rc.s) * 0.012, -3.5, 5) + Math.sin(R.t * 0.5 + rc.wob) * 1.2;
    let front = null; for (const o of R.cars) { if (o === rc || o.s <= rc.s || o.s - rc.s > 34 || Math.abs(o.x - rc.x) > 2.0) continue; if (!front || o.s < front.s) front = o; }
    rc.cool -= dt;
    if (front) { const gap = front.s - rc.s - PL; if (gap < 24 && front.v < vt + 3 && rc.cool <= 0) { const li = LANE_X.reduce((b, lx, i) => Math.abs(lx - rc.x) < Math.abs(LANE_X[b] - rc.x) ? i : b, 0), opts = [li - 1, li + 1].filter(l => l >= 0 && l < 3 && laneClear(rc, LANE_X[l])); if (opts.length) { rc.targetX = LANE_X[pick(opts)]; rc.cool = 2.4; } } if (gap < 10) vt = Math.min(vt, front.v - 1.5); }
    else if (rc.cool <= 0 && Math.random() < dt * 0.12) { const l = (Math.random() * 3) | 0; if (laneClear(rc, LANE_X[l])) { rc.targetX = LANE_X[l]; rc.cool = 5; } }
  }
  const dr = terrDrift(rc.s, rc.v), sfA = Math.max(0.2, clamp(rc.v / 14, 0, 1) * (1 - 0.35 * clamp((rc.v - 34) / 30, 0, 1)));   // AI melawan tarikan tikungan (feedforward)
  rc.steer = clamp((rc.targetX - rc.x) * 0.55 - (rc.vl + dr) * 0.22 - dr / (LAT_MAX * sfA), -1, 1); rc.thr = tFromV(vt);
}
// --- fisika satu mobil balap ---
function stepRaceCar(rc, dt, steer, thr) {
  rc.off = Math.abs(rc.x) > ROAD_HALF + 0.35;
  let tv = thr >= 0 ? RV_CRUISE + thr * (RV_MAX - RV_CRUISE) : RV_CRUISE + thr * (RV_CRUISE - RV_MIN);
  if (rc.boostT > 0) { tv += 12; rc.boostT -= dt; if (Math.random() < dt * 30) puff(rc.x + rr(-0.5, 0.5), 0.45, -rc.s + 2.4, 1, [0x7ad0ff, 0xffffff, 0xffd23f], 2, 0.7); }
  tv += 4.5 * rc.draft - terrGrade(rc.s) * 40; if (rc.off) tv = Math.min(tv, 24);
  if (rc.v < tv) { rc.v = Math.min(tv, rc.v + (rc.boostT > 0 ? 20 : 11) * (1 - 0.5 * rc.v / (RV_MAX + 16)) * dt); } else { const dec = thr < -0.15 ? 32 * wxGrip() : (rc.off ? 20 : 4); rc.v = Math.max(tv, rc.v - dec * dt); }
  rc.braking = thr < -0.15 && rc.v > tv + 0.5;
  const sf = clamp(rc.v / 14, 0, 1) * (1 - 0.35 * clamp((rc.v - 34) / 30, 0, 1)); rc.vl += (steer * LAT_MAX * sf - rc.vl) * (1 - Math.exp(-dt * 7 * wxGrip())); rc.x += (rc.vl + terrDrift(rc.s, rc.v)) * dt;
  if (Math.abs(rc.x) > RAIL_X - PW / 2 - 0.1) { const sd = Math.sign(rc.x); rc.x = sd * (RAIL_X - PW / 2 - 0.1); rc.vl = -sd * 3; rc.v *= 0.94; if (rc.targetX !== undefined) rc.targetX = clamp(rc.targetX, -4, 4); puff(rc.x + sd * 0.9, 0.5, -rc.s, 2, [0xffcc33, 0xffffff], 3, 0.6); if (rc.human >= 0) race.cams[rc.human].shake = Math.max(race.cams[rc.human].shake, 0.3); }
  rc.yaw += (-Math.atan2(rc.vl, Math.max(rc.v, 6)) * 1.5 - rc.yaw) * (1 - Math.exp(-dt * 8)); rc.s += rc.v * dt; rc.vTop = Math.max(rc.vTop, rc.v); rc.bumpT = Math.max(0, rc.bumpT - dt); rc.padCool = Math.max(0, rc.padCool - dt);
}
function raceInteractions(dt) {
  const R = race, cs = R.cars;
  for (const a of cs) { a.draft = 0; if (a.finished) continue; for (const b of cs) { if (b === a || b.s <= a.s) continue; const gap = b.s - a.s - PL; if (gap < 16 && gap > 0 && Math.abs(b.x - a.x) < 1.7) a.draft = Math.max(a.draft, 1 - gap / 16); } }
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const a = cs[i], b = cs[j]; if (a.finished || b.finished) continue; const dx = Math.abs(a.x - b.x), ds = Math.abs(a.s - b.s);
    if (dx < PW * 0.88 && ds < PL * 0.92 && (a.bumpT <= 0 || b.bumpT <= 0)) {
      const f = a.s > b.s ? a : b, k = f === a ? b : a, sd = Math.sign(a.x - b.x) || (Math.random() < 0.5 ? 1 : -1);
      if (ds > PL * 0.45) k.v = Math.min(k.v, f.v * 0.9); else { a.v *= 0.97; b.v *= 0.97; }
      a.vl += sd * 4; b.vl -= sd * 4; a.x += sd * 0.25; b.x -= sd * 0.25; a.bumpT = b.bumpT = 0.5; if (typeof damageHit === 'function') { damageHit(-sd, a.car); damageHit(sd, b.car); } puff((a.x + b.x) / 2, 0.6, -(a.s + b.s) / 2, 10, [0xffcc33, 0xff7a1f, 0xdddddd], 4);
      [a, b].forEach(q => { if (q.human >= 0) { R.cams[q.human].shake = 1; try { navigator.vibrate && navigator.vibrate(60); } catch (e) {} } }); if (a.human >= 0 || b.human >= 0) sfx.crash();
    }
  }
  for (const rc of cs) for (const p of R.pads) if (rc.padCool <= 0 && Math.abs(rc.s - p.s) < 3.2 && Math.abs(rc.x - p.x) < 1.7) { rc.boostT = 2.2; rc.padCool = 3; if (rc.human >= 0) { say('NITRO! 🚀', '#7fd0ff'); sfx.near(); R.cams[rc.human].shake = Math.max(R.cams[rc.human].shake, 0.35); } }
}
function raceFinishCheck() {
  const R = race;
  for (const rc of R.cars) if (!rc.finished && rc.s >= R.len) {
    rc.finished = true; rc.finishT = R.t - (rc.s - R.len) / Math.max(rc.v, 1); R.order.push(rc); rc.rank = R.order.length;
    if (rc.human >= 0) { say((race2P ? 'P' + (rc.human + 1) + ' ' : '') + 'FINIS! #' + rc.rank, rc.rank === 1 ? '#ffe36a' : '#ffffff'); sfx.done(); R.cams[rc.human].shake = 0.6; if (R.firstFinish < 0) R.firstFinish = R.t; }
  }
  if (R.humans.every(h => h.finished) && R.endT < 0) R.endT = 9;                                  // beri waktu AI menyelesaikan balapan
  else if (R.endT > 2 && R.humans.every(h => h.finished) && R.cars.every(c => c.finished)) R.endT = 2;
  if (R.endT < 0 && R.firstFinish >= 0 && R.t - R.firstFinish > 40) R.endT = 0.5;
  else if (R.endT < 0 && R.t > 420) R.endT = 0.5;
}
function raceRanks() { const R = race, un = R.cars.filter(c => !c.finished).sort((a, b) => b.s - a.s); R.cars.forEach(c => { if (!c.finished) c.rank = R.order.length + un.indexOf(c) + 1; }); }
// --- pembaruan per frame ---
function raceUpdate(dt) {
  const R = race; elapsed += dt;
  if (state === 'calib') { updateManualInput(dt); if (useTilt) tiltCalibStep(); engineSet(0, 0, 0); }
  else if (state === 'count') {
    updateManualInput(dt); cdT -= dt; const n = Math.ceil(cdT - 0.5); if (n !== cdShown && n >= 0) { cdShown = n; const c = $('count'); if (n > 0) { show('count', true); c.textContent = n; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(); } else show('count', false); }
    engineSet(0, 0.6 + 0.4 * Math.sin(elapsed * 12), 0); if (cdT <= 0.5) { state = 'play'; R.going = true; R.t = 0; show('count', false); sfx.go(); say('GO!', '#7fffd0'); }
  } else if (state === 'play') {
    updateManualInput(dt); updateTiltInput(); camTick(dt);
    R.t += dt;
    for (const rc of R.cars) { if (rc.human >= 0 && !rc.finished) { const I = rc.human ? input2 : input; rc.steer = I.steer; rc.thr = I.throttle; } else aiControl(rc, dt); stepRaceCar(rc, dt, rc.steer, rc.thr); }
    raceInteractions(dt); raceFinishCheck(); raceRanks();
    const h0 = R.humans[0]; engineSet(h0.v, h0.thr, h0.vl, h0.braking);
    if (R.endT >= 0) { R.endT -= dt; if (R.endT <= 0) { finishRace(); return; } }
  }
  for (const rc of R.cars) { const g = rc.car.g; g.position.set(rc.x, 0, -rc.s); g.rotation.y = rc.yaw; g.rotation.z = -rc.vl * 0.012; g.rotation.x = rc.braking ? -0.025 : 0; for (const w of rc.car.wheels) { w.piv.rotation.x -= rc.v * dt / w.r; if (w.front) w.yaw.rotation.y = -rc.steer * 0.42; } rc.car.tailM.emissiveIntensity = rc.braking ? 2.2 : 0.4; }
  updateParts(dt, 0); updateCockpit(); updateRaceHud(dt);
}
function updateRaceHud(dt) {
  const R = race; R.hudT -= dt; if (R.hudT > 0) return; R.hudT = 0.05;
  if (state === 'play' || state === 'over') $('raceTime').textContent = fmtRT(R.t);
  R.humans.forEach((h, i) => { $('rpos' + i).textContent = h.rank || 1; $('rspd' + i).textContent = Math.round(h.v * 3.6); $('rpos' + i).style.color = h.rank === 1 ? '#ffe36a' : '#fff'; const f = $('rflag' + i); f.textContent = h.finished ? '🏁 FINIS' : h.boostT > 0 ? '🚀 NITRO' : h.draft > 0.2 ? '💨 SLIPSTREAM' : ''; $('rwh' + i).style.transform = `rotate(${(h.steer * 100).toFixed(0)}deg)`; $('rg' + i).style.height = Math.max(0, h.thr) * 50 + '%'; $('rb' + i).style.height = Math.max(0, -h.thr) * 50 + '%'; });
  if (!race2P && state === 'play') updateCurveHud(R.humans[0].s); R.cars.forEach((c, k) => { R.rbarDots[k].style.left = clamp(c.s / R.len, 0, 1) * 100 + '%'; });
}
function finishRace() {
  const R = race; state = 'over'; stopCamera(); stopEngine(); ['rhud', 'splitLine', 'gameBtns', 'touchBtns', 'count', 'calibBox', 'camBox', 'curveHud'].forEach(i => show(i, false));
  const un = R.cars.filter(c => !c.finished).sort((a, b) => b.s - a.s); un.forEach((c, k) => { c.rank = R.order.length + k + 1; });
  const sorted = R.cars.slice().sort((a, b) => a.rank - b.rank), h0 = R.humans[0]; let title, big, info = '';
  if (race2P) { const w = R.humans.find(h => h.rank < R.humans.find(o => o !== h).rank); title = '🏆 ' + w.name + ' MENANG!'; big = w.finished ? fmtRT(w.finishT) : '—'; info = `${R.len / 1000} km · ${RDIFF[settings.rdiff].n}`; }
  else { const bk = 'bestRace' + R.len, prev = store.get(bk, 0), nb = h0.finished && h0.rank === 1 && (!prev || h0.finishT < prev); if (nb) store.set(bk, +h0.finishT.toFixed(2)); title = h0.rank === 1 ? (nb ? '🏆 JUARA 1! REKOR BARU!' : '🏆 JUARA 1!') : h0.rank <= 3 ? '🥈 FINIS KE-' + h0.rank : 'FINIS KE-' + h0.rank; big = h0.finished ? fmtRT(h0.finishT) : '—'; info = `${R.len / 1000} km · lawan ${RDIFF[settings.rdiff].n}${prev ? ' · rekor terbaik ' + fmtRT(prev) : ''}`; }
  const coins = addCoins((h0.finished ? [120, 70, 40, 15][Math.min(h0.rank - 1, 3)] : 8) * [1, 1.6, 2.2][settings.rlen]); if (coins) info += ' · +' + coins + ' 🪙';
  $('overTitle').textContent = title; $('overScore').textContent = big; $('overInfo').textContent = info; if (race2P) lbAfterGame(null, 0); else lbAfterGame(lbBoard(), h0.finished ? lbEnc(h0.finishT * 1000) : 0);
  $('overTable').innerHTML = '<table class="sum"><tr><th>#</th><th>Pembalap</th><th>Waktu</th><th>Kec. maks</th></tr>' + sorted.map(c => `<tr${c.human >= 0 ? ' class="me"' : ''}><td>${c.rank}</td><td>${c.name}</td><td>${c.finished ? fmtRT(c.finishT) : 'belum finis'}</td><td>${Math.round(c.vTop * 3.6)} km/j</td></tr>`).join('') + '</table>';
  show('over', true);
}
// --- kamera per pemain & render layar terbelah ---
function raceCamUpdate(hi, dt, aspect) {
  const rc = race.humans[hi], C = race.cams[hi], back = aspect < 0.8 ? 10.5 : (race2P ? 7.2 : 7.8), up = aspect < 0.8 ? 3.6 : 2.7, view = race2P ? 0 : settings.view;
  if (view !== 0) {
    const g = rc.car.g; g.updateMatrixWorld(true); _eye.copy(view === 1 ? cockpit.eye : _hoodEye).applyMatrix4(g.matrixWorld); _fwd.set(0, -0.03, -1).applyQuaternion(g.quaternion); const sw = (Math.random() - 0.5) * (C.shake * 0.04 + clamp((rc.v - 40) / 40, 0, 1) * 0.004 + (rc.off ? 0.012 : 0));
    camera.position.set(_eye.x + sw, _eye.y + sw * 0.6, _eye.z); _look.copy(camera.position).addScaledVector(_fwd, 10); _look.y -= 0.18 + rc.v * 0.001; camera.up.set(Math.sin(-rc.vl * 0.012), 1, 0).normalize(); camera.lookAt(_look); C.shake = Math.max(0, C.shake - dt * 2);
    camera.fov = (view === 1 ? 70 : 66) + clamp(rc.v, 0, 80) * 0.22; return;
  }
  const tp = new THREE.Vector3(rc.x * 0.62, up + rc.v * 0.006, -rc.s + back), tl = new THREE.Vector3(rc.x * 0.8 + Math.sin(-rc.yaw) * 4, 1.0 + terrGrade(rc.s) * 9, -rc.s - 13);
  if (!C.init) { C.pos.copy(tp); C.look.copy(tl); C.init = true; } const k = 1 - Math.exp(-dt * 7); C.pos.lerp(tp, k); C.look.lerp(tl, k);
  C.shake = Math.max(0, C.shake - dt * 2); camera.position.copy(C.pos); camera.position.x += (Math.random() - 0.5) * (C.shake * 0.35 + clamp((rc.v - 45) / 40, 0, 1) * 0.02); camera.position.y += (Math.random() - 0.5) * (C.shake * 0.25);
  camera.up.set(0, 1, 0); camera.lookAt(C.look); const fov = 58 + clamp(rc.v, 0, 80) * 0.36 + C.shake * 3; C.fov += (fov - C.fov) * 0.08; camera.fov = C.fov;
}
function renderRace() {
  const R = race, W = innerWidth, H = innerHeight, dt = Math.min(0.05, dtS);
  renderer.setScissorTest(true); const n = race2P ? 2 : 1;
  for (let hi = 0; hi < n; hi++) {
    const x0 = race2P ? hi * W / 2 : 0, w = race2P ? W / 2 : W, rc = R.humans[hi];
    renderer.setViewport(x0, 0, w, H); renderer.setScissor(x0, 0, w, H); camera.aspect = w / H; raceCamUpdate(hi, dt, w / H); camera.updateProjectionMatrix();
    focusWorld(-rc.s + 6); headlight.position.set(rc.x, 1, -rc.s - 1.5); headlight.target.position.set(rc.x, 0, -rc.s - 30);
    if (!race2P && settings.view === 1 && cockpit && rc.car === playerCar) { rc.car.g.visible = false; mirrorCam.position.set(rc.x, 1.35, -rc.s); mirrorCam.lookAt(rc.x - rc.vl * 0.15, 1.15, -rc.s + 60); if ((cockpit.frame++ & 1) === 0) { renderer.setRenderTarget(mirrorRT); renderer.setScissorTest(false); mirrorBegin(), renderer.render(scene, mirrorCam), mirrorEnd(); renderer.setScissorTest(true); renderer.setRenderTarget(null); } rc.car.g.visible = true; renderer.setViewport(x0, 0, w, H); renderer.setScissor(x0, 0, w, H); }
    setBend(rc.s, -rc.s); shadowFollow(rc.x, -rc.s); rainAt(camera); renderer.render(scene, camera);
  }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, W, H);
}
