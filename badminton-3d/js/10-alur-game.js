'use strict';
// ---------- alur game ----------
function setVersus(v) {
  versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v);
  show('vsHelp', v); show('diffBox', !v);
}
$('btnM1').onclick = () => setVersus(false); $('btnM2').onclick = () => setVersus(true);
$('diffBox').querySelectorAll('button').forEach(b => {
  b.classList.toggle('on', +b.dataset.d === settings.diff);
  b.onclick = () => { settings.diff = +b.dataset.d; saveSettings(); $('diffBox').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); };
});

async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'finger', game: 'Badminton 3D' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastMx = [null, null];
  resetPlayers(); winner = null; server = 0; shake = 0;
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('gameBtns', true);
  show('camBox', withCam); $('dot0').style.display = $('dot1').style.display = 'none';
  state = 'play'; readyRally();
  toast(withCam ? (versus ? 'Tunjukkan 2 tangan: kiri = P1, kanan = P2. Gerakkan telunjuk untuk menggerakkan raket!' : 'Gerakkan telunjuk untuk menggerakkan raket. Jangan lupa: maju = smash, mundur = clear!') : (versus ? 'P1: setengah layar bawah / WASD · P2: setengah atas / panah' : 'Geser jari atau gerakkan mouse untuk menggerakkan raket.'), 3800);
}
function gameOver() {
  state = 'over'; stopCamera();
  const a = players[0].score, b = players[1].score;
  $('overTitle').textContent = versus ? `🏆 P${winner + 1} MENANG!` : (winner === 0 ? '🏆 KAMU MENANG!' : 'KAMU KALAH');
  $('overScore').textContent = `${a} : ${b}`;
  $('overInfo').textContent = versus ? 'Skor akhir P1 : P2' : `Melawan AI tingkat ${['Mudah', 'Sedang', 'Sulit'][settings.diff]}`;
  (versus || winner === 0 ? sfx.win : sfx.lose)();
  show('hud', false); show('gameBtns', false); show('over', true);
}
function toMenu() { stopCamera(); state = 'menu'; S.live = false; ['paused', 'over', 'hud', 'gameBtns'].forEach(i => show(i, false)); show('menu', true); }
function pauseGame() { if (state !== 'play') return; state = 'paused'; show('csPauseBox', useCam); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; }
$('btnCam').onclick = () => startGame(true); $('btnTouch').onclick = () => startGame(false);
$('btnAgainCam').onclick = () => startGame(true); $('btnAgainTouch').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.55; saveSettings(); muteLabel(); };
muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
