'use strict';
// ======================= PEMAIN & KIPER (rangka sendi + animasi) =======================
const PEL = 0.95;                                    // tinggi panggul saat berdiri
const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.72 }, o || {}));
const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.scale.set(sx, sy, sz); return o; };
const cylM = (rt, rb, h, m, s = 14) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m);
const boxM = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const grp = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
const put = (par, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); o.castShadow = true; par.add(o); return o; };
function limbGeo(len, r0, r1, bulge, at) { const pts = [], N = 12; for (let i = 0; i <= N; i++) { const t = i / N, w = t < at ? Math.sin(Math.PI / 2 * t / at) : Math.cos(Math.PI / 2 * (t - at) / (1 - at)); pts.push(new THREE.Vector2(lerp(r0, r1, t) + bulge * Math.max(0, w), -t * len)); } return new THREE.LatheGeometry(pts, 16); }
const limb = (len, r0, r1, b, at, m) => new THREE.Mesh(limbGeo(len, r0, r1, b, at), m);
const numTex = (n, col, bg) => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.clearRect(0, 0, 128, 128); x.fillStyle = col; x.font = 'bold 96px Impact,Arial Black,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 64, 70); return mkTex(c); };
// o: {shirt, trim, shorts, socks, skin, hair, number, keeper}
function makeHuman(o) {
  const skin = M(o.skin, { roughness: 0.62 }), hair = M(o.hair, { roughness: 0.85 }), shirt = M(o.shirt, { roughness: 0.62 }), trim = M(o.trim, { roughness: 0.6 }), shorts = M(o.shorts, { roughness: 0.65 }), socks = M(o.socks, { roughness: 0.8 }), boot = M(o.keeper ? 0x2a2a2a : 0x111111, { roughness: 0.4, metalness: 0.15 }), sole = M(0xe8e8e8, { roughness: 0.6 }), dark = new THREE.MeshBasicMaterial({ color: 0x120a08 }), white = M(0xffffff, { roughness: 0.3 });
  const root = new THREE.Group(), pelvis = grp(root, 0, PEL, 0), j = {};
  put(pelvis, sph(0.2, shorts, 1.05, 0.72, 0.78), 0, 0, 0);                                                    // panggul + celana
  j.torso = grp(pelvis, 0, 0.04, 0);
  const chest = put(j.torso, new THREE.Mesh(new THREE.LatheGeometry([[0.16, 0], [0.19, 0.12], [0.215, 0.3], [0.225, 0.45], [0.17, 0.53], [0.07, 0.56]].map(p => new THREE.Vector2(p[0], p[1])), 20), shirt), 0, 0, 0); chest.scale.set(1.12, 1, 0.78);
  put(j.torso, sph(0.25, shirt, 1, 0.25, 0.62), 0, 0.5, 0);                                                    // bahu
  put(j.torso, cylM(0.062, 0.075, 0.1, skin), 0, 0.58, 0); const collar = put(j.torso, new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.018, 8, 16), trim), 0, 0.55, 0); collar.rotation.x = Math.PI / 2;
  if (o.number != null) { const np = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.27), new THREE.MeshBasicMaterial({ map: numTex(o.number, '#' + o.trim.toString(16).padStart(6, '0')), transparent: true })); np.position.set(0, 0.31, 0.162); j.torso.add(np);
    const lg = new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), new THREE.MeshBasicMaterial({ color: o.trim })); lg.position.set(0.09, 0.4, -0.16); lg.rotation.y = Math.PI; j.torso.add(lg); }
  put(j.torso, boxM(0.34, 0.035, 0.012, trim), 0, 0.12, -0.165);
  j.head = grp(j.torso, 0, 0.64, 0);
  put(j.head, sph(0.105, skin, 0.95, 1.12, 1.0), 0, 0.12, 0); put(j.head, sph(0.075, skin, 0.9, 0.7, 0.9), 0, 0.04, -0.03);
  const cap = put(j.head, new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair), 0, 0.13, 0.005); cap.scale.set(1, 1.1, 1.05);
  put(j.head, sph(0.07, hair, 1.0, 0.5, 0.7), 0, 0.1, 0.08);
  [-1, 1].forEach(s => { put(j.head, sph(0.02, white, 1.1, 1, 0.5), s * 0.04, 0.12, -0.095); put(j.head, sph(0.011, dark), s * 0.04, 0.12, -0.105); put(j.head, sph(0.022, skin, 0.5, 1, 0.7), s * 0.105, 0.1, 0); const br = boxM(0.04, 0.008, 0.01, hair); br.position.set(s * 0.04, 0.15, -0.095); br.rotation.z = -s * 0.12; j.head.add(br); });
  put(j.head, sph(0.017, skin, 1, 1.3, 1.1), 0, 0.09, -0.107);
  const arm = side => {
    const sh = grp(j.torso, side * 0.235, 0.5, 0); put(sh, sph(0.055, shirt));
    put(sh, limb(0.2, 0.052, 0.046, 0.008, 0.3, shirt)); put(sh, limb(0.1, 0.046, 0.04, 0, 0.5, skin), 0, -0.2, 0);          // lengan atas (kaus) + kulit
    const el = grp(sh, 0, -0.3, 0); put(el, sph(0.036, o.keeper ? shirt : skin));
    if (o.keeper) { put(el, limb(0.27, 0.042, 0.036, 0.005, 0.3, shirt)); } else put(el, limb(0.27, 0.04, 0.032, 0.008, 0.3, skin));
    const hand = grp(el, 0, -0.28, 0);
    if (o.keeper) { put(hand, sph(0.065, M(0xf2f2f2, { roughness: 0.5 }), 1, 1.2, 0.8), 0, -0.04, 0); put(hand, boxM(0.1, 0.03, 0.02, M(o.trim)), 0, 0.02, 0); } else put(hand, sph(0.04, skin, 1, 1.2, 0.8), 0, -0.03, 0);
    const marker = new THREE.Object3D(); marker.position.set(0, -0.05, 0); hand.add(marker);
    return { sh, el, hand, marker };
  };
  const aL = arm(-1), aR = arm(1); j.shL = aL.sh; j.shR = aR.sh; j.elL = aL.el; j.elR = aR.el; j.hdL = aL.hand; j.hdR = aR.hand;
  const leg = side => {
    const hp = grp(pelvis, side * 0.1, -0.06, 0); put(hp, limb(0.3, 0.1, 0.082, 0.012, 0.3, shorts)); put(hp, limb(0.16, 0.082, 0.064, 0, 0.5, skin), 0, -0.28, 0);
    const kn = grp(hp, 0, -0.44, 0); put(kn, sph(0.052, skin)); put(kn, limb(0.43, 0.062, 0.042, 0.012, 0.3, socks), 0, 0, 0);
    const an = grp(kn, 0, -0.43, 0); put(an, sph(0.04, skin)); put(an, boxM(0.095, 0.06, 0.27, boot), 0, -0.035, -0.07); put(an, sph(0.052, boot, 1.0, 0.8, 1.7), 0, -0.04, -0.12); put(an, boxM(0.1, 0.012, 0.29, sole), 0, -0.07, -0.075);
    for (let k = 0; k < 4; k++) { put(an, cylM(0.008, 0.012, 0.016, sole, 6), side * ((k % 2) ? 0.028 : -0.028), -0.08, -0.02 - Math.floor(k / 2) * 0.17); }
    const marker = new THREE.Object3D(); marker.position.set(0, -0.06, -0.12); an.add(marker);
    return { hp, kn, an, marker };
  };
  const lL = leg(-1), lR = leg(1); j.hpL = lL.hp; j.knL = lL.kn; j.anL = lL.an; j.hpR = lR.hp; j.knR = lR.kn; j.anR = lR.an;
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.18, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.008; root.add(sh);
  const rig = { root, pelvis, j, shadow: sh, cur: Object.assign({}, POSE0), tgt: Object.assign({}, POSE0), markers: { hdL: aL.marker, hdR: aR.marker, elL: j.elL, elR: j.elR, shL: j.shL, shR: j.shR, anL: lL.marker, anR: lR.marker, knL: j.knL, knR: j.knR, torso: j.torso, pelvis, head: j.head } };
  scene.add(root); return rig;
}
const POSE0 = { py: 0, ppx: 0, ppy: 0, ppz: 0, tx: 0.06, ty: 0, tz: 0, hx: 0, hy: 0, sLx: 0.08, sLz: 0.14, sRx: 0.08, sRz: 0.14, eL: 0.18, eR: 0.18, hLx: 0, hLz: 0.03, hRx: 0, hRz: 0.03, kL: 0.06, kR: 0.06, aL: 0, aR: 0 };
function applyPose(rig, p) {
  const j = rig.j; rig.pelvis.position.y = PEL + p.py; rig.pelvis.rotation.set(p.ppx, p.ppy, p.ppz); j.torso.rotation.set(p.tx, p.ty, p.tz); j.head.rotation.set(p.hx, p.hy, 0);
  j.shL.rotation.set(p.sLx, 0, -p.sLz); j.shR.rotation.set(p.sRx, 0, p.sRz); j.elL.rotation.x = p.eL; j.elR.rotation.x = p.eR;
  j.hpL.rotation.set(p.hLx, 0, -p.hLz); j.hpR.rotation.set(p.hRx, 0, p.hRz); j.knL.rotation.x = -p.kL; j.knR.rotation.x = -p.kR; j.anL.rotation.x = p.aL; j.anR.rotation.x = p.aR;
}
function setPoseNow(rig, p) { Object.assign(rig.cur, p); applyPose(rig, rig.cur); }
function easePose(rig, tgt, dt, rate) { const k = 1 - Math.exp(-dt * rate); for (const key in POSE0) { const t = tgt[key] != null ? tgt[key] : POSE0[key]; rig.cur[key] += (t - rig.cur[key]) * k; } applyPose(rig, rig.cur); }
const P_ = (o) => Object.assign({}, POSE0, o);
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
function kf(u, keys) {                                   // spline Catmull-Rom: kecepatan sendi mengalir (tanpa berhenti-jalan di tiap kunci)
  const n = keys.length; if (u <= keys[0][0]) return keys[0][1]; if (u >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 1; while (u > keys[i][0]) i++; const a = keys[i - 1], b = keys[i], h = b[0] - a[0], t = (u - a[0]) / h, p = keys[i - 2] || a, q = keys[i + 1] || b;
  const m0 = (b[1] - p[1]) / (b[0] - p[0]) * h, m1 = (q[1] - a[1]) / (q[0] - a[0]) * h, t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * m1;
}
function blendPose(a, b, w) { const o = {}; for (const k in POSE0) o[k] = lerp(a[k], b[k], w); return o; }
// --- pose berlari (fase 0..2π) ---
function runPose(ph, amp = 1, lean = 0.22) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return P_({ py: -0.03 - 0.03 * Math.abs(c) * amp, tx: lean, ty: -0.12 * s * amp, hLx: 0.75 * s * amp, hRx: -0.75 * s * amp, kL: 0.25 + 0.95 * Math.max(0, -Math.sin(ph - 0.9)) * amp, kR: 0.25 + 0.95 * Math.max(0, Math.sin(ph - 0.9)) * amp, aL: 0.1, aR: 0.1, sLx: -0.8 * s * amp, sRx: 0.8 * s * amp, eL: 1.2, eR: 1.2, sLz: 0.12, sRz: 0.12, hLz: 0.04, hRz: 0.04, ppy: 0.1 * s * amp });
}
// --- tendangan: u = detik relatif terhadap sentuhan bola (−0.5 … +0.8); left = kaki kiri ---
function kickPose(u, left, curve = 0) {
  const A = [[-0.34, 0.15], [-0.12, -0.9], [0.0, 0.85], [0.22, 1.5], [0.6, 0.5]], K = [[-0.34, 0.5], [-0.14, 1.95], [0.0, 0.3], [0.22, 0.55], [0.6, 0.15]], Ank = [[-0.2, 0.0], [0, -0.75], [0.3, -0.55], [0.6, 0]];
  const hk = kf(u, A), kk = kf(u, K), ak = kf(u, Ank), plantH = kf(u, [[-0.34, -0.1], [-0.12, 0.28], [0.0, 0.18], [0.3, 0.1], [0.6, 0.0]]), plantK = kf(u, [[-0.34, 0.4], [-0.12, 0.5], [0.0, 0.42], [0.3, 0.3], [0.6, 0.08]]);
  const arm1 = kf(u, [[-0.34, -0.5], [-0.1, 0.9], [0.2, 0.4], [0.6, 0.1]]), arm2 = kf(u, [[-0.34, 0.6], [-0.1, -0.3], [0.2, 0.1], [0.6, 0.1]]), tx = kf(u, [[-0.34, 0.2], [-0.12, -0.06], [0.0, 0.12], [0.25, 0.38], [0.6, 0.1]]), ty = kf(u, [[-0.12, 0.2], [0.0, -0.18], [0.3, -0.3], [0.6, 0]]) * (left ? -1 : 1);
  const o = { py: kf(u, [[-0.34, -0.06], [-0.12, -0.08], [0.0, -0.05], [0.25, 0.02], [0.6, 0]]), ppy: ty * 0.6, tx, ty: ty * 0.5, tz: curve * 0.08, ppz: curve * 0.06, hx: kf(u, [[-0.2, 0.15], [0, 0.35], [0.4, 0.1]]), eL: 0.6, eR: 0.6, sLz: 0.35, sRz: 0.35 };
  const kickSide = left ? 'L' : 'R', plantSide = left ? 'R' : 'L';
  o['h' + kickSide + 'x'] = hk; o['k' + kickSide] = kk; o['a' + kickSide] = ak; o['h' + kickSide + 'z'] = 0.05 + curve * 0.12; o['h' + plantSide + 'x'] = plantH; o['k' + plantSide] = plantK;
  o['s' + kickSide + 'x'] = arm2; o['s' + plantSide + 'x'] = arm1; o['s' + plantSide + 'z'] = 0.9; o['s' + kickSide + 'z'] = 0.25; return P_(o);
}
const poseCelebrate = t => P_({ py: -0.02 + 0.1 * Math.abs(Math.sin(t * 7)), tx: -0.1, sLx: 2.9, sRx: 2.9, sLz: 0.5, sRz: 0.5, eL: 0.3, eR: 0.3, hLx: 0.25 * Math.sin(t * 7), hRx: -0.25 * Math.sin(t * 7), kL: 0.4, kR: 0.4, hx: -0.3 });
const poseDejected = t => P_({ py: -0.05, tx: 0.35, hx: 0.5, sLx: 2.3, sRx: 2.3, sLz: 0.25, sRz: 0.25, eL: 2.2, eR: 2.2, hLz: 0.1, hRz: 0.1, kL: 0.2, kR: 0.2 });
const poseWaiting = (t, lean) => P_({ tx: 0.1, hx: -0.05, sLx: 0.3, sRx: 0.3, sLz: 0.55, sRz: 0.55, eL: 1.3, eR: 1.3, hLz: 0.09, hRz: 0.09, kL: 0.1, kR: 0.1, ppy: lean || 0, py: 0.003 * Math.sin(t * 2) });
// --- kiper ---
function keeperReady(t, sway = 0, tense = 0) {                // tense 0..1: makin siaga saat penendang mendekat
  const s = Math.sin(t * 3.2), z = 0.04 * (1 - tense);
  return P_({ py: -0.1 - 0.07 * tense + 0.012 * Math.sin(t * 5), tx: 0.32 + 0.16 * tense, hx: -0.34 - 0.1 * tense, sLx: 0.6 + 0.2 * tense, sRx: 0.6 + 0.2 * tense, sLz: 0.85 + 0.12 * tense + z * s, sRz: 0.85 + 0.12 * tense - z * s, eL: 0.6 + 0.3 * tense, eR: 0.6 + 0.3 * tense, hLx: 0.5 + 0.25 * tense, hRx: 0.5 + 0.25 * tense, hLz: 0.25 + 0.08 * tense + 0.05 * s * (1 - tense) + sway, hRz: 0.25 + 0.08 * tense - 0.05 * s * (1 - tense) - sway, kL: 0.8 + 0.35 * tense, kR: 0.8 + 0.35 * tense, aL: -0.25, aR: -0.25 });
}
// selam: u = kemajuan 0..1, dir = -1 kiri / +1 kanan, hi = ketinggian 0..1. mengembalikan {pose, dy (tinggi panggul), dx fraksi jarak, tilt}
const diveEase = u => { u = clamp(u, 0, 1); return 1 - Math.pow(1 - u, 2.1); };       // tolakan eksplosif lalu melambat
function keeperDive(u, dir, hi) {
  const e = diveEase(u), tilt = lerp(0.1, lerp(1.35, 1.0, hi), e), jump = Math.sin(Math.PI * clamp(u * 0.95, 0, 1)) * (0.15 + 0.55 * hi), land = smooth((u - 0.55) / 0.45);
  const gat = Math.sin(Math.PI * clamp(u / 0.2, 0, 1));            // 'gather': menekuk & condong sedikit ke arah berlawanan sebelum menolak
  const y = lerp(PEL - 0.1, lerp(0.34, 0.5, hi), e) + jump * (1 - land) - 0.09 * gat;
  const o = { ppz: -dir * (tilt - 0.14 * gat), tx: lerp(0.3, -0.05, e), hx: lerp(-0.3, 0.1, e), sLx: lerp(0.6, 3.0, e), sRx: lerp(0.6, 3.0, e), sLz: lerp(0.85, 0.22, e), sRz: lerp(0.85, 0.22, e), eL: lerp(0.6, 0.15, e), eR: lerp(0.6, 0.15, e), hLx: lerp(0.5, -0.3, e), hRx: lerp(0.5, -0.45, e), kL: lerp(0.8, 0.9, e), kR: lerp(0.8, 1.2, e), hLz: 0.12, hRz: 0.12 };
  return { pose: P_(o), py: y - PEL, tilt };
}
function keeperCatchPose(t) { return P_({ py: -0.55, ppz: 0, tx: 0.8, sLx: 1.7, sRx: 1.7, sLz: 0.35, sRz: 0.35, eL: 1.8, eR: 1.8, hLx: 0.9, hRx: 0.9, kL: 1.4, kR: 1.4, hx: 0.3 }); }
// --- snapshot untuk ulangan ---
function snapRig(r) { return { x: r.root.position.x, y: r.root.position.y, z: r.root.position.z, ry: r.root.rotation.y, pose: Object.assign({}, r.cur) }; }
function applySnap(r, s) { r.root.position.set(s.x, s.y, s.z); r.root.rotation.y = s.ry; Object.assign(r.cur, s.pose); applyPose(r, r.cur); }
