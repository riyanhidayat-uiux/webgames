'use strict';
// ======================= TINGKAT GRAFIS & BAYANGAN MATAHARI =======================
// Tingkat: 0 Rendah (tanpa bayangan, resolusi ≤1×, hujan & lalu lintas dikurangi) · 1 Sedang (bayangan 1024) · 2 Tinggi (bayangan 2048).
// Governor FPS di 09-hud-render-loop.js menurunkan/menaikkan tingkat otomatis bila pengaturan = Otomatis.
// Bayangan: satu peta bayangan (PCF lunak) dari matahari yang mengikuti mobil. Karena lengkungan dunia dihitung di shader dari posisi z DUNIA, material
// kedalaman (shadow pass) ikut melengkung persis sama dengan gambar utama, jadi bayangan tetap menempel di tikungan & bukit.
const GFXQ = [
  { label: 'Rendah', pr: 1, shadow: 0, rain: 0.4, traffic: 0.6, mirror: 0 },
  { label: 'Sedang', pr: 1.5, shadow: 1024, rain: 0.7, traffic: 0.85, mirror: 3 },
  { label: 'Tinggi', pr: 2, shadow: 2048, rain: 1, traffic: 1, mirror: 2 }
];
let GFXC = GFXQ[settings.gfx], gfxNow = settings.gfx; const SH = { on: !!GFXC.shadow };
function applyGfxLevel(l, silent) {
  l = clamp(l | 0, 0, 2); const prev = GFXC; gfxNow = l; GFXC = GFXQ[l]; SH.on = !!GFXC.shadow;
  if (renderer.shadowMap.enabled !== SH.on) { renderer.shadowMap.enabled = SH.on; scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); }); }
  if (SH.on && GFXC.shadow !== prev.shadow) { sun.shadow.mapSize.set(GFXC.shadow, GFXC.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (typeof setMaxPR === 'function') setMaxPR(GFXC.pr);
  if (typeof applyEnv === 'function') applyEnv(settings.env);
  if (!silent && typeof toast === 'function') toast('Grafis: ' + GFXC.label, 1800);
}
const applyQuality = () => applyGfxLevel(settings.gfxAuto ? gfxNow : settings.gfx, true);
// ikuti titik (x, z) dunia dengan kisi sebesar texel agar bayangan tidak "berenang"
function shadowFollow(x, z) {
  if (!SH.on) return; const cell = 104 / (GFXC.shadow || 2048), sx = Math.round(x / cell) * cell, sz = Math.round(z / cell) * cell;
  sun.target.position.set(sx, 0, sz - 14); sun.position.set(sx - 30, 60, sz - 14 + 22); sun.target.updateMatrixWorld();
}
(function initShadows() {
  renderer.shadowMap.enabled = SH.on; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sun.castShadow = true; sun.shadow.mapSize.set(GFXC.shadow || 1024, GFXC.shadow || 1024); const c = sun.shadow.camera; c.left = -26; c.right = 26; c.top = 52; c.bottom = -52; c.near = 1; c.far = 170;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.035; sun.shadow.radius = 2.5; scene.add(sun.target);
  road.receiveShadow = true; grass.receiveShadow = true; railMeshes.forEach(r => { r.receiveShadow = true; r.castShadow = true; });
  for (const s of scen) if (s.o.userData.lamp) s.o.traverse(m => { if (m.isMesh && m.geometry.type !== 'SphereGeometry') m.castShadow = true; });   // tiang lampu
  // kotak culling bayangan: pad lengkungan dunia dibatasi (bayangan hanya di dekat mobil, geseran lengkung di sana kecil) → jauh lebih sedikit objek yang digambar di pass bayangan
  const smr = renderer.shadowMap.render.bind(renderer.shadowMap); renderer.shadowMap.render = (l, s, cam) => { const p = BEND.pad; BEND.pad = Math.min(p, 14); smr(l, s, cam); BEND.pad = p; };
  shadowFollow(0, 0);
})();
