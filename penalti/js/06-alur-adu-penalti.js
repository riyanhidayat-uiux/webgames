'use strict';
// ======================= ALUR ADU PENALTI =======================
let state = 'menu', useCam = false, elapsed = 0, pausedFrom = 'ready', excite = 0.1, shake = 0;
const MT = { mode: 0, role: 'kick', turn: 0, score: [0, 0], marks: [[], []], total: 5, sudden: false, over: false, goals: 0, tries: 0, best: 0, speeds: [], names: ['KAMU', 'LAWAN'], winner: -1 };
const AIM = { x: 0, y: 1.2, show: false };
let A = null, replayData = null, repT = 0;
const REPLAY_RATE = 0.42, KICK_AIM_Z = 0;
function say(text, color) { const m = $('bigMsg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
let cmtTimer = 0;
function comment(text, ms = 2800) { const c = $('cmt'); c.textContent = text; c.classList.add('on'); clearTimeout(cmtTimer); cmtTimer = setTimeout(() => c.classList.remove('on'), ms); }
function updateTv() {
  const t0 = TEAMS[settings.team % TEAMS.length], t1 = TEAMS[oppTeam % TEAMS.length]; $('tn0').textContent = MT.names[0]; $('tn1').textContent = MT.names[1]; $('ts0').textContent = MT.score[0]; $('ts1').textContent = MT.score[1];
  $('tvr0').style.borderLeft = '6px solid #' + t0.c1.toString(16).padStart(6, '0'); $('tvr1').style.borderLeft = '6px solid #' + t1.c1.toString(16).padStart(6, '0');
  [0, 1].forEach(i => { const n = MT.mode === 1 ? (i === 0 ? MT.total : 0) : Math.max(5, MT.marks[i].length + (MT.turn === i && !MT.over ? 1 : 0)); let h = ''; for (let k = 0; k < n; k++) { const m = MT.marks[i][k], cur = !MT.over && !m && MT.turn === i && k === MT.marks[i].length; h += `<span class="dot ${m === 'g' ? 'g' : m === 'm' ? 'm' : ''}${cur ? ' cur' : ''}"></span>`; } $('td' + i).innerHTML = h; });
  $('tvr1').classList.toggle('hidden', MT.mode === 1); $('tvInfo').textContent = MT.mode === 1 ? `TENDANGAN ${Math.min(MT.tries + 1, MT.total)} / ${MT.total}` : (MT.sudden ? 'ADU PENALTI · SUDDEN DEATH' : 'ADU PENALTI · PUTARAN ' + (Math.min(Math.floor(Math.max(MT.marks[0].length, MT.marks[1].length)) + (MT.over ? 0 : 1), 99)));
}
async function startGame(withCam) {
  initAudio(); startCrowd();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'full', game: 'Tendangan Penalti' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; base.ok = false;
  oppTeam = (settings.team + 1 + ((Math.random() * (TEAMS.length - 1)) | 0)) % TEAMS.length; Object.assign(MT, { mode: settings.mode, role: 'kick', turn: 0, score: [0, 0], marks: [[], []], total: settings.mode === 1 ? 10 : 5, sudden: false, over: false, goals: 0, tries: 0, best: 0, speeds: [], winner: -1, names: ['KAMU', TEAMS[oppTeam % TEAMS.length].n.toUpperCase()] });
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('gameBtns', true); show('btnCal', withCam); show('camBox', withCam); applyAtmo(settings.atmo); updateTv();
  if (withCam) { state = 'calib'; startCalib(); } else beginAttempt();
}
function matchStatus() {
  if (MT.mode === 1) return MT.tries >= MT.total ? 0 : -1;
  const [a, b] = MT.marks, sa = MT.score[0], sb = MT.score[1], ta = a.length, tb = b.length;
  if (ta <= 5 && tb <= 5 && !(ta === 5 && tb === 5)) { const ra = 5 - ta, rb = 5 - tb; if (sa > sb + rb) return 0; if (sb > sa + ra) return 1; return -1; }
  if (ta === tb && ta >= 5) { if (sa !== sb) return sa > sb ? 0 : 1; MT.sudden = true; }
  return -1;
}
// --- satu percobaan (tendangan atau penyelamatan) ---
function beginAttempt() {
  MT.role = MT.mode === 1 ? 'kick' : (MT.turn === 0 ? 'kick' : 'defend'); const role = MT.role;
  buildActors(role, (Math.random() * KEEPER_KITS.length) | 0); resetBall(); KP.mode = 'ready'; KEEP.canCatch = true; KEEP.catchV = role === 'defend' ? 20 : 19; AIM.x = 0; AIM.y = 1.2; AIM.show = role === 'kick';
  A = { role, phase: 'ready', t: 0, plan: null, left: false, approachDur: 0.95, contact: false, aim: { x: 0, y: 1.2 }, userDive: null, keeperPlan: null, keeperStartAt: -1, resultShown: false, frames: [], power: 0, curve: 0, loft: 0, startX: 0, startZ: SPOT_Z + 3.6, plantX: -0.12, plantZ: SPOT_Z + 0.62, endT: 0, pendingDive: null };
  backNet.visible = role !== 'defend'; netDz.fill(0); netVz.fill(0); netGeo.attributes.position.needsUpdate = true;
  kicker.root.position.set(role === 'defend' ? 0 : -1.5, 0, SPOT_Z + 3.3); kicker.root.rotation.y = role === 'defend' ? 0 : 0.28; setPoseNow(kicker, poseWaiting(0)); updateTv(); state = 'ready'; replayData = null;
  show('power', false); show('speedTag', false); $('replayTag').classList.add('hidden');
  const youKick = role === 'kick'; comment(youKick ? (useCam ? 'Giliranmu menendang! Tunjuk sasaran dengan tangan, lalu tendang.' : 'Giliranmu menendang! Bidik dengan mouse, tahan klik lalu lepas.') : (useCam ? 'Giliranmu menjaga gawang! Miringkan badan untuk menyelam.' : 'Giliranmu menjaga gawang! Tekan ← → ↑ untuk menyelam.'), 3600);
  $('help').textContent = youKick ? (useCam ? '👉 Rentangkan tangan ke sasaran · 🦵 ayun kaki untuk menendang (cepat = kuat)' : '🖱️ Bidik dengan mouse · tahan klik / Spasi lalu lepas · Q/E = bola lengkung · R/F = bola naik/turun') : (useCam ? '🧤 Miringkan badan ke kiri/kanan untuk menyelam, angkat tangan untuk tinggi' : '← → menyelam · ↑ lompat tinggi · ↓ menyelam rendah · Spasi = tengah'); show('help', true); setTimeout(() => sfx.whistle(false), 350);
}
// kondisi: penendang manusia menendang
function userKick(o) {
  if (!A || A.role !== 'kick' || A.phase !== 'ready' || A.t < 0.9) return false;
  A.plan = userShotParams(o.aimX, o.aimY, o.power, o.curve || 0, o.loft || 0); A.left = !!o.left; A.curve = o.curve || 0; A.approachDur = o.quick ? 0.62 : 1.55; A.startX = o.quick ? (A.left ? 0.8 : -0.8) : (A.left ? 2.0 : -2.0); A.startZ = SPOT_Z + (o.quick ? 1.5 : 3.9); A.phase = 'approach'; A.t = 0; A.plantX = A.left ? 0.2 : -0.2; A.aim = { x: o.aimX, y: o.aimY }; AIM.show = false; show('power', false); show('help', false);
  kicker.root.position.set(A.startX, 0, A.startZ); return true;
}
// penjaga manusia memutuskan menyelam. dirScreen: -1 kiri layar, +1 kanan layar, 0 tengah; hi 0..1
function userDive(dirScreen, hi) {
  if (!A || A.role !== 'defend' || A.userDive || !(A.phase === 'ready' || A.phase === 'approach' || (A.phase === 'flight' && shot.t < 0.2)) || A.t < 0.5 && A.phase === 'ready') return false;
  const dir = dirScreen === 0 ? 1 : -dirScreen;                       // kamera di belakang kiper: kanan layar = -x dunia
  const rel = A.phase === 'ready' ? -1.2 : A.phase === 'approach' ? A.t - A.approachDur : shot.t; A.userDive = { dir, hi, rel };
  keeperStartDive({ dir, dist: dirScreen === 0 ? 0.25 : 2.15, hi: dirScreen === 0 ? 1 : hi, delay: 0 }, 1); KP.dur = 0.52; return true;
}
function startAIKick() {
  const sk = settings.skill; A.plan = aiShotPlan(sk); A.left = Math.random() < 0.2; A.approachDur = 1.55; A.startX = (A.plan.tell ? -A.plan.side : A.plan.side) * 2.0 || rr(-0.8, 0.8); A.startZ = SPOT_Z + 3.9; A.plantX = A.left ? 0.2 : -0.2; A.aim = { x: A.plan.tx, y: A.plan.ty }; A.phase = 'approach'; A.t = 0; kicker.root.position.set(A.startX, 0, A.startZ);
}
// --- animasi penendang ---
function kickerAnimate(dt) {
  const a = A, k = kicker, T = a.approachDur, u = a.t - T, runLen = Math.max(0.12, T - 0.34); if (a.resultShown) return;
  const p0x = a.startX, p0z = a.startZ, p1x = a.plantX, p1z = a.plantZ + 0.5, L = Math.hypot(p1x - p0x, p1z - p0z), thRun = Math.atan2(-(p1x - p0x), -(p1z - p0z));
  const aimX = a.aim ? a.aim.x : 0, turn = (target, rate) => { let d = target - k.root.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); k.root.rotation.y += d * (1 - Math.exp(-dt * rate)); };
  const stride = 0.8, amp0 = clamp(L / 3.2, 0.4, 1);
  if (a.t < runLen) {                                     // lari pendek: percepat lalu melambat menjelang bola, langkah mengikuti jarak tempuh
    const f = a.t / runLen, sf = 0.4 * f + 0.6 * smooth(f), dist = sf * L; a.ph = dist / stride * Math.PI; a.phLast = a.ph;
    k.root.position.x = lerp(p0x, p1x, sf); k.root.position.z = lerp(p0z, p1z, sf); turn(thRun, 9);
    const amp = amp0 * (0.6 + 0.4 * Math.min(1, f * 3)), rp = runPose(a.ph, amp, 0.1 + 0.17 * amp); rp.hx = 0.2 + 0.1 * smooth(f); easePose(k, rp, dt, 22);
  } else if (u < 0.85) {
    const f = clamp((a.t - runLen) / 0.34, 0, 1), sf = smooth(f), px = lerp(p1x, a.plantX, sf), pz = lerp(p1z, a.plantZ, sf);
    const ft = u > 0 ? 0.7 * (1 - Math.exp(-u * 4.5)) : 0; k.root.position.x = px + (u > 0 ? (a.left ? 0.1 : -0.1) * (1 - Math.exp(-u * 4)) : 0); k.root.position.z = pz - ft;
    turn(lerp(thRun, Math.atan2(-(aimX * 0.45 - px), -(0 - pz)) * 0.55 + (a.left ? 0.15 : -0.15), sf), 12);
    a.ph = (a.phLast || 0) + (a.t - runLen) * 8; const kp = kickPose(u, a.left, a.curve), w = 1 - smooth((a.t - runLen) / 0.16), rp = runPose(a.ph, 0.55, 0.2);
    setPoseNow(k, w > 0.001 ? blendPose(kp, rp, w) : kp);
  } else {                                                // setelah menendang: dua langkah meluncur lalu berdiri memandang bola
    const w = clamp((u - 0.85) / 1.2, 0, 1), z0 = a.plantZ - 0.7, adv = 0.45 * (1 - Math.exp(-(u - 0.85) * 2)); k.root.position.z = z0 - adv; turn(0, 3);
    const rp = runPose(a.ph + (u - 0.85) * 6.5, 0.5 * (1 - w), 0.06); rp.hx = -0.05; easePose(k, w < 1 ? rp : P_({ tx: 0.08, hx: -0.12, sLx: 0.25, sRx: 0.25, sLz: 0.5, sRz: 0.5, eL: 1.2, eR: 1.2, hLz: 0.07, hRz: 0.07, kL: 0.1, kR: 0.1 }), dt, 7);
  }
}
function contactNow() {
  const a = A; a.contact = true; const p = a.plan; const sp = p.spin; const v = solveShot(p.speed, p.tx, p.ty, sp); kickBall(v, sp); a.phase = 'flight'; a.t = 0; a.flightT = 0; MT.speeds.push(p.speed);
  $('speedTag').innerHTML = Math.round(p.speed * 3.6) + ' <small>km/j</small>'; show('speedTag', true); setTimeout(() => show('speedTag', false), 3500);
  if (a.role === 'kick') { const plan = keeperPlanDive(a.aim, p.speed, settings.skill); a.keeperPlan = plan; a.keeperStartAt = plan.delay; }
  else if (!a.userDive) { a.pendingDive = null; }
  recordFrame();
}
function recordFrame() { A.frames.push({ t: shot.t, p: BALL.p.clone(), q: BALL.q.clone(), k: snapRig(kicker), g: snapRig(keeper) }); }
// --- pembaruan per frame ---
function flowUpdate(dt) {
  const a = A; a.t += dt; kicker.shadow.visible = true;
  if (a.phase === 'ready') {
    easePose(kicker, Object.assign(poseWaiting(a.t, 0), { hy: 0.3 * Math.sin(a.t * 0.9), hx: 0.02 + 0.08 * Math.max(0, Math.sin(a.t * 0.5)) }), dt, 8); keeperUpdate(dt, -1, settings.skill);
    if (a.role === 'defend' && a.t > 1.7 && !a.userDive) startAIKick(); else if (a.role === 'defend' && a.t > 1.7) startAIKick();
    if (a.role === 'kick') { show('reticle', true); }
  } else if (a.phase === 'approach') {
    kickerAnimate(dt); keeperUpdate(dt, -1, settings.skill); if (a.t >= a.approachDur) contactNow();
  } else if (a.phase === 'flight') {
    a.flightT += dt; kickerAnimate(dt);
    if (a.role === 'kick' && a.keeperPlan && KP.mode === 'ready' && shot.t >= a.keeperStartAt) keeperStartDive(a.keeperPlan, settings.skill);
    if (a.role === 'defend' && !a.userDive && KP.mode === 'ready' && shot.t > 0.05) { /* tidak menyelam: kiper hanya berdiri */ }
    updateKeeperSpheres(dt); keeperUpdate(dt, shot.t, settings.skill); ballUpdate(dt); processBallEvents(); recordFrame();
    if (shot.result && !a.resultShown) onResult(shot.result);
    if (a.resultShown) { a.endT += dt; resultAnimations(dt); if (a.endT > 2.3) afterResult(); }
  } else if (a.phase === 'result') { a.endT += dt; resultAnimations(dt); ballUpdate(dt); updateKeeperSpheres(dt); }
}
function processBallEvents() {
  for (const e of ballEvents) {
    if (e.type === 'kick') sfx.kick(e.v); else if (e.type === 'bounce') sfx.bounce(e.v); else if (e.type === 'post' || e.type === 'bar') { sfx.post(e.v); shake = Math.max(shake, 0.4); excite = Math.min(1, excite + 0.15); }
    else if (e.type === 'net') sfx.net(e.v); else if (e.type === 'glove') { sfx.glove(e.v); shake = Math.max(shake, 0.25); } else if (e.type === 'catch') { sfx.catchB(); KP.mode = 'catch'; KP.t = 0; } else if (e.type === 'body') sfx.body();
  } ballEvents.length = 0;
}
function onResult(res) {
  const a = A; a.resultShown = true; a.endT = 0; a.res = res; const you = a.role === 'kick', goal = res === 'goal';
  if (MT.mode === 1) { MT.tries++; if (goal) MT.goals++; MT.marks[0].push(goal ? 'g' : 'm'); MT.score[0] = MT.goals; } else { const ti = you ? 0 : 1; MT.marks[ti].push(goal ? 'g' : 'm'); if (goal) MT.score[ti]++; }
  const msgs = { goal: you ? ['GOOOL!!', '#7fffa0', 'Sempurna! Bola bersarang di gawang!'] : ['KEBOBOLAN!', '#ff7a7a', 'Penendang lawan mencetak gol.'], saved: you ? ['DITEPIS KIPER!', '#ff9a7a', 'Kiper menepis tendanganmu!'] : ['PENYELAMATAN!', '#7fffa0', 'Kiper menggagalkan tendangan lawan!'], post: ['MENGENAI TIANG!', '#ffe36a', 'Hanya berjarak sejengkal dari gol!'], wide: ['MELEBAR!', '#ffb36a', 'Bola keluar dari sisi gawang.'], over: ['MELAMBUNG!', '#ffb36a', 'Bola terbang di atas mistar.'] }, m = msgs[res];
  say(m[0], m[1]); comment(m[2] + (res === 'goal' ? ' · ' + Math.round(shot.speed * 3.6) + ' km/j' : ''), 3200);
  const good = (you && goal) || (!you && (res === 'saved' || res === 'wide' || res === 'over' || res === 'post')); if (goal && you || res === 'saved' && !you) { excite = 1; sfx.cheer(); } else if (goal && !you) { excite = 0.7; sfx.cheer(); setTimeout(() => sfx.groan(), 500); } else { excite = 0.5; (res === 'post' ? sfx.ooh : sfx.groan)(); }
  if (res === 'goal') shake = Math.max(shake, 0.35);
  if (!goal && KP.mode === 'ready') { KP.mode = 'ready'; }
  updateTv();
}
function resultAnimations(dt) {
  const a = A, you = a.role === 'kick', goal = a.res === 'goal', saved = a.res === 'saved'; a.celT = (a.celT || 0) + dt; const t = a.celT;
  if (goal) { easePose(kicker, you ? poseCelebrate(t) : poseDejected(t), dt, 8); if (you) { kicker.root.position.z += 0; kicker.root.position.z = Math.min(SPOT_Z + 4, kicker.root.position.z + dt * 1.8); kicker.root.rotation.y *= 0.95; } if (KP.mode === 'ready') { KP.mode = you ? 'dejected' : 'celebrate'; KP.t = 0; } }
  else { easePose(kicker, poseDejected(t), dt, 6); if (saved && KP.mode === 'ready') { KP.mode = 'celebrate'; KP.t = 0; } if (!saved && (KP.mode === 'ready')) { KP.mode = you ? 'ready' : 'celebrate'; } }
}
function afterResult() {
  const res = A.res; A.phase = 'done';
  if ((res === 'goal' || res === 'saved') && A.frames.length > 8 && replayOn()) { startReplay(); return; }
  nextAttempt();
}
const replayOn = () => true;
function nextAttempt() {
  const st = matchStatus(); if (st >= 0) { finishMatch(st); return; }
  if (MT.mode === 0) MT.turn = 1 - MT.turn; beginAttempt();
}
function finishMatch(winner) {
  MT.over = true; MT.winner = winner; state = 'over'; stopCamera(); stopCrowd(); ['hud', 'gameBtns', 'power', 'reticle', 'help', 'camBox', 'calibBox'].forEach(i => show(i, false)); sfx.done();
  let title, big, info, rows = '';
  if (MT.mode === 1) { const acc = Math.round(MT.goals / Math.max(1, MT.tries) * 100), top = MT.speeds.length ? Math.max(...MT.speeds) * 3.6 : 0, nb = MT.goals > store.get('bestPractice', 0); if (nb) store.set('bestPractice', MT.goals); title = MT.goals >= 8 ? 'LUAR BIASA!' : MT.goals >= 5 ? 'BAGUS!' : 'TERUS LATIHAN!'; big = MT.goals + ' / ' + MT.total; info = `Akurasi ${acc}% · tendangan terkeras ${Math.round(top)} km/j${nb ? ' · REKOR BARU!' : ' · rekor ' + store.get('bestPractice', 0)}`; }
  else { title = winner === 0 ? '🏆 KAMU MENANG!' : 'KAMU KALAH...'; big = MT.score[0] + ' - ' + MT.score[1]; info = `${MT.names[0]} vs ${MT.names[1]} · ${MT.sudden ? 'sampai sudden death' : 'adu penalti'}`; if (winner === 0) store.set('wins', store.get('wins', 0) + 1); rows = '<table class="sum"><tr><th></th>' + MT.marks[0].map((_, i) => `<th>${i + 1}</th>`).join('') + '</tr>' + [0, 1].map(i => `<tr><td>${MT.names[i]}</td>${MT.marks[i].map(m => `<td>${m === 'g' ? '⚽' : '❌'}</td>`).join('')}</tr>`).join('') + '</table>'; }
  $('overTitle').textContent = title; $('overScore').textContent = big; $('overInfo').textContent = info; $('overTable').innerHTML = rows; show('over', true);
}
function toMenu() { stopCamera(); stopCrowd(); state = 'menu'; A = null; replayData = null; ['paused', 'over', 'hud', 'gameBtns', 'power', 'reticle', 'help', 'camBox', 'calibBox'].forEach(i => show(i, false)); show('menu', true); backNet.visible = true; applyAtmo(settings.atmo); menuScene(); }
function menuScene() { oppTeam = (settings.team + 1) % TEAMS.length; buildActors('kick', 0); resetBall(); kicker.root.position.set(1.2, 0, SPOT_Z + 1.2); kicker.root.rotation.y = 0.3; setPoseNow(kicker, poseWaiting(0)); }
function pauseGame() { if (state === 'menu' || state === 'over' || state === 'paused') return; pausedFrom = state; state = 'paused'; show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = pausedFrom; }
// --- ulangan gerak lambat ---
function startReplay() { replayData = A.frames; repT = 0; state = 'replay'; $('replayTag').classList.remove('hidden'); show('help', false); }
function replayUpdate(dt) {
  repT += dt * REPLAY_RATE; const f = replayData; const tEnd = f[f.length - 1].t; let i = 0; while (i < f.length - 1 && f[i + 1].t <= repT * 1 + f[0].t) i++;
  const s = f[Math.min(i, f.length - 1)]; BALL.p.copy(s.p); BALL.q.copy(s.q); syncBallMesh(); applySnap(kicker, s.k); applySnap(keeper, s.g);
  if (repT + f[0].t >= tEnd + 0.8) endReplay();
}
function endReplay() { $('replayTag').classList.add('hidden'); replayData = null; nextAttempt(); }
