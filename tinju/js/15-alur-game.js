'use strict';
// ======================= ALUR GAME =======================
function resetPlayer() { Object.assign(P, { hp: 100, stam: 100, sup: 0, guard: false, lean: 0, duck: false, combo: 0, comboT: 0, score: 0, dealt: 0, perfectD: 0, hands: 0 }); gloveAnim[0] = gloveAnim[1] = null; }
function startCountdown(then) {
  state = 'count'; let n = 3; const c = $('count'); show('count', true);
  const set = () => { c.textContent = n > 0 ? n : 'FIGHT!'; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(); }; set();
  const iv = setInterval(() => { if (state !== 'count') { clearInterval(iv); show('count', false); return; } n--; if (n < 0) { clearInterval(iv); show('count', false); then(); return; } set(); }, 800);
}
function startRounds() { fi = 0; resetPlayer(); beginRound(); }
function beginRound() { E = newEnemy(fi); EN.cur = {}; EN.root.position.set(0, 0, -0.2); updateHud(); sfx.bell(); say('RONDE ' + (fi + 1), '#ffd23f'); startCountdown(() => { state = 'fight'; E.state = 'idle'; E.t = 1.1; }); }
function endRound() {
  P.score += Math.round(500 * (fi + 1) + P.hp * 5); sfx.win(); updateHud();
  if (fi + 1 >= FIGHTERS.length) { finishGame(true); return; }
  fi++; P.hp = Math.min(100, P.hp + 30); P.stam = 100; say('MENANG RONDE!', '#7fffd0'); state = 'between'; setTimeout(() => { if (state === 'between') beginRound(); }, 1800);
}
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'upper', game: 'Tinju' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastCx = [null, null]; cam.miss = 0; pmiss[0] = pmiss[1] = 0; bases.forEach(b => { b.ok = false; }); calibs.forEach(c => { c.samples = []; }); calDone[0] = calDone[1] = false; HS.forEach(hh => hh.forEach(h => { h.valid = false; h.prev = null; h.hist = []; }));
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('gameBtns', true); show('btnCal', withCam); show('cue', false);
  $('hud').classList.toggle('versus', versus); document.body.classList.toggle('isvs', versus); document.body.classList.toggle('withctl', !withCam); document.body.classList.toggle('versusctl', versus && !withCam);
  show('ctl', !withCam); show('ctl2', !withCam && versus); EN.root.visible = !versus; VB.forEach(bx => { bx.root.visible = versus; }); GL.forEach(G => { G.g.visible = !versus; }); FP.visible = !versus;
  if (versus) { VF = [mkVF(0), mkVF(1)]; vr = { round: 1, t: 60, locked: false, max: 5 }; pend = []; VB.forEach((bx, i) => { bx.root.position.set(VPOS[i], 0, 0); bx.cur = {}; }); updateHudVs(); }
  else { resetPlayer(); E = newEnemy(0); updateHud(); }
  if (withCam) {
    state = 'calib'; show('camBox', true); applyPrev(); show('calibBox', true); show('calS2', versus); show('calBox2', versus);
    $('calS').textContent = (versus ? 'P1 (kiri) dan P2 (kanan): berdiri berdampingan ±2 meter dari kamera. ' : 'Berdiri ±2 meter dari kamera. ') + 'Angkat kedua kepalan ke dekat wajah (posisi siap bertinju) dan diam sebentar…'; $('calBar').style.width = '0%'; $('calS2').textContent = versus ? 'P2: menunggu…' : ''; $('calBar2').style.width = '0%';
    toast(versus ? 'Berdiri berdampingan ±1 meter. P1 = orang di kiri layar, P2 = di kanan. Pukulan butuh waktu sampai: lawan bisa menangkis atau menghindar!' : 'Pukul dengan gerakan cepat · tangkis: kepalan di wajah · hindari: miring badan / merunduk', 5500);
  } else { if (versus) startVersus(); else startRounds(); toast(versus ? 'P1: Z/X/C pukul · V tangkis · A miring · S runduk.   P2: J/K/L pukul · M tangkis · ◀ miring · ▼ runduk' : 'Z/X/C pukul · Spasi tangkis · A/D miring · S runduk (atau pakai tombol di bawah)', 6000); }
}
function recalibrate() { if (!useCam || (state !== 'fight' && state !== 'count')) return; calibs.forEach(c => { c.samples = []; }); bases.forEach(b => { b.ok = false; }); calDone[0] = calDone[1] = false; state = 'calib'; show('calS2', versus); show('calBox2', versus); show('count', false); show('calibBox', true); $('calBar').style.width = '0%'; $('calS').textContent = 'Angkat kedua kepalan ke dekat wajah dan diam sebentar…'; }
function finishGame(won) {
  state = 'over'; stopCamera(); show('cue', false); const nb = P.score > best; if (nb) { best = P.score; store.set('best', best); }
  $('overTitle').textContent = won ? '🏆 JUARA!' : (P.hp <= 0 ? 'KO!' : 'SELESAI'); $('overScore').textContent = P.score;
  $('overInfo').textContent = `${won ? 'Semua lawan dikalahkan!' : `Sampai ronde ${fi + 1} melawan ${FIGHTERS[Math.min(fi, 4)].name}.`} Kerusakan ke lawan ${Math.round(P.dealt)} · menghindar tepat ${P.perfectD}x · ${nb && P.score > 0 ? 'REKOR BARU! ' : ''}terbaik ${best}`;
  ['hud', 'gameBtns', 'ctl'].forEach(i => show(i, false)); show('over', true); sfx[won ? 'win' : 'ko']();
}
function toMenu() { stopCamera(); state = 'menu'; E = null; pend = []; ['paused', 'over', 'hud', 'gameBtns', 'count', 'calibBox', 'ctl', 'ctl2', 'cue'].forEach(i => show(i, false)); show('menu', true); EN.cur = {}; EN.root.visible = true; VB.forEach(bx => { bx.root.visible = false; }); GL.forEach(G => { G.g.visible = true; }); FP.visible = true; $('hud').classList.remove('versus'); document.body.classList.remove('withctl', 'versusctl', 'isvs'); }
function pauseGame() { if (state !== 'fight') return; state = 'paused'; show('csPauseBox', useCam); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'fight'; }
$('btnCam').onclick = () => startGame(true); $('btnKey').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainKey').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnCal').onclick = recalibrate;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; }; $('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.6; saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
