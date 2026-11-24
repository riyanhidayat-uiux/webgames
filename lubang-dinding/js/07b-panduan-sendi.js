'use strict';
// ======================= PANDUAN KOREKSI SENDI =======================
// Saat dinding mendekat, game menunjuk sendi yang paling meleset dari lubang: teks ("Angkat tangan kanan") + panah 3D dari sendimu ke tempat seharusnya.
const COACH_J = [['nose', 'kepala'], ['hdL', 'tangan kiri'], ['hdR', 'tangan kanan'], ['eL', 'siku kiri'], ['eR', 'siku kanan'], ['kL', 'lutut kiri'], ['kR', 'lutut kanan'], ['aL', 'kaki kiri'], ['aR', 'kaki kanan']];
const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.92, depthTest: false });
const ARROWS = [0, 1].map(() => {
  const g = new THREE.Group(), shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 10), arrowMat), cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 14), arrowMat);
  g.add(shaft, cone); g.visible = false; g.renderOrder = 20; shaft.renderOrder = cone.renderOrder = 20; scene.add(g); return { g, shaft, cone };
});
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0);
function placeArrow(a, ox, from, to, pulse) {
  _a.set(from.x + ox, from.y, 0.45); _b.set(to.x + ox, to.y, 0.45); _d.subVectors(_b, _a); const len = _d.length(); if (len < 0.28) { a.g.visible = false; return; }
  _d.normalize(); const head = 0.5, sl = Math.max(0.05, len - head), off = 0.12 * Math.sin(pulse * 9);               // panah "mendorong" ke arah tujuan
  _q.setFromUnitVectors(_up, _d); a.shaft.quaternion.copy(_q); a.cone.quaternion.copy(_q);
  a.shaft.scale.set(1, sl, 1); a.shaft.position.copy(_a).addScaledVector(_d, sl / 2 + off); a.cone.position.copy(_a).addScaledVector(_d, sl + head / 2 + off); a.g.visible = true;
}
// untuk dinding 'pilih salah satu': pakai pose yang paling dekat dengan posisi tubuh saat ini
function poseErr(B, J) { let m = 0; for (const [n] of COACH_J) { const P = B[n], T = J[n]; if (P && T && P.v >= 0.3) m = Math.max(m, Math.hypot(T.x - P.x, T.y - P.y)); } return m; }
function holeView(h, B) { if (!h.alt) return h; return poseErr(B, h.alt.J) < poseErr(B, h.J) ? { J: h.alt.J, pose: h.alt.pose, off: h.off } : h; }
const coachSt = [{ key: null, txt: '' }, { key: null, txt: '' }];
function coachText(n, name, d, rad) {
  const side = n.endsWith('L') ? -1 : 1, ax = Math.abs(d.x), ay = Math.abs(d.y);
  if (n === 'nose' && ax >= ay * 0.7) return (d.x > 0 ? '➡ Geser kepala ke kanan' : '⬅ Geser kepala ke kiri');
  if (ay >= ax) return d.y > 0 ? `⬆ Angkat ${name}` : `⬇ Turunkan ${name}`;
  if (n === 'nose') return d.x > 0 ? '➡ Geser kepala ke kanan' : '⬅ Geser kepala ke kiri';
  return (d.x * side > 0) ? `${side < 0 ? '⬅' : '➡'} Rentangkan ${name} ke samping` : `${side < 0 ? '➡' : '⬅'} Rapatkan ${name} ke badan`;
}
function coachUpdate(now) {
  const active = state === 'play';
  for (let i = 0; i < 2; i++) {
    const el = $('coach' + i), pl = PL[i], st = coachSt[i]; let txt = '', cls = '', arrow = null;
    if (active && i < NP() && pl && pl.alive && pl.B.valid) {
      const nh = nearestHole(i), w = nh.w, h = nh.h && holeView(nh.h, pl.B.J);
      if (w && h && !w.done && w.z > -31 && w.z < 0.4) {
        const B = pl.B.J, rad = w.rad; let worst = null, we = 0, lat = w.slide ? pl.px - w.slide.s1 : 0;
        for (const [n, name] of COACH_J) {
          const P = B[n], T = h.J[n]; if (!P || !T || P.v < 0.3) continue;
          if (['kL', 'kR', 'aL', 'aR'].includes(n) && !hasLeg(h.pose.spec) && P.v < 0.55) continue;
          const e = Math.hypot(T.x - P.x, T.y - P.y); if (e > we) { we = e; worst = { n, name, P, T }; }
        }
        if (st.key && worst && st.key !== worst.n) {                             // histeresis: bertahan di sendi sebelumnya kecuali yang baru jauh lebih meleset
          const P0 = B[st.key], T0 = h.J[st.key]; if (P0 && T0) { const e0 = Math.hypot(T0.x - P0.x, T0.y - P0.y); if (e0 > rad * 0.95 && we < e0 * 1.25) worst = { n: st.key, name: COACH_J.find(c => c[0] === st.key)[1], P: P0, T: T0 }; }
        }
        if (w.slide && Math.abs(lat) > SLIDE_DEAD) { st.key = null; txt = lat > 0 ? '⬅ GESER BADAN KE KIRI' : 'GESER BADAN KE KANAN ➡'; cls = 'fix'; }
        else if (worst && we > rad * 0.95) {
          st.key = worst.n; txt = coachText(worst.n, worst.name, { x: worst.T.x - worst.P.x, y: worst.T.y - worst.P.y }, rad); cls = 'fix'; arrow = worst;
        } else { st.key = null; txt = '✓ POSE PAS — TAHAN!'; cls = 'ok'; }
      } else st.key = null;
    } else st.key = null;
    if (txt !== st.txt) { el.textContent = txt; el.classList.toggle('hidden', !txt); st.txt = txt; }
    el.classList.toggle('ok', cls === 'ok'); el.classList.toggle('fix', cls === 'fix'); el.classList.toggle('vs', versus);
    if (arrow) placeArrow(ARROWS[i], (OFFS()[i] || 0) + pl.ax, arrow.P, arrow.T, now / 1000); else ARROWS[i].g.visible = false;
  }
  // lencana rantai
  const cw = state === 'play' ? walls.filter(w => !w.done && w.chain).sort((a, b) => b.z - a.z)[0] : null, ch = $('chainHud');
  const t = cw ? `🔗 RANTAI ${cw.chain.idx + 1}/${cw.chain.len}` : ''; if (ch._t !== t) { ch._t = t; ch.textContent = t; ch.classList.toggle('hidden', !t); }
}
