'use strict';
// ======================= ALUR PERMAINAN =======================
let state = 'menu', versus = false, useCam = false, players = [], cur = 0, elapsed = 0, pausedFrom = 'ready';
let lastCur = -1, ballVisX = 0, aimX = 0, aimAngle = 0, aimSpin = 0, pinsLeftBefore = 10, turnF = 0, rollStartT = 0, settleT = 0, resolveT = 0, lastGutter = false, best = store.get('best', 0);
const HELP_TXT = '←/→ geser · Q/E arah · Z/X lengkung · tahan SPASI lalu lepas = lempar · atau geser ke atas di layar';
const playerName = i => versus ? 'P' + (i + 1) : 'KAMU';
const mkPlayer = i => ({ i, rolls: [] });
const renderBoard = () => { $('board').innerHTML = boardHtml(players, cur, state !== 'over'); };
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'upper', game: 'Boling 3D' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; base.ok = false; players = (versus ? [0, 1] : [0]).map(mkPlayer); cur = 0;
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('gameBtns', true); show('btnCal', withCam); show('camBox', withCam); show('help', !withCam); $('help').textContent = HELP_TXT;
  document.body.classList.toggle('vs', versus); resetPins(); setBallStyle(settings.ball); beginTurn(true);
}
function beginTurn(first) {
  const p = players[cur], st = rollsState(p.rolls); pinsLeftBefore = st.pinsLeft; turnF = st.f;
  if (st.pinsLeft === 10) resetPins();
  aimX = 0; ballVisX = 0; aimAngle = 0; aimSpin = 0; placeBall(0); renderBoard();
  $('info').innerHTML = `<b>${playerName(cur)}</b> · FRAME ${st.f + 1} · LEMPARAN ${st.r + 1}`;
  const switched = versus && !first && cur !== lastCur; lastCur = cur;
  if (useCam && (!base.ok || switched)) { base.ok = false; state = 'calib'; startCalib(); }
  else { state = 'ready'; readyReset(); }
  if (versus && (first || switched)) say(playerName(cur) + ' GILIRAN', cur ? '#6fc8ff' : '#ffb35a');
}
function launch(x, angle, spin, speed) {
  if (state !== 'ready' && state !== 'swing') return;
  state = 'roll'; rollStartT = elapsed; settleT = 0; lastGutter = false; hitEvents = []; launchBall(ballVisX, angle, spin, speed); sfx.release(); sfx.rollStart(); show('power', false);
}
function onGutter() { lastGutter = true; sfx.gutter(); }
function endRoll() {
  if (state !== 'roll') return; state = 'resolve'; sfx.rollStop();
  const p = players[cur], st0 = rollsState(p.rolls), knocked = pinsLeftBefore - standingPins().length;
  const strike = knocked === 10 && st0.pinsLeft === 10, spare = !strike && knocked === st0.pinsLeft && st0.pinsLeft < 10;
  p.rolls.push(knocked); renderBoard(); resolveT = strike ? 2.4 : 1.9;
  if (strike) { say('STRIKE!', '#ffe36a'); sfx.strike(); confettiBurst(60); shake = 1; }
  else if (spare) { say('SPARE!', '#7fffd0'); sfx.spare(); confettiBurst(25); }
  else if (knocked === 0) { say(lastGutter ? 'GUTTER...' : 'MELESET', '#ff8a8a'); sfx.miss(); }
  else say(knocked + ' PIN', '#fff');
}
function nextTurn() {
  sweepPins(); const p = players[cur], nst = rollsState(p.rolls);
  const turnOver = nst.done || nst.f !== turnF;
  if (turnOver) {
    if (players.every(q => rollsState(q.rolls).done)) { finishGame(); return; }
    if (versus) { cur = (cur + 1) % players.length; if (rollsState(players[cur].rolls).done) cur = (cur + 1) % players.length; }
    else if (nst.done) { finishGame(); return; }
  }
  beginTurn(false);
}
function finishGame() {
  state = 'over'; stopCamera(); sfx.rollStop(); sfx.done(); ['hud', 'gameBtns', 'power', 'help', 'calibBox', 'camBox'].forEach(i => show(i, false));
  const sc = players.map(p => totalScore(p.rolls)); let title = 'PERMAINAN SELESAI', big = sc[0], info = '';
  const strikes = p => p.rolls.filter((v, i) => v === 10).length;
  if (versus) { title = sc[0] === sc[1] ? 'SERI!' : '🏆 P' + (sc[0] > sc[1] ? 1 : 2) + ' MENANG!'; big = sc[0] + ' : ' + sc[1]; info = `Strike P1 ${strikes(players[0])} / P2 ${strikes(players[1])}`; }
  else { const nb = sc[0] > best; if (nb) { best = sc[0]; store.set('best', best); } info = `${strikes(players[0])} strike${nb ? ' — REKOR BARU!' : ''} · rekor ${best}`; title = sc[0] >= 250 ? 'LUAR BIASA!' : sc[0] >= 150 ? 'BAGUS SEKALI!' : sc[0] >= 100 ? 'LUMAYAN!' : 'TERUS LATIHAN!'; }
  $('overTitle').textContent = title; $('overScore').textContent = big; $('overInfo').textContent = info; $('overBoard').innerHTML = boardHtml(players, -1, false); show('over', true);
}
function toMenu() { stopCamera(); sfx.rollStop(); state = 'menu'; ['paused', 'over', 'hud', 'gameBtns', 'power', 'help', 'calibBox', 'camBox'].forEach(i => show(i, false)); show('menu', true); document.body.classList.remove('vs'); resetPins(); placeBall(0); }
function pauseGame() { if (state !== 'ready' && state !== 'swing' && state !== 'roll' && state !== 'resolve' && state !== 'calib') return; pausedFrom = state; state = 'paused'; show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = pausedFrom; }
