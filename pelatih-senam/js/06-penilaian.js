'use strict';
// ======================= PENILAIAN =======================
function judge(p, f, now) {
  const c = curEx(); if (!c) return; const E = EXS[c.ex], m = measure(f, p.base); let a = null, out = null;
  if (E.kind === 'cycle') { a = c.ex === 'jj' ? m.jj : c.ex === 'squat' ? m.squat : m.press; out = stepRep(p.R, a, now); p.meter = a == null ? 0 : clamp(a, 0, 1.4); }
  else if (E.kind === 'alt2') { const o1 = stepRep(p.R, m.kneeL, now), o2 = stepRep(p.R2, m.kneeR, now); out = o1 && o1.rep ? o1 : (o2 && o2.rep ? o2 : (o1 || o2)); a = Math.max(m.kneeL == null ? 0 : m.kneeL, m.kneeR == null ? 0 : m.kneeR); p.meter = clamp(a, 0, 1.4); }
  else { a = m.lean; out = stepSide(p.R, a, now); p.meter = clamp(Math.abs(a), 0, 1.4); }
  if (out && out.rep) addRep(p, out.rep);
  else if (out && out.partial && elapsed - p.fbT > 1.2) { p.fb = E.tip; p.fbT = elapsed; sfx.miss(); }
}
function addRep(p, q) {
  const c = curEx(); if (!c || p.done) return; p.tot++; p.streak++; p.qual.push(q === 'perfect' ? 1 : 0.7); p.kcal += EXS[c.ex].kcal;
  const pts = Math.round(10 * (q === 'perfect' ? 1.5 : 1) * (1 + Math.min(1, p.streak * 0.08))); p.score += pts; p.fb = q === 'perfect' ? 'SEMPURNA!' : 'BAGUS!'; p.fbT = elapsed;
  sfx.rep(q); if (p.i === 0 || versus) { const el = $('rep' + p.i); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 130); }
  if (p.scr) popText('+' + pts, p.scr.x, p.scr.y - p.scr.T * 1.4, q === 'perfect' ? '#ffe36a' : '#7fffd0');
  if (!versus && (p.tot % 5 === 0 || p.tot === c.reps)) speak(String(p.tot)); else if (!versus && p.tot <= 3) speak(String(p.tot));
  if (p.tot >= c.reps) { p.done = true; p.score += Math.round(exT) * 2; say(versus ? 'P' + (p.i + 1) + ' SELESAI!' : 'TARGET TERCAPAI!', '#7fffd0'); }
  updateHud();
}
