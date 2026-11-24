'use strict';
// ======================= EFEK VISUAL =======================
// pecahan dinding, gelombang kejut, garis kecepatan di lorong, denyut lantai, dan hentakan FOV kamera.
const DEB = [];
{ const gm = new THREE.BoxGeometry(0.5, 0.5, 0.14); for (let i = 0; i < 80; i++) { const m = new THREE.Mesh(gm, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, transparent: true })); m.visible = false; scene.add(m); DEB.push({ m, vx: 0, vy: 0, vz: 0, rx: 0, ry: 0, rz: 0, life: 0, max: 1 }); } }
const RINGS = [];
{ const gm = new THREE.RingGeometry(0.62, 0.78, 56); for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(gm, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); m.visible = false; scene.add(m); RINGS.push({ m, life: 0, max: 0.6, size: 6 }); } }
function fxRing(x, y, z, hex, size = 6, life = 0.6) { const r = RINGS.find(q => q.life <= 0); if (!r) return; r.life = r.max = life; r.size = size; r.m.position.set(x, y, z); r.m.material.color.set(hex); r.m.visible = true; r.m.scale.setScalar(0.3); }
// dinding pecah menjadi keping berwarna dinding yang melesat ke arah kamera
function fxShatter(w, power = 1) {
  const WW = versus ? 12 : 8, cx = w.holes.length ? w.holes.reduce((a, h) => a + h.off, 0) / w.holes.length + (w.hs || 0) : 0; let n = Math.round(46 * (0.7 + 0.4 * power));
  const col = new THREE.Color(w.cols ? w.cols[0] : 0x7a5aff), col2 = new THREE.Color(w.cols ? w.cols[1] : 0x3a2a8a);
  for (const d of DEB) { if (n <= 0) break; if (d.life > 0) continue; n--;
    const x = (Math.random() - 0.5) * WW, y = WCY + (Math.random() - 0.5) * WHT, dx = x - cx, dy = y - WCY, dl = Math.hypot(dx, dy) || 1, sp = (2.5 + Math.random() * 5) * (0.8 + 0.5 * power);
    d.vx = dx / dl * sp + (Math.random() - 0.5) * 2; d.vy = dy / dl * sp * 0.8 + 2 + Math.random() * 3; d.vz = 5 + Math.random() * 8 * power; d.rx = (Math.random() - 0.5) * 12; d.ry = (Math.random() - 0.5) * 12; d.rz = (Math.random() - 0.5) * 12;
    d.life = d.max = 0.9 + Math.random() * 0.8; d.m.position.set(x, y, w.z + 0.2); d.m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); d.m.material.color.copy(Math.random() < 0.5 ? col : col2); d.m.material.opacity = 1;
    d.m.scale.set(0.5 + Math.random() * 1.1, 0.5 + Math.random() * 1.1, 1); d.m.visible = true; }
  fxRing(cx, WCY, w.z + 0.4, 0xffffff, 9 + 3 * power, 0.55); fovKick = Math.max(fovKick, 0.5 + 0.5 * power);
}
// dinding menghantam (satu lubang gagal): serpihan kecil + gelombang kejut merah
function fxCrash(x) { fxRing(x, WCY, 0.6, 0xff4a6a, 8, 0.5); fxRing(x, WCY, 0.6, 0xffb0c0, 5, 0.35); floorGlow = 1; floorGlowCol = 0xff2a4a; fovKick = Math.max(fovKick, 0.9); }
function fxPerfect(x) { fxRing(x, -0.5, 0.5, 0x7fffd0, 7, 0.6); fxRing(x, -0.5, 0.5, 0xffd23f, 4.5, 0.45); floorGlow = 1; floorGlowCol = 0x2affb0; }
function fxGood(x) { fxRing(x, -0.5, 0.5, 0xffd23f, 5, 0.45); floorGlow = Math.max(floorGlow, 0.6); floorGlowCol = 0xffc040; }
// garis kecepatan di lorong
const STR_N = 240, strPos = new Float32Array(STR_N * 3), strGeo = new THREE.BufferGeometry();
for (let i = 0; i < STR_N; i++) { strPos[i * 3] = (Math.random() - 0.5) * 2 * (TUN_X - 0.4); strPos[i * 3 + 1] = TUN_BOT + 0.2 + Math.random() * (TUN_TOP - TUN_BOT - 0.4); strPos[i * 3 + 2] = -70 + Math.random() * 82; }
strGeo.setAttribute('position', new THREE.BufferAttribute(strPos, 3));
const strMat = new THREE.PointsMaterial({ color: 0xc8b8ff, size: 0.16, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }), strPts = new THREE.Points(strGeo, strMat); strPts.frustumCulled = false; scene.add(strPts);
let fovKick = 0, floorGlow = 0, floorGlowCol = 0x2affb0; const tmpC = new THREE.Color(), lampBase = new THREE.Color(0xc8b8ff);
function fxUpdate(dt) {
  for (const d of DEB) { if (d.life <= 0) continue; d.life -= dt; if (d.life <= 0) { d.m.visible = false; continue; } d.vy -= 9 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt; d.m.rotation.x += d.rx * dt; d.m.rotation.y += d.ry * dt; d.m.rotation.z += d.rz * dt; d.m.material.opacity = Math.min(1, d.life / (d.max * 0.5)); }
  for (const r of RINGS) { if (r.life <= 0) continue; r.life -= dt; if (r.life <= 0) { r.m.visible = false; continue; } const k = 1 - r.life / r.max; r.m.scale.setScalar(0.3 + r.size * k * (2 - k)); r.m.material.opacity = (1 - k) * 0.9; }
  const spd = state === 'play' || state === 'dying' ? 18 + (34 / travelTime() - 7) * 0.6 : 4, p = strGeo.attributes.position.array;
  for (let i = 0; i < STR_N; i++) { let z = p[i * 3 + 2] + spd * dt; if (z > 12) { z -= 82; p[i * 3] = (Math.random() - 0.5) * 2 * (TUN_X - 0.4); p[i * 3 + 1] = TUN_BOT + 0.2 + Math.random() * (TUN_TOP - TUN_BOT - 0.4); } p[i * 3 + 2] = z; }
  strGeo.attributes.position.needsUpdate = true;
  floorGlow = Math.max(0, floorGlow - dt * 2.2); floor.material.emissive.setHex(floorGlowCol); floor.material.emissiveIntensity = floorGlow * 0.55;
  fovKick = Math.max(0, fovKick - dt * 3.2);
  const nw = walls.filter(w => !w.done).sort((a, b) => b.z - a.z)[0]; tmpC.copy(lampBase); if (nw && nw.cols) tmpC.lerp(new THREE.Color(nw.cols[0]), 0.55 * Math.max(0, Math.min(1, (nw.z + 34) / 34))); lampMat.color.lerp(tmpC, Math.min(1, dt * 4));
  strMat.color.lerp(nw && nw.cols ? new THREE.Color(nw.cols[0]).lerp(new THREE.Color(0xffffff), 0.5) : lampBase, Math.min(1, dt * 3));
}
