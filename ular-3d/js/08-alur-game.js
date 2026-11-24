'use strict';
// ---------- alur game ----------
function setVersus(v) {
  versus = v;
  $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v);
  show('vsHelp', v);
  $('camBox').classList.toggle('vs', v);
  if (state === 'menu') resetGame();
}
$('btnM1').onclick = () => setVersus(false);
$('btnM2').onclick = () => setVersus(true);

async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'finger', game: 'Ular 3D' }))) { stopCamera(); return; } }
  else stopCamera();
  useCam = withCam; cam.on = withCam;
  cam.pl.forEach(q => { q.cand = null; q.cnt = 0; }); cam.lastMx = [null, null];
  $('camBox').classList.toggle('vs', versus);
  resetGame();
  show('menu', false); show('over', false); show('paused', false);
  show('hud', !versus); show('hudVs', versus); show('gameBtns', true);
  show('camBox', withCam); $('camBox').style.opacity = settings.prev ? 1 : 0;
  state = 'play';
  const c = $('count'); let n = 3;
  show('count', true); c.textContent = n; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
  const iv = setInterval(() => {
    n--;
    if (state === 'menu' || state === 'over') { clearInterval(iv); show('count', false); return; }
    if (n <= 0) { clearInterval(iv); show('count', false); return; }
    c.textContent = n; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go');
  }, 300);
  if (withCam) toast(versus ? 'Tunjukkan 2 tangan: kiri = P1, kanan = P2. Arahkan telunjuk ke arah belok!' : 'Arahkan telunjuk ke arah yang diinginkan. Pastikan tangan terlihat di kamera!', 3800);
  else toast(versus ? 'P1: geser sisi kiri / WASD · P2: geser sisi kanan / panah' : 'Geser jari / pakai panah atau WASD untuk belok.', 3200);
}

function gameOver() {
  state = 'over';
  stopCamera();
  if (versus) {
    $('overTitle').textContent = winner === 'tie' ? 'SERI!' : `🏆 P${winner + 1} MENANG`;
    $('overScore').textContent = `${players[0].score} : ${players[1].score}`;
    $('overInfo').textContent = `Skor P1 : P2 · panjang ${players[0].apples + 4} / ${players[1].apples + 4}`;
  } else {
    const p = players[0], nb = p.score > best;
    if (nb) { best = p.score; store.set('best', best); }
    $('overTitle').textContent = nb && p.score > 0 ? 'REKOR BARU!' : 'GAME OVER';
    $('overScore').textContent = p.score;
    $('overInfo').textContent = `${p.apples} apel · terbaik ${best}`;
  }
  show('hud', false); show('hudVs', false); show('gameBtns', false); show('over', true);
}
function toMenu() {
  stopCamera(); state = 'menu';
  show('paused', false); show('over', false); show('hud', false); show('hudVs', false); show('gameBtns', false); show('count', false); show('menu', true);
  resetGame();
}
function pauseGame() { if (state !== 'play') return; state = 'paused'; show('csPauseBox', useCam); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; acc = Math.min(acc, 0); }

$('btnCam').onclick = () => startGame(true);
$('btnTouch').onclick = () => startGame(false);
$('btnAgainCam').onclick = () => startGame(true);
$('btnAgainTouch').onclick = () => startGame(false);
$('btnHome').onclick = toMenu;
$('btnQuit').onclick = toMenu;
$('btnPause').onclick = pauseGame;
$('btnResume').onclick = resumeGame;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.5; saveSettings(); muteLabel(); };
muteLabel();
$('oWrap').checked = settings.wrap; $('oPrev').checked = settings.prev;
$('oWrap').onchange = e => { settings.wrap = e.target.checked; saveSettings(); };
$('oPrev').onchange = e => { settings.prev = e.target.checked; saveSettings(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
