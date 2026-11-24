'use strict';
// --- langit, matahari, bulan, bintang, awan, burung, gunung ---
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color(0x2a7be0) }, mid: { value: new THREE.Color(0x7ec0ff) }, bot: { value: new THREE.Color(0xd8efff) } },
  vertexShader: 'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float vY; void main(){ float y = max(vY,0.0); vec3 c = mix(bot, mid, smoothstep(0.0,0.3,y)); c = mix(c, top, smoothstep(0.25,0.85,y)); gl_FragColor = vec4(c,1.0); }'
});
const dome = new THREE.Mesh(new THREE.SphereGeometry(150, 24, 16), skyMat); dome.renderOrder = -10; scene.add(dome);
const starGeo = new THREE.BufferGeometry(), starPos = new Float32Array(420 * 3);
for (let i = 0; i < 420; i++) { const a = Math.random() * 6.283, y = 0.08 + Math.random() * 0.9, r = Math.sqrt(1 - y * y) * 140; starPos[i * 3] = Math.cos(a) * r; starPos[i * 3 + 1] = y * 140; starPos[i * 3 + 2] = Math.sin(a) * r; }
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); scene.add(stars);
const sunTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.18, 'rgba(255,240,180,1)'); g.addColorStop(0.4, 'rgba(255,200,100,.35)'); g.addColorStop(1, 'rgba(255,180,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return mkTex(c); })();
const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); sunSpr.scale.set(46, 46, 1); scene.add(sunSpr);
const moonTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 20, 64, 64, 64); g.addColorStop(0, 'rgba(220,230,255,.5)'); g.addColorStop(1, 'rgba(220,230,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); x.fillStyle = '#eef2ff'; x.beginPath(); x.arc(64, 64, 24, 0, 6.283); x.fill(); x.fillStyle = 'rgba(160,170,200,.45)'; [[56, 58, 5], [72, 70, 4], [66, 52, 3]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 6.283); x.fill(); }); return mkTex(c); })();
const moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false, fog: false })); moonSpr.scale.set(30, 30, 1); scene.add(moonSpr);
const cloudTex = (() => { const c = mkCanvas(256, 128), x = c.getContext('2d'); for (let i = 0; i < 16; i++) { const px = 40 + Math.random() * 176, py = 60 + Math.random() * 20 - (i < 8 ? 10 : 0), r = 22 + Math.random() * 26, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 128); } return mkTex(c); })();
const clouds = [];
for (let i = 0; i < 14; i++) { const m = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: rr(0.7, 0.95) }); const sp = new THREE.Sprite(m); const sc = rr(24, 46); sp.scale.set(sc, sc * 0.45, 1); sp.position.set(rr(-110, 110), rr(22, 52), rr(-150, -90)); sp.userData.v = rr(0.5, 1.6); scene.add(sp); clouds.push(sp); }
const birds = [];
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group(), bm = new THREE.MeshBasicMaterial({ color: 0x2a2a34, side: THREE.DoubleSide, fog: false });
  const mkW = s => { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.35), bm); const pv = new THREE.Group(); w.position.x = s * 0.55; pv.add(w); g.add(pv); return pv; };
  g.userData = { l: mkW(-1), r: mkW(1), v: rr(5, 9), ph: Math.random() * 6 };
  g.position.set(rr(-90, 90), rr(14, 26), rr(-100, -60)); g.scale.setScalar(rr(1.2, 2)); scene.add(g); birds.push(g);
}
function ridge(w, h, rough, fillStyle) { const c = mkCanvas(1024, 128), x = c.getContext('2d'); x.fillStyle = fillStyle; x.beginPath(); x.moveTo(0, 128); let y = 70; for (let i = 0; i <= 1024; i += 16) { y += rr(-rough, rough); y = Math.max(20, Math.min(104, y)); x.lineTo(i, y); } x.lineTo(1024, 128); x.closePath(); x.fill(); return mkTex(c); }
function skyline() { const c = mkCanvas(1024, 128), x = c.getContext('2d'); x.fillStyle = '#fff'; let px = 0; while (px < 1024) { const w = 16 + Math.random() * 30, h = 20 + Math.random() * 80; x.fillRect(px, 128 - h, w, h); if (Math.random() < 0.3) x.fillRect(px + w / 2 - 1, 128 - h - 14, 2, 14); px += w + Math.random() * 6; } return mkTex(c); }
const farLayers = [
  { mesh: new THREE.Mesh(new THREE.PlaneGeometry(430, 52), new THREE.MeshBasicMaterial({ map: ridge(430, 52, 16, '#fff'), transparent: true, depthWrite: false, fog: false })), z: -142, y: 25, k: 0.55 },
  { mesh: new THREE.Mesh(new THREE.PlaneGeometry(400, 34), new THREE.MeshBasicMaterial({ map: ridge(400, 34, 11, '#fff'), transparent: true, depthWrite: false, fog: false })), z: -128, y: 16, k: 0.4 },
  { mesh: new THREE.Mesh(new THREE.PlaneGeometry(360, 40), new THREE.MeshBasicMaterial({ map: skyline(), transparent: true, depthWrite: false, fog: false })), z: -112, y: 19, k: 0.28 }
];
farLayers.forEach(l => { l.mesh.position.set(0, l.y, l.z); scene.add(l.mesh); });

// --- siklus siang -> senja -> malam -> fajar (berdasarkan jarak lari) ---
const C = h => new THREE.Color(h);
const KF = [
  { p: 0.0, top: C(0x2a7be0), mid: C(0x7ec0ff), bot: C(0xd8efff), fog: C(0xcfe8ff), hemiI: 0.85, sunI: 0.9, sunC: C(0xffffff), hemiG: C(0x4a6a40), ng: 0, grass: C(0xffffff), cloud: C(0xffffff), far: C(0x8aaad0), sunY: 30 },
  { p: 0.25, top: C(0x3a3a8a), mid: C(0xe0704a), bot: C(0xffc27a), fog: C(0xf0a878), hemiI: 0.6, sunI: 0.65, sunC: C(0xffb070), hemiG: C(0x5a4a40), ng: 0.3, grass: C(0xffc8a0), cloud: C(0xffb89a), far: C(0x9a6a7a), sunY: 7 },
  { p: 0.5, top: C(0x050a24), mid: C(0x0e1a4a), bot: C(0x26306a), fog: C(0x1c2456), hemiI: 0.4, sunI: 0.2, sunC: C(0x8aa0ff), hemiG: C(0x1a2040), ng: 1, grass: C(0x6a78a8), cloud: C(0x4a5a8a), far: C(0x1a2450), sunY: -22 },
  { p: 0.75, top: C(0x4a4a9a), mid: C(0xff8f8a), bot: C(0xffd0a0), fog: C(0xf0b090), hemiI: 0.55, sunI: 0.55, sunC: C(0xffc090), hemiG: C(0x5a4a4a), ng: 0.35, grass: C(0xffd0b0), cloud: C(0xffc0a8), far: C(0xa8708a), sunY: 6 },
  { p: 1.0, top: C(0x2a7be0), mid: C(0x7ec0ff), bot: C(0xd8efff), fog: C(0xcfe8ff), hemiI: 0.85, sunI: 0.9, sunC: C(0xffffff), hemiG: C(0x4a6a40), ng: 0, grass: C(0xffffff), cloud: C(0xffffff), far: C(0x8aaad0), sunY: 30 }
];
const E = { top: new THREE.Color(), mid: new THREE.Color(), bot: new THREE.Color(), fog: new THREE.Color(), sunC: new THREE.Color(), hemiG: new THREE.Color(), grass: new THREE.Color(), cloud: new THREE.Color(), far: new THREE.Color(), hemiI: 1, sunI: 1, ng: 0, sunY: 30 };
let envPhase = 0;
function updateEnv(dt) {
  const target = (state === 'play' || state === 'dying' || state === 'count') ? (dist / 1800) % 1 : 0;
  envPhase = target;
  let i = 0; while (i < KF.length - 2 && envPhase >= KF[i + 1].p) i++;
  const a = KF[i], b = KF[i + 1]; let t = (envPhase - a.p) / (b.p - a.p); t = t * t * (3 - 2 * t);
  ['top', 'mid', 'bot', 'fog', 'sunC', 'hemiG', 'grass', 'cloud', 'far'].forEach(k => E[k].copy(a[k]).lerp(b[k], t));
  E.hemiI = a.hemiI + (b.hemiI - a.hemiI) * t; E.sunI = a.sunI + (b.sunI - a.sunI) * t; E.ng = a.ng + (b.ng - a.ng) * t; E.sunY = a.sunY + (b.sunY - a.sunY) * t;
  skyMat.uniforms.top.value.copy(E.top); skyMat.uniforms.mid.value.copy(E.mid); skyMat.uniforms.bot.value.copy(E.bot);
  scene.fog.color.copy(E.fog);
  hemi.intensity = E.hemiI; hemi.groundColor.copy(E.hemiG); sun.intensity = E.sunI; sun.color.copy(E.sunC);
  grassMat.color.copy(E.grass); hedgeMat.color.copy(E.grass); hedgeTop.color.copy(E.grass); sideMat.color.copy(E.grass).lerp(new THREE.Color(0xffffff), 0.4);
  dome.position.copy(camera.position);
  const ng = E.ng;
  stars.position.copy(camera.position); stars.material.opacity = Math.max(0, (ng - 0.45) / 0.55);
  sunSpr.position.set(-38, Math.max(E.sunY, -30), -135); sunSpr.material.color.copy(E.sunC); sunSpr.material.opacity = ng > 0.9 ? 0 : 1;
  moonSpr.position.set(36, 34, -135); moonSpr.material.opacity = Math.max(0, (ng - 0.5) / 0.5);
  clouds.forEach(c => { c.position.x += c.userData.v * dt * 0.4; if (c.position.x > 130) c.position.x = -130; c.material.color.copy(E.cloud); });
  birds.forEach(g => {
    const u = g.userData; g.position.x += u.v * dt; if (g.position.x > 100) g.position.x = -100;
    const f = Math.sin(elapsed * 9 + u.ph) * 0.6; u.l.rotation.z = f; u.r.rotation.z = -f; g.visible = ng < 0.55;
  });
  farLayers.forEach(l => l.mesh.material.color.copy(E.far).multiplyScalar(1 - l.k * 0.35));
  winMats.forEach(m => { m.emissiveIntensity = ng > 0.2 ? Math.min(1, (ng - 0.2) / 0.5) : 0; });
  glowMat.opacity = 0.18 + 0.7 * Math.min(1, ng * 1.3);
  MATS.beacon.emissiveIntensity = 0.4 + 0.9 * (0.5 + 0.5 * Math.sin(elapsed * 4));
  MATS.lamp.emissiveIntensity = 0.5 + 0.9 * (0.5 + 0.5 * Math.sin(elapsed * 7));
}

// pelari: karakter berdetail dengan rangka bersendi (paha-lutut, lengan-siku)
const runner = new THREE.Group();
const rig = (() => {
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o || {}));
  const mat = {
    hoodie: M(0xf3eee6, { roughness: 0.85 }), hoodieDark: M(0xd9d2c6, { roughness: 0.9 }), vest: M(0x5b7fb0, { roughness: 0.8 }), vestLow: M(0xb9a688, { roughness: 0.85 }), vestDark: M(0x3f5f8c, { roughness: 0.85 }),
    jeans: M(0x4d6fa3, { roughness: 0.85 }), jeansLight: M(0x6b8fc4, { roughness: 0.85 }), jeansDark: M(0x34507d, { roughness: 0.9 }),
    skin: M(0xf0b98a, { roughness: 0.7 }), skinDark: M(0xd99a6c, { roughness: 0.7 }), hair: M(0x6a3a1c, { roughness: 0.8 }),
    cap: M(0xe8461e, { roughness: 0.65 }), capDark: M(0xb8310f, { roughness: 0.7 }), capWhite: M(0xf6f2ea, { roughness: 0.7 }),
    shoe: M(0xf4f4f2, { roughness: 0.5 }), shoeGrey: M(0xc9ccd2, { roughness: 0.6 }), sole: M(0xe9e9e6, { roughness: 0.55 }), lace: M(0x82d12e, { emissive: 0x2a4a08, roughness: 0.5 }), red: M(0xd8321e, { roughness: 0.6 }),
    eyeW: M(0xffffff, { roughness: 0.3 }), iris: M(0x5a3418, { roughness: 0.4 }), teeth: M(0xffffff, { roughness: 0.3 }), belt: M(0x2a2a30, { roughness: 0.7 })
  };
  const dark = new THREE.MeshBasicMaterial({ color: 0x1a1210 });
  const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.scale.set(sx, sy, sz); return o; };
  const cyl = (rt, rb, h, m, seg = 14) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const put = (par, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
  const grp = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };

  const hips = grp(runner, 0, 0.98, 0);
  put(hips, sph(0.27, mat.jeans, 1, 0.7, 0.88));
  put(hips, cyl(0.272, 0.272, 0.05, mat.belt, 18), 0, 0.1, 0);                 // ikat pinggang
  [-1, 1].forEach(s => { put(hips, box(0.15, 0.17, 0.02, mat.jeansDark), s * 0.11, -0.05, 0.235).rotation.y = 0; put(hips, box(0.13, 0.012, 0.022, mat.jeansLight), s * 0.11, 0.025, 0.236); });  // saku belakang
  const torso = grp(hips, 0, 0.1, 0); torso.scale.set(1.12, 1, 1.1);
  put(torso, cyl(0.255, 0.23, 0.66, mat.hoodie, 20), 0, 0.31, 0);              // kaus / hoodie putih
  put(torso, cyl(0.27, 0.245, 0.4, mat.vest, 20), 0, 0.43, 0);                 // rompi jeans (atas)
  put(torso, cyl(0.255, 0.24, 0.22, mat.vestLow, 20), 0, 0.12, 0);             // rompi bagian bawah (krem)
  put(torso, cyl(0.258, 0.258, 0.03, mat.vestDark, 20), 0, 0.235, 0);          // sambungan
  put(torso, sph(0.3, mat.vest, 1, 0.45, 0.88), 0, 0.64, 0);                   // bahu rompi
  put(torso, box(0.015, 0.5, 0.02, mat.vestDark), 0, 0.31, 0.27);              // kelim punggung
  put(torso, box(0.2, 0.12, 0.02, mat.vestDark), 0, 0.46, 0.272);              // tambalan punggung
  put(torso, box(0.12, 0.04, 0.025, mat.red), 0, 0.46, 0.278);
  [-1, 1].forEach(s => { put(torso, box(0.14, 0.12, 0.02, mat.vestLow), s * 0.1, 0.18, -0.245); });  // saku depan
  // tudung hoodie yang menggantung di punggung (bergoyang)
  put(torso, sph(0.25, mat.hoodie, 1.2, 0.8, 0.8), 0, 0.68, 0.16);
  const ponyChain = []; let pp = grp(torso, 0, 0.66, 0.26);
  for (let i = 0; i < 3; i++) { const g = grp(pp, 0, -0.085, 0.035); put(g, sph(0.21 - i * 0.035, i ? mat.hoodieDark : mat.hoodie, 1.1, 0.75, 0.5)); ponyChain.push(g); pp = g; }
  const scarfSegs = [];
  // kepala
  const head = grp(torso, 0, 0.8, 0); head.scale.set(1.14, 1.3, 1.2);
  put(head, cyl(0.075, 0.085, 0.12, mat.skin), 0, -0.05, 0);                    // leher
  put(head, sph(0.24, mat.skin, 1, 1.02, 0.98), 0, 0.21, 0);
  put(head, sph(0.075, mat.skin, 1.1, 0.8, 0.8), 0, 0.09, -0.16);              // dagu
  [-1, 1].forEach(sx => {
    put(head, sph(0.058, mat.eyeW, 1, 1.25, 0.55), sx * 0.085, 0.235, -0.205);
    put(head, sph(0.036, mat.iris, 1, 1.2, 0.5), sx * 0.085, 0.233, -0.226);
    put(head, sph(0.019, dark, 1, 1.2, 0.5), sx * 0.085, 0.232, -0.234);
    const hl = sph(0.012, mat.eyeW); hl.position.set(sx * 0.085 + 0.013, 0.248, -0.236); head.add(hl);
    put(head, box(0.1, 0.032, 0.025, mat.hair), sx * 0.09, 0.3, -0.215).rotation.z = -sx * 0.22;   // alis tebal
    put(head, sph(0.045, mat.skin, 0.6, 1, 0.55), sx * 0.235, 0.2, 0);                             // telinga
    put(head, sph(0.04, mat.hair, 0.6, 1.8, 0.8), sx * 0.2, 0.2, -0.07);                            // cambang
    put(head, new THREE.Mesh(new THREE.CircleGeometry(0.04, 12), M(0xf09a86)), sx * 0.15, 0.15, -0.19).rotation.y = -sx * 0.5;
  });
  put(head, sph(0.034, mat.skinDark, 1, 0.9, 0.9), 0, 0.185, -0.235);          // hidung
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.013, 6, 16, Math.PI), dark); sm.rotation.z = Math.PI; put(head, sm, 0.01, 0.14, -0.224);   // senyum lebar
  put(head, box(0.1, 0.022, 0.012, mat.teeth), 0.01, 0.123, -0.232);           // gigi
  put(head, sph(0.22, mat.hair, 1, 0.5, 0.62), 0, 0.3, -0.08);                 // rambut depan
  put(head, sph(0.19, mat.hair, 1.0, 0.5, 0.5), 0, 0.2, 0.16);               // rambut belakang (di bawah topi)
  // topi baseball oranye-merah, panel depan putih
  const cap = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.255, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.46), mat.cap), 0, 0.27, 0.0); cap.scale.set(1, 1.1, 1.08);
  const panel = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.2575, 18, 12, Math.PI * 1.5 - 0.55, 1.1, 0, Math.PI * 0.4), mat.capWhite), 0, 0.27, 0.0); panel.scale.set(1, 1.1, 1.08);
  put(head, cyl(0.258, 0.262, 0.03, mat.capDark, 22), 0, 0.272, 0.0).scale.set(1, 1, 1.08);   // lis tepi topi
  const brim = put(head, sph(0.2, mat.cap, 1.12, 0.1, 1.0), 0, 0.3, -0.27); brim.rotation.x = 0.28;
  put(head, sph(0.19, mat.capDark, 1.1, 0.04, 0.95), 0, 0.287, -0.27).rotation.x = 0.28;
  put(head, box(0.07, 0.07, 0.02, mat.lace), 0, 0.4, -0.2).rotation.x = -0.5;                    // logo hijau
  put(head, box(0.18, 0.045, 0.03, mat.capDark), 0, 0.27, 0.255);               // pengatur belakang
  put(head, box(0.05, 0.05, 0.02, mat.cap), 0, 0.46, 0.0);                      // kancing atas
  // lengan: lengan hoodie putih, tangan kulit
  const mkArm = side => {
    const sh = grp(torso, side * 0.37, 0.64, 0); sh.scale.set(1.12, 1, 1.12);
    put(sh, sph(0.1, mat.hoodie));
    put(sh, cyl(0.072, 0.064, 0.34, mat.hoodie), 0, -0.17, 0);
    const el = grp(sh, 0, -0.34, 0);
    put(el, sph(0.066, mat.hoodie));
    put(el, cyl(0.066, 0.058, 0.28, mat.hoodie), 0, -0.14, 0);
    put(el, cyl(0.064, 0.064, 0.05, mat.hoodieDark), 0, -0.27, 0);              // manset
    put(el, sph(0.074, mat.skin, 1, 1.1, 0.9), 0, -0.34, 0);                   // tangan
    put(el, sph(0.034, mat.skin), side * 0.05, -0.31, -0.04);                  // jempol
    return { sh, el };
  };
  // kaki: jeans digulung, sepatu putih tali hijau
  const mkLeg = side => {
    const hp = grp(hips, side * 0.12, -0.02, 0); hp.scale.set(1.12, 1, 1.12);
    put(hp, cyl(0.112, 0.09, 0.44, mat.jeans), 0, -0.22, 0);
    put(hp, box(0.045, 0.3, 0.02, mat.jeansLight), side * 0.098, -0.2, 0);
    const kn = grp(hp, 0, -0.44, 0);
    put(kn, sph(0.09, mat.jeans));
    put(kn, cyl(0.09, 0.07, 0.4, mat.jeans), 0, -0.2, 0);
    if (side < 0) { put(kn, box(0.07, 0.07, 0.02, mat.skin), 0, -0.02, -0.088); put(kn, box(0.1, 0.012, 0.022, mat.jeansLight), 0, -0.065, -0.089); }   // sobekan lutut
    put(kn, cyl(0.086, 0.086, 0.07, mat.jeansLight), 0, -0.36, 0);             // lipatan celana
    const ft = grp(kn, 0, -0.4, 0); ft.scale.set(1.12, 1, 1.15);
    put(ft, sph(0.105, mat.shoe, 0.95, 0.75, 1.6), 0, -0.045, -0.07);
    put(ft, sph(0.085, mat.shoe, 1, 0.9, 1), 0, 0.0, 0.03);                    // pergelangan sepatu
    put(ft, box(0.19, 0.055, 0.4, mat.sole), 0, -0.112, -0.07);
    put(ft, box(0.12, 0.03, 0.12, mat.lace), 0, 0.01, -0.1).rotation.x = -0.2;  // lidah & tali hijau
    put(ft, box(0.15, 0.028, 0.03, mat.lace), 0, 0.03, -0.06);
    put(ft, box(0.15, 0.05, 0.05, mat.red), 0, -0.04, 0.12);                   // aksen tumit merah
    put(ft, sph(0.055, mat.shoeGrey, 1, 0.6, 1), 0, -0.04, -0.2);              // ujung sepatu
    return { hp, kn, ft };
  };
  const aL = mkArm(-1), aR = mkArm(1), lL = mkLeg(-1), lR = mkLeg(1);
  const key = new THREE.Group(); torso.add(key);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 18), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.3 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; runner.add(shadow);
  runner.scale.setScalar(0.9);
  scene.add(runner);
  const cur = { hipY: 0.98, torsoX: -0.2, headX: 0, thL: 0, thR: 0, knL: 0, knR: 0, anL: 0, anR: 0, arL: 0, arR: 0, elL: 1, elR: 1, yaw: 0, armZ: 0.12, twist: 0, roll: 0, sway: 0, runT: 0, puL: 0, puR: 0 };
  return { mat, hips, torso, head, aL, aR, lL, lR, scarfSegs, ponyChain, key, shadow, cur };
})();

// rintangan & koin
function diagTex(c1, c2, w = 128, h = 64) {
  const c = mkCanvas(w, h), x = c.getContext('2d'); x.fillStyle = c1; x.fillRect(0, 0, w, h); x.fillStyle = c2;
  for (let i = -h; i < w + h; i += h / 2) { x.beginPath(); x.moveTo(i, h); x.lineTo(i + h / 4, h); x.lineTo(i + h * 0.75, 0); x.lineTo(i + h / 2, 0); x.closePath(); x.fill(); }
  return mkTex(c);
}
const OBM = {
  conc: new THREE.MeshStandardMaterial({ color: 0xb8bcc6, roughness: 0.9 }),
  face: (() => {
    const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#f0702a'; x.fillRect(0, 0, 128, 128);
    const hz = diagTex('#ffd23f', '#22262e', 128, 24); x.drawImage(hz.image, 0, 0); x.drawImage(hz.image, 0, 104);
    x.fillStyle = '#fff'; x.fillRect(14, 30, 100, 68); x.strokeStyle = '#22262e'; x.lineWidth = 4; x.strokeRect(14, 30, 100, 68);
    x.font = '54px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#e0302a'; x.fillText('⛔', 64, 66);
    return new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.6 });
  })(),
  low19: new THREE.MeshStandardMaterial({ map: rep(diagTex('#ffffff', '#e0483a'), 4, 1), roughness: 0.5 }),
  low61: new THREE.MeshStandardMaterial({ map: rep(diagTex('#ffffff', '#e0483a'), 12, 1), roughness: 0.5 }),
  hz19: new THREE.MeshStandardMaterial({ map: rep(diagTex('#ffd23f', '#22262e'), 4, 1), roughness: 0.5 }),
  hz61: new THREE.MeshStandardMaterial({ map: rep(diagTex('#ffd23f', '#22262e'), 12, 1), roughness: 0.5 }),
  sign: (() => {
    const c = mkCanvas(256, 64), x = c.getContext('2d'); x.fillStyle = '#7a2ae0'; x.fillRect(0, 0, 256, 64); x.strokeStyle = '#fff'; x.lineWidth = 4; x.strokeRect(3, 3, 250, 58);
    x.font = 'bold 30px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText('▼ MERUNDUK ▼', 128, 34);
    return new THREE.MeshStandardMaterial({ map: mkTex(c), roughness: 0.5, emissive: 0x2a0a5a });
  })(),
  post: new THREE.MeshStandardMaterial({ color: 0xcfd6e6, metalness: 0.5, roughness: 0.4 }),
  plate: new THREE.MeshStandardMaterial({ color: 0x2a2e3a, roughness: 0.8 }),
  coinSide: new THREE.MeshStandardMaterial({ color: 0xc8901a, metalness: 0.8, roughness: 0.3, emissive: 0x5a3a00 }),
  coinFace: (() => {
    const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 56, 6, 64, 64, 64);
    g.addColorStop(0, '#fff4a0'); g.addColorStop(0.6, '#ffd23f'); g.addColorStop(1, '#d9a21a'); x.fillStyle = g; x.beginPath(); x.arc(64, 64, 62, 0, 6.283); x.fill();
    x.strokeStyle = '#c8901a'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 50, 0, 6.283); x.stroke();
    x.fillStyle = '#e8b020'; x.strokeStyle = '#fff4a0'; x.lineWidth = 3; x.beginPath();
    for (let i = 0; i < 10; i++) { const rad = i % 2 ? 14 : 34, an = -Math.PI / 2 + i * Math.PI / 5; x[i ? 'lineTo' : 'moveTo'](64 + Math.cos(an) * rad, 64 + Math.sin(an) * rad); }
    x.closePath(); x.fill(); x.stroke();
    return new THREE.MeshStandardMaterial({ map: mkTex(c), metalness: 0.6, roughness: 0.3, emissive: 0x6a4a00, emissiveIntensity: 0.6 });
  })()
};
const coinGlowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
const GEO = { coin: new THREE.CylinderGeometry(0.32, 0.32, 0.08, 28), rim: new THREE.TorusGeometry(0.32, 0.035, 8, 28) };
const _gc = {}; const GC = (T, ...a) => { const k = T + a.join(','); return _gc[k] || (_gc[k] = new THREE[T + 'Geometry'](...a)); };
function mkBlock() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(GC('Box', 1.95, 0.2, 1.35), OBM.plate); base.position.y = 0.1; g.add(base);
  const body = new THREE.Mesh(GC('Box', 1.8, 2.0, 1.2), [OBM.conc, OBM.conc, OBM.conc, OBM.conc, OBM.face, OBM.face]); body.position.y = 1.2; body.castShadow = true; g.add(body);
  const lb = new THREE.Mesh(GC('Cylinder', 0.16, 0.2, 0.12, 10), OBM.plate); lb.position.y = 2.26; g.add(lb);
  const lamp = new THREE.Mesh(GC('Sphere', 0.17, 10, 8), MATS.lamp); lamp.position.y = 2.4; g.add(lamp);
  [-0.7, 0.7].forEach(px => { const rf = new THREE.Mesh(GC('Box', 0.22, 0.1, 0.02), MATS.beacon); rf.position.set(px, 0.45, 0.61); g.add(rf); });
  return g;
}
function mkBar(kind, wide) {
  const g = new THREE.Group(), w = wide ? 6.1 : 1.9;
  const low = kind === 'low', y = low ? 0.55 : 1.3, th = low ? 0.24 : 0.36, ph = low ? 0.7 : 1.75;
  const mat = low ? (wide ? OBM.low61 : OBM.low19) : (wide ? OBM.hz61 : OBM.hz19);
  const bar = new THREE.Mesh(GC('Box', w, th, 0.3), mat); bar.position.y = y; bar.castShadow = true; g.add(bar);
  [-1, 1].forEach(sd => {
    const px = sd * (w / 2 - 0.08);
    const p = new THREE.Mesh(GC('Box', 0.16, ph, 0.16), OBM.post); p.position.set(px, ph / 2, 0); p.castShadow = true; g.add(p);
    const bp = new THREE.Mesh(GC('Box', 0.4, 0.06, 0.55), OBM.plate); bp.position.set(px, 0.03, 0); g.add(bp);
    const tip = new THREE.Mesh(GC('Sphere', low ? 0.1 : 0.13, 8, 6), low ? MATS.beacon : MATS.lamp); tip.position.set(px, ph + 0.06, 0); g.add(tip);
  });
  if (!low) { const sg = new THREE.Mesh(GC('Box', 1.5, 0.38, 0.06), [OBM.plate, OBM.plate, OBM.plate, OBM.plate, OBM.sign, OBM.plate]); sg.position.set(0, y, 0.17); g.add(sg); }
  return g;
}
function mkCoin() {
  const g = new THREE.Group(), body = new THREE.Mesh(GEO.coin, [OBM.coinSide, OBM.coinFace, OBM.coinFace]); body.rotation.x = Math.PI / 2; body.castShadow = true; g.add(body);
  g.add(new THREE.Mesh(GEO.rim, OBM.coinSide));
  const gl = new THREE.Sprite(coinGlowMat); gl.scale.set(1.25, 1.25, 1); g.add(gl); g.userData.gl = gl;
  return g;
}
let obstacles = [], coins = [];
function addObstacle(type, lane, z) {
  const wide = lane < 0;
  const mesh = type === 'block' ? mkBlock() : mkBar(type, wide);
  mesh.position.set(wide ? 0 : LANES[lane], 0, z);
  scene.add(mesh); obstacles.push({ type, lane, z, mesh, hit: false });
}
function addCoin(lane, z, y = 0.9) {
  const m = mkCoin(); m.position.set(LANES[lane], y, z); m.rotation.y = Math.random() * 6; scene.add(m); coins.push({ lane, z, y, mesh: m });
}
function clearWorld() { obstacles.forEach(o => scene.remove(o.mesh)); coins.forEach(c => scene.remove(c.mesh)); obstacles = []; coins = []; }

// garis kecepatan (angin) saat laju tinggi
const streaks = [];
for (let i = 0; i < 18; i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  m.position.set((Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 3.6), 0.4 + Math.random() * 2.8, -Math.random() * 45 + 6); scene.add(m); streaks.push(m);
}
function updateStreaks(dz, k) {
  for (const m of streaks) {
    m.position.z += dz * 1.5; if (m.position.z > 9) { m.position.z = -42 - Math.random() * 6; m.position.x = (Math.random() < 0.5 ? -1 : 1) * (1.4 + Math.random() * 3.6); m.position.y = 0.4 + Math.random() * 2.8; }
    m.material.opacity = 0.45 * k; m.scale.z = 0.6 + k * 1.4;
  }
}
// partikel
const PART = [];
for (let i = 0; i < 50; i++) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1 });
}
function burst(x, y, z, n, colors, speed = 3) {
  for (const p of PART) {
    if (n <= 0) break; if (p.life > 0) continue; n--;
    const a = Math.random() * 6.283, e = Math.random() * 2.5 - 0.6, s = (0.4 + Math.random()) * speed;
    p.vx = Math.cos(a) * Math.cos(e) * s; p.vz = Math.sin(a) * Math.cos(e) * s; p.vy = Math.sin(e) * s + 2;
    p.life = p.max = 0.4 + Math.random() * 0.5; p.m.position.set(x, y, z); p.m.material.color.set(colors[(Math.random() * colors.length) | 0]); p.m.visible = true;
  }
}
