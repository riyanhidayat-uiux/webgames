'use strict';
// ======================= ALUR GAME =======================
function resetRun() {
  setTheme(0, true);
  walls.forEach(disposeWall); walls = []; wallNo = 0; pw = { wide: 0, slow: 0 }; if (typeof powHud === 'function') powHud(); pracReset(); chain = null; chainState = {}; spawnFrac = 0.55; spawnGap = 0.4; shake = 0; winner = null; best = store.get(bestKey(), 0); timeLeft = CHILL_TIME; timeShown = -1;
  PL = (versus ? [0, 1] : [0]).map(mkPlayer); PL.forEach((p, i) => { if (useCam) p.k = { arm: 1, torso: 1 }; });
  PART.forEach(p => { p.life = 0; p.m.visible = false; }); setHint(0, null); setHint(1, null);
  const cols = versus ? PCOLS : [[0x38d8ff, 0x0a5a78]]; AVS.forEach((a, i) => { a.setColor(...(cols[i] || cols[0])); a.g.visible = i < NP(); a.g.position.x = OFFS()[i] || 0; });
  $('hint').classList.toggle('vs', versus); updateHud(); updateTimerHud(true);
}
function startCountdown() {
  state = 'count'; let n = 3; const c = $('count'); show('count', true);
  const set = () => { c.textContent = n > 0 ? n : 'MULAI!'; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); sfx.tick(n); }; set();
  const iv = setInterval(() => { if (state !== 'count') { clearInterval(iv); show('count', false); return; } n--; if (n < 0) { clearInterval(iv); show('count', false); state = 'play'; return; } set(); }, 800);
}
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'full', game: 'Lubang di Dinding' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastCx = [null, null]; cam.has = false; calib.samples = [[], []]; calib.done = [false, false];
  resetRun();
  show('menu', false); show('over', false); show('paused', false); show('hud', !versus); show('hudVs', versus); show('hint', true); show('hint2', versus); show('gameBtns', true); show('btnCal', withCam); show('timerHud', chill && !versus); show('timerHud2', chill && versus); $('lives').classList.toggle('hidden', noLives()); ['vl1', 'vl2'].forEach(i => $(i).classList.toggle('hidden', chill));
  show('stepBtns', !withCam && !versus && !practice); show('presetBar', !withCam); show('presetBar2', !withCam && versus); show('msg1', false); show('msg2', false); $('presetBar').classList.toggle('vs', versus);
  if (!withCam) { buildPresetBars(); setPreset(0, 0); if (versus) setPreset(1, 0); }
  if (withCam) {
    show('camBox', true); applyPreview(); state = 'calib'; show('calibBox', true); show('calS2', versus); show('calBarBox2', versus);
    $('calS').textContent = versus ? 'P1 (kiri) dan P2 (kanan): berdiri berdampingan ±2–3 meter dari kamera, tangan lurus di samping badan…' : 'Berdiri ±2–3 meter dari kamera, tegak, tangan lurus di samping badan…'; $('calBar').style.width = '0%'; $('calS2').textContent = versus ? 'P2: menunggu…' : ''; $('calBar2').style.width = '0%';
    toast(versus ? 'Berdirilah berdampingan dengan jarak ±1 meter. P1 = orang di kiri layar, P2 = di kanan.' : 'Pastikan kepala, kedua lengan, dan pinggang terlihat di kotak pratinjau kiri bawah.', 5000);
  } else { startCountdown(); if (practice) toast('Mode Latihan: tanpa nyawa & tanpa waktu. Tekan ⏸ → Selesai untuk melihat ringkasan.', 4500); else if (chill) toast('Mode Santai: tidak ada nyawa, waktu 5 menit.', 3500); else toast(versus ? 'P1: tombol di kiri / angka · P2: tombol di kanan / panah ◀ ▶.' : 'Pilih pose dengan tombol di bawah layar (atau angka 1–9, 0, panah ◀ ▶).', 4000); }
}
function recalibrate() { if (!useCam || (state !== 'play' && state !== 'count')) return; calib.samples = [[], []]; calib.done = [false, false]; state = 'calib'; show('count', false); show('calibBox', true); show('calS2', versus); show('calBarBox2', versus); $('calS').textContent = 'Berdiri tegak, tangan lurus di samping badan…'; $('calBar').style.width = '0%'; $('calBar2').style.width = '0%'; }
function gameOver() {
  state = 'over'; stopCamera(); show('btnFinish', false); show('overTable', false); sfx.over();
  if (!versus && PL[0].score > best && PL[0].score > 0) setTimeout(() => sfx.record(), 900);
  if (versus) {
    lbAfterGame(null, 0); const a = PL[0].score, b = PL[1].score; winner = a === b ? 'tie' : a > b ? 0 : 1;
    $('overTitle').textContent = (chill ? 'WAKTU HABIS! ' : '') + (winner === 'tie' ? 'SERI!' : `🏆 P${winner + 1} MENANG!`); $('overScore').textContent = `${a} : ${b}`;
    $('overInfo').textContent = `${Math.max(...PL.map(p => p.cleared))} dinding · sempurna P1 ${PL[0].perfects} / P2 ${PL[1].perfects}`;
  } else if (practice) {
    lbAfterGame(null, 0); const r = pracSummary();
    $('overTitle').textContent = r.t.n ? (r.acc >= 80 ? 'LATIHAN BAGUS!' : 'LATIHAN SELESAI') : 'LATIHAN SELESAI'; $('overScore').textContent = r.t.ok + ' / ' + r.t.n; $('overInfo').textContent = r.t.n ? `${r.acc}% lolos · ${PL[0].perfects} sempurna · akurasi terbaik ${Math.round(PL[0].bestAcc * 100)}%` : 'Belum ada dinding yang dilewati.';
    $('overTable').innerHTML = r.html; show('overTable', !!r.html);
  } else {
    const p = PL[0], nb = p.score > best; if (nb) { best = p.score; store.set(bestKey(), best); }
    $('overTitle').textContent = nb && p.score > 0 ? 'REKOR BARU!' : chill ? 'WAKTU HABIS!' : 'GAME OVER'; $('overScore').textContent = p.score;
    lbAfterGame(lbBoard(), p.score);
    $('overInfo').textContent = `${p.cleared} dinding terlewati · ${p.perfects} sempurna · akurasi terbaik ${Math.round(p.bestAcc * 100)}% · terbaik ${best}${chill ? ' · mode santai' : ''}`;
  }
  ['hud', 'hudVs', 'hint', 'hint2', 'gameBtns', 'presetBar', 'presetBar2', 'stepBtns', 'msg1', 'msg2'].forEach(i => show(i, false)); show('over', true);
}
function toMenu() { setTheme(0, true); stopCamera(); state = 'menu'; walls.forEach(disposeWall); walls = []; ['paused', 'over', 'hud', 'hudVs', 'hint', 'hint2', 'gameBtns', 'count', 'calibBox', 'presetBar', 'presetBar2', 'stepBtns', 'msg1', 'msg2'].forEach(i => show(i, false)); show('menu', true); PL = (versus ? [0, 1] : [0]).map(mkPlayer); AVS.forEach((a, i) => { a.g.visible = i < NP(); a.g.position.x = OFFS()[i] || 0; a.setColor(...((versus ? PCOLS : [[0x38d8ff, 0x0a5a78]])[i] || [0x38d8ff, 0x0a5a78])); }); }
function pauseGame() { if (state !== 'play') return; state = 'paused'; show('btnFinish', practice && !versus); show('csPauseBox', useCam); show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; }
$('btnCam').onclick = () => startGame(true); $('btnKey').onclick = () => startGame(false); $('btnAgainCam').onclick = () => startGame(true); $('btnAgainKey').onclick = () => startGame(false);
$('btnFinish').onclick = () => { show('paused', false); gameOver(); }; $('btnHome').onclick = toMenu; $('btnQuit').onclick = toMenu; $('btnPause').onclick = pauseGame; $('btnResume').onclick = resumeGame; $('btnCal').onclick = recalibrate;
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.5; saveSettings(); muteLabel(); }; muteLabel();
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

// hasil satu dinding (per pemain)
function resolveWall(w) {
  w.done = true; let allPerfect = w.holes.length > 0, anyMiss = false;
  for (const h of w.holes) {
    const p = PL[h.pl], a = h.best, off = h.off + (w.hs || 0); h.done = true; p.bestAcc = Math.max(p.bestAcc, a);
    if (practice) { pracRecord(h, a >= 0.78, a); p.retry = a >= 0.78 ? null : h.pose; }
    if (a >= 0.78) {
      p.combo++; const mult = Math.min(5, Math.max(1, p.combo)), grade = a >= 0.97 ? ['SEMPURNA!', 100, sfx.perfect, '#7fffd0'] : a >= 0.88 ? ['BAGUS!', 70, sfx.good, '#ffd23f'] : ['LOLOS', 40, sfx.ok, '#cfc4ff'];
      if (a >= 0.97) { fxPerfect(off); AVS[h.pl].flash(0x7fffd0); } else if (a >= 0.88) { fxGood(off); AVS[h.pl].flash(0xffd23f); } else AVS[h.pl].flash(0xcfc4ff);
      const pts = grade[1] * mult; p.score += pts; p.cleared++; if (a >= 0.97) p.perfects++; else allPerfect = false; grade[2](p.combo); say(grade[0] + ' +' + pts, grade[3], h.pl);
      burst(off, -0.5, 0.5, 26, ['#7fffd0', '#ffd23f', '#ffffff', '#ff7ad0'], 6);
      if (h.alt && a >= 0.78) { const ta = h.pose.tier, tb = h.alt.pose.tier, ch = h.ba > h.bm ? tb : ta, ot = h.ba > h.bm ? ta : tb; if (ch > ot) { p.score += 25; setTimeout(() => { if (state === 'play') say('PILIHAN BERANI +25', '#ffb36a', h.pl); }, 450); } }
      if (w.boss) { const extra = pts * 2; p.score += extra; setTimeout(() => { if (state === 'play') say('BOS KALAH! +' + (pts + extra), '#ffd23f', h.pl); }, 400); fxRing(off, -0.5, 0.5, 0xffd23f, 13, 0.8); sfx.bossWin(); }
      if (w.slide) { p.score += 30; setTimeout(() => { if (state === 'play') say('LANGKAH +30', '#9fe7ff', h.pl); }, 600); }
      if (h.adapt) { p.score += 30; setTimeout(() => { if (state === 'play') say('ADAPTASI +30', '#ffb36a', h.pl); }, 500); }
    } else {
      allPerfect = false; anyMiss = true; p.combo = 0; if (!noLives()) p.lives--; shake = noLives() ? 0.55 : 1; sfx.miss(); fxCrash(off); AVS[h.pl].flash(0xff4a6a); say(a > 0.2 ? 'KENA DINDING!' : 'TIDAK TERDETEKSI', '#ff5a7a', h.pl); $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on');
      burst(off, -0.5, 0.5, 40, ['#ff5a7a', w.color, '#ffffff'], 8); try { navigator.vibrate && navigator.vibrate([80, 40, 160]); } catch (e) {}
      if (!noLives() && p.lives <= 0) p.alive = false;
    }
  }
  if (versus && allPerfect && w.holes.length === 2) { PL.forEach(p => { p.score += 50; }); say('KOMPAK! +50', '#ffe36a', -1); sfx.team(); burst(0, 0.5, 0.8, 40, ['#ffe36a', '#ffffff', '#ff7ad0'], 7); }
  if (w.power && !anyMiss && w.holes.length) grantPower(w.power);
  if (practice) spawnGap = anyMiss ? 1.9 : 1.2;
  if (!anyMiss && w.holes.length) { const perf = allPerfect ? 1 : 0.6; fxShatter(w, perf); w.g.visible = false; sfx.whoosh(); sfx.shatter(allPerfect ? 1 : 0); }
  if (w.chain) {
    const g = chainState[w.chain.id] || (chainState[w.chain.id] = { ok: true, n: 0 }); if (anyMiss) g.ok = false; g.n++;
    if (g.n === w.chain.len && g.ok) { const bonus = 50 * w.chain.len; PL.forEach(p => { if (p.alive) p.score += bonus; }); setTimeout(() => { if (state === 'play') say('RANTAI x' + w.chain.len + '! +' + bonus, '#ffe36a', -1); }, 350); sfx.chain(); burst(0, 0.5, 0.8, 50, ['#9fe7ff', '#ffe36a', '#ffffff'], 7); fxRing(0, 0, 0.5, 0x9fe7ff, 11, 0.7); }
  }
  updateHud();
  if (PL.every(p => !p.alive)) { state = 'dying'; dieT = 1.2; }
}

// hadiah power-up dari dinding berlogo
function grantPower(k) {
  const P = POWERS[k]; sfx.power();
  if (k === 'life') { PL.forEach(p => { if (p.alive && p.lives < 3) p.lives++; }); } else pw[k] = P.n;
  setTimeout(() => { if (state === 'play') say(P.icon + ' ' + P.name, '#ffe36a', -1); }, 350); fxRing(0, 0, 0.5, 0xffe36a, 10, 0.7); burst(0, 0.5, 0.8, 30, ['#ffe36a', '#ffffff', '#ff7ad0'], 6); powHud(); updateHud();
}
