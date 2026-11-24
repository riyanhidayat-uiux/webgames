'use strict';
// ---------- avatar kerangka 3D (satu per pemain, di bidang z = 0) ----------
const jMatOK = new THREE.MeshStandardMaterial({ color: 0x5aff8a, emissive: 0x108a3a }), jMatBad = new THREE.MeshStandardMaterial({ color: 0xff4a6a, emissive: 0x8a1030 }), jMatN = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x555577 });
const JNAMES = ['nose', 'sL', 'sR', 'eL', 'eR', 'wL', 'wR', 'hL', 'hR', 'kL', 'kR', 'aL', 'aR', 'hdL', 'hdR'];
const MARK_N = ['hdL', 'hdR', 'eL', 'eR'];
const upV = new THREE.Vector3(0, 1, 0), tv = new THREE.Vector3(), tq = new THREE.Quaternion(), av1 = new THREE.Vector3(), av2 = new THREE.Vector3();
function makeAvatar() {
  const g = new THREE.Group(); scene.add(g);
  const boneMat = new THREE.MeshStandardMaterial({ color: 0x38d8ff, emissive: 0x0a5a78, roughness: 0.4 });
  const bones = BONES.map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1, 10), boneMat); g.add(m); return m; });
  const joints = {}; JNAMES.forEach(n => { const m = new THREE.Mesh(new THREE.SphereGeometry(n === 'nose' ? 0.3 : 0.16, 14, 10), jMatN); g.add(m); joints[n] = m; });
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); tg.setIndex([0, 1, 2, 0, 2, 3]);
  const torsoMat = new THREE.MeshBasicMaterial({ color: 0x38d8ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide }), torso = new THREE.Mesh(tg, torsoMat); g.add(torso);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111122 }); [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), eyeMat); e.position.set(s * 0.1, 0.06, 0.28); joints.nose.add(e); });
  const marks = MARK_N.map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 8, 24), new THREE.MeshBasicMaterial({ color: 0xff4a6a, transparent: true, opacity: 0.9 })); m.visible = false; g.add(m); return m; });
  const emBase = new THREE.Color(0x0a5a78), emFlash = new THREE.Color(0xffffff); let pulse = 0, lastT = 0;
  return {
    g, setColor(hex, em) { boneMat.color.setHex(hex); boneMat.emissive.setHex(em); emBase.setHex(em); torsoMat.color.setHex(hex); },
    flash(hex) { emFlash.setHex(hex); pulse = 1; },                                  // kilat warna saat lolos / terbentur
    update(P, hole, rad, tNow) {
      const dtA = Math.min(0.1, Math.max(0, tNow - lastT)); lastT = tNow; if (pulse > 0) { pulse = Math.max(0, pulse - dtA * 3); boneMat.emissive.copy(emBase).lerp(emFlash, pulse); torsoMat.opacity = 0.28 + 0.4 * pulse; } else torsoMat.opacity = 0.28;
      const J = P.B.J, V = P.B.valid, pos = n => J[n] && J[n].v > 0.25;
      BONES.forEach(([a, b], i) => { const m = bones[i]; if (!V || !pos(a) || !pos(b)) { m.visible = false; return; } m.visible = true;
        av1.set(J[a].x, J[a].y, 0); av2.set(J[b].x, J[b].y, 0); tv.subVectors(av2, av1); const len = tv.length() || 0.001; m.position.copy(av1).addScaledVector(tv, 0.5); m.scale.set(1, len, 1); tq.setFromUnitVectors(upV, tv.normalize()); m.quaternion.copy(tq); });
      JNAMES.forEach(n => { const m = joints[n]; if (!V || !pos(n)) { m.visible = false; return; } m.visible = true; m.position.set(J[n].x, J[n].y, 0); m.material = hole ? (distToPose(J[n], hole.J) <= rad * 1.05 ? jMatOK : jMatBad) : jMatN; });
      MARK_N.forEach((n, i) => { const m = marks[i]; if (!hole || !V) { m.visible = false; return; } const t = hole.J[n], cov = distToBody(t, J) <= rad * 1.1; m.visible = true; m.position.set(t.x, t.y, 0.12); m.rotation.z = tNow * 2; m.material.color.setHex(cov ? 0x5aff8a : 0xff4a6a); m.scale.setScalar(n[0] === 'h' ? 1 : 0.7); });
      const arr = tg.attributes.position.array, q = ['sL', 'sR', 'hR', 'hL'];
      if (V && q.every(pos)) { q.forEach((n, i) => { arr[i * 3] = J[n].x; arr[i * 3 + 1] = J[n].y; arr[i * 3 + 2] = -0.02; }); tg.attributes.position.needsUpdate = true; torso.visible = true; } else torso.visible = false;
    }
  };
}
const AVS = [makeAvatar(), makeAvatar()];

// partikel
const PART = [];
for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1, rx: 0, ry: 0 }); }
function burst(x, y, z, n, colors, speed = 5) {
  for (const p of PART) { if (n <= 0) break; if (p.life > 0) continue; n--; const a = Math.random() * 6.283, e = Math.random() * 3 - 1, s = (0.4 + Math.random()) * speed;
    p.vx = Math.cos(a) * s; p.vz = Math.abs(Math.sin(a)) * s * 1.2 + 2; p.vy = Math.sin(e) * s; p.life = p.max = 0.6 + Math.random() * 0.7; p.rx = Math.random() * 8; p.ry = Math.random() * 8;
    p.m.position.set(x, y, z); p.m.material.color.set(colors[(Math.random() * colors.length) | 0]); p.m.visible = true; p.m.scale.setScalar(0.6 + Math.random() * 1.2); }
}
