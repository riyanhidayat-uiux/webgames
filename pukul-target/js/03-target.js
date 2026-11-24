'use strict';
// ---------- target ----------
function pickTarget(pref) {
  const m = { l: 70, r: SW - 70, t: SH * 0.2, b: SH - 80 }, p = useCam ? PL[Math.min(pref, NP() - 1)] : null;
  for (let k = 0; k < 14; k++) {
    let x, y;
    if (p && p.valid) { const th = rr(-3.5, 0.35), R = p.sww * rr(1.15, 2.5); x = p.cx + Math.cos(th) * R; y = p.cy + Math.sin(th) * R * 0.9; }
    else if (!useCam && versus) { x = (pref === 0 ? rr(0.06, 0.46) : rr(0.54, 0.94)) * SW; y = rr(m.t, m.b); }
    else { x = rr(m.l, m.r); y = rr(m.t, m.b); }
    if (x < m.l || x > m.r || y < m.t || y > m.b) continue;
    if (p && p.nose && Math.hypot(x - p.nose.x, y - p.nose.y) < p.sww * 0.9) continue;
    if (bubbles.some(b => Math.hypot(b.ex - x, b.ey - y) < SH * 0.14 && b.t > 0.35)) continue;
    return { x, y };
  }
  return { x: rr(m.l, m.r), y: rr(m.t, m.b) };
}
function spawnBubble() {
  const d = DIFF[settings.diff], dur0 = Math.max(d.minDur, d.dur - tPlay * 0.012);
  const score = Math.max(...PL.map(p => p.score)), r = Math.random();
  let type = 'normal';
  if (r < 0.1 && tPlay > 8) type = 'bomb'; else if (r < 0.2 && tPlay > 15) type = 'big'; else if (r < 0.29 && tPlay > 6) type = 'gold'; else if (r < 0.33 && !versus && lives < 5) type = 'heart';
  const hex = type === 'gold' ? 0xffd23f : type === 'heart' ? 0xff7ac0 : type === 'bomb' ? 0x2a2a38 : type === 'big' ? 0x6aa8ff : PALETTE[(Math.random() * PALETTE.length) | 0];
  const dur = dur0 * (type === 'gold' ? 0.75 : type === 'big' ? 1.1 : 1), size = d.size * settings.size * (type === 'big' ? 1.35 : type === 'gold' ? 0.82 : 1);
  const tg = pickTarget(nextPref); nextPref = (nextPref + 1) % NP();
  const e = pxToWorld(tg.x, tg.y), s = { x: rr(-0.6, 0.6), y: rr(-0.4, 0.5) };
  const g = new THREE.Group();
  const body = new THREE.Mesh(bubGeo, bubMat(hex, type === 'bomb' ? 0.95 : 0.42)); g.add(body);
  const core = new THREE.Mesh(bubGeo, getCore(hex)); core.scale.setScalar(0.5); g.add(core);
  const edge = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false })); edge.position.z = 0.05; g.add(edge);
  const hl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: type === 'bomb' ? 0.35 : 0.95 })); hl.scale.set(0.95, 0.65, 1); hl.position.set(-0.38, 0.42, 0.95); g.add(hl);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: type === 'bomb' ? 0xff2a2a : hex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: type === 'bomb' ? 0.7 : 0.55 })); glow.scale.set(3.2, 3.2, 1); glow.userData.glow = true; g.add(glow);
  if (ICON[type]) { const ic = new THREE.Sprite(new THREE.SpriteMaterial({ map: ICON[type], transparent: true, depthTest: false })); ic.scale.set(1.25, 1.25, 1); ic.position.z = 0.9; g.add(ic); }
  let ring = null; if (type === 'big') { ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xaad0ff })); g.add(ring); }
  scene.add(g);
  bubbles.push({ type, hex, g, body, core, glow, ring, t: 0, dur, size, sx: s.x, sy: s.y, ex: e.x, ey: e.y, ex_px: tg.x, ey_px: tg.y, x: s.x, y: s.y, z: -40, hp: type === 'big' ? 2 : 1, cool: 0, dead: false, wob: Math.random() * 6 });
}
function disposeBubble(b) { scene.remove(b.g); b.g.traverse(o => { if (o.material && o.material.map === undefined) {} if (o.isSprite && o.material) o.material.dispose(); }); }
function clearBubbles() { bubbles.forEach(disposeBubble); bubbles = []; }
const bubbleScreen = b => { const c = worldToPx(b.x, b.y, b.z), e = worldToPx(b.x + b.size, b.y, b.z); return { x: c.x, y: c.y, r: Math.abs(e.x - c.x) }; };
