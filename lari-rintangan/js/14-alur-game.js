'use strict';
// ---------- alur game ----------
function startCountdown() {
  state = 'count'; let n = 3;
  const c = $('count'); show('count', true);
  const set = () => { c.textContent = n > 0 ? n : 'LARI!'; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(); };
  set();
  const iv = setInterval(() => {
    if (state !== 'count') { clearInterval(iv); show('count', false); return; }
    n--;
    if (n < 0) { clearInterval(iv); show('count', false); state = 'play'; jumpArmed = true; return; }
    set();
  }, 800);
}
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'torso', game: 'Lari Rintangan' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; sm.init = false; base.ok = false; calib.samples = [];
  resetRun();
  show('menu', false); show('over', false); show('paused', false); show('hud', true); show('gameBtns', true); show('btnCal', withCam);
  if (withCam) {
    show('camBox', true); applyPreview(); state = 'calib';
    $('calT').textContent = 'KALIBRASI'; $('calS').textContent = 'Berdiri ±2 meter dari kamera, tegak, sampai kedua bahu terlihat…'; $('calBar').style.width = '0%'; show('calibBox', true);
    toast('Lihat kotak pratinjau di kiri bawah: garis kuning = batas lompat, ungu = batas merunduk, biru = batas geser.', 5500);
  } else { startCountdown(); toast('← → pindah jalur · ↑/spasi lompat · ↓ merunduk (atau geser layar)', 3500); }
}
function recalibrate() {
  if (!useCam || (state !== 'play' && state !== 'count')) return;
  base.ok = false; calib.samples = []; sm.init = false; state = 'calib'; show('count', false);
  $('calS').textContent = 'Berdiri tegak menghadap kamera…'; $('calBar').style.width = '0%'; show('calibBox', true);
}
function gameOver() {
  state = 'over'; stopCamera();
  const sc = finalScore(), nb = sc > best; if (nb) { best = sc; store.set('best', best); }
  $('overTitle').textContent = nb && sc > 0 ? 'REKOR BARU!' : 'GAME OVER';
  $('overScore').textContent = sc; $('overInfo').textContent = `${Math.floor(dist)} m · ${coinCount} koin · terbaik ${best}`;
  show('hud', false); show('gameBtns', false); show('over', true);
}
function toMenu() { stopCamera(); state = 'menu'; clearWorld(); ['paused', 'over', 'hud', 'gameBtns', 'count', 'calibBox'].forEach(i => show(i, false)); show('menu', true); }
function pauseGame() { if (state !== 'play') return; state = 'paused'; show('csPauseBox', useCam); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; }
$('btnCam').onclick = () => startGame(true); $('btnKey').onclick = () => startGame(false);
$('btnAgainCam').onclick = () => startGame(true); $('btnAgainKey').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnCal').onclick = recalibrate;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.5; saveSettings(); muteLabel(); };
muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
