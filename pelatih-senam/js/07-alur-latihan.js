'use strict';
// ======================= ALUR LATIHAN =======================
function setCoach(ex, text) { coachEx = ex; coachT = 0; $('coachSay').textContent = text || EXS[ex].desc; }
function startProgram() {
  prog = PROGS[settings.prog].list.map(([ex, reps, time]) => ({ ex, reps, time })); exI = 0; PLY.forEach(p => { p.reps = []; p.score = 0; p.kcal = 0; });
  PLY.forEach(p => { p.tot = 0; p.streak = 0; p.qual = []; p.done = false; p.R = mkRep(); p.R2 = mkRep(); p.fb = ''; });
  beginIntro();
}
function beginIntro() {
  const c = curEx(); state = 'intro'; introT = 5; PLY.forEach(p => { p.tot = 0; p.streak = 0; p.done = false; p.R = mkRep(); p.R2 = mkRep(); p.fb = ''; p.meter = 0; });
  setCoach(c.ex); $('restT').textContent = exI === 0 ? 'SIAP-SIAP' : 'LATIHAN BERIKUTNYA'; $('restN').textContent = EXS[c.ex].name; $('restD').textContent = EXS[c.ex].desc + ' Target ' + c.reps + ' kali dalam ' + c.time + ' detik.'; show('rest', true); updateHud(); speak(EXS[c.ex].name);
  ['hud'].forEach(i => show(i, true));
}
function beginWork() { const c = curEx(); state = 'work'; exT = c.time; show('rest', false); say('MULAI!', '#7fffd0'); sfx.go(); speak('Mulai'); setCoach(c.ex, EXS[c.ex].tip); }
function endExercise() {
  const c = curEx(); PLY.forEach(p => { p.reps.push({ ex: c.ex, target: c.reps, done: p.tot, qual: p.qual.length ? p.qual.reduce((a, b) => a + b, 0) / p.qual.length : 0 }); });
  if (exI + 1 >= prog.length) { finishWorkout(); return; }
  state = 'rest'; restT = 8; exI++; sfx.rest(); const n = curEx(); setCoach(n.ex, 'Istirahat dulu. Berikutnya: ' + EXS[n.ex].name);
  $('restT').textContent = 'ISTIRAHAT'; $('restN').textContent = 'Berikutnya: ' + EXS[n.ex].name; $('restD').textContent = 'Atur napas… ' + EXS[n.ex].desc; show('rest', true); say(PLY.every(p => p.tot >= c.reps) ? 'BAGUS SEKALI!' : 'SELESAI!', '#ffd23f');
}
function finishWorkout() {
  state = 'over'; stopCamera(); sfx.done(); speak('Latihan selesai. Kerja bagus');
  const rows = PLY.map(p => { const tot = p.reps.reduce((a, r) => a + r.target, 0), dn = p.reps.reduce((a, r) => a + Math.min(r.done, r.target), 0), q = p.reps.filter(r => r.done).reduce((a, r) => a + r.qual, 0) / Math.max(1, p.reps.filter(r => r.done).length), ratio = dn / Math.max(1, tot); return { p, tot, dn, ratio, q, grade: ratio >= 0.95 && q >= 0.8 ? 'S' : ratio >= 0.8 ? 'A' : ratio >= 0.6 ? 'B' : 'C' }; });
  let title = 'LATIHAN SELESAI!', grade = rows[0].grade, info;
  if (versus) { const w = rows[0].p.score === rows[1].p.score ? -1 : rows[0].p.score > rows[1].p.score ? 0 : 1; title = w < 0 ? 'SERI!' : '🏆 P' + (w + 1) + ' MENANG!'; grade = rows[0].p.score + ' : ' + rows[1].p.score; info = `Poin P1 ${rows[0].p.score} / P2 ${rows[1].p.score} · kalori P1 ${rows[0].p.kcal.toFixed(1)} / P2 ${rows[1].p.kcal.toFixed(1)} kkal`; }
  else { const r = rows[0], nb = r.p.score > best; if (nb) { best = r.p.score; store.set('best', best); } info = `${r.dn} dari ${r.tot} repetisi · ${r.p.score} poin${nb ? ' — REKOR BARU!' : ''} · ±${r.p.kcal.toFixed(1)} kkal terbakar · rekor ${best}`; }
  $('overTitle').textContent = title; $('overGrade').textContent = grade; $('overInfo').textContent = info;
  const exs = PLY[0].reps; let t = '<table class="sum"><tr><th>Latihan</th>' + PLY.map((p, i) => `<th>${versus ? 'P' + (i + 1) : 'Hasil'}</th>`).join('') + '</tr>';
  exs.forEach((r, k) => { t += `<tr><td>${EXS[r.ex].name}</td>` + PLY.map(p => { const q = p.reps[k]; return `<td>${q.done}/${q.target}${q.done >= q.target ? ' ✔' : ''}</td>`; }).join('') + '</tr>'; }); t += '</table>';
  if (!versus) t += `<div class="hint" style="margin:4px auto">Nilai latihan: <b>${rows[0].grade}</b></div>`; $('overTable').innerHTML = t;
  ['hud', 'gameBtns', 'rest', 'coachBox'].forEach(i => show(i, false)); show('over', true);
}
function toMenu() { stopCamera(); state = 'menu'; ['paused', 'over', 'hud', 'gameBtns', 'rest', 'coachBox', 'count', 'calibBox'].forEach(i => show(i, false)); show('menu', true); document.body.classList.remove('vs'); }
async function startGame(withCam) {
  initAudio();
  if (withCam) { const ok = await enableCamera(); if (!ok) return; if (!(await CamGuide.run({ cam, video, kind: 'full', game: 'Pelatih Senam' }))) { stopCamera(); return; } } else stopCamera();
  useCam = withCam; cam.on = withCam; cam.lastCx = [null, null]; PLY = (versus ? [0, 1] : [0]).map(mkPly);
  show('menu', false); show('over', false); show('paused', false); show('gameBtns', true); show('btnCal', withCam); show('coachBox', true); resize(); show('pc1', versus); document.body.classList.toggle('vs', versus); show('hud', true);
  $('pc0').classList.toggle('r', !versus); $('pc0').classList.toggle('l', versus); $('pc1').classList.toggle('l', false); $('pc1').classList.toggle('r', versus); setCoach('jj', 'Halo! Aku pelatihmu. Ikuti gerakanku ya!');
  if (withCam) { state = 'calib'; show('calibBox', true); show('calBox2', versus); show('calS2', versus); $('calS').textContent = (versus ? 'P1 (kiri) dan P2 (kanan): ' : '') + 'berdiri ±2,5–3 meter dari kamera sampai seluruh badan terlihat, tangan lurus di samping badan…'; $('calBar').style.width = '0%'; $('calS2').textContent = versus ? 'P2: menunggu…' : ''; $('calBar2').style.width = '0%'; show('rest', false); show('hud', false); toast('Pastikan kepala sampai kaki terlihat dan ruangan cukup terang.', 4500); }
  else { PLY.forEach(p => { p.base.ok = true; p.calOk = true; }); startProgram(); toast(versus ? 'Demo: Spasi = repetisi P1, Enter = repetisi P2' : 'Demo: tekan Spasi untuk menghitung 1 repetisi', 4500); }
}
function recalibrate() { if (!useCam || (state !== 'work' && state !== 'intro' && state !== 'rest')) return; PLY.forEach(p => { p.cal = []; p.calOk = false; }); state = 'calib'; show('calibBox', true); show('rest', false); show('hud', false); }
function pauseGame() { if (state !== 'work' && state !== 'intro' && state !== 'rest') return; pausedFrom = state; state = 'paused'; show('paused', true); }
let pausedFrom = 'work';
function resumeGame() { if (state !== 'paused') return; show('paused', false); state = pausedFrom; }
function skip() { if (state === 'intro') beginWork(); else if (state === 'rest') beginIntro(); else if (state === 'work') endExercise(); }
addEventListener('keydown', e => {
  const k = e.key; if (k === 'p' || k === 'Escape') { if (state === 'paused') resumeGame(); else pauseGame(); return; }
  if (!useCam && state === 'work') { if (k === ' ') { e.preventDefault(); addRep(PLY[0], 'good'); } if (k === 'Enter' && PLY[1]) addRep(PLY[1], 'perfect'); }
});
