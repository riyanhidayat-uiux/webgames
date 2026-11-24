'use strict';
// ---------- render ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

let hitT = 0;
// siklus lari: kunci paha (maju +) & tekuk lutut sepanjang satu putaran, diinterpolasi mulus
const RK = { u: [0, 0.12, 0.25, 0.4, 0.5, 0.65, 0.8, 0.92], th: [0.55, 0.35, 0.0, -0.45, -0.58, -0.1, 0.72, 0.78], kn: [0.25, 0.75, 0.45, 0.2, 0.5, 1.75, 1.5, 0.8] };
function cyc(vals, u) {
  const n = RK.u.length; let i = 0; for (let k = 0; k < n; k++) if (u >= RK.u[k]) i = k;
  const u0 = RK.u[i], u1 = i === n - 1 ? 1 : RK.u[i + 1], t = (u - u0) / (u1 - u0);
  const p0 = vals[(i - 1 + n) % n], p1 = vals[i], p2 = vals[(i + 1) % n], p3 = vals[(i + 2) % n];
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}
const ankleFor = (th, kn, u) => clamp((kn - th) * 0.85, -0.5, 0.9) - (u > 0.55 && u < 0.95 ? 0.15 : 0);   // telapak rata saat menapak
// tinggi dasar sepatu terhadap pinggul (kinematika maju) -> pinggul diturunkan sampai kaki terendah menapak jalan
const soleBottom = (th, kn, an) => {
  const ay = -0.02 - 0.44 * Math.cos(th) - 0.4 * Math.cos(th - kn), phi = th - kn + an;
  return ay + Math.min(-0.11 * Math.cos(phi) + 0.24 * Math.sin(phi), -0.11 * Math.cos(phi) - 0.1 * Math.sin(phi));
};
function animateRunner(dt) {
  P.run += dt * (state === 'play' ? 14 + speed * 0.25 : 4);
  const c = rig.cur, t = elapsed, p = P.run, playing = state === 'play';
  let mode, T;
  if (hitT > 0) { mode = 'hit'; T = { hipY: 0.9, torsoX: 0.45, headX: -0.3, thL: 0.5, thR: -0.4, knL: -0.9, knR: -0.5, anL: 0, anR: 0, arL: 1.4, arR: -1.2, elL: 0.8, elR: 0.9, yaw: 0, twist: 0, roll: 0, sway: 0 }; }
  else if (P.air) { mode = 'air'; T = { hipY: 1.0, torsoX: -0.12, headX: -0.1, thL: 0.95, thR: -0.3, knL: -1.25, knR: -1.5, anL: -0.5, anR: -0.6, arL: 2.5, arR: 2.5, elL: 0.35, elR: 0.35, yaw: 0, twist: 0, roll: 0, sway: 0 }; }
  else if (P.duckT > 0) { mode = 'duck'; T = { hipY: 0.57, torsoX: -0.8, headX: 0.45, thL: 1.3, thR: 1.3, knL: -2.05, knR: -2.05, anL: 0.75, anR: 0.75, arL: 0.7, arR: 0.7, elL: 1.1, elR: 1.1, yaw: 0, twist: 0, roll: 0, sway: 0 }; }
  else if (playing) {
    mode = 'run';
    const uL = ((p / 6.2832) % 1 + 1) % 1, uR = (uL + 0.5) % 1;
    const thL = cyc(RK.th, uL), kpL = cyc(RK.kn, uL), thR = cyc(RK.th, uR), kpR = cyc(RK.kn, uR);
    const anL = ankleFor(thL, kpL, uL), anR = ankleFor(thR, kpR, uR);
    const ground = -Math.min(soleBottom(thL, kpL, anL), soleBottom(thR, kpR, anR));
    const lift = 0.1 * Math.pow((1 + Math.cos(4 * Math.PI * (uL - 0.5))) / 2, 2);      // fase melayang di antara langkah
    const arL = 1.05 * thR, arR = 1.05 * thL;
    T = { hipY: ground + lift, torsoX: -0.22 + 0.03 * Math.cos(4 * Math.PI * uL), headX: 0.14, thL, thR, knL: -kpL, knR: -kpR, anL, anR, arL, arR,
      elL: 1.35 + 0.35 * clamp(arL, -0.6, 0.8), elR: 1.35 + 0.35 * clamp(arR, -0.6, 0.8), yaw: 0,
      twist: 0.16 * Math.sin(2 * Math.PI * uL), roll: 0.05 * Math.sin(2 * Math.PI * uL + 1.2), sway: 0.035 * Math.sin(2 * Math.PI * uL + 0.5) };
    // debu kecil saat tiap kaki mendarat
    if (uL < c.puL) burst(P.x - 0.11, 0.06, -0.25, 2, ['#e0d8c8', '#c8c0b0'], 1.1);
    if (uR < c.puR) burst(P.x + 0.11, 0.06, -0.25, 2, ['#e0d8c8', '#c8c0b0'], 1.1);
    c.puL = uL; c.puR = uR;
  } else if (state === 'dying') { mode = 'dying'; T = { hipY: 0.8, torsoX: 0.6, headX: -0.4, thL: 0.3, thR: -0.3, knL: -0.6, knR: -0.4, anL: 0, anR: 0, arL: 1.2, arR: -1.0, elL: 0.6, elR: 0.6, yaw: 0, twist: 0, roll: 0, sway: 0 }; }
  else {   // diam / sapa kamera
    mode = 'idle';
    const face = state === 'menu' || state === 'over';
    T = { hipY: 0.98 + 0.012 * Math.sin(t * 2.2), torsoX: 0.02, headX: 0, thL: 0.03, thR: -0.03, knL: -0.05, knR: -0.05, anL: 0, anR: 0, arL: 0.05 * Math.sin(t * 2), arR: face ? 2.65 + 0.28 * Math.sin(t * 7) : -0.05 * Math.sin(t * 2), elL: 0.15, elR: face ? 0.5 + 0.4 * Math.sin(t * 7) : 0.15, yaw: face ? Math.PI : 0, twist: 0, roll: 0, sway: 0 };
  }
  // saat berlari, sudut dipakai langsung agar kaki tetap menapak jalan (tanpa jeda penghalusan)
  c.runT = mode === 'run' ? c.runT + dt : 0;
  const kk = mode === 'run' ? Math.min(1, 0.25 + c.runT * 6) : Math.min(1, dt * (hitT > 0 ? 30 : 20));
  for (const key in T) c[key] += (T[key] - c[key]) * kk;
  rig.hips.position.y = c.hipY; rig.hips.position.x = c.sway; rig.hips.rotation.y = -0.6 * c.twist;
  rig.torso.rotation.x = c.torsoX; rig.torso.rotation.y = c.twist; rig.torso.rotation.z = c.roll; rig.head.rotation.x = c.headX; rig.head.rotation.z = -c.roll * 0.7;
  rig.lL.hp.rotation.x = c.thL; rig.lR.hp.rotation.x = c.thR; rig.lL.kn.rotation.x = c.knL; rig.lR.kn.rotation.x = c.knR;
  rig.lL.ft.rotation.x = c.anL; rig.lR.ft.rotation.x = c.anR;
  rig.aL.sh.rotation.x = c.arL; rig.aR.sh.rotation.x = c.arR; rig.aL.el.rotation.x = c.elL; rig.aR.el.rotation.x = c.elR;
  rig.aL.sh.rotation.z = -c.armZ; rig.aR.sh.rotation.z = c.armZ;
  // rambut, syal, gantungan: mengalir ke belakang makin kencang saat lari
  const sp = playing ? Math.min(1, 0.4 + speed / 30) : 0.15;
  rig.scarfSegs.forEach((g, i) => { g.rotation.y = 0.42 * sp * Math.sin(t * 12 - i * 0.9); g.rotation.x = (0.14 - 0.12 * sp) + (0.12 + 0.07 * i) * sp * Math.sin(t * 9.5 - i * 0.8); });
  rig.ponyChain.forEach((g, i) => { g.rotation.x = 0.22 * sp + 0.2 * sp * Math.sin(t * 11 - i * 0.8); g.rotation.z = 0.15 * sp * Math.sin(t * 8 - i); });
  rig.key.rotation.z = 0.5 * sp * Math.sin(t * 9); rig.key.rotation.x = 0.3 * sp * Math.sin(t * 7);
  // arah hadap: kamera di belakang saat main, menghadap kamera di menu
  c.yaw += (T.yaw - c.yaw) * Math.min(1, dt * 6);
  runner.rotation.y = c.yaw;
  runner.rotation.z = clamp((LANES[P.lane] - P.x) * -0.08, -0.2, 0.2);
  runner.position.set(P.x, P.y, 0);
  runner.visible = invuln > 0 ? Math.floor(t * 14) % 2 === 0 : true;
  rig.shadow.scale.setScalar(1 / (1 + P.y * 0.6));
  hitT = Math.max(0, hitT - dt);
  { const fl = hitT > 0 ? 0xaa1010 : 0x000000; rig.mat.hoodie.emissive.setHex(fl); rig.mat.vest.emissive.setHex(fl); rig.mat.vestLow.emissive.setHex(fl); rig.mat.jeans.emissive.setHex(fl); }
}

function render(dt) {
  elapsed += dt;
  // pelari: pilih pose lalu haluskan
  animateRunner(dt);
  if (state !== 'play') for (const m of streaks) m.material.opacity = 0;
  // partikel
  for (const q of PART) {
    if (q.life <= 0) continue; q.life -= dt;
    if (q.life <= 0) { q.m.visible = false; continue; }
    q.vy -= 9 * dt; q.m.position.x += q.vx * dt; q.m.position.y = Math.max(0.03, q.m.position.y + q.vy * dt); q.m.position.z += q.vz * dt;
    q.m.material.opacity = Math.min(1, q.life / q.max * 1.8);
  }
  // kamera
  const asp = camera.aspect, back = asp < 0.8 ? 8.6 : 6.4, up = asp < 0.8 ? 4.2 : 3.3;
  camPos.set(P.x * 0.55, up + P.y * 0.25, back); camLook.set(P.x * 0.3, 1.2, -9);
  shake = Math.max(0, shake - dt * 2);
  if (shake > 0) { camPos.x += (Math.random() - 0.5) * shake * 0.5; camPos.y += (Math.random() - 0.5) * shake * 0.35; }
  camera.position.lerp(camPos, 1 - Math.exp(-dt * 7)); camera.lookAt(camLook);
  camera.fov += ((state === 'play' ? 60 + (speed - 12) * 0.5 : 60) - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix();
  sun.target.position.set(P.x, 0, -3); sun.position.set(P.x - 6, 14, 3);
  updateEnv(dt);
  renderer.render(scene, camera);
}
