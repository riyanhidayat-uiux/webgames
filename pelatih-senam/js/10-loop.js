'use strict';
// ======================= LOOP =======================
let last = performance.now(), cdLast = -1;
function update(dt) {
  elapsed += dt;
  if (state === 'intro') { introT -= dt; const n = Math.ceil(introT); if (n !== cdLast && n <= 3 && n > 0) { cdLast = n; sfx.tick(); } if (introT <= 0) { cdLast = -1; beginWork(); } $('tLabel').textContent = Math.max(0, Math.ceil(introT)); $('tFill').style.width = '100%'; }
  else if (state === 'work') {
    exT -= dt; const c = curEx(); $('tLabel').textContent = Math.max(0, Math.ceil(exT)); $('tFill').style.width = clamp(exT / c.time, 0, 1) * 100 + '%';
    PLY.forEach((p, i) => { if (p.fb && elapsed - p.fbT > 1.6 && p.fb !== EXS[c.ex].tip || (p.fb && elapsed - p.fbT > 2.4)) p.fb = ''; $('fb' + i).textContent = p.fb; $('sc' + i).textContent = p.score + ' poin'; $('rep' + i).textContent = p.tot; });
    if (exT <= 0 || PLY.every(p => p.done)) endExercise();
  } else if (state === 'rest') { restT -= dt; $('tLabel').textContent = Math.max(0, Math.ceil(restT)); $('tFill').style.width = clamp(restT / 8, 0, 1) * 100 + '%'; if (restT <= 0) beginIntro(); }
  coachT += dt; const period = coachEx === 'side' ? 3.2 : coachEx === 'knees' ? 1.6 : 2.4; applyCoach(coachPose(coachEx, (coachT % period) / period), Math.min(1, dt * 12));
  cR.render(cS, cC);
}
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  detectPose(now); if (state !== 'paused') update(dt); drawFx(); requestAnimationFrame(frame);
}
resize(); setVersus(false); toMenu(); requestAnimationFrame(frame);
