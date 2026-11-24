'use strict';
// ======================= ALUR PERMAINAN =======================
let gameType = settings.gtype ? 'race' : 'drive', mode = settings.mode, chill = mode >= 1, timed = mode === 1, freeMode = mode === 2, state = 'menu', useCam = false, useTilt = false, elapsed = 0, pausedFrom = 'play', dieT = 0, cdT = 0, cdShown = 0;
const bestKey = () => ['best', 'bestChill', 'bestFree'][mode];
let best = store.get(bestKey(), 0);
async function startGame(inMode) {
  initAudio(); const isRace = gameType === 'race';
  if (isRace && settings.players === 2 && inMode === 'tilt') { toast('Balapan 2 Player tidak mendukung sensor miring HP. Pakai kamera atau keyboard.', 4000); return; }
  camPlayers = (isRace && settings.players === 2 && inMode === 'cam') ? 2 : 1;
  if (inMode === 'cam') { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'upper', game: 'Simulasi Mobil' }))) { stopCamera(); return; } } else stopCamera();
  if (inMode === 'tilt') { const ok = await enableTilt(); if (!ok) return; }
  useCam = inMode === 'cam'; useTilt = inMode === 'tilt'; cam.on = useCam; CP.forEach(c => { c.base.ok = false; c.calib = []; }); tilt.ok = false;
  raceCleanup(); if (isRace) { startRace(); return; } show('rhud', false); terrSeed((Math.random() * 1e9) | 0); terrSetup();
  resetDrive(); best = store.get(bestKey(), 0); buildPlayer(); applyEnv(settings.env); startEngine();
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('dash', true); show('gameBtns', true); show('btnCal', useCam || useTilt); show('camBox', useCam); show('touchBtns', !useCam);
  show('timerHud', timed); $('dash').classList.toggle('cockpit', settings.view === 1); $('lives').classList.toggle('hidden', chill); updateLives(); updateTimerHud(true); $('bestHud').textContent = 'TERBAIK ' + best;
  if (useCam || useTilt) { state = 'calib'; startCalib(); } else startCountdown();
}
function startCountdown() { state = 'count'; cdT = 3.5; cdShown = 0; show('calibBox', false); }
function beginPlay() { state = 'play'; show('count', false); sfx.go(); say('GO!', '#7fffd0'); if (freeMode) toast('Jalan Santai: tanpa nyawa dan tanpa batas waktu. Nikmati perjalanan! Tekan C untuk ganti sudut pandang.', 5000); else if (timed) toast('Mode Santai: tabrakan tidak mengurangi nyawa. Waktu 3 menit!', 3500); else toast('3 nyawa. Hindari tabrakan dan salip sebanyak mungkin mobil!', 3500); }
function gameOver(timeUp) {
  state = 'over'; stopCamera(); stopEngine(); sirenStop(); vsStop(); sfx.done(); ['hud', 'dash', 'gameBtns', 'touchBtns', 'count', 'calibBox', 'camBox', 'curveHud'].forEach(i => show(i, false));
  const sc = score(), nb = sc > best, earn = typeof addCoins === 'function' ? addCoins(Math.floor(sc / 40) * (freeMode ? 0.5 : 1)) : 0; if (nb) { best = sc; store.set(bestKey(), best); }
  $('overTitle').textContent = freeMode ? 'PERJALANAN SELESAI' : nb && sc > 0 ? 'REKOR BARU!' : timeUp ? 'WAKTU HABIS!' : 'GAME OVER'; $('overScore').textContent = sc;
  $('overInfo').textContent = `${(P.dist / 1000).toFixed(2)} km · ${P.passed} mobil disalip · ${P.near} nyaris · kecepatan maks ${Math.round(P.vTop * 3.6)} km/j${freeMode ? ' · jalan santai' : timed ? ' · mode santai' : ''} · terbaik ${best}${earn ? ` · +${earn} 🪙` : ''}`; lbAfterGame(lbBoard(), sc); show('over', true);
}
function toMenu() { raceCleanup(); stopCamera(); stopEngine(); sirenStop(); vsStop(); state = 'menu'; ['paused', 'over', 'hud', 'dash', 'gameBtns', 'touchBtns', 'count', 'calibBox', 'camBox', 'curveHud'].forEach(i => show(i, false)); show('menu', true); resetDrive(); P.v = 0; applyEnv(settings.env); buildPlayer(); }
function pauseGame() { if (state !== 'play' && state !== 'count' && state !== 'calib') return; pausedFrom = state; state = 'paused'; show('btnFinish', freeMode && pausedFrom === 'play'); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = pausedFrom; }
