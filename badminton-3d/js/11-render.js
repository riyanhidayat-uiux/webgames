'use strict';
// ---------- render ----------
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camTarget = new THREE.Vector3(), VIEW = new THREE.Vector3(0, 0.62, 0.78).normalize(), UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

function render(dt) {
  elapsed += dt;
  // pemain
  for (const p of players) {
    const m = p.mesh, sp = Math.hypot(p.vx, p.vz);
    p.run += dt * Math.min(sp, 9) * 1.6;
    m.position.set(p.x, Math.abs(Math.sin(p.run * 2)) * 0.05 * Math.min(1, sp / 3), p.z);
    m.rotation.y = p.side > 0 ? Math.PI : 0;
    m.rotation.z = clamp(-p.vxS * p.side * -0.02, -0.15, 0.15);
    const { arm, legs } = m.userData;
    arm.rotation.x = p.swing > 0 ? -Math.PI * 0.9 * Math.sin((1 - p.swing) * Math.PI * 0.9 + 0.2) : -0.4 + Math.sin(elapsed * 3 + p.i) * 0.05;
    arm.rotation.z = -0.5;
    legs[0].rotation.x = Math.sin(p.run * 2) * 0.5 * Math.min(1, sp / 3); legs[1].rotation.x = -legs[0].rotation.x;
  }
  // kok
  let sx = S.x, sy = S.y, sz = S.z;
  if (phase === 'ready') { const sp = players[server]; if (sp) { sx = sp.x; sy = 1.0; sz = sp.z - sp.side * 0.4; } }
  shuttle.position.set(sx, sy, sz);
  if (S.live) {
    tmpV.set(S.vx, S.vy, S.vz).normalize();
    shuttle.quaternion.setFromUnitVectors(UP, tmpV);
    trailHist.unshift(sx, sy, sz); if (trailHist.length > TRN * 3) trailHist.length = TRN * 3;
  } else if (trailHist.length) trailHist.length = Math.max(0, trailHist.length - 6);
  for (let i = 0; i < TRN; i++) {
    const j = Math.min(i, Math.max(0, trailHist.length / 3 - 1)) * 3;
    trailPos[i * 3] = trailHist.length ? trailHist[j] : 0; trailPos[i * 3 + 1] = trailHist.length ? trailHist[j + 1] : -9; trailPos[i * 3 + 2] = trailHist.length ? trailHist[j + 2] : 0;
  }
  trailGeo.attributes.position.needsUpdate = true;
  sShadow.position.set(sx, 0.02, sz); sShadow.scale.setScalar(1 / (1 + sy * 0.25));
  // partikel
  for (const q of PART) {
    if (q.life <= 0) continue; q.life -= dt;
    if (q.life <= 0) { q.m.visible = false; continue; }
    q.vy -= 9 * dt; q.m.position.x += q.vx * dt; q.m.position.y = Math.max(0.03, q.m.position.y + q.vy * dt); q.m.position.z += q.vz * dt;
    q.m.material.opacity = Math.min(1, q.life / q.max * 1.8);
  }
  // kamera
  const asp = camera.aspect, dist = Math.max(16, 12.5 / asp + 4);
  camTarget.set(S.x * 0.12, 0.4, 0.4);
  camPos.copy(camTarget).addScaledVector(VIEW, dist);
  shake = Math.max(0, shake - dt * 1.8);
  if (shake > 0) { camPos.x += (Math.random() - 0.5) * shake * 0.5; camPos.y += (Math.random() - 0.5) * shake * 0.4; }
  camera.position.lerp(camPos, Math.min(1, dt * 4)); camLook.lerp(camTarget, Math.min(1, dt * 4));
  camera.lookAt(camLook);
  renderer.render(scene, camera);
}
