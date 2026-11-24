'use strict';
// ======================= RENDER =======================
function drawFx(dt) {
  fctx.clearRect(0, 0, SW, SH);
  PL.forEach((pl, i) => {
    if (!pl.valid) return; const col = versus ? PTXT[i] : '#7fffd0';
    fctx.lineCap = 'round'; fctx.shadowColor = col; fctx.shadowBlur = 12; fctx.strokeStyle = col; fctx.lineWidth = Math.max(3, SH * 0.008); fctx.globalAlpha = 0.85;
    for (const [a, b] of pl.bones) { fctx.beginPath(); fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y); fctx.stroke(); }
    fctx.globalAlpha = 1;
    for (const q of pl.pts) { const big = q.kind === 'hand'; fctx.shadowBlur = big ? 18 : 8; fctx.fillStyle = big ? '#ffffff' : col; fctx.globalAlpha = big ? 0.9 : 0.6; fctx.beginPath(); fctx.arc(q.x, q.y, big ? q.r * 0.55 : q.r * 0.35, 0, 6.283); fctx.fill(); if (big) { fctx.globalAlpha = 0.5; fctx.strokeStyle = col; fctx.lineWidth = 3; fctx.beginPath(); fctx.arc(q.x, q.y, q.r * 0.8, 0, 6.283); fctx.stroke(); } }
    fctx.globalAlpha = 1; fctx.shadowBlur = 0;
  });
}
function resize() { SW = innerWidth; SH = innerHeight; renderer.setSize(SW, SH, false); camera.aspect = SW / SH; camera.updateProjectionMatrix(); const dpr = Math.min(devicePixelRatio || 1, 2); fx.width = SW * dpr; fx.height = SH * dpr; fctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
addEventListener('resize', resize);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  detectPose(now); if (!useCam) ptrPoints();
  update(dt); drawFx(dt); renderer.render(scene, camera); requestAnimationFrame(frame);
}
resize(); $('bestHud').textContent = 'TERBAIK ' + best; requestAnimationFrame(frame);
