'use strict';
// ---------- petinju lawan (model detail: otot, wajah, sarung tinju, celana, sepatu) ----------
const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, side: THREE.DoubleSide }, o || {}));
const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.scale.set(sx, sy, sz); o.castShadow = true; return o; };
const cyl = (rt, rb, h, m, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.castShadow = true; return o; };
const box = (w, h, d, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = true; return o; };
const grp = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
const put = (par, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); par.add(o); return o; };
// anggota badan melengkung (otot menggembung) yang menggantung ke bawah dari titik sendi
function limbGeo(len, r0, r1, bulge, at, seg = 18) {
  const pts = [], N = 14;
  for (let i = 0; i <= N; i++) { const t = i / N, w = t < at ? Math.sin(Math.PI / 2 * t / at) : Math.cos(Math.PI / 2 * (t - at) / (1 - at)); pts.push(new THREE.Vector2(lerp(r0, r1, t) + bulge * Math.max(0, w), -t * len)); }
  return new THREE.LatheGeometry(pts, seg);
}
const limb = (len, r0, r1, bulge, at, m) => { const o = new THREE.Mesh(limbGeo(len, r0, r1, bulge, at), m); o.castShadow = true; return o; };
function makeGlove(side, mat) {
  const g = new THREE.Group();
  put(g, sph(0.165, mat.glove, 1, 1.1, 1.12), 0, -0.09, 0.02);                          // kepalan
  put(g, sph(0.062, mat.glove, 0.8, 1.5, 0.95), -side * 0.135, -0.04, 0.1);                // jempol
  put(g, cyl(0.1, 0.108, 0.13, mat.white), 0, 0.09, 0);                                    // manset putih
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.103, 0.012, 8, 20), mat.glove); ring.rotation.x = Math.PI / 2; ring.position.y = 0.035; g.add(ring);   // garis di manset
  for (let i = 0; i < 3; i++) put(g, box(0.05, 0.012, 0.012, mat.laceM), 0, 0.06 + i * 0.035, 0.108);  // tali
  const logo = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), mat.white); logo.position.set(0, -0.06, 0.188); g.add(logo);
  return g;
}
function makeBoxer() {
  const root = new THREE.Group();
  const mat = {
    skin: M(0xf1c9a5, { roughness: 0.5 }), skinD: M(0xc9a07c, { roughness: 0.6 }), trunks: M(0x3aa8ff, { roughness: 0.5 }), trim: M(0xffffff, { roughness: 0.5 }), glove: M(0x2a7ae0, { roughness: 0.32 }), white: M(0xf4f4f4, { roughness: 0.5 }),
    laceM: M(0xdddddd), boot: M(0xf2f2f2, { roughness: 0.45 }), sole: M(0x1a1a1a), hair: M(0x2a1a10, { roughness: 0.85 }), gear: M(0xc02a2a, { roughness: 0.4 }), gearD: M(0x1a1a1a, { roughness: 0.6 }),
    eyeW: M(0xffffff, { roughness: 0.2 }), iris: M(0x5a3a1a, { roughness: 0.3 }), lip: M(0xb05a5a, { roughness: 0.5 }), tooth: M(0xffffff, { roughness: 0.3 }), tat: new THREE.MeshBasicMaterial({ color: 0x14141e, transparent: true, opacity: 0.85 }),
    bruise: new THREE.MeshBasicMaterial({ color: 0x7a2a6a, transparent: true, opacity: 0, depthWrite: false })
  };
  const dark = new THREE.MeshBasicMaterial({ color: 0x120a0a });
  // ---- pinggul + celana ----
  const hips = grp(root, 0, 1.0, 0);
  const shortsPts = [[0.27, 0.1], [0.285, 0.0], [0.31, -0.14], [0.345, -0.3], [0.37, -0.4]].map(p => new THREE.Vector2(p[0], p[1]));
  const shorts = new THREE.Mesh(new THREE.LatheGeometry(shortsPts, 26), mat.trunks); shorts.scale.set(1.08, 1, 1.0); shorts.castShadow = true; hips.add(shorts);
  const waist = cyl(0.29, 0.29, 0.1, mat.trim, 26); waist.scale.set(1.08, 1, 1.0); put(hips, waist, 0, 0.1, 0);
  const hem = cyl(0.375, 0.375, 0.05, mat.trim, 26); hem.scale.set(1.08, 1, 1.0); put(hips, hem, 0, -0.4, 0);
  const nameTex = new THREE.CanvasTexture(mkCanvas(256, 64)); const nameMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.065), new THREE.MeshBasicMaterial({ map: nameTex, transparent: true })); nameMesh.position.set(0, 0.1, 0.296); hips.add(nameMesh);
  [-1, 1].forEach(s => { const st = box(0.03, 0.42, 0.02, mat.trim); st.position.set(s * 0.345, -0.18, 0.02); st.rotation.z = -s * 0.1; hips.add(st); });
  // ---- badan atas: dada, perut berotot ----
  const torso = grp(hips, 0, 0.16, 0);
  const tp = [[0.24, 0], [0.25, 0.1], [0.27, 0.24], [0.3, 0.38], [0.335, 0.52], [0.33, 0.62], [0.26, 0.7], [0.13, 0.76]].map(p => new THREE.Vector2(p[0], p[1]));
  const tm = new THREE.Mesh(new THREE.LatheGeometry(tp, 28), mat.skin); tm.scale.set(1.18, 1, 0.72); tm.castShadow = true; torso.add(tm);
  const chest = [];
  [-1, 1].forEach(s => {
    const pec = sph(0.125, mat.skin, 1.15, 0.8, 0.75); put(torso, pec, s * 0.14, 0.5, 0.15); chest.push(pec);
    put(torso, sph(0.018, mat.skinD), s * 0.15, 0.48, 0.225);                                                  // puting
    put(torso, sph(0.11, mat.skin, 0.8, 1, 0.8), s * 0.36, 0.38, 0.0);                                        // otot samping (latissimus)
    put(torso, sph(0.12, mat.skin, 1, 0.55, 0.9), s * 0.1, 0.72, -0.02);                                       // trapezius
  });
  for (let r = 0; r < 4; r++) [-1, 1].forEach(s => put(torso, sph(0.058, mat.skin, 1.05, 0.78, 0.3), s * 0.06, 0.1 + r * 0.085, 0.19));
  put(torso, box(0.012, 0.34, 0.012, mat.skinD), 0, 0.24, 0.205);
  put(torso, box(0.26, 0.012, 0.012, mat.skinD), 0, 0.31, 0.2).rotation.z = 0;
  const tatChest = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), new THREE.MeshBasicMaterial({ map: (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.strokeStyle = '#14141e'; x.lineWidth = 5; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; x[i ? 'lineTo' : 'moveTo'](32 + Math.cos(a) * 26, 32 + Math.sin(a) * 26); } x.closePath(); x.stroke(); return new THREE.CanvasTexture(c); })(), transparent: true })); tatChest.position.set(-0.15, 0.5, 0.232); torso.add(tatChest);
  // ---- leher + kepala ----
  put(torso, cyl(0.1, 0.115, 0.14, mat.skin), 0, 0.77, 0);
  const head = grp(torso, 0, 0.84, 0);
  put(head, sph(0.215, mat.skin, 1, 1.12, 1.06), 0, 0.2, 0);                                     // tengkorak
  put(head, sph(0.15, mat.skin, 1.05, 0.72, 0.92), 0, 0.07, 0.035);                              // rahang
  put(head, sph(0.075, mat.skin, 1.1, 0.8, 0.8), 0, -0.005, 0.12);                               // dagu
  const bruises = [], lids = [];
  [-1, 1].forEach(s => {
    put(head, sph(0.055, mat.skin, 1.2, 0.8, 0.8), s * 0.125, 0.155, 0.14);                      // tulang pipi
    put(head, sph(0.04, mat.skin, 0.5, 1, 0.8), s * 0.215, 0.15, 0.0);                           // telinga
    put(head, sph(0.05, mat.skin, 1.3, 0.55, 0.8), s * 0.085, 0.255, 0.165);                     // tonjolan alis
    const eyeW = put(head, sph(0.04, mat.eyeW, 1.1, 1.0, 0.55), s * 0.085, 0.22, 0.19); put(head, sph(0.02, mat.iris, 1, 1, 0.6), s * 0.085, 0.22, 0.207); put(head, sph(0.011, dark, 1, 1, 0.6), s * 0.085, 0.22, 0.212);
    const lid = put(head, sph(0.045, mat.skin, 1.2, 0.55, 0.65), s * 0.085, 0.245, 0.19); lids.push(lid);
    const brow = put(head, box(0.1, 0.022, 0.026, mat.hair), s * 0.088, 0.275, 0.2); brow.rotation.z = s * 0.28; brow.castShadow = false;
    const br1 = put(head, sph(0.05, mat.bruise, 1.2, 0.8, 0.7), s * 0.09, 0.21, 0.195); bruises.push(br1);
    const br2 = put(head, sph(0.06, mat.bruise, 1.2, 0.9, 0.7), s * 0.125, 0.14, 0.15); bruises.push(br2);
  });
  put(head, sph(0.04, mat.skin, 1, 1.35, 1.1), 0, 0.15, 0.215);                                   // hidung
  put(head, sph(0.025, mat.skin, 1.5, 0.8, 0.9), 0, 0.12, 0.225);
  [-1, 1].forEach(s => put(head, sph(0.011, dark, 1, 1.4, 1), s * 0.02, 0.118, 0.238));        // lubang hidung
  put(head, sph(0.038, mat.lip, 2.2, 0.5, 0.8), 0, 0.075, 0.2);                                  // bibir atas
  put(head, sph(0.04, mat.lip, 2.0, 0.6, 0.8), 0, 0.04, 0.2);                                    // bibir bawah
  put(head, box(0.1, 0.022, 0.03, mat.tooth), 0, 0.058, 0.21);                                   // pelindung gigi
  // rambut / jenggot / pelindung kepala (diatur per petarung)
  const hair = {};
  hair.short = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.225, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mat.hair), 0, 0.21, -0.01); hair.short.scale.set(1, 1.12, 1.08);
  hair.mohawk = grp(head, 0, 0.4, 0); for (let i = 0; i < 8; i++) { const c = box(0.03, 0.09 + (i % 2) * 0.03, 0.06, mat.hair); c.position.set(0, 0.02 - i * 0.0, 0.16 - i * 0.05); c.rotation.x = -0.3 + i * 0.08; hair.mohawk.add(c); }
  hair.afro = put(head, sph(0.27, mat.hair, 1.05, 0.95, 1.0), 0, 0.3, -0.04);
  const beard = put(head, sph(0.13, mat.hair, 1.0, 0.7, 0.8), 0, 0.045, 0.09); beard.scale.set(1.05, 0.65, 0.8);
  const gear = grp(head, 0, 0, 0);
  const gtop = put(gear, new THREE.Mesh(new THREE.SphereGeometry(0.245, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), mat.gear), 0, 0.22, -0.005); gtop.scale.set(1, 1.1, 1.08);
  put(gear, sph(0.06, mat.gear, 2.0, 0.55, 0.5), 0, 0.305, 0.19);                                // bantalan dahi
  [-1, 1].forEach(s => { put(gear, sph(0.085, mat.gear, 0.6, 1.1, 1.0), s * 0.2, 0.14, 0.03); put(gear, sph(0.07, mat.gear, 0.55, 0.9, 0.9), s * 0.185, 0.07, 0.115); const st = box(0.012, 0.2, 0.012, mat.gearD); st.position.set(s * 0.17, 0.0, 0.08); st.rotation.z = s * 0.3; gear.add(st); });
  const chin = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.01, 6, 16, Math.PI), mat.gearD); chin.rotation.set(Math.PI / 2, 0, Math.PI); chin.position.set(0, -0.015, 0.045); gear.add(chin);
  // ---- lengan: bahu, bisep, siku, lengan bawah, sarung tinju ----
  const mkArm = s => {
    const sh = grp(torso, s * 0.41, 0.63, 0);
    put(sh, sph(0.108, mat.skin, 1, 1.1, 1.05), 0, 0, 0);                                        // deltoid
    put(sh, limb(0.34, 0.088, 0.062, 0.03, 0.3, mat.skin));                                       // lengan atas (bisep)
    const tat = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 16, 1, true), mat.tat); tat.position.y = -0.1; sh.add(tat);
    const el = grp(sh, 0, -0.34, 0);
    put(el, sph(0.062, mat.skin));                                                                 // siku
    put(el, limb(0.31, 0.066, 0.048, 0.022, 0.22, mat.skin));                                      // lengan bawah
    const gl = grp(el, 0, -0.4, 0); gl.add(makeGlove(s, mat));
    return { sh, el, gl, tat };
  };
  const aL = mkArm(-1), aR = mkArm(1);
  // ---- kaki: paha, lutut, betis, sepatu tinju ----
  const mkLeg = s => {
    const hp = grp(hips, s * 0.15, -0.04, 0);
    put(hp, limb(0.5, 0.15, 0.1, 0.045, 0.32, mat.skin));
    const kn = grp(hp, 0, -0.5, 0);
    put(kn, sph(0.1, mat.skin));
    put(kn, limb(0.46, 0.1, 0.06, 0.045, 0.3, mat.skin));
    const ft = grp(kn, 0, -0.46, 0);
    put(ft, cyl(0.066, 0.07, 0.14, mat.boot), 0, 0.0, 0);                                          // betis sepatu
    put(ft, sph(0.1, mat.boot, 0.9, 0.62, 1.75), 0, -0.095, 0.07);                                 // telapak
    put(ft, box(0.15, 0.03, 0.36, mat.sole), 0, -0.145, 0.07);                                     // sol
    put(ft, box(0.16, 0.015, 0.03, mat.trunks), 0, 0.06, 0);                                       // aksen sepatu
    for (let i = 0; i < 4; i++) put(ft, box(0.07, 0.012, 0.012, mat.laceM), 0, -0.01 - i * 0.0, 0.065 + i * 0.045).position.y = -0.04 - i * 0.012;
    return { hp, kn, ft };
  };
  const lL = mkLeg(-1), lR = mkLeg(1);
  const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = mkCanvas(128, 64), x = c.getContext('2d'); x.font = '44px sans-serif'; x.textAlign = 'center'; x.fillText('⭐ ⭐ ⭐', 64, 46); return mkTex(c); })(), transparent: true })); star.scale.set(1.2, 0.6, 1); star.position.set(0, 0.95, 0); star.visible = false; head.add(star);
  const warn = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,60,40,.95)'); g.addColorStop(1, 'rgba(255,60,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })(), transparent: true, depthTest: false, blending: THREE.AdditiveBlending })); warn.scale.set(1.2, 1.2, 1); warn.visible = false; root.add(warn);
  scene.add(root);
  return { root, mat, hips, torso, head, aL, aR, lL, lR, star, warn, cur: {}, parts: { gear, hair, beard, tatChest, nameTex, bruises, lids, chest, tatArms: [aL.tat, aR.tat] } };
}
const EN = makeBoxer(); EN.root.position.set(0, 0, -0.2);
// cahaya tepi dari belakang lawan agar bentuk 3D lebih terasa
const rim = new THREE.DirectionalLight(0x9fb8ff, 0.8); rim.position.set(-2, 3, -6); scene.add(rim);
const warm = new THREE.PointLight(0xff9a6a, 0.9, 9); warm.position.set(2.2, 2.4, 2.2); scene.add(warm);
