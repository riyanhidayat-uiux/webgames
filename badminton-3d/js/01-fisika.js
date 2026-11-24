'use strict';
// ---------- fisika ----------
const G = 9.8, CD = G / (6.5 * 6.5);          // kecepatan jatuh maksimum kok ~6,5 m/s
const HL = 6.7, HW = 2.9, NET_H = 1.55;       // setengah panjang / lebar lapangan, tinggi net
function simLand(px, py, pz, vx, vy, vz) {
  const h = 1 / 90; let x = px, y = py, z = pz, yNet = null;
  for (let i = 0; i < 900; i++) {
    const sp = Math.hypot(vx, vy, vz);
    vx -= CD * sp * vx * h; vy += (-G - CD * sp * vy) * h; vz -= CD * sp * vz * h;
    const z0 = z; x += vx * h; y += vy * h; z += vz * h;
    if (yNet === null && z0 !== z && z0 * z <= 0) yNet = y;
    if (y <= 0) return { x, z, yNet, t: i * h };
  }
  return { x, z, yNet, t: 10 };
}
function solveShot(px, py, pz, tx, tz, theta) {
  const dx = tx - px, dz = tz - pz, D = Math.hypot(dx, dz) || 1, hx = dx / D, hz = dz / D;
  let th = theta;
  for (let att = 0; att < 7; att++, th += 5) {
    const rad = th * Math.PI / 180, c = Math.cos(rad), sn = Math.sin(rad);
    let lo = 3, hi = 80;
    for (let k = 0; k < 16; k++) {
      const m = (lo + hi) / 2, r = simLand(px, py, pz, hx * c * m, sn * m, hz * c * m);
      if (Math.hypot(r.x - px, r.z - pz) < D) lo = m; else hi = m;
    }
    const m = (lo + hi) / 2, r = simLand(px, py, pz, hx * c * m, sn * m, hz * c * m);
    if ((r.yNet === null || r.yNet >= NET_H + 0.2) && Math.hypot(r.x - tx, r.z - tz) < 1.6) return { v: [hx * c * m, sn * m, hz * c * m], land: r };
  }
  return null;
}
