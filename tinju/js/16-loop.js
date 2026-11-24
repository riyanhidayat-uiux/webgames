'use strict';
// ======================= LOOP =======================
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
function updateParticles(dt) { for (const q of PART) { if (q.life <= 0) continue; q.life -= dt; if (q.life <= 0) { q.m.visible = false; continue; } q.vy -= 6 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.material.opacity = Math.min(1, q.life / q.max * 2); } }
function renderVersus(dt) {
  updateVersus(dt); animateVersus(dt); vsLight(); updateParticles(dt);
  shake = Math.max(0, shake - dt * 2.4); const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.14 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.1 : 0, asp = camera.aspect, dist = clamp(2.7 / asp + 2.3, 3.6, 8);
  camera.position.set(sx, 1.82 + sy, dist); camera.rotation.z = 0; camera.lookAt(0, 1.1, 0); renderer.render(scene, camera);
}
function render(dt) {
  elapsed += dt;
  if (versus && state !== 'menu') { renderVersus(dt); return; }
  updateDefense();
  if (state === 'fight') { P.stam = Math.min(100, P.stam + dt * 18); P.comboT -= dt; if (P.comboT <= 0 && P.combo) { P.combo = 0; } updateEnemy(dt); }
  else if (state === 'menu') { if (!E) { E = newEnemy(0); } E.state = 'idle'; }
  animateEnemy(dt); animateGloves(dt); updateHudLight();
  if (state === 'menu') { /* tampilan menu */ }
  for (const q of PART) { if (q.life <= 0) continue; q.life -= dt; if (q.life <= 0) { q.m.visible = false; continue; } q.vy -= 6 * dt; q.m.position.x += q.vx * dt; q.m.position.y += q.vy * dt; q.m.position.z += q.vz * dt; q.m.material.opacity = Math.min(1, q.life / q.max * 2); }
  // kamera: miring / merunduk mengikuti pemain
  shake = Math.max(0, shake - dt * 2.4); const sx = shake > 0 ? (Math.random() - 0.5) * shake * 0.12 : 0, sy = shake > 0 ? (Math.random() - 0.5) * shake * 0.1 : 0;
  camLean += (P.lean - camLean) * Math.min(1, dt * 10); camDuck += ((P.duck ? 1 : 0) - camDuck) * Math.min(1, dt * 12);
  const tx = camLean * 0.55, ty = -camDuck * 0.55, rz = -camLean * 0.12;
  camera.position.x += (CAM_HOME.x + tx - camera.position.x) * Math.min(1, dt * 14); camera.position.y += (CAM_HOME.y + ty - camera.position.y) * Math.min(1, dt * 14); camera.position.z = CAM_HOME.z;
  camera.position.x += sx; camera.position.y += sy; camera.rotation.z += (rz - camera.rotation.z) * Math.min(1, dt * 12); camera.lookAt(camera.position.x * 0.2, 1.78 + ty * 0.3, -0.5); camera.rotation.z += rz * 0.5;
  renderer.render(scene, camera);
}
let camLean = 0, camDuck = 0;
let hudT = 0; function updateHudLight() { hudT += 0.016; if (hudT > 0.05) { hudT = 0; detUI(); $('phpF').style.width = P.hp + '%'; $('stamF').style.width = P.stam + '%'; $('supF').style.width = P.sup + '%'; } }
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  detectPose(now);
  if (hitStop > 0) { hitStop -= dt; dt *= 0.08; } else if (slow > 0) { slow -= dt; dt *= 0.4; }
  render(dt); requestAnimationFrame(frame);
}
resize(); toMenu(); $('ename').textContent = ''; requestAnimationFrame(frame);
