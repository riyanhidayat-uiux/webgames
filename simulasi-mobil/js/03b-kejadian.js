'use strict';
// ======================= KEJADIAN DI JALAN (mode menyetir) =======================
// 1) Ambulans / polisi menyusul dari belakang di lajurmu (sirene + lampu): pindah lajur untuk memberi jalan (+50), kalau tidak = tabrakan.
// 2) Kecelakaan (2 mobil menutup 2 lajur) atau mobil mogok (1 mobil + segitiga pengaman) di depan: pilih lajur yang terbuka.
// 3) Lubang jalan: tidak mengurangi nyawa, tapi memperlambat, mengguncang, dan memotong sedikit skor.
const EV = { nextD: 520, potD: 190, em: null, pots: [], wantEm: 0 };
let lastWhoosh = 0;
const laneOf = x => LANE_X.reduce((b, lx, i) => Math.abs(lx - x) < Math.abs(LANE_X[b] - x) ? i : b, 0);
const laneBusy = (lane, z0, z1) => traffic.some(c => !c.em && c.z > z0 && c.z < z1 && (c.lane === lane || (c.lc && c.lc.to === lane)));

// ---- lubang jalan ----
const potG = new THREE.CircleGeometry(1, 22), potMat = new THREE.MeshBasicMaterial({ color: 0x0b0b0e, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), potRim = new THREE.MeshBasicMaterial({ color: 0x585d66, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
function spawnPothole() {
  const g = new THREE.Group(), rim = new THREE.Mesh(potG, potRim), hole = new THREE.Mesh(potG, potMat); rim.rotation.x = hole.rotation.x = -Math.PI / 2; rim.scale.set(1.14, 1.14, 1); rim.position.y = 0.018; hole.position.y = 0.022; g.add(rim, hole);
  const rx = rr(0.65, 1.0), rz = rr(0.9, 1.5); g.scale.set(rx, 1, rz); const x = rr(-4.4, 4.4); g.position.set(x, 0, -175); scene.add(g); EV.pots.push({ g, x, z: -175, rx, rz, hit: false });
}
function clearPotholes() { EV.pots.forEach(p => scene.remove(p.g)); EV.pots = []; }

// ---- ambulans / polisi ----
function spawnEmergency() {
  const lane = laneOf(P.x); if (laneBusy(lane, -50, 30)) return false;
  const police = Math.random() < 0.4, c = police ? makeCar('sedan', 0x1d2b55) : makeCar('suv', 0xf6f6f8), roofY = police ? 1.6 : 1.9;
  const mR = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 1 }), mB = new THREE.MeshStandardMaterial({ color: 0x000055, emissive: 0x2a5aff, emissiveIntensity: 1 });
  const bar = new THREE.Group(), b1 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.28), mR), b2 = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.15, 0.28), mB); b1.position.x = -0.28; b2.position.x = 0.28; bar.add(b1, b2); bar.position.set(0, roofY + 0.07, -0.2); c.g.add(bar);
  if (!police) { const sm = new THREE.MeshBasicMaterial({ color: 0xd8222a }); [-1, 1].forEach(sd => { const st = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 3.4), sm); st.position.set(sd * (c.w / 2 + 0.012), 1.0, 0.15); c.g.add(st); }); }
  Object.assign(c, { x: LANE_X[lane], lane, z: 100, speed: Math.max(P.v, 20) + 15, nm: true, passed: true, lc: null, canLC: false, em: true, emPass: false, hit: false, mR, mB, police });
  c.g.position.set(c.x, 0, c.z); scene.add(c.g); traffic.push(c); EV.em = c; sirenStart(police); sfx.warn(); say(police ? '🚓 POLISI! MINGGIR!' : '🚑 AMBULANS! MINGGIR!', '#ff7a8a'); return true;
}
// ---- kecelakaan / mobil mogok ----
function spawnWreck() {
  const free = [0, 1, 2].filter(l => !laneBusy(l, -215, -165)).sort(() => Math.random() - 0.5); if (!free.length) return false;
  const n = free.length >= 3 ? 2 : 1;
  for (let k = 0; k < n; k++) {
    const lane = free[k], c = makeCar(pick(['sedan', 'hatch', 'suv']), pick([0x2a6ae0, 0xd8222a, 0xf2b81c, 0x2a9a4a, 0xe8e8ee, 0x8a8a96, 0xe87a1e]));
    Object.assign(c, { x: LANE_X[lane] + (n === 2 ? rr(-0.3, 0.3) : 0), lane, z: -190 + rr(-5, 5), speed: 0, nm: false, passed: false, lc: null, canLC: false, haz: true, stat: true, smoke: n === 2 });
    c.g.position.set(c.x, 0, c.z); c.g.rotation.y = n === 2 ? rr(-0.35, 0.35) : 0; scene.add(c.g); traffic.push(c);
    if (n === 1) { const tri = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.5, 3), new THREE.MeshStandardMaterial({ color: 0xd8222a, emissive: 0x661010, emissiveIntensity: 0.6 })); tri.position.set(0, 0.25, 7.5); c.g.add(tri); }
  }
  sfx.warn(); say(n === 2 ? '⚠ KECELAKAAN DI DEPAN!' : '⚠ MOBIL MOGOK DI DEPAN!', '#ffb36a'); return true;
}
function startEvent() {
  if (Math.random() < 0.45 || !spawnWreck()) EV.wantEm = 8;      // ambulans/polisi: coba muncul sampai 8 dtk (menunggu lajurmu kosong dari mobil di depan)
}
function resetEvents() {
  clearPotholes(); if (typeof clearMapEvents === 'function') clearMapEvents(); EV.em = null; EV.wantEm = 0; EV.nextD = rr(450, 650); EV.potD = rr(120, 220); lastWhoosh = 0; sirenStop();
}
// ---- per frame (hanya state 'play') ----
function updateEvents(dt) {
  const d = P.v * dt, hard = freeMode ? 0 : clamp(P.dist / 7000, 0, 1);
  if (typeof updateMapEvents === 'function') updateMapEvents(dt);
  EV.potD -= d; if (EV.potD <= 0) { spawnPothole(); EV.potD = rr(230, 480) * (freeMode ? 1.8 : 1) * (1 - 0.25 * hard); }
  for (let i = EV.pots.length - 1; i >= 0; i--) {
    const p = EV.pots[i]; p.z += d; p.g.position.z = p.z;
    if (!p.hit && Math.abs(p.z) < p.rz + 1.2 && Math.abs(p.x - P.x) < PW / 2 + p.rx * 0.55) {
      p.hit = true; P.v *= 0.78; shake = Math.max(shake, 0.75); sfx.thump(); puff(P.x, 0.2, 0, 8, [0x3a3a40, 0x6a6a72, 0xb0b0b8], 3, 1.2); try { navigator.vibrate && navigator.vibrate(40); } catch (e) {}
      if (timed) P.bonus = Math.max(-P.scoreAcc, P.bonus - 20); say('LUBANG JALAN!', '#ffb36a');
    }
    if (p.z > 14) { scene.remove(p.g); EV.pots.splice(i, 1); }
  }
  if (EV.wantEm > 0 && !EV.em) { EV.wantEm -= dt; if (spawnEmergency()) EV.wantEm = 0; }
  EV.nextD -= d; if (EV.nextD <= 0 && !EV.em && EV.wantEm <= 0 && !traffic.some(c => c.stat)) { startEvent(); EV.nextD = rr(520, 950) * (timed ? 1.15 : freeMode ? 1.7 : 1); }
  const e = EV.em;
  if (e) {
    if (!traffic.includes(e)) { EV.em = null; sirenStop(); }
    else {
      e.speed = Math.max(P.v, 20) + 14; const ph = Math.floor(elapsed * 9) % 2; e.mR.emissiveIntensity = ph ? 2.2 : 0.15; e.mB.emissiveIntensity = ph ? 0.15 : 2.2;
      sirenSet(Math.abs(e.z), e.x - P.x, e.z > 0 ? 1 : -1);
      if (!e.emPass && e.z < -3) { e.emPass = true; if (!e.hit) { P.bonus += 50; say('MINGGIR! +50', '#7fffd0'); sfx.coin(); } }
    }
  }
  const bl = Math.floor(elapsed * 3.2) % 2 ? 1.8 : 0;
  for (const c of traffic) {
    if (c.haz) c.blinkers.forEach(b => { b.material.emissiveIntensity = bl; });
    if (c.smoke && c.z > -130 && Math.random() < dt * 5) puff(c.x, 1.3, c.z, 1, [0x777777, 0x999999, 0x555555], 1.0, 1.8);
  }
}
