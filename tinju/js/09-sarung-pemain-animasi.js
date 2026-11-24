'use strict';
// ---------- sarung pemain: animasi ----------
function animateGloves(dt) {
  GL.forEach((G, i) => {
    let tx = G.home.x, ty = G.home.y, tz = G.home.z, rz = 0;
    if (P.guard) { tx = (i ? 1 : -1) * 0.17; ty = -0.14; tz = -1.0; }
    if (useCam && hands[i] && hands[i].valid && state === 'fight') { const w = hands[i].w; tx = clamp(w.x * 0.5, -0.7, 0.7); ty = clamp(w.y * 0.35 - 0.22, -0.6, 0.4); tz = -1.0 - clamp(w.z, -0.3, 1.2) * 0.5; }
    const a = gloveAnim[i];
    if (a) { a.t += dt; const u = clamp(a.t / a.dur, 0, 1), f = Math.sin(u * Math.PI); const sx = i ? 1 : -1;
      if (a.kind === 'jab') { tx = lerp(tx, sx * 0.12, f); ty = lerp(ty, -0.02, f); tz = lerp(tz, -2.35, f); }
      else if (a.kind === 'hook') { tx = lerp(sx * 0.8, -sx * 0.1, u); ty = -0.05; tz = lerp(-1.1, -2.2, f); rz = f * 0.6; }
      else { tx = sx * 0.12; ty = lerp(-0.6, 0.3, u); tz = lerp(-1.1, -2.25, f); }
      if (u >= 1) gloveAnim[i] = null; }
    G.cur.x += (tx - G.cur.x) * Math.min(1, dt * 22); G.cur.y += (ty - G.cur.y) * Math.min(1, dt * 22); G.cur.z += (tz - G.cur.z) * Math.min(1, dt * 22);
    G.g.position.set(G.cur.x, G.cur.y, G.cur.z); G.g.rotation.set(-0.3 - (P.guard ? 0.5 : 0), (i ? -1 : 1) * 0.2, rz * (i ? -1 : 1));
    updateArmFP(i, G);
  });
}
