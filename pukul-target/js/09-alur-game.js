'use strict';
// ======================= ALUR GAME =======================
function resetRun() {
  clearBubbles(); PL = (versus ? [0, 1] : [0]).map(mkP); spawnT = 0.6; tPlay = 0; hitsTot = 0; missTot = 0; lives = 5; timeLeft = 90; fever = { c: 0, t: 0 }; nextPref = 0;
  PART.forEach(p => { p.life = 0; p.m.visible = false; }); RINGS.forEach(r => { r.life = 0; r.m.visible = false; }); updateHud(); updateFever();
}
function startCountdown() {
  state = 'count'; show('waitBox', false); let n = 3; const c = $('count'); show('count', true);
  const set = () => { c.textContent = n > 0 ? n : 'PUKUL!'; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(); }; set();
  const iv = setInterval(() => { if (state !== 'count') { clearInterval(iv); show('count', false); return; } n--; if (n < 0) { clearInterval(iv); show('count', false); state = 'play'; return; } set(); }, 800);
}
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'upper', game: 'Pukul Target' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastCx = [null, null]; ptrs.forEach((p, id) => { if (!p.mouse) ptrs.delete(id); });
  resetRun(); show('menu', false); show('over', false); show('paused', false); show('hud', !versus); show('hudVs', versus); show('fever', !versus || true); show('gameBtns', true);
  if (withCam) { state = 'wait'; waitT = 0; show('waitBox', true); $('waitT').textContent = 'SIAP-SIAP'; $('waitS').textContent = versus ? 'Berdirilah berdampingan di depan kamera (P1 kiri, P2 kanan) sampai kerangka kalian muncul…' : 'Berdiri ±2 meter dari kamera sampai kerangkamu muncul di layar…'; toast('Gerakkan tangan untuk memukul bola. Hindari 💣!', 4000); }
  else { startCountdown(); toast(versus ? 'P1: sisi kiri layar · P2: sisi kanan. Gerakkan mouse / sentuh untuk memukul!' : 'Gerakkan mouse (atau sentuh layar) untuk memukul bola. Hindari 💣!', 4000); }
}
function endGame() { if (state === 'dying' || state === 'over') return; state = 'dying'; dieT = 0.9; }
function gameOver() {
  state = 'over'; stopCamera(); sfx.over(); clearBubbles();
  if (versus) { const a = PL[0].score, b = PL[1].score; $('overTitle').textContent = a === b ? 'SERI!' : `🏆 P${a > b ? 1 : 2} MENANG!`; $('overScore').textContent = `${a} : ${b}`; $('overInfo').textContent = `Target kena P1 ${PL[0].hits} / P2 ${PL[1].hits} · combo terbaik ${PL[0].maxCombo} / ${PL[1].maxCombo}`; }
  else { const p = PL[0], nb = p.score > best; if (nb) { best = p.score; store.set('best', best); } const tot = hitsTot + missTot; $('overTitle').textContent = nb && p.score > 0 ? 'REKOR BARU!' : 'GAME OVER'; $('overScore').textContent = p.score; $('overInfo').textContent = `${p.hits} target kena · akurasi ${tot ? Math.round(hitsTot / tot * 100) : 0}% · combo terbaik ${p.maxCombo} · terbaik ${best}`; }
  ['hud', 'hudVs', 'fever', 'gameBtns', 'waitBox'].forEach(i => show(i, false)); show('over', true);
}
function toMenu() { stopCamera(); state = 'menu'; clearBubbles(); ['paused', 'over', 'hud', 'hudVs', 'fever', 'gameBtns', 'count', 'waitBox'].forEach(i => show(i, false)); show('menu', true); }
function pauseGame() { if (state !== 'play') return; state = 'paused'; show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; }
$('btnCam').onclick = () => startGame(true); $('btnPtr').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainPtr').onclick = () => startGame(false);
$('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.55; saveSettings(); muteLabel(); }; muteLabel();
addEventListener('keydown', e => { if (e.key === 'p' || e.key === 'Escape') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
