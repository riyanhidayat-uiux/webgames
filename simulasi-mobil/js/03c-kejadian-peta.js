'use strict';
// ======================= KEJADIAN KHAS PETA (mode menyetir) =======================
// Desa: kerbau/kambing menyeberang · Pegunungan: longsoran batu + kabut tebal · Pantai: ombak menyapu jalan · Bebatuan: badai debu.
// Dijadwalkan per jarak (bukan waktu) seperti kejadian lain; tidak berbarengan dengan ambulans/kecelakaan. Tol tidak punya kejadian khusus.
const MEV = { nextD: 420, animals: [], rocks: [], waves: [], fog: 0, fogT: 0, fogLeft: 0, fogKind: null, base: null, gust: 0 };
const FOGKIND = { kabut: { color: 0xdfe3e8, far: 0.32, near: 0.15 }, debu: { color: 0xc4975a, far: 0.2, near: 0.05 } };
// ---- hewan ----
const aMat = {}, aM = (c, r = 0.9) => aMat[c] || (aMat[c] = new THREE.MeshStandardMaterial({ color: c, roughness: r }));
const aSph = new THREE.SphereGeometry(1, 14, 10), aCyl = new THREE.CylinderGeometry(1, 0.75, 1, 8), aCone = new THREE.ConeGeometry(1, 1, 8);
// Hewan berkaki: badan elips, leher, kepala (moncong, telinga, tanduk/taring), 4 kaki berpivot di pinggul, ekor. Menghadap +z. Animasi jalan: animateAnimal().
function makeAnimal(kind) {
  const g = new THREE.Group(), K = kind === 'kerbau', B = kind === 'babi', s = K ? 1 : B ? 0.62 : 0.55;
  const bc = K ? 0x4a4743 : B ? 0x4a3328 : 0xe9e2d2, hc = K ? 0x3a3835 : B ? 0x3a261c : 0xd8cfbb, lc = K ? 0x2f2d2a : B ? 0x2a1c14 : 0x9a917f;
  const legH = (K ? 0.66 : B ? 0.5 : 0.78) * s, bodyY = legH + 0.14 * s, rw = (K ? 0.46 : B ? 0.5 : 0.4) * s, rh = (K ? 0.43 : B ? 0.46 : 0.38) * s, rl = (K ? 0.98 : B ? 0.92 : 0.9) * s;
  const mesh = (geo, c, sx, sy, sz, x, y, z, par) => { const m = new THREE.Mesh(geo, aM(c)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true; (par || g).add(m); return m; };
  mesh(aSph, bc, rw, rh, rl, 0, bodyY, 0);
  if (K) mesh(aSph, bc, rw * 0.9, rh * 0.8, 0.4 * s, 0, bodyY + 0.2 * s, 0.55 * s);   // punuk bahu
  // leher + kepala
  const head = new THREE.Group(), hz = rl + (K ? 0.05 : 0.0) * s, hy = bodyY + (K ? -0.02 : B ? -0.12 : 0.34) * s; head.position.set(0, hy, hz); g.add(head);
  const nl = (K ? 0.55 : B ? 0.3 : 0.6) * s, neck = mesh(aCyl, bc, (K ? 0.22 : B ? 0.28 : 0.13) * s, nl, (K ? 0.22 : B ? 0.28 : 0.13) * s, 0, (bodyY + hy) / 2, rl * 0.85 + nl * 0.18);
  neck.rotation.x = Math.atan2(hz - rl * 0.7, nl * 0.9) * 0.9 * (K || B ? 1 : 1.0) + (K ? 0.2 : 0);
  if (K) neck.rotation.x = 1.15; if (B) neck.rotation.x = 1.3; if (!K && !B) neck.rotation.x = 0.55;
  mesh(aSph, hc, (K ? 0.24 : B ? 0.26 : 0.14) * s, (K ? 0.24 : B ? 0.25 : 0.16) * s, (K ? 0.38 : B ? 0.3 : 0.26) * s, 0, 0, 0.12 * s, head);
  mesh(aSph, K ? 0x2a2826 : B ? 0x6a4a3a : 0xc8bfae, (K ? 0.2 : B ? 0.18 : 0.1) * s, (K ? 0.17 : B ? 0.16 : 0.09) * s, (K ? 0.2 : B ? 0.22 : 0.14) * s, 0, (K ? -0.08 : B ? -0.04 : -0.05) * s, (K ? 0.47 : B ? 0.42 : 0.34) * s, head);   // moncong
  [-1, 1].forEach(a => {
    mesh(aSph, 0x111111, 0.035 * s, 0.035 * s, 0.035 * s, a * (K ? 0.2 : 0.12) * s, 0.07 * s, (K ? 0.3 : 0.22) * s, head);                                              // mata
    const ear = mesh(aSph, hc, 0.16 * s * (B ? 0.7 : 1), 0.05 * s, 0.1 * s, a * (K ? 0.3 : 0.2) * s, 0.14 * s, -0.02 * s, head); ear.rotation.z = -a * 0.35;                // telinga
    if (K) { const h1 = mesh(aCyl, 0xd8d2c2, 0.045, 0.34, 0.045, a * 0.38, 0.2, -0.06, head); h1.rotation.z = -a * 1.25; h1.rotation.y = a * 0.3; const h2 = mesh(aCone, 0xcfc8b4, 0.04, 0.26, 0.04, a * 0.66, 0.3, -0.2, head); h2.rotation.z = -a * 0.4; h2.rotation.x = -0.9; }   // tanduk melengkung ke belakang
    else if (B) { const t = mesh(aCone, 0xe8e0c8, 0.02, 0.14, 0.02, a * 0.1, -0.02, 0.5 * s, head); t.rotation.z = a * 0.5; t.rotation.x = -0.5; }                         // taring
    else { const h = mesh(aCone, 0xd8cfbb, 0.025, 0.24, 0.025, a * 0.06, 0.2 * s, -0.04 * s, head); h.rotation.x = -0.5; }                                                    // tanduk kecil
  });
  if (kind === 'kambing') mesh(aCone, 0xd8cfbb, 0.035, 0.18, 0.035, 0, -0.2 * s, 0.3 * s, head).rotation.x = Math.PI;   // jenggot
  // kaki: pivot di pinggul/bahu supaya bisa berayun
  const legs = [];
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([a, b], i) => {
    const p = new THREE.Group(); p.position.set(a * rw * 0.62, legH + 0.16 * s, b * rl * 0.58); g.add(p); const lh = legH + 0.16 * s;
    mesh(aCyl, i < 2 ? bc : bc, (K ? 0.1 : B ? 0.08 : 0.05) * s * 1.4, lh, (K ? 0.1 : B ? 0.08 : 0.05) * s * 1.4, 0, -lh / 2, 0, p);
    mesh(aCyl, lc, (K ? 0.095 : B ? 0.08 : 0.05) * s * 1.2, 0.12 * s, (K ? 0.095 : B ? 0.08 : 0.05) * s * 1.2, 0, -lh + 0.06 * s, 0, p);   // kuku/kaki bawah gelap
    legs.push({ p, off: (i === 0 || i === 3) ? 0 : Math.PI });
  });
  // ekor
  const tail = new THREE.Group(); tail.position.set(0, bodyY + 0.12 * s, -rl * 0.95); g.add(tail);
  if (B) { const c = mesh(aCyl, bc, 0.03, 0.18 * s * 2, 0.03, 0, 0, -0.04, tail); c.rotation.x = -1.2; }
  else if (kind === 'kambing') { const c = mesh(aCone, bc, 0.05, 0.22, 0.05, 0, 0.08, -0.02, tail); c.rotation.x = -0.6; }
  else { const c = mesh(aCyl, bc, 0.035, 0.7, 0.035, 0, -0.3, -0.05, tail); mesh(aSph, 0x1f1d1b, 0.07, 0.14, 0.07, 0, -0.68, -0.05, tail); c.rotation.x = 0; }
  g.userData.legs = legs; g.userData.head = head; g.userData.tail = tail; g.userData.hy = hy; g.userData.big = K;
  return g;
}
function animateAnimal(a) {
  const u = a.g.userData; if (!u.legs) return; const sw = a.kind === 'kerbau' ? 0.45 : 0.6;
  u.legs.forEach(l => { l.p.rotation.x = Math.sin(a.ph + l.off) * sw; });
  u.head.rotation.x = Math.sin(a.ph * 2) * 0.06 + (u.big ? 0.12 : 0); u.tail.rotation.z = Math.sin(a.ph * 1.3) * 0.5; u.tail.rotation.x = Math.sin(a.ph * 0.9) * 0.12;
  a.g.position.y = Math.abs(Math.sin(a.ph)) * 0.025;
}
function spawnAnimals(msg, only) {
  const n = 2 + (Math.random() < 0.5 ? 1 : 0), dir = Math.random() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const kind = only || (i === 0 || Math.random() < 0.4 ? 'kerbau' : 'kambing'), g = makeAnimal(kind), x0 = -dir * (7.6 + i * 0.4), z0 = -165 - i * 7;
    g.scale.setScalar(kind === 'kerbau' ? 1.5 : 1.7); g.rotation.y = dir * Math.PI / 2; g.position.set(x0, 0, z0); scene.add(g); MEV.animals.push({ g, x: x0, z: z0, dir, kind, v: rr(1.1, 1.5), ph: rr(0, 6), hit: false, mooed: false });
  }
  say(msg || '🐃 TERNAK MENYEBERANG!', '#ffd27a'); sfx.warn();
}
// ---- longsoran batu ----
function spawnRockfall(label, pal) {
  const n = 3 + ((Math.random() * 3) | 0), lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
  for (let i = 0; i < n; i++) {
    const size = rr(0.55, 0.95), m = rockItem(pal || 'granit', size), g = new THREE.Group(); g.add(m); const tx = LANE_X[lanes[i % 3]] + rr(-0.8, 0.8), z0 = -150 - i * 9;
    g.position.set(-9.5 - i, 5 + rr(0, 3), z0); scene.add(g); MEV.rocks.push({ g, m, x: g.position.x, y: g.position.y, z: z0, tx, size, vy: 0, landed: false, hit: false, wait: i * 0.35, sp: rr(2.2, 3.4), spin: rr(1.5, 3) });
  }
  say(label || '🪨 LONGSORAN BATU!', '#ffb36a'); sfx.warn(); setTimeout(() => sfx.rockfall(), 400);
}
// ---- ombak ----
const waveMat = new THREE.MeshBasicMaterial({ color: 0xcfeeff, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -5 });
function spawnWave() {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(PAVED * 2 + 3, 9), waveMat); g.rotation.x = -Math.PI / 2; g.position.set(0, 0.03, -170); scene.add(g); MEV.waves.push({ g, z: -170, hit: false });
  say('🌊 OMBAK DI DEPAN!', '#9fe3ff'); sfx.warn();
}
// ---- kabut tebal / badai debu ----
function startFog(kind, secs) {
  const f = scene.fog; if (MEV.fogKind) return; MEV.fogKind = kind; MEV.fogT = 1; MEV.fogLeft = secs; MEV.base = { near: f.near, far: f.far, color: f.color.clone() };
  say(kind === 'debu' ? '🌪️ BADAI DEBU! Jarak pandang pendek' : '🌫️ KABUT TEBAL! Pelan-pelan', kind === 'debu' ? '#ffcf8a' : '#dfe9f3');
}
const veil = document.createElement('div'); veil.id = 'dustVeil'; veil.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;opacity:0;mix-blend-mode:normal;will-change:opacity';
document.body.appendChild(veil);
const SKYN = ['top', 'mid', 'bot'];
function fogFrame(dt) {
  const was = MEV.fog; MEV.fog += (MEV.fogT - MEV.fog) * Math.min(1, dt * 0.9);
  if (MEV.fogKind && MEV.base) {
    const K = FOGKIND[MEV.fogKind], f = scene.fog, k = MEV.fog, B = MEV.base, c = new THREE.Color(K.color).multiplyScalar(0.5 + 0.5 * clamp(hemi.intensity, 0, 1));
    f.far = lerp(B.far, B.far * K.far, k); f.near = lerp(B.near, Math.max(3, B.near * K.near), k); f.color.copy(B.color).lerp(c, k); scene.background.copy(f.color);
    if (!B.sky) B.sky = SKYN.map(n => skyMat.uniforms[n].value.clone());
    SKYN.forEach((n, i) => skyMat.uniforms[n].value.copy(B.sky[i]).lerp(f.color, k * (MEV.fogKind === 'debu' ? 0.92 : 0.8)));
    if (MEV.fogKind === 'debu') { mountains.forEach(m => { if (!m.userData.b0) m.userData.b0 = m.material.color.clone(); m.material.color.copy(m.userData.b0).lerp(f.color, k * 0.8); }); }
    const hex = '#' + f.color.getHexString(), t = elapsed * 260 % 400;
    veil.style.background = MEV.fogKind === 'debu' ? `repeating-linear-gradient(104deg, transparent 0 60px, rgba(214,170,110,.16) 60px 140px, transparent 140px 260px) ${t}px 0 / 400px 100%, radial-gradient(ellipse at 50% 55%, rgba(196,151,90,.12), ${hex}cc 95%)` : `radial-gradient(ellipse at 50% 55%, rgba(235,240,245,.1), ${hex}b0 95%)`;
    veil.style.opacity = (k * (MEV.fogKind === 'debu' ? 0.85 : 0.65)).toFixed(2);
  }
  if (MEV.fogKind && MEV.fogT === 0 && MEV.fog < 0.02) { MEV.fogKind = null; MEV.base = null; MEV.fog = 0; veil.style.opacity = 0; mountains.forEach(m => { if (m.userData.b0) { m.userData.b0 = null; } }); applyEnv(settings.env); }
  if (was !== MEV.fog || MEV.fogKind) MEV.gust = MEV.fog;
}
function clearMapEvents() {
  MEV.animals.forEach(a => scene.remove(a.g)); MEV.rocks.forEach(r => scene.remove(r.g)); MEV.waves.forEach(w => scene.remove(w.g)); MEV.animals = []; MEV.rocks = []; MEV.waves = [];
  if (MEV.fogKind) { MEV.fogKind = null; MEV.base = null; MEV.fogT = 0; MEV.fog = 0; MEV.gust = 0; veil.style.opacity = 0; mountains.forEach(m => { m.userData.b0 = null; }); applyEnv(settings.env); } MEV.nextD = rr(380, 620);
}
function updateMapEvents(dt) {
  const d = P.v * dt, id = MAP.id; fogFrame(dt);
  MEV.nextD -= d;
  if (MEV.nextD <= 0 && id !== 'tol' && id !== 'neon' && !EV.em && EV.wantEm <= 0 && !traffic.some(c => c.stat) && !MEV.animals.length && !MEV.rocks.length && !MEV.waves.length && !MEV.fogKind) {
    if (id === 'desa') spawnAnimals(); else if (id === 'gunung') { Math.random() < 0.6 ? spawnRockfall() : startFog('kabut', 22); } else if (id === 'pantai') spawnWave(); else if (id === 'salju') { Math.random() < 0.5 ? spawnRockfall('❄️ LONGSORAN SALJU!', 'kapur') : startFog('kabut', 22); } else if (id === 'hutan') { Math.random() < 0.65 ? spawnAnimals('🐗 BABI HUTAN MENYEBERANG!', 'babi') : startFog('kabut', 20); } else if (id === 'batu') Math.random() < 0.55 ? startFog('debu', 20) : spawnRockfall2();
    MEV.nextD = rr(520, 900) * (freeMode ? 1.5 : 1);
  }
  if (MEV.fogKind) { MEV.fogLeft -= dt; if (MEV.fogLeft <= 0) MEV.fogT = 0; }
  for (let i = MEV.animals.length - 1; i >= 0; i--) {
    const a = MEV.animals[i]; a.z += d; a.x += a.dir * a.v * dt; a.ph += dt * 6; a.g.position.x = a.x; a.g.position.z = a.z; animateAnimal(a);
    if (!a.mooed && a.z > -95) { a.mooed = true; sfx.moo(a.kind); }
    if (!a.hit && Math.abs(a.z) < PL / 2 + 0.7 && Math.abs(a.x - P.x) < PW / 2 + (a.kind === 'kerbau' ? 1.3 : 0.8)) { a.hit = true; crash(null); puff(a.x, 0.8, a.z, 10, [0x8a8070, 0xb0a890], 3, 1.2); }
    if (a.z > 16 || Math.abs(a.x) > 13) { scene.remove(a.g); MEV.animals.splice(i, 1); }
  }
  for (let i = MEV.rocks.length - 1; i >= 0; i--) {
    const r = MEV.rocks[i]; r.z += d;
    if (r.wait > 0) { if (r.z > -120) r.wait -= dt; } else if (!r.landed) {
      r.x += Math.sign(r.tx - r.x) * r.sp * dt * 2; r.vy -= 9.8 * dt; r.y += r.vy * dt; r.m.rotation.x += r.spin * dt; r.m.rotation.z += r.spin * 0.7 * dt; const gy = 0;
      if (r.y <= gy) { r.y = gy; r.vy = -r.vy * 0.3; if (Math.abs(r.vy) < 0.8) r.vy = 0; }
      if (Math.abs(r.tx - r.x) < 0.25 && r.y <= 0.01) { r.landed = true; puff(r.x, 0.3, r.z, 5, [0x8a8680, 0xb8b2a8], 2, 1); }
    }
    r.g.position.set(r.x, r.y, r.z);
    if (!r.hit && Math.abs(r.z) < PL / 2 + r.size * 0.5 && Math.abs(r.x - P.x) < PW / 2 + r.size * 0.75 && r.y < 1) { r.hit = true; crash(null); puff(r.x, 0.5, r.z, 8, [0x8a8680, 0xb8b2a8], 3, 1); scene.remove(r.g); MEV.rocks.splice(i, 1); continue; }
    if (r.z > 16) { scene.remove(r.g); MEV.rocks.splice(i, 1); }
  }
  for (let i = MEV.waves.length - 1; i >= 0; i--) {
    const w = MEV.waves[i]; w.z += d; w.g.position.z = w.z; waveMat.opacity = 0.35 + 0.15 * Math.sin(elapsed * 6);
    if (!w.hit && Math.abs(w.z) < 4.5 + PL / 2) { w.hit = true; P.v *= 0.86; P.vl += rr(-3, 3); shake = Math.max(shake, 0.5); sfx.splash(); puff(P.x, 0.4, -1, 14, [0xeaf6ff, 0xbfe3ff, 0xffffff], 4, 1.2); say('🌊 OMBAK! Jalan licin', '#9fe3ff'); }
    if (w.z > 14) { scene.remove(w.g); MEV.waves.splice(i, 1); }
  }
}
const spawnRockfall2 = () => spawnRockfall();   // Bebatuan: batu runtuh dari tebing kapur juga
