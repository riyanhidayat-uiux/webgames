'use strict';
// ======================= GAMBAR =======================
const iconCache = {};
function icon(p) { if (iconCache[p.id]) return iconCache[p.id]; const c = document.createElement('canvas'); c.width = 96; c.height = 116; const x = c.getContext('2d'), J = p.J, sx = 96 / 5.2, sy = 116 / 6.2, X = v => 48 + v * sx, Y = v => 116 * 0.3 - v * sy; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#fff'; x.fillStyle = '#fff'; x.lineWidth = 6;
  x.globalAlpha = 0.25; x.beginPath(); x.moveTo(X(J.sL.x), Y(J.sL.y)); x.lineTo(X(J.sR.x), Y(J.sR.y)); x.lineTo(X(J.hR.x), Y(J.hR.y)); x.lineTo(X(J.hL.x), Y(J.hL.y)); x.closePath(); x.fill(); x.globalAlpha = 1; x.beginPath(); for (const [a, b] of [['sL', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['sR', 'eR'], ['eR', 'wR'], ['sL', 'hL'], ['sR', 'hR'], ['hL', 'hR'], ['hL', 'kL'], ['kL', 'aL'], ['hR', 'kR'], ['kR', 'aR'], ['c', 'nose']]) { x.moveTo(X(J[a].x), Y(J[a].y)); x.lineTo(X(J[b].x), Y(J[b].y)); } x.stroke(); x.beginPath(); x.arc(X(J.nose.x), Y(J.nose.y), 0.3 * sx, 0, 6.283); x.fill(); return (iconCache[p.id] = c); }
function drawLane() {
  if (!song || state !== 'play') return; const lw = Math.min(SW * 0.62, 640), x0 = SW / 2 - lw / 2 + 30, y = 12 + 8, hh = 96, horizon = beatDur * Math.max(5, song.spacing + 2);
  fctx.fillStyle = 'rgba(0,0,0,.45)'; fctx.beginPath(); fctx.roundRect ? fctx.roundRect(SW / 2 - lw / 2 - 10, y - 8, lw + 20, hh + 22, 16) : fctx.rect(SW / 2 - lw / 2 - 10, y - 8, lw + 20, hh + 22); fctx.fill();
  const pulseR = 1 + 0.12 * pulse; fctx.strokeStyle = '#ffd24a'; fctx.lineWidth = 4; fctx.beginPath(); fctx.arc(x0, y + hh / 2, 48 * pulseR, 0, 6.283); fctx.stroke();
  for (const m of choreo) { const t = m.beat * beatDur, d = t - songT; if (d < -0.6 || d > horizon) continue; const px = x0 + (d / horizon) * (lw - 40), near = d >= -0.3 && d < beatDur * 1.5, sc = near ? 1 : 0.8, im = icon(m.pose); fctx.globalAlpha = d < 0 ? Math.max(0, 1 + d / 0.6) : 1;
    fctx.fillStyle = near ? 'rgba(255,106,200,.55)' : 'rgba(255,255,255,.18)'; fctx.fillRect(px - 36 * sc, y + hh / 2 - 46 * sc, 72 * sc, 92 * sc); fctx.drawImage(im, px - 36 * sc, y + hh / 2 - 46 * sc, 72 * sc, 88 * sc);
    if (d < 0 && m.res[0]) { fctx.fillStyle = GC[m.res[0]]; fctx.font = 'bold 14px system-ui'; fctx.textAlign = 'center'; fctx.fillText(GN[m.res[0]], px, y + hh / 2 + 56 * sc); } fctx.globalAlpha = 1; }
}
function drawFx(dt) {
  fctx.clearRect(0, 0, SW, SH); drawLane();
  if (useCam) PLY.forEach((p, i) => {
    if (!p.valid || !p.raw) return; const P = p.raw, pt = n => imgToScreen(P[n].nx, P[n].ny), sim = p.sim, match = sim > 0.6, col = match ? '#7fff9a' : (versus ? PCOL[i][0] : '#ff9ae0');
    fctx.lineCap = 'round'; fctx.shadowColor = col; fctx.shadowBlur = match ? 20 : 10; fctx.strokeStyle = col; fctx.lineWidth = Math.max(4, SH * 0.011);
    for (const [a, b] of SKB) { if (P[a].v < 0.3 || P[b].v < 0.3) continue; const A = pt(a), B = pt(b); fctx.beginPath(); fctx.moveTo(A.x, A.y); fctx.lineTo(B.x, B.y); fctx.stroke(); }
    fctx.shadowBlur = 0; fctx.fillStyle = '#fff'; for (const n of ['nose', 'wL', 'wR']) { if (P[n].v < 0.3) continue; const A = pt(n); fctx.beginPath(); fctx.arc(A.x, A.y, 6, 0, 6.283); fctx.fill(); }
    const S = imgToScreen((P.sL.nx + P.sR.nx) / 2, (P.sL.ny + P.sR.ny) / 2), Hh = P.hL.v > 0.3 ? imgToScreen((P.hL.nx + P.hR.nx) / 2, (P.hL.ny + P.hR.ny) / 2) : { x: S.x, y: S.y + 150 }; p.scr = { x: S.x, y: S.y - 60 };
    $('sim' + i).style.width = Math.round(sim * 100) + '%';
  });
  else PLY.forEach((p, i) => { $('sim' + i).style.width = '0%'; });
  for (const c of conf) { c.life -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 900 * dt; if (c.life > 0) { fctx.globalAlpha = Math.min(1, c.life * 2); fctx.fillStyle = c.c; fctx.fillRect(c.x, c.y, c.s, c.s); } } conf = conf.filter(c => c.life > 0); fctx.globalAlpha = 1;
}
function resize() { SW = innerWidth; SH = innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2); fx.width = SW * dpr; fx.height = SH * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0); const b = $('danceBox').getBoundingClientRect(), w = Math.max(60, b.width || 240), h = Math.max(80, b.height || 330); dR.setSize(w, h, false); dC.aspect = w / h; dC.updateProjectionMatrix(); }
addEventListener('resize', resize);
