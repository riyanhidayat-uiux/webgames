'use strict';
const SLIDE_LANE = 1.2, SLIDE_DEAD = 0.3;     // jalur geser (lebar bahu) & toleransi posisi
// posisi tubuh pemain untuk dinding bergeser: selisih lateral di luar toleransi dihitung sebagai kesalahan posisi
function bodyForWall(p, w) {
  if (!w.slide) return p.B.J; const e = p.px - w.hs, m = Math.max(0, Math.abs(e) - SLIDE_DEAD) * Math.sign(e); if (!m) return p.B.J;
  const o = {}; for (const n in p.B.J) { const j = p.B.J[n]; o[n] = { x: j.x + m, y: j.y, v: j.v }; } return o;
}
// ---------- dinding berlubang (satu lubang per pemain) ----------
const WALLCOLS = [[0x2fb8ff, 0x1a6ac0], [0xff5a9a, 0xc02a6a], [0xffb02a, 0xc06a1a], [0x7aff6a, 0x2aa04a], [0xb06aff, 0x6a2ac0]];
const shift = (J, dx) => { const o = {}; for (const n in J) o[n] = { x: J[n].x + dx, y: J[n].y }; return o; };
function drawWallTex(holes0, rad, cols, WW) {
  const holes = holes0.flatMap(h => h.alt ? [h, { J: h.alt.J, off: h.off }] : [h]);                       // dinding 'pilih salah satu': siluet gabungan dua pose
  const PXU = 80, W = WW * PXU, H = WHT * PXU, c = mkCanvas(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#' + cols[0].toString(16).padStart(6, '0')); g.addColorStop(1, '#' + cols[1].toString(16).padStart(6, '0'));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(255,255,255,.14)'; x.lineWidth = 2; for (let j = 0; j <= WHT; j++) { x.beginPath(); x.moveTo(0, j * PXU); x.lineTo(W, j * PXU); x.stroke(); } for (let i = 0; i <= WW; i++) { x.beginPath(); x.moveTo(i * PXU, 0); x.lineTo(i * PXU, H); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.35)'; for (let j = 0; j <= WHT; j++) for (let i = 0; i <= WW; i++) { x.beginPath(); x.arc(i * PXU, j * PXU, 3, 0, 6.283); x.fill(); }
  const X = v => (v + WW / 2) * PXU, Y = v => (WCY + WHT / 2 - v) * PXU;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = x.fillStyle = 'rgba(255,255,255,.9)';                  // bingkai neon terang di sekeliling lubang
  for (const h of holes) {
    const J = shift(h.J, h.off), R = rad + 0.1; x.lineWidth = 2 * R * PXU;
    x.beginPath(); x.moveTo(X(J.sL.x), Y(J.sL.y)); x.lineTo(X(J.sR.x), Y(J.sR.y)); x.lineTo(X(J.hR.x), Y(J.hR.y)); x.lineTo(X(J.hL.x), Y(J.hL.y)); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); for (const [a, b] of BONES) { x.moveTo(X(J[a].x), Y(J[a].y)); x.lineTo(X(J[b].x), Y(J[b].y)); } x.stroke(); x.beginPath(); x.arc(X(J.nose.x), Y(J.nose.y), 0.3 * PXU + R * PXU, 0, 6.283); x.fill();
  }
  x.restore();
  x.save(); x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000'; x.strokeStyle = '#000'; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 2 * rad * PXU;
  for (const h of holes) {
    const J = shift(h.J, h.off);
    x.beginPath(); x.moveTo(X(J.sL.x), Y(J.sL.y)); x.lineTo(X(J.sR.x), Y(J.sR.y)); x.lineTo(X(J.hR.x), Y(J.hR.y)); x.lineTo(X(J.hL.x), Y(J.hL.y)); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); for (const [a, b] of BONES) { x.moveTo(X(J[a].x), Y(J[a].y)); x.lineTo(X(J[b].x), Y(J[b].y)); } x.stroke();
    x.beginPath(); x.arc(X(J.nose.x), Y(J.nose.y), (0.3 + rad) * PXU, 0, 6.283); x.fill();
  }
  x.restore(); return mkTex(c);
}
function makeWall(poses, rad, idx, opts) {
  opts = opts || {};
  const WW0 = versus ? 12 : 8, WW = WW0 + (opts.slide ? 2 * SLIDE_LANE + 0.2 : 0), offs = OFFS(), pal = typeof wallPalette === 'function' ? wallPalette() : WALLCOLS, cols = opts.cols || pal[idx % pal.length], holes = [];
  poses.forEach((pose, i) => { if (pose) { const h = { pl: i, pose, J: buildPose(pose.spec, PL[i].k), off: offs[i], best: 0, done: false }; if (opts.morph && opts.morph[i]) h.morph = { pose: opts.morph[i], J: buildPose(opts.morph[i].spec, PL[i].k) }; holes.push(h); } });
  if (opts.alt) holes.forEach((h, i) => { const a = opts.alt[i]; if (a) h.alt = { pose: a, J: buildPose(a.spec, PL[i].k) }; });
  const g = new THREE.Group(), tex = drawWallTex(holes, rad, cols, WW);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(WW, WHT), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.55, emissive: cols[1], emissiveIntensity: 0.18 }));
  front.position.set(0, WCY, 0); g.add(front);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(WW, WHT), new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, color: 0x555566 })); back.position.set(0, WCY, -0.3); g.add(back);
  const pm = new THREE.MeshStandardMaterial({ color: cols[1], roughness: 0.6, emissive: cols[1], emissiveIntensity: 0.15 });
  const addPanel = (w, h, x, y) => { if (w <= 0.01) return; const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), pm); m.position.set(x, y, -0.15); g.add(m); };
  const sideW = TUN_X - WW0 / 2; if (opts.slide) front.position.x = back.position.x = opts.slide.s0;
  addPanel(sideW, TUN_TOP - TUN_BOT, -(WW0 / 2 + sideW / 2), (TUN_TOP + TUN_BOT) / 2); addPanel(sideW, TUN_TOP - TUN_BOT, WW0 / 2 + sideW / 2, (TUN_TOP + TUN_BOT) / 2);
  addPanel(WW0, TUN_TOP - (WCY + WHT / 2), 0, (TUN_TOP + WCY + WHT / 2) / 2); addPanel(WW0, (WCY - WHT / 2) - TUN_BOT, 0, (TUN_BOT + WCY - WHT / 2) / 2);
  if (opts.icon) { const sp = makeIconSprite(opts.icon); sp.position.set(0, WCY + WHT / 2 - 0.55, 0.3); g.add(sp); }
  g.userData = { tex, pm }; scene.add(g);
  return { g, holes, rad, z: -34, done: false, tex, speed: 6, color: cols[1], cols, WW, mats: [front.material, back.material], chain: opts.chain || null, power: opts.power || null, boss: !!opts.boss, morphPending: holes.some(h => h.morph), planes: [front, back], slide: opts.slide ? Object.assign({ z0: -27, z1: -11 }, opts.slide) : null, hs: opts.slide ? opts.slide.s0 : 0 };
}
// dinding berubah pose di tengah jalan: gambar ulang tekstur lubang
function rebuildWallTex(w) { const t = drawWallTex(w.holes, w.rad, w.cols, w.WW); w.mats.forEach(m => { m.map = t; m.needsUpdate = true; }); w.tex.dispose(); w.tex = t; w.g.userData.tex = t; }
function makeIconSprite(emoji) {
  const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = 'rgba(255,240,150,.95)'; x.beginPath(); x.arc(64, 64, 58, 0, 6.283); x.fill(); x.strokeStyle = '#2a1200'; x.lineWidth = 6; x.stroke(); x.font = '70px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); sp.scale.set(1.2, 1.2, 1); sp.renderOrder = 15; sp.userData.own = true; return sp;
}
function disposeWall(w) { scene.remove(w.g); w.tex.dispose(); w.g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material !== w.g.userData.pm) { if (o.userData.own && o.material.map) o.material.map.dispose(); o.material.dispose(); } }); w.g.userData.pm.dispose(); }
