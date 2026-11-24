'use strict';
// ======================= HUD =======================
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color, pi = -1) {
  const m = $(pi < 0 || !versus ? 'msg' : pi === 0 ? 'msg1' : 'msg2'); if (versus && pi >= 0) show(pi === 0 ? 'msg1' : 'msg2', true);
  m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show');
}
const heartsHtml = pl => { if (noLives()) return ''; let h = ''; for (let i = 0; i < 3; i++) h += `<span class="${i >= pl.lives ? 'lost' : ''}">❤</span>`; return h; };
function updateHud() {
  if (versus) {
    for (let i = 0; i < 2; i++) { const p = PL[i]; $('vs' + (i + 1)).textContent = p.score; $('vl' + (i + 1)).innerHTML = heartsHtml(p); $('vc' + (i + 1)).textContent = p.combo >= 2 ? '🔥 x' + Math.min(5, p.combo) : ''; }
    $('wallHud2').textContent = 'DINDING ' + Math.max(...PL.map(p => p.cleared)); return;
  }
  const p = PL[0]; $('score').textContent = p.score; if (practice) { const t = pracTotals(); $('wallHud').textContent = 'LOLOS ' + t.ok + ' / ' + t.n; } else $('wallHud').textContent = 'LV ' + levelOf(wallNo > 0 ? wallNo - 1 : 0) + ' · DINDING ' + p.cleared; $('comboHud').textContent = p.combo >= 2 ? '🔥 COMBO x' + Math.min(5, p.combo) : '';
  $('bestHud').textContent = practice ? '🎓 LATIHAN' : 'TERBAIK ' + Math.max(best, p.score); $('lives').innerHTML = heartsHtml(p);
}
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function updateTimerHud(force) {
  if (!chill) return; const s = Math.max(0, Math.ceil(timeLeft)); if (s === timeShown && !force) return; timeShown = s;
  ['timerHud', 'timerHud2'].forEach(id => { const e = $(id); e.textContent = fmtTime(s); e.classList.toggle('low', s <= 30); });
}
function drawIcon(ctx, w, h, J, col, lw, keep) {
  if (!keep) ctx.clearRect(0, 0, w, h); const sx = w / 5.2, sy = h / 6.2, X = v => w / 2 + v * sx, Y = v => h * 0.27 - v * sy;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
  ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(X(J.sL.x), Y(J.sL.y)); ctx.lineTo(X(J.sR.x), Y(J.sR.y)); ctx.lineTo(X(J.hR.x), Y(J.hR.y)); ctx.lineTo(X(J.hL.x), Y(J.hL.y)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
  ctx.beginPath(); for (const [a, b] of BONES) { ctx.moveTo(X(J[a].x), Y(J[a].y)); ctx.lineTo(X(J[b].x), Y(J[b].y)); } ctx.stroke();
  ctx.beginPath(); ctx.arc(X(J.nose.x), Y(J.nose.y), 0.3 * sx, 0, 6.283); ctx.fill();
}
const HINT = [{ box: 'hint', ctx: $('hintC').getContext('2d'), name: 'hintName', fill: 'hintFill', pose: null }, { box: 'hint2', ctx: $('hintC2').getContext('2d'), name: 'hintName2', fill: 'hintFill2', pose: null }];
function setHint(i, w, h) {
  const H = HINT[i];
  if (!w || !h) { if (H.pose) { H.pose = null; H.ctx.clearRect(0, 0, 192, 224); $(H.name).textContent = ''; } $(H.fill).style.width = '0%'; return; }
  if (H.pose !== h.pose) { H.pose = h.pose; drawIcon(H.ctx, 192, 224, h.J, versus ? PTXT[i] : '#7fffd0', 9); if (h.alt) drawIcon(H.ctx, 192, 224, h.alt.J, '#ffb36a', 6, true); $(H.name).textContent = h.alt ? h.pose.name + ' / ' + h.alt.pose.name : h.pose.name; $(H.name).style.color = versus ? PTXT[i] : '#7fffd0'; const L = $(H.name).textContent.length; $(H.name).style.fontSize = L > 22 ? '13px' : L > 13 ? '16px' : ''; }
  $(H.fill).style.width = Math.round(clamp(1 - Math.abs(w.z) / 34, 0, 1) * 100) + '%';
}
// tombol pose (tanpa kamera): satu baris per pemain
function buildPresetBars() {
  [['presetBar', 0], ['presetBar2', 1]].forEach(([id, pi]) => {
    const bar = $(id); bar.innerHTML = '';
    POSES.forEach((p, i) => { const b = document.createElement('button'), c = mkCanvas(88, 100); b.appendChild(c); b.appendChild(document.createTextNode((pi === 0 && i < 9 ? (i + 1) + ' ' : pi === 0 && i === 9 ? '0 ' : '') + p.name));
      drawIcon(c.getContext('2d'), 88, 100, buildPose(p.spec, { arm: 1, torso: 1 }), '#cfc4ff', 5); b.onclick = () => { setPreset(pi, i); initAudio(); }; bar.appendChild(b); (p['btn' + pi] = b); });
  });
}
function setPreset(pi, i) { if (!PL[pi]) return; PL[pi].preset = i; POSES.forEach((p, k) => { if (p['btn' + pi]) p['btn' + pi].classList.toggle('on', k === i); }); const bt = POSES[i] && POSES[i]['btn' + pi]; if (bt && bt.scrollIntoView) try { bt.scrollIntoView({ inline: 'nearest', block: 'nearest' }); } catch (e) {} }
function stepLane(d) { const p = PL[0]; if (!p || versus) return; p.pxT = clamp(Math.round(p.pxT / SLIDE_LANE) + d, -1, 1) * SLIDE_LANE; }   // tanpa kamera: geser satu jalur
$('stepL').onclick = () => stepLane(-1); $('stepR').onclick = () => stepLane(1);
addEventListener('keydown', e => {
  const k = e.key;
  if (!useCam && state !== 'menu') {
    const cyc = (pi, d) => setPreset(pi, (PL[pi].preset + d + POSES.length) % POSES.length), m = '1234567890'.indexOf(k);
    if (m >= 0 && m < POSES.length) setPreset(0, m);
    if (k === 'q' || k === 'Q') stepLane(-1);
    if (k === 'e' || k === 'E') stepLane(1);
    if (k === 'a' || k === 'A' || (!versus && k === 'ArrowLeft')) cyc(0, -1);
    if (k === 'd' || k === 'D' || (!versus && k === 'ArrowRight')) cyc(0, 1);
    if (versus && k === 'ArrowLeft') cyc(1, -1);
    if (versus && k === 'ArrowRight') cyc(1, 1);
  }
  if (k === 'p' || k === 'Escape') { if (state === 'play') pauseGame(); else if (state === 'paused') resumeGame(); }
});

// lencana power-up aktif
function powHud() {
  const el = $('powHud'); if (!el) return; const t = [pw.wide > 0 ? `⭕×${pw.wide}` : '', pw.slow > 0 ? `⏳×${pw.slow}` : ''].filter(Boolean).join('  ');
  if (el._t !== t) { el._t = t; el.textContent = t; el.classList.toggle('hidden', !t); }
}
