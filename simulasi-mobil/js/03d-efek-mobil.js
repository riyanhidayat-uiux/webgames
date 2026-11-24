'use strict';
// ======================= EFEK MOBIL PEMAIN: LAMPU DEPAN & KERUSAKAN =======================
// Lampu depan: dua berkas cahaya kerucut (additive, memudar menjauh) + bercak terang di jalan; kuat malam hari, makin terlihat saat hujan/kabut.
// Kerusakan (mode menyetir): tiap tabrakan menambah goresan/penyok gelap; tabrakan ke-1 retakkan kaca depan; ke-2 mulai berasap; ke-3 asap hitam & percikan.
const FX = { car: null, grp: null, beams: [], pool: null, decals: [], level: 0, smokeT: 0, k: 0 };
const dmgMat = new THREE.MeshStandardMaterial({ color: 0x4a413a, roughness: 0.9, metalness: 0.3, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const dmgGeo = new THREE.SphereGeometry(1, 9, 6);
const crackTex = (() => { const c = mkCanvas(128, 96), x = c.getContext('2d'); x.strokeStyle = 'rgba(245,250,255,.95)'; x.lineWidth = 1.6; x.lineCap = 'round'; const cx = 70, cy = 40; for (let i = 0; i < 11; i++) { let a = i / 11 * 6.283 + Math.random() * 0.4, X = cx, Y = cy; x.beginPath(); x.moveTo(X, Y); for (let k = 0; k < 4; k++) { a += (Math.random() - 0.5) * 0.9; const l = 10 + Math.random() * 14; X += Math.cos(a) * l; Y += Math.sin(a) * l * 0.75; x.lineTo(X, Y); } x.stroke(); } x.lineWidth = 1; for (let r = 8; r < 30; r += 9) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.75, 0, 0.3, 5.2); x.stroke(); } return mkTex(c); })();
const crackMat = new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
const poolTex = (() => { const c = mkCanvas(64, 128), x = c.getContext('2d'), g = x.createRadialGradient(32, 100, 2, 32, 90, 90); g.addColorStop(0, 'rgba(255,244,214,1)'); g.addColorStop(0.5, 'rgba(255,236,190,.45)'); g.addColorStop(1, 'rgba(255,230,180,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 128); return mkTex(c); })();
function fxBuild(car) {
  const g = car.g, tp = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES[car.kind]) || { L: car.l || 4.5, W: car.w || 1.8, belt: 1.0, roof: 1.5, cabF: 0.9, cabFT: 0.3 }, L = car.l || tp.L, W = car.w || tp.W;
  FX.car = car; FX.L = L; FX.W = W; FX.tp = tp; FX.grp = new THREE.Group(); g.add(FX.grp); FX.beams = []; FX.decals = []; FX.level = 0; FX.crack = null;
  const bg = new THREE.CylinderGeometry(1.5, 0.05, 14, 18, 1, true), pos = bg.attributes.position, col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) { const t = (pos.getY(i) + 7) / 14, v = Math.pow(1 - t, 1.6) * 0.9; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = v; }   // t=0 ujung sempit (di mobil) → terang; menjauh memudar
  bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  [-1, 1].forEach(sd => { const m = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0xfff0cc, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, opacity: 0 })); m.rotation.x = -Math.PI / 2 + 0.06; m.position.set(sd * W * 0.32, 0.72, -L / 2 - 7); m.frustumCulled = false; m.renderOrder = 8; FX.grp.add(m); FX.beams.push(m); });
  FX.pool = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 12), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  FX.pool.rotation.x = -Math.PI / 2; FX.pool.position.set(0, 0.04, -L / 2 - 7); FX.pool.rotation.z = Math.PI; FX.grp.add(FX.pool);
}
function damageHit(side, target) {
  const c = target || playerCar; if (!c || !c.g) return;
  let D = c === FX.car ? FX : c.dmg;
  if (!D) { if (c === playerCar) return; D = c.dmg = { grp: new THREE.Group(), level: 0, decals: [], crack: null }; c.g.add(D.grp); }
  D.level = Math.min(3, D.level + 1);
  const tp = (typeof CAR_TYPES !== 'undefined' && CAR_TYPES[c.kind]) || { L: c.l || 4.5, W: c.w || 1.8, belt: 1.0, roof: 1.5, cabF: 0.9, cabFT: 0.3 }, L = c.l || tp.L, W = c.w || tp.W;
  const dent = (x, y, z, sx, sy, sz, ry) => { const m = new THREE.Mesh(dmgGeo, dmgMat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.y = ry; D.grp.add(m); D.decals.push(m); };
  const r = () => Math.random() - 0.5;
  dent(side * (0.3 + Math.random() * 0.35), 0.56 + r() * 0.08, -L / 2 + 0.03, 0.16 + Math.random() * 0.14, 0.06 + Math.random() * 0.05, 0.03, 0);            // penyok bumper depan
  dent(side * (W / 2 - 0.005), 0.86 + r() * 0.1, -L * (0.02 + Math.random() * 0.14), 0.025, 0.05 + Math.random() * 0.05, 0.16 + Math.random() * 0.14, 0);   // goresan samping
  if (D.level >= 2) dent(-side * 0.5, 0.6, -L / 2 + 0.03, 0.2, 0.07, 0.03, 0);
  if (D.level >= 1 && !D.crack) {   // kaca depan retak: bidang miring mengikuti kemiringan kaca
    const dx = tp.cabF - tp.cabFT, dy = tp.roof - tp.belt, n = Math.hypot(dx, dy), a = Math.atan2(-dx, -dy), xc = (tp.cabF + tp.cabFT) / 2, yc = (tp.belt + tp.roof) / 2, off = 0.025;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.62, n * 0.92), crackMat); m.rotation.x = a; m.position.set(0, yc + dx / n * off, -xc - dy / n * off); D.grp.add(m); D.crack = m;
  }
}
function damageClear() { if (!FX.grp) return; FX.decals.forEach(m => FX.grp.remove(m)); FX.decals = []; if (FX.crack) { FX.grp.remove(FX.crack); FX.crack = null; } FX.level = 0; }
function carFxFrame(dt) {
  if (!playerCar) return; if (FX.car !== playerCar) fxBuild(playerCar);
  const E = envNow(), W = WX(), night = E.night, haze = 1 + 1.6 * (W.rain ? 1 : 0) + (W.mist || MEV.fogKind ? 1.4 : 0), on = settings.view === 0 || state === 'menu' || state === 'garage' || (typeof garageOpen !== 'undefined' && garageOpen);
  const k = clamp((night - 0.1) * 1.3, 0, 1) * (on ? 1 : 0); FX.k += (k - FX.k) * Math.min(1, dt * 4);
  FX.beams.forEach(b => { b.material.opacity = 0.2 * FX.k * Math.min(haze, 2.4) * (GFXC.shadow || 0 ? 1 : 0.8); b.visible = FX.k > 0.02; }); FX.pool.material.opacity = 0.5 * FX.k; FX.pool.visible = FX.k > 0.02;
  if (FX.level >= 2 && state === 'play' && !(typeof raceActive === 'function' && raceActive())) {
    FX.smokeT -= dt; if (FX.smokeT <= 0) { FX.smokeT = FX.level >= 3 ? 0.07 : 0.16; const dark = FX.level >= 3; puff(P.x + (Math.random() - 0.5) * 0.4, 0.95, -FX.L / 2 + 0.6, 1, dark ? [0x1c1c1e, 0x2a2a2e, 0x3a3a3e] : [0x777779, 0x9a9a9e, 0xb8b8bc], 1.0, dark ? 1.9 : 1.4); if (dark && Math.random() < 0.18) puff(P.x + (Math.random() - 0.5) * 0.5, 0.7, -FX.L / 2 + 0.3, 2, [0xffd060, 0xff8a20], 3, 0.5); }
  }
}
