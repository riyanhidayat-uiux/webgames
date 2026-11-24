'use strict';
// ---------- UI ----------
function hearts(el, p) {
  let h = '';
  const gained = el._l !== undefined && p.lives > el._l;
  for (let i = 0; i < p.max; i++) h += `<span class="${i >= p.lives ? 'lost' : (gained && i === p.lives - 1 ? 'gain' : '')}">❤</span>`;
  el.innerHTML = h; el._l = p.lives;
}
function renderHud() {
  if (versus) {
    $('vs1').textContent = pl[0].score; $('vs2').textContent = pl[1].score;
    if (chill) {
      [0, 1].forEach(i => { $('vl' + (i + 1)).innerHTML = `<span style="font-size:15px;color:#9dffb0;letter-spacing:1px">🌿 terlewat ${pl[i].missed}</span>`; $('vl' + (i + 1))._l = undefined; });
    } else { hearts($('vl1'), pl[0]); hearts($('vl2'), pl[1]); }
    return;
  }
  $('score').textContent = score;
  $('bestHud').textContent = gm === 'arcade' ? 'REKOR LEVEL ' + Math.max(bestA.lv, camp.level) : gm === 'boss' ? 'REKOR BOS ' + Math.max(bestA.boss, camp.bossesDown) : (chill ? 'REKOR SANTAI ' : (settings.timed ? 'REKOR 5 MENIT ' : 'TERBAIK ')) + Math.max(bests[bestKey()], score);
  $('lives').classList.toggle('hidden', chill);
  $('chillBadge').classList.toggle('hidden', !chill);
  if (chill) $('chillBadge').textContent = '🌿 SANTAI · terlewat ' + missed;
  const sp = $('lives').children;
  for (let i = 0; i < 5; i++) sp[i].classList.toggle('lost', i >= lives);
  const lv = $('lives');
  if (lv._l !== undefined && lives > lv._l) { const e = sp[lives - 1]; e.classList.remove('gain'); void e.offsetWidth; e.classList.add('gain'); }
  lv._l = lives;
}
function updateHud() { renderHud(); vsCheck(); }
function vsCheck() {
  if (!versus || state !== 'play') return;
  const a = pl[0], b = pl[1];
  if (!chill && !vsHandicap && !sudden && Math.abs(a.score - b.score) > 20) {
    const l = a.score < b.score ? a : b;
    l.max = 6; l.lives++; vsHandicap = true;
    toast(`Handicap: ${l === a ? 'P1' : 'P2'} tertinggal >20 poin → +1 ❤`, 2600);
    renderHud();
  }
  let w = null;
  if (sudden) {
    if (a.lives <= 0 || b.lives <= 0) w = (a.lives <= 0 && b.lives <= 0) ? 'tie' : (a.lives <= 0 ? 1 : 0);
    else if (sdT <= 0) w = a.score === b.score ? 'tie' : (a.score > b.score ? 0 : 1);
  } else if (a.lives <= 0 || b.lives <= 0) {
    if (a.lives <= 0 && b.lives <= 0) {
      if (a.score === b.score) {
        sudden = true; sdT = 30; a.lives = b.lives = a.max = b.max = 1;
        toast('SERI! → SUDDEN DEATH: 1 ❤, 30 detik', 3200);
        renderHud(); return;
      }
      w = a.score > b.score ? 0 : 1;
    } else w = a.lives <= 0 ? 1 : 0;
  }
  if (w !== null) { winner = w; state = 'dying'; dieT = 0.9; }
}
function hudOff() { show('hud', false); show('hudVs', false); show('campHud', false); show('bossHud', false); }
function setVersus(v) {
  versus = v;
  $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v);
  show('btnSensor', !v); show('vsHelp', v); show('chillHelp', chill);
}
function setChill(c) {
  chill = c;
  $('btnChill').classList.toggle('on', c);
  $('btnChill').textContent = '🌿 Mode Santai: ' + (c ? 'NYALA' : 'MATI');
  show('chillHelp', c);
  $('btnInf').classList.toggle('on', c);
  $('btnInf').textContent = c ? '♾️ Nyawa: ON' : '♾️ Nyawa';
}
$('btnChill').onclick = () => setChill(!chill);
const timedLabel = () => { $('btnTimed').classList.toggle('on', settings.timed); $('btnTimed').textContent = '⏱️ Waktu: ' + (settings.timed ? '5 MENIT' : 'BEBAS'); };
$('btnTimed').onclick = () => { settings.timed = !settings.timed; saveSettings(); timedLabel(); };
timedLabel();
function onTimeUp() {
  timeUp = true;
  texts.push({ x: W / 2, y: H * 0.36, s: 'WAKTU HABIS!', sub: '', life: 1.6, color: '#ffd23f', big: 1.7 });
  if (versus) {
    const a = pl[0].score, b = pl[1].score;
    if (a === b && !chill) {
      sudden = true; sdT = 30; pl[0].lives = pl[1].lives = pl[0].max = pl[1].max = 1;
      toast('WAKTU HABIS — SERI! SUDDEN DEATH 30 detik, 1 ❤', 3400); renderHud(); return;
    }
    winner = a === b ? 'tie' : (a > b ? 0 : 1);
  }
  state = 'dying'; dieT = 1.0; sfx.combo();
}
function updateTimer(dt) {
  if (gm !== 'classic' || !settings.timed || state !== 'play' || timeUp) return;
  timeLeft -= dt;
  const sec = Math.ceil(Math.max(0, timeLeft)), txt = '⏱ ' + fmtT(timeLeft), low = timeLeft <= 10;
  if (versus) { if (!sudden) $('sdTimer').textContent = txt; }
  else { $('timerS').textContent = txt; $('timerS').classList.toggle('low', low); }
  if (sec !== lastSec) { lastSec = sec; if (sec <= 5 && sec > 0) tone(0.09, 880, 880, 0.12, 'square'); }
  if (timeLeft <= 0) { timeLeft = 0; onTimeUp(); }
}
$('btnInf').onclick = () => {
  setChill(!chill); updateHud();
  toast(chill ? '♾️ Nyawa tak terbatas NYALA — buah jatuh tidak membuatmu kalah (bom −10 poin).' + (versus ? ' Akhiri lewat ⏸ → Selesai: skor tertinggi menang.' : '') : 'Nyawa tak terbatas MATI — kembali ke aturan biasa.', 2600);
};
$('btnM1').onclick = () => setVersus(false);
$('btnM2').onclick = () => setVersus(true);
let toastTimer = 0;
function toast(msg, ms = 3200) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
function show(id, on) { $(id).classList.toggle('hidden', !on); }

function startGame(useSensor, useCam = false) {
  fruits = []; halves = []; parts = []; splats = []; texts = []; misses = []; queue = [];
  score = 0; lives = 5; missed = 0; spawnT = 0.7; shake = 0; flash = 0;
  timeLeft = MATCH_T; timeUp = false; lastSec = -1; $('timerS').textContent = ''; $('timerS').classList.remove('low');
  pl = [mkP(), mkP()]; winner = null; sudden = false; sdT = 0; vsHandicap = false; starT = 9; spawnZ = [0.7, 1.1];
  vc = [mkVc(0), mkVc(1)]; $('sdTimer').textContent = '';
  rings = []; freeze = [{ t: 0, a: 0 }, { t: 0, a: 0 }]; fever = [{ c: 0, t: 0, a: 0 }, { c: 0, t: 0, a: 0 }];
  $('lives')._l = $('vl1')._l = $('vl2')._l = undefined;
  if (versus) useSensor = false;
  state = 'play';
  sens.on = useSensor;
  sensorBlade = makeBlade(450);
  camBlade = makeBlade(380);
  cam.on = useCam; cam.has = false; cam.seen = false;
  if (!useCam) stopCamera();
  calibrate();
  show('menu', false); show('over', false); show('paused', false);
  show('hud', !versus); show('hudVs', versus); show('gameBtns', true); show('btnInf', true);
  $('btnCal').style.display = useSensor ? '' : 'none';
  campStart();
  updateHud();
  if (useCam) {
    toast('Tunjukkan jari telunjuk ke kamera depan, lalu sabetkan cepat untuk menebas!', 3800);
    setTimeout(() => {
      if (state === 'play' && cam.on && !cam.seen) toast('Jari belum terlihat. Pastikan cahaya cukup dan tangan ±30–60 cm dari kamera.', 4200);
    }, 4500);
  }
  if (useSensor) {
    sens.seen = false;
    toast('Pegang HP dengan nyaman — posisi ini jadi titik tengah. Miringkan untuk bergerak, kibaskan untuk menebas!', 3800);
    setTimeout(() => {
      if (state === 'play' && sens.on && !sens.seen) {
        sens.on = false;
        $('btnCal').style.display = 'none';
        toast('Sensor gerak tidak terdeteksi di perangkat/browser ini. Mode sentuhan aktif.', 4200);
      }
    }, 1800);
  }
}

function gameOver() {
  state = 'over';
  sens.on = false;
  stopCamera();
  show('paused', false);
  show('btnAgainSensor', !versus);
  if (versus) {
    lbAfterGame('classic', 0);
    $('overTitle').textContent = winner === 'tie' ? 'SERI!' : `🏆 P${winner + 1} MENANG`;
    $('overScore').textContent = `${pl[0].score} : ${pl[1].score}`;
    $('overBest').textContent = 'Skor P1 : P2';
  } else if (gm !== 'classic') {
    const isB = gm === 'boss', val = isB ? camp.bossesDown : camp.level, rec = isB ? bestA.boss : bestA.lv, nb = val > rec;
    if (nb) { if (isB) { bestA.boss = val; store.set('bestBoss', val); } else { bestA.lv = val; store.set('bestArcadeLv', val); } }
    $('overTitle').textContent = nb && val > 0 ? 'REKOR BARU!' : 'GAME OVER';
    $('overScore').textContent = score;
    $('overBest').textContent = isB ? `Bos dikalahkan: ${camp.bossesDown} · rekor ${Math.max(rec, val)}` : `Sampai level ${camp.level} · rekor ${Math.max(rec, val)}`;
    lbAfterGame(gm, val);
  } else {
    lbAfterGame('classic', 0);
    const key = bestKey(), nb = score > bests[key];
    if (nb) { bests[key] = score; store.set(key, score); }
    const label = chill ? ' santai' : (settings.timed ? ' 5 menit' : '');
    $('overTitle').textContent = nb && score > 0 ? (chill ? 'REKOR SANTAI!' : 'REKOR BARU!') : (timeUp ? 'WAKTU HABIS!' : (chill ? 'SELESAI' : 'GAME OVER'));
    $('overScore').textContent = score;
    $('overBest').textContent = (chill ? `Terlewat: ${missed} · ` : '') + 'Rekor' + label + ': ' + bests[key];
  }
  hudOff(); show('gameBtns', false);
  show('over', true);
}

function pauseGame() {
  if (state !== 'play') return;
  state = 'paused';
  show('btnFinish', chill);
  show('paused', true);
}

async function onStartSensor() {
  initAudio();
  const ok = await enableSensors();
  startGame(ok);
}
let camBusy = false;
async function onStartCam() {
  if (camBusy) return;
  camBusy = true;
  initAudio();
  show('camHelp', false);
  const ok = await enableCamera();
  let go = ok;
  if (ok) { go = await CamGuide.run({ cam, video, kind: 'finger', game: 'Buah Ninja' }); if (!go) stopCamera(); }
  camBusy = false;
  if (go) startGame(false, true);
}
$('btnCamRetry').onclick = () => { if (location.protocol === 'http:' && location.hostname !== 'localhost') { location.href = location.href.replace(/^http:/, 'https:'); return; } onStartCam(); };
$('btnCamTouch').onclick = () => { show('camHelp', false); initAudio(); startGame(false); };
$('btnCamMenu').onclick = () => { show('camHelp', false); show('menu', true); };
$('btnCam').onclick = onStartCam;
$('btnAgainCam').onclick = onStartCam;
$('btnSensor').onclick = onStartSensor;
$('btnAgainSensor').onclick = onStartSensor;
$('btnTouch').onclick = () => { initAudio(); startGame(false); };
$('btnAgainTouch').onclick = () => { initAudio(); startGame(false); };
$('btnCal').onclick = () => { calibrate(); toast('Dikalibrasi ✔', 1200); };
$('btnPause').onclick = pauseGame;
$('btnFinish').onclick = () => {
  if (versus) winner = pl[0].score === pl[1].score ? 'tie' : (pl[0].score > pl[1].score ? 0 : 1);
  gameOver();
};
$('btnResume').onclick = () => { show('paused', false); state = 'play'; last = performance.now(); };
$('btnHome').onclick = () => { show('over', false); hudOff(); show('gameBtns', false); sens.on = false; stopCamera(); state = 'menu'; fruits = []; halves = []; parts = []; rings = []; texts = []; show('menu', true); };
$('btnQuit').onclick = () => { show('paused', false); hudOff(); show('gameBtns', false); sens.on = false; stopCamera(); state = 'menu'; fruits = []; show('menu', true); };
const muteLabel = () => { $('btnMute').textContent = settings.mute ? '🔇' : '🔊'; };
$('btnMute').onclick = () => { settings.mute = !settings.mute; if (master) master.gain.value = settings.mute ? 0 : 0.5; saveSettings(); muteLabel(); };
muteLabel();

const sSens = $('sSens'), sFlick = $('sFlick'), sInv = $('sInv');
sSens.value = settings.sens; sFlick.value = settings.flick; sInv.checked = settings.invY;
sSens.oninput = () => { settings.sens = +sSens.value; saveSettings(); };
sFlick.oninput = () => { settings.flick = +sFlick.value; saveSettings(); };
sInv.onchange = () => { settings.invY = sInv.checked; saveSettings(); };
const sCam = $('sCam'), sPrev = $('sPrev');
sCam.value = settings.camRange; sPrev.checked = settings.camPreview;
sCam.oninput = () => { settings.camRange = +sCam.value; saveSettings(); };
sPrev.onchange = () => { settings.camPreview = sPrev.checked; saveSettings(); };
const sMus = $('sMus'); sMus.checked = settings.music !== false; sMus.onchange = () => { settings.music = sMus.checked; saveSettings(); };
if (window.isSecureContext === false) show('secureWarn', true);

document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(() => { resize(); if (sens.on) calibrate(); }, 250));
