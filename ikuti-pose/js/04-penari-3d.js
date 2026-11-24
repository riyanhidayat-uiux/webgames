'use strict';
// ======================= PENARI 3D =======================
const dR = new THREE.WebGLRenderer({ canvas: $('danceC'), antialias: true, alpha: true }); dR.setClearColor(0x000000, 0); dR.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const dS = new THREE.Scene(), dC = new THREE.PerspectiveCamera(38, 0.7, 0.1, 30); dC.position.set(0, 1.18, 5.5); dC.lookAt(0, 1.1, 0);
dS.add(new THREE.HemisphereLight(0xffffff, 0x3a1a6a, 0.95)); const dL = new THREE.DirectionalLight(0xffffff, 0.8); dL.position.set(2, 4, 4); dS.add(dL);
const pL1 = new THREE.PointLight(0xff4aa8, 0.8, 8); pL1.position.set(-2, 2, 2); dS.add(pL1); const pL2 = new THREE.PointLight(0x4aa8ff, 0.8, 8); pL2.position.set(2, 2, 2); dS.add(pL2);
const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, o || {}));
const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.scale.set(sx, sy, sz); return o; };
const cyl = (rt, rb, h, m) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m);
const grp = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
const put = (par, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); par.add(o); return o; };
function limbGeo(len, r0, r1, bulge, at) { const pts = [], N = 12; for (let i = 0; i <= N; i++) { const t = i / N, w = t < at ? Math.sin(Math.PI / 2 * t / at) : Math.cos(Math.PI / 2 * (t - at) / (1 - at)); pts.push(new THREE.Vector2(lerp(r0, r1, t) + bulge * Math.max(0, w), -t * len)); } return new THREE.LatheGeometry(pts, 16); }
const limb = (len, r0, r1, b, at, m) => new THREE.Mesh(limbGeo(len, r0, r1, b, at), m);
function makeDancer() {
  const root = new THREE.Group(), skin = M(0xe8b890, { side: THREE.DoubleSide }), top = M(0xff4aa8, { side: THREE.DoubleSide, emissive: 0x4a0a2a }), pants = M(0x2a2a5a, { side: THREE.DoubleSide }), shoe = M(0xffffff), accent = M(0xffd24a, { emissive: 0x4a3a00 }), hair = M(0x201018), dark = new THREE.MeshBasicMaterial({ color: 0x1a1210 }), white = M(0xffffff);
  const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  const hips = grp(root, 0, 0.95, 0); hips.add(sph(0.23, pants, 1.1, 0.75, 0.85));
  const torso = grp(hips, 0, 0.12, 0); const tm = new THREE.Mesh(new THREE.LatheGeometry([[0.2, 0], [0.22, 0.2], [0.26, 0.42], [0.29, 0.56], [0.24, 0.66], [0.1, 0.72]].map(p => new THREE.Vector2(p[0], p[1])), 22), top); tm.scale.set(1.12, 1, 0.78); torso.add(tm);
  put(torso, sph(0.3, skin, 1, 0.3, 0.7), 0, 0.64, 0); put(torso, box(0.5, 0.05, 0.3, accent), 0, 0.2, 0.04); put(torso, cyl(0.075, 0.09, 0.12, skin), 0, 0.74, 0);
  const head = grp(torso, 0, 0.84, 0); put(head, sph(0.2, skin, 1, 1.1, 1.03), 0, 0.2, 0); put(head, sph(0.14, skin, 1, 0.7, 0.9), 0, 0.07, 0.03);
  const cap = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.215, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hair), 0, 0.22, -0.01); cap.scale.set(1, 1.12, 1.07);
  [-1, 1].forEach(s => { put(head, sph(0.042, white, 1.1, 1.2, 0.5), s * 0.075, 0.2, 0.18); put(head, sph(0.022, M(0x3a2a1a), 1, 1, 0.5), s * 0.075, 0.2, 0.195); put(head, sph(0.011, dark), s * 0.075, 0.2, 0.2); put(head, sph(0.04, skin, 0.5, 1, 0.8), s * 0.2, 0.14, 0); put(head, sph(0.03, M(0xff8a9a), 1.3, 0.8, 0.4), s * 0.12, 0.11, 0.16); const br = box(0.09, 0.02, 0.02, hair); br.position.set(s * 0.078, 0.255, 0.185); br.rotation.z = -s * 0.15; head.add(br); put(head, sph(0.05, accent), s * 0.21, 0.04, 0.02); });
  put(head, sph(0.032, skin, 1, 1.2, 1.1), 0, 0.14, 0.2); const sm = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 6, 14, Math.PI), M(0xb04040)); sm.rotation.z = Math.PI; sm.position.set(0, 0.095, 0.19); head.add(sm);
  const mkArm = s => { const sh = grp(torso, s * 0.34, 0.62, 0); put(sh, sph(0.085, skin)); put(sh, limb(0.32, 0.065, 0.048, 0.016, 0.3, skin)); const el = grp(sh, 0, -0.32, 0); put(el, sph(0.05, skin)); put(el, limb(0.28, 0.048, 0.038, 0.012, 0.25, skin)); put(el, sph(0.062, skin, 1, 1.1, 0.8), 0, -0.31, 0); const wr = cyl(0.052, 0.052, 0.06, accent); wr.position.y = -0.27; el.add(wr); return { sh, el }; };
  const mkLeg = s => { const hp = grp(hips, s * 0.12, -0.04, 0); put(hp, limb(0.46, 0.105, 0.07, 0.02, 0.3, pants)); const kn = grp(hp, 0, -0.46, 0); put(kn, limb(0.44, 0.07, 0.05, 0.02, 0.3, pants)); const ft = grp(kn, 0, -0.44, 0); put(ft, sph(0.085, shoe, 0.9, 0.6, 1.6), 0, -0.04, 0.06); put(ft, box(0.12, 0.025, 0.24, accent), 0, -0.1, 0.06); return { hp, kn, ft }; };
  const aL = mkArm(-1), aR = mkArm(1), lL = mkLeg(-1), lR = mkLeg(1);
  const sh2 = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.3 })); sh2.rotation.x = -Math.PI / 2; sh2.position.y = 0.01; root.add(sh2);
  dS.add(root); return { root, hips, torso, head, aL, aR, lL, lR, cur: {} };
}
const DANCER = makeDancer();
function applyDancer(spec, k, bounce) {
  const T = { armL: rad(spec.a[0]), armR: rad(spec.a[2]), elL: rad(spec.a[1] - spec.a[0]), elR: rad(spec.a[3] - spec.a[2]), legL: rad(spec.legL != null ? spec.legL : (spec.leg || 0)), legR: rad(spec.legR != null ? spec.legR : (spec.leg || 0)), lean: rad(spec.lean || 0) }, c = DANCER.cur;
  for (const key in T) { if (c[key] === undefined) c[key] = T[key]; c[key] += (T[key] - c[key]) * k; }
  DANCER.aL.sh.rotation.z = -c.armL; DANCER.aR.sh.rotation.z = c.armR; DANCER.aL.el.rotation.z = -c.elL; DANCER.aR.el.rotation.z = c.elR;
  DANCER.lL.hp.rotation.z = -Math.max(0.05, c.legL); DANCER.lR.hp.rotation.z = Math.max(0.05, c.legR); DANCER.torso.rotation.z = -c.lean; DANCER.head.rotation.z = c.lean * 0.4; DANCER.hips.position.y = 0.95 - 0.05 * bounce; DANCER.root.rotation.y = Math.sin(elapsed * 1.5) * 0.08;
}
