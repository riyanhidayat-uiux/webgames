'use strict';
// ---------- sarung tinju pemain (sudut pandang orang pertama) ----------
const gloveMat = M(0xd02a2a, { roughness: 0.35 }), cuffMat = M(0xffffff);
const GL = [-1, 1].map(s => { const g = new THREE.Group(); const b = sph(0.17, gloveMat, 1, 1.05, 1.2); g.add(b); const th = sph(0.07, gloveMat); th.position.set(-s * 0.13, 0.02, 0.07); g.add(th); g.scale.setScalar(0.58); camera.add(g); return { g, home: { x: s * 0.34, y: -0.36, z: -1.0 }, cur: { x: s * 0.34, y: -0.5, z: -0.8 }, p: null }; });
// lengan pemain di pandangan orang pertama: bahu di luar layar -> siku (IK) -> pergelangan -> sarung tinju
const skinFP = M(0xe0b890, { roughness: 0.5 }), FP = new THREE.Group(); camera.add(FP);
const ARMS = [-1, 1].map(sd => { const up = limb(0.5, 0.115, 0.082, 0.03, 0.3, skinFP), fo = limb(0.5, 0.088, 0.066, 0.024, 0.25, skinFP), el = sph(0.075, skinFP), wr = cyl(0.074, 0.074, 0.13, cuffMat); FP.add(up, fo, el, wr); return { sd, up, fo, el, wr }; });
const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3(), v4 = new THREE.Vector3(), downV = new THREE.Vector3(0, -1, 0);
function placeLimb(m, A, B, len) { v4.subVectors(B, A); const L = v4.length() || 0.001; m.position.copy(A); m.scale.set(1, L / len, 1); m.quaternion.setFromUnitVectors(downV, v4.normalize()); }
function updateArmFP(i, G) {
  const A = ARMS[i], S = v1.set(A.sd * 0.5, -0.95, -0.02), W = v2.set(G.cur.x, G.cur.y - 0.02, G.cur.z + 0.2), d = S.distanceTo(W), L = Math.max(0.95, d * 0.6);
  const dir = v3.subVectors(W, S).normalize(), mid = new THREE.Vector3().addVectors(S, W).multiplyScalar(0.5), h = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
  const pole = new THREE.Vector3(A.sd * 0.55, -1, 0.5); pole.addScaledVector(dir, -pole.dot(dir)); pole.normalize();
  const Epos = mid.addScaledVector(pole, h);
  placeLimb(A.up, S, Epos, 0.5); placeLimb(A.fo, Epos, W, 0.5); A.el.position.copy(Epos); A.wr.position.copy(W); A.wr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v4.subVectors(W, Epos).normalize());
}
const PART = [];
for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1 }); }
function burst(x, y, z, n, cols, sp = 3) { for (const p of PART) { if (n <= 0) break; if (p.life > 0) continue; n--; const a = Math.random() * 6.283, e = Math.random() * 3 - 0.6, s = (0.4 + Math.random()) * sp; p.vx = Math.cos(a) * s; p.vz = Math.sin(a) * s + 1.5; p.vy = Math.sin(e) * s + 1; p.life = p.max = 0.4 + Math.random() * 0.4; p.m.position.set(x, y, z); p.m.material.color.set(cols[(Math.random() * cols.length) | 0]); p.m.visible = true; } }
