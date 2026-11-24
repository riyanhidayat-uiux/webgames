'use strict';
// ---------- render ----------
const tmpM = new THREE.Matrix4(), tmpC = new THREE.Color(), tmpP = new THREE.Vector3(), tmpS = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
const camTarget = new THREE.Vector3(), camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
const VIEW = new THREE.Vector3(0, 0.85, 0.53).normalize();

function resize() {
  const w = innerWidth, h = innerHeight, asp = w / h;
  renderer.setSize(w, h, false);
  camera.aspect = asp; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);

function segPos(p, i, a) {
  const c = p.snake[i], q = p.prev[i] || c;
  const dx = c.x - q.x, dy = c.y - q.y;
  if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) return [c.x, c.y];
  return [q.x + dx * a, q.y + dy * a];
}

function render(dt) {
  elapsed += dt;
  const a = (state === 'play' || state === 'paused') ? Math.max(0, Math.min(1, acc / stepMs)) : 1;
  let n = 0, fx = 0, fz = 0, fc = 0;
  for (const p of players) {
    const L = p.snake.length, hd = p.head;
    if (p.st === 'dead') { p.rT -= dt; if (p.rT <= 0 && state === 'play') { spawnSnake(p); p.st = 'alive'; p.inv = 2.5; } }
    if (p.inv > 0) p.inv -= dt;
    p.pulseT += dt * 14;
    if (p.st !== 'alive' || !L) { hd.visible = false; continue; }
    const hide = p.inv > 0 && Math.floor(elapsed * 12) % 2 === 0;
    const pos = [];
    for (let i = 0; i < L; i++) pos.push(segPos(p, i, a));
    hd.visible = !hide;
    if (!hide) {
      for (let i = 1; i < L; i++) {
        const f = i / L;
        const base = 0.62 + (1 - f) * 0.3 - 0.18 * f;
        const bump = 1 + 0.3 * Math.exp(-Math.pow(i - p.pulseT, 2) / 3);
        const sc = (0.5 + base * 0.5) * bump * 0.95;
        tmpP.set(wx(pos[i][0]), 0.5, wz(pos[i][1]));
        tmpS.setScalar(sc * 1.15);
        tmpM.compose(tmpP, tmpQ.identity(), tmpS);
        bodyMesh.setMatrixAt(n, tmpM);
        tmpC.setHSL(p.hue + 0.1 * f, 0.78, 0.5 + (i % 2 ? 0.04 : -0.02));
        bodyMesh.setColorAt(n, tmpC); n++;
        if (i + 1 < L) {
          const dx = pos[i][0] - pos[i + 1][0], dy = pos[i][1] - pos[i + 1][1];
          if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) {
            tmpP.set(wx((pos[i][0] + pos[i + 1][0]) / 2), 0.5, wz((pos[i][1] + pos[i + 1][1]) / 2));
            tmpS.setScalar(sc * 1.05);
            tmpM.compose(tmpP, tmpQ.identity(), tmpS);
            bodyMesh.setMatrixAt(n, tmpM);
            bodyMesh.setColorAt(n, tmpC); n++;
          }
        }
      }
    }
    hd.position.set(wx(pos[0][0]), 0.55, wz(pos[0][1]));
    const target = Math.atan2(p.dir.x, p.dir.y);
    let d = target - p.headAng; d = Math.atan2(Math.sin(d), Math.cos(d));
    p.headAng += d * Math.min(1, dt * 16);
    hd.rotation.y = p.headAng;
    hd.scale.setScalar(1 + (p.pulseT < 3 ? 0.18 * Math.exp(-p.pulseT) : 0));
    hd.userData.tongue.scale.z = 0.6 + 0.4 * Math.max(0, Math.sin(elapsed * 14));
    hd.userData.mat.color.set(p.headCol);
    fx += wx(pos[0][0]); fz += wz(pos[0][1]); fc++;
  }
  bodyMesh.count = n;
  bodyMesh.instanceMatrix.needsUpdate = true;
  if (bodyMesh.instanceColor) bodyMesh.instanceColor.needsUpdate = true;

  // makanan
  if (foodCell) {
    food.visible = true;
    food.position.set(wx(foodCell.x), 0.5 + Math.sin(elapsed * 3.2) * 0.08, wz(foodCell.y));
    food.rotation.y = elapsed * 1.5;
    food.scale.setScalar(1 + 0.06 * Math.sin(elapsed * 6));
  } else food.visible = false;
  let goldTxt = '';
  if (goldCell) {
    gold.position.set(wx(goldCell.x), 0.55 + Math.sin(elapsed * 4) * 0.1, wz(goldCell.y));
    gem.rotation.y = elapsed * 2.5; gem.rotation.x = elapsed * 1.3; ring.rotation.z = elapsed * 3;
    const left = Math.max(0, goldT), blink = left < 2.5 && Math.floor(elapsed * 8) % 2 === 0;
    gold.visible = !blink;
    goldTxt = '⭐ ' + left.toFixed(1) + 's';
  } else gold.visible = false;
  $(versus ? 'goldMid' : 'goldHud').textContent = goldTxt;

  // partikel
  for (const q of PART) {
    if (q.life <= 0) continue;
    q.life -= dt;
    if (q.life <= 0) { q.m.visible = false; continue; }
    q.vy -= 14 * dt;
    q.m.position.x += q.vx * dt; q.m.position.y = Math.max(0.05, q.m.position.y + q.vy * dt); q.m.position.z += q.vz * dt;
    q.m.material.opacity = Math.min(1, q.life / q.max * 1.6);
  }

  // kamera: mengikuti kepala sedikit + getar saat tabrakan
  const asp = camera.aspect, dist = Math.max(31, 27 / asp);
  const hx = fc ? fx / fc : 0, hz = fc ? fz / fc : 0;
  camTarget.set(hx * 0.18, 0, hz * 0.18 + 1.2);
  camPos.copy(camTarget).addScaledVector(VIEW, dist);
  shake = Math.max(0, shake - dt * 1.4);
  if (shake > 0) { camPos.x += (Math.random() - 0.5) * shake * 0.9; camPos.y += (Math.random() - 0.5) * shake * 0.6; }
  camera.position.lerp(camPos, Math.min(1, dt * 5));
  camLook.lerp(camTarget, Math.min(1, dt * 5));
  camera.lookAt(camLook);
  renderer.render(scene, camera);
}
