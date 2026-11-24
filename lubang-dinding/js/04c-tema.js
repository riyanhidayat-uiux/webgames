'use strict';
// ======================= TEMA DUNIA =======================
// Tiap level (10 dinding) pindah dunia: warna lorong & lampu, palet dinding, dan nuansa musik (nada dasar + tempo).
// Urutan: NEON → SENJA → HUTAN → KUTUB → LAVA → (ulang). Mode Latihan selalu NEON.
const THEMES = [
  { id: 'neon', name: 'NEON', bg: 0x140a2e, ceil: 0x1a0f3c, hemi: [0xc8b8ff, 0x201040], lamp: 0xc8b8ff, floor: ['#1c1140', '#6a4ae0', 'rgba(160,130,255,.35)'], side: ['#241450', '#7a5aff'], walls: WALLCOLS.slice(), roots: [33, 29, 36, 31], bpm: 0 },
  { id: 'senja', name: 'SENJA', bg: 0x2a0a22, ceil: 0x3a1230, hemi: [0xffc8a8, 0x401030], lamp: 0xffc08a, floor: ['#3a1034', '#ff5a9a', 'rgba(255,170,120,.35)'], side: ['#4a1440', '#ff8a3c'], walls: [[0xff7a3c, 0xc0401a], [0xff4a8a, 0xa0206a], [0xffc23a, 0xc07a1a], [0xb06aff, 0x6a2ac0], [0xff5a5a, 0xa02a3a]], roots: [38, 34, 36, 31], bpm: 4 },
  { id: 'hutan', name: 'HUTAN', bg: 0x061a14, ceil: 0x0a2a1e, hemi: [0xc8ffd8, 0x0a2a1a], lamp: 0xb8ffc8, floor: ['#0f2e22', '#3ae08a', 'rgba(140,255,170,.3)'], side: ['#12402e', '#7aff6a'], walls: [[0x4ae08a, 0x1a8a4a], [0x9aff5a, 0x4aa02a], [0xe0c03a, 0x9a7a1a], [0x3ac8b0, 0x1a7a78], [0xff8a5a, 0xa04a2a]], roots: [28, 33, 31, 26], bpm: -4 },
  { id: 'kutub', name: 'KUTUB', bg: 0x08203a, ceil: 0x0e2e50, hemi: [0xd8f0ff, 0x102a48], lamp: 0xd8f6ff, floor: ['#123a5c', '#8ae0ff', 'rgba(200,240,255,.35)'], side: ['#1a4a70', '#c8f4ff'], walls: [[0xa8c8f8, 0x5a80c0], [0x9a8aff, 0x5a4ac0], [0xff8ad0, 0xb04a90], [0x6a9aff, 0x3a5ac0], [0xc0d0ec, 0x7a90b8]], roots: [30, 35, 32, 25], bpm: -2 },
  { id: 'lava', name: 'LAVA', bg: 0x2a0806, ceil: 0x3a0e08, hemi: [0xffb890, 0x400c06], lamp: 0xffb06a, floor: ['#3a1008', '#ff6a2a', 'rgba(255,150,80,.35)'], side: ['#4a1a0e', '#ffb02a'], walls: [[0xff5a2a, 0xa01a0a], [0xffa02a, 0xb0600a], [0xffd23a, 0xb08a1a], [0xff3a6a, 0x9a1a3a], [0xc05aff, 0x6a2a90]], roots: [26, 26, 29, 31], bpm: 8 }
];
let THEME = THEMES[0];
const wallPalette = () => THEME.walls, TW = { bg: new THREE.Color(), ceil: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color() };
function paintTunnel(th) {
  let c = floorTex.image, x = c.getContext('2d'); x.fillStyle = th.floor[0]; x.fillRect(0, 0, 128, 128); x.strokeStyle = th.floor[1]; x.lineWidth = 3; x.strokeRect(1, 1, 126, 126); x.strokeStyle = th.floor[2]; x.lineWidth = 1; x.beginPath(); x.moveTo(64, 0); x.lineTo(64, 128); x.moveTo(0, 64); x.lineTo(128, 64); x.stroke(); floorTex.needsUpdate = true;
  c = sideTex.image; x = c.getContext('2d'); x.fillStyle = th.side[0]; x.fillRect(0, 0, 64, 128); x.fillStyle = th.side[1]; x.fillRect(0, 56, 64, 6); x.fillStyle = 'rgba(255,255,255,.7)'; x.fillRect(0, 58, 64, 2); sideTex.needsUpdate = true;
}
// pindah tema; instant = langsung (awal game / menu), kalau tidak warna latar & lampu meluncur halus. Mengembalikan true bila tema berubah.
function setTheme(i, instant) {
  const th = THEMES[i % THEMES.length], changed = th !== THEME; THEME = th;
  if (changed) paintTunnel(th);
  lampBase.setHex(th.lamp); ROOTS.splice(0, 4, ...th.roots); MUS.bpmAdd = th.bpm;
  TW.bg.setHex(th.bg); TW.ceil.setHex(th.ceil); TW.hs.setHex(th.hemi[0]); TW.hg.setHex(th.hemi[1]);
  if (instant) { scene.background.copy(TW.bg); scene.fog.color.copy(TW.bg); ceil.material.color.copy(TW.ceil); hemi.color.copy(TW.hs); hemi.groundColor.copy(TW.hg); }
  return changed;
}
function themeFrame(dt) {
  const k = Math.min(1, dt * 1.8); scene.background.lerp(TW.bg, k); scene.fog.color.copy(scene.background); ceil.material.color.lerp(TW.ceil, k); hemi.color.lerp(TW.hs, k); hemi.groundColor.lerp(TW.hg, k);
}
function themeFlash() { const e = $('themeFlash'); e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
// dipanggil saat dinding pertama tiap level muncul
function themeForLevel(lv) { const ch = setTheme(lv - 1); if (ch) themeFlash(); return ch; }
