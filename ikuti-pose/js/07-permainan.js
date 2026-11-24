'use strict';
// ======================= PERMAINAN =======================
function judgeFrame() {
  if (state !== 'play') return;
  for (const m of choreo) {
    if (m.done) continue; const t = m.beat * beatDur, dtm = songT - t;
    if (dtm >= -WIN && dtm <= WIN) PLY.forEach((p, i) => { if (p.valid && p.J) { const e = poseError(p.J, m.pose.J); if (e != null && e < m.best[i]) m.best[i] = e; if (Math.abs(dtm) < 0.12 || true) p.sim = simPct(e); } });
    if (dtm > WIN) finalize(m);
  }
}
function finalize(m) {
  m.done = true; const bonusScr = [];
  PLY.forEach((p, i) => {
    const g = gradeOf(m.best[i]); m.res[i] = g; p.counts[g]++;
    if (g === 'miss' || g === 'ok') p.combo = 0; else { p.combo++; p.maxCombo = Math.max(p.maxCombo, p.combo); }
    const mult = 1 + Math.min(1, Math.floor(p.combo / 5) * 0.1), pts = Math.round(GP[g] * mult); p.score += pts;
    const sx = p.scr ? p.scr.x : SW * (versus ? (i ? 0.7 : 0.3) : 0.6), sy = p.scr ? p.scr.y : SH * 0.4; popText(GN[g] + (pts ? ' +' + pts : ''), sx, sy, GC[g]); if (g === 'perfect') confetti(i);
    if (i === 0) sfx.hit(g);
  });
  flashT = 1; lastGrade = m.res.slice(); updateHud();
}
let flashT = 0, lastGrade = [null, null], conf = [];
function confetti(i) { const x0 = PLY[i].scr ? PLY[i].scr.x : SW / 2, y0 = PLY[i].scr ? PLY[i].scr.y : SH / 2; for (let k = 0; k < 16; k++) conf.push({ x: x0, y: y0, vx: (Math.random() - 0.5) * 500, vy: -Math.random() * 450 - 100, c: ['#ff4aa8', '#ffd24a', '#4aa8ff', '#7fffd0'][k % 4], life: 0.9, s: 5 + Math.random() * 5 }); }
const PAD = 0.04;
function startSong(withCam) {
  const sg = SONGS[settings.song]; song = sg; beatDur = 60 / sg.bpm; choreo = makeChoreo(sg); songT = 0; nextStep = 0; lastBeat = -1; conf = [];
  PLY.forEach(p => { p.score = 0; p.combo = 0; p.maxCombo = 0; p.counts = { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 }; p.sim = 0; });
  show('hud', true); show('danceBox', true); resize(); show('gameBtns', true); show('pc1', versus); $('pc0').classList.toggle('r', !versus); $('pc0').classList.toggle('l', versus); $('pc1').classList.toggle('r', versus); $('songT').textContent = sg.e + ' ' + sg.name; updateHud();
  state = 'play'; say('SIAP!', '#ffd24a'); if (withCam) toast('Tirukan pose penari tepat pada ketukan. Kerangka menyala saat mirip!', 4000); else toast('Demo: tekan Spasi (P1) / Enter (P2) tepat pada ketukan!', 4500);
}
function endSong() {
  state = 'over'; stopCamera(); sfx.end(); const total = choreo.length;
  const rows = PLY.map(p => { const pts = p.counts.perfect * 100 + p.counts.great * 80 + p.counts.good * 50 + p.counts.ok * 20, pct = pts / (total * 100), stars = pct >= 0.92 ? 5 : pct >= 0.78 ? 4 : pct >= 0.6 ? 3 : pct >= 0.4 ? 2 : pct >= 0.2 ? 1 : 0; return { p, pct, stars, rank: pct >= 0.92 ? 'S' : pct >= 0.78 ? 'A' : pct >= 0.6 ? 'B' : pct >= 0.4 ? 'C' : 'D' }; });
  let title = 'SELESAI!', grade = rows[0].rank, info;
  if (versus) { const a = rows[0].p.score, b = rows[1].p.score; title = a === b ? 'SERI!' : '🏆 P' + (a > b ? 1 : 2) + ' MENANG!'; grade = a + ' : ' + b; info = `Combo terbaik P1 ${rows[0].p.maxCombo} / P2 ${rows[1].p.maxCombo} · lagu ${song.name}`; }
  else { const r = rows[0], key = 'best_' + song.id, prev = store.get(key, 0), nb = r.p.score > prev; if (nb) store.set(key, r.p.score); info = `${r.p.score} poin${nb ? ' — REKOR BARU!' : ''} · combo terbaik ${r.p.maxCombo} · ${song.name}${prev && !nb ? ' · rekor ' + prev : ''}`; }
  $('overTitle').textContent = title; $('overGrade').textContent = grade; $('overStars').textContent = versus ? '' : '★'.repeat(rows[0].stars) + '☆'.repeat(5 - rows[0].stars); $('overInfo').textContent = info;
  const cn = ['perfect', 'great', 'good', 'ok', 'miss']; let t = '<table class="sum"><tr><th></th>' + PLY.map((p, i) => `<th>${versus ? 'P' + (i + 1) : 'Hasil'}</th>`).join('') + '</tr>'; cn.forEach(k => { t += `<tr><td>${GN[k]}</td>` + PLY.map(p => `<td>${p.counts[k]}</td>`).join('') + '</tr>'; }); t += '</table>'; $('overTable').innerHTML = t;
  ['hud', 'gameBtns', 'danceBox', 'waitBox', 'count'].forEach(i => show(i, false)); show('over', true);
}
function toMenu() { stopCamera(); state = 'menu'; ['paused', 'over', 'hud', 'gameBtns', 'danceBox', 'count', 'waitBox'].forEach(i => show(i, false)); show('menu', true); }
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'torso', game: 'Ikuti Pose' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastCx = [null, null]; PLY = (versus ? [0, 1] : [0]).map(mkPly); show('menu', false); show('over', false); show('paused', false);
  if (withCam) { state = 'wait'; waitT = 0; show('waitBox', true); show('gameBtns', true); $('waitS').textContent = versus ? 'Berdirilah berdampingan di depan kamera sampai kerangka kalian muncul…' : 'Berdiri ±2 meter dari kamera sampai kerangkamu muncul di layar…'; }
  else startSong(false);
}
let waitT = 0, pausedFrom = 'play';
function pauseGame() { if (state !== 'play') return; pausedFrom = state; state = 'paused'; show('paused', true); }
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = 'play'; }
addEventListener('keydown', e => {
  const k = e.key; if (k === 'p' || k === 'Escape') { if (state === 'paused') resumeGame(); else pauseGame(); return; }
  if (state === 'play' && !useCam && !e.repeat) { if (k === ' ') { e.preventDefault(); tapTiming(0); } else if (k === 'Enter' && versus) tapTiming(1); }
});
// mode demo: ketukan dinilai dari ketepatan waktu saja
function tapTiming(pi) {
  let bm = null, bd = Infinity; for (const m of choreo) { if (m.done) continue; const d = Math.abs(songT - m.beat * beatDur); if (d < bd) { bd = d; bm = m; } }
  if (!bm || bd > WIN) { const p = PLY[pi]; p.combo = 0; popText('TERLALU CEPAT', SW * 0.5, SH * 0.4, '#ff6a8a'); updateHud(); return; }
  const e = bd < 0.1 ? 8 : bd < 0.18 ? 22 : bd < 0.26 ? 34 : 46; if (e < bm.best[pi]) bm.best[pi] = e;
}
