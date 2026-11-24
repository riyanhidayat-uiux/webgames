'use strict';
// ======================= GAMBAR (overlay) =======================
const BONES = [['sL', 'sR'], ['sL', 'eL'], ['eL', 'wL'], ['sR', 'eR'], ['eR', 'wR'], ['sL', 'hL'], ['sR', 'hR'], ['hL', 'hR'], ['hL', 'kL'], ['kL', 'aL'], ['hR', 'kR'], ['kR', 'aR']];
function drawFx() {
  fctx.clearRect(0, 0, SW, SH); if (!useCam) return;
  PLY.forEach((p, i) => {
    if (!p.valid || !p.f) return; const f = p.f, P = f.raw, col = versus ? PCOL[i][0] : '#7fffd0', pt = n => imgToScreen(P[n].nx, P[n].ny);
    const reached = p.meter >= HI(); fctx.lineCap = 'round'; fctx.shadowColor = reached ? '#ffd23f' : col; fctx.shadowBlur = reached ? 18 : 10; fctx.strokeStyle = reached ? '#ffd23f' : col; fctx.lineWidth = Math.max(4, SH * 0.01);
    for (const [a, b] of BONES) { if (P[a].v < 0.3 || P[b].v < 0.3) continue; const A = pt(a), B = pt(b); fctx.beginPath(); fctx.moveTo(A.x, A.y); fctx.lineTo(B.x, B.y); fctx.stroke(); }
    fctx.shadowBlur = 0; fctx.fillStyle = '#fff'; for (const n of ['nose', 'wL', 'wR', 'kL', 'kR', 'aL', 'aR']) { if (P[n].v < 0.3) continue; const A = pt(n); fctx.beginPath(); fctx.arc(A.x, A.y, 5, 0, 6.283); fctx.fill(); }
    const S = imgToScreen((P.hL.nx + P.hR.nx) / 2, (P.hL.ny + P.hR.ny) / 2), Tp = Math.hypot(pt('sL').x - pt('hL').x, pt('sL').y - pt('hL').y) || 100; p.scr = { x: S.x, y: S.y - Tp, T: Tp };
    // meter amplitudo di samping badan: isi sampai garis target
    const mx = S.x + Tp * 1.15, mh = Tp * 2.2, my = S.y - Tp * 1.2, fill = clamp(p.meter / 1.3, 0, 1), tgt = clamp(HI() / 1.3, 0, 1);
    fctx.fillStyle = 'rgba(0,0,0,.5)'; fctx.fillRect(mx - 9, my, 18, mh); fctx.fillStyle = reached ? '#ffd23f' : col; fctx.fillRect(mx - 9, my + mh * (1 - fill), 18, mh * fill); fctx.strokeStyle = '#fff'; fctx.lineWidth = 3; fctx.beginPath(); fctx.moveTo(mx - 15, my + mh * (1 - tgt)); fctx.lineTo(mx + 15, my + mh * (1 - tgt)); fctx.stroke();
  });
}
function resize() { SW = innerWidth; SH = innerHeight; const dpr = Math.min(devicePixelRatio || 1, 2); fx.width = SW * dpr; fx.height = SH * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0); const b = $('coachBox').getBoundingClientRect(); const w = Math.max(60, b.width || 220), h = Math.max(80, b.height || 300); cR.setSize(w, h, false); cC.aspect = w / h; cC.updateProjectionMatrix(); }
addEventListener('resize', resize);
