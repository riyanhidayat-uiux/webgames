'use strict';
// ======================= PELATIH 3D =======================
const cR = new THREE.WebGLRenderer({ canvas: $('coachC'), antialias: true, alpha: true }); cR.setClearColor(0x000000, 0); cR.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
const cS = new THREE.Scene(), cC = new THREE.PerspectiveCamera(38, 0.72, 0.1, 30); cC.position.set(0, 1.18, 5.5); cC.lookAt(0, 1.12, 0);
cS.add(new THREE.HemisphereLight(0xffffff, 0x1a4a40, 0.95)); const cL = new THREE.DirectionalLight(0xffffff, 0.8); cL.position.set(2, 4, 4); cS.add(cL);
const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55 }, o || {}));
const sph = (r, m, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m); o.scale.set(sx, sy, sz); return o; };
const cyl = (rt, rb, h, m) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 14), m);
const grp = (par, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
const put = (par, o, x = 0, y = 0, z = 0) => { o.position.set(x, y, z); par.add(o); return o; };
function limbGeo(len, r0, r1, bulge, at) { const pts = [], N = 12; for (let i = 0; i <= N; i++) { const t = i / N, w = t < at ? Math.sin(Math.PI / 2 * t / at) : Math.cos(Math.PI / 2 * (t - at) / (1 - at)); pts.push(new THREE.Vector2(lerp(r0, r1, t) + bulge * Math.max(0, w), -t * len)); } return new THREE.LatheGeometry(pts, 16); }
const limb = (len, r0, r1, b, at, m) => new THREE.Mesh(limbGeo(len, r0, r1, b, at), m);
function makeCoach() {
  const root = new THREE.Group(), skin = M(0xf0c8a0, { side: THREE.DoubleSide }), top = M(0x1fd0b0, { side: THREE.DoubleSide }), shorts = M(0x24356a, { side: THREE.DoubleSide }), shoe = M(0xffffff), accent = M(0xff4a6a), hair = M(0x3a2418), dark = new THREE.MeshBasicMaterial({ color: 0x1a1210 }), white = M(0xffffff);
  const hips = grp(root, 0, 0.95, 0); const pel = sph(0.23, shorts, 1.1, 0.75, 0.85); hips.add(pel);
  const torso = grp(hips, 0, 0.12, 0); const tm = new THREE.Mesh(new THREE.LatheGeometry([[0.2, 0], [0.22, 0.2], [0.26, 0.42], [0.29, 0.56], [0.24, 0.66], [0.1, 0.72]].map(p => new THREE.Vector2(p[0], p[1])), 22), top); tm.scale.set(1.12, 1, 0.78); torso.add(tm);
  put(torso, sph(0.3, skin, 1, 0.3, 0.7), 0, 0.64, 0); const stripe = box(0.5, 0.05, 0.3, accent); stripe.position.set(0, 0.2, 0.04); torso.add(stripe);
  function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
  put(torso, cyl(0.075, 0.09, 0.12, skin), 0, 0.74, 0);
  const head = grp(torso, 0, 0.84, 0); put(head, sph(0.2, skin, 1, 1.1, 1.03), 0, 0.2, 0); put(head, sph(0.14, skin, 1, 0.7, 0.9), 0, 0.07, 0.03);
  const cap = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair), 0, 0.22, -0.01); cap.scale.set(1, 1.1, 1.06);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.028, 8, 24), accent); band.rotation.x = Math.PI / 2; band.position.set(0, 0.27, 0); band.scale.set(1, 1.04, 1); head.add(band);
  [-1, 1].forEach(s => { put(head, sph(0.042, white, 1.1, 1.2, 0.5), s * 0.075, 0.2, 0.18); put(head, sph(0.022, M(0x3a2a1a), 1, 1, 0.5), s * 0.075, 0.2, 0.195); put(head, sph(0.011, dark), s * 0.075, 0.2, 0.2); put(head, sph(0.04, skin, 0.5, 1, 0.8), s * 0.2, 0.14, 0); const br = box(0.09, 0.02, 0.02, hair); br.position.set(s * 0.078, 0.255, 0.185); br.rotation.z = -s * 0.15; head.add(br); put(head, sph(0.03, M(0xff9a9a), 1.3, 0.8, 0.4), s * 0.12, 0.11, 0.16); });
  put(head, sph(0.032, skin, 1, 1.2, 1.1), 0, 0.14, 0.2);
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 6, 14, Math.PI), M(0xb04040)); sm.rotation.z = Math.PI; sm.position.set(0, 0.095, 0.19); head.add(sm);
  const pony = grp(head, 0, 0.3, -0.18); for (let i = 0; i < 3; i++) put(pony, sph(0.07 - i * 0.012, hair, 1, 1.25, 1), 0, -0.06 - i * 0.09, -0.04 - i * 0.03);
  const mkArm = s => { const sh = grp(torso, s * 0.34, 0.62, 0); put(sh, sph(0.085, skin)); put(sh, limb(0.32, 0.065, 0.048, 0.016, 0.3, skin)); const el = grp(sh, 0, -0.32, 0); put(el, sph(0.05, skin)); put(el, limb(0.28, 0.048, 0.038, 0.012, 0.25, skin)); put(el, sph(0.062, skin, 1, 1.1, 0.8), 0, -0.31, 0); const wr = cyl(0.05, 0.05, 0.05, accent); wr.position.y = -0.27; el.add(wr); return { sh, el }; };
  const mkLeg = s => { const hp = grp(hips, s * 0.12, -0.04, 0); put(hp, limb(0.46, 0.105, 0.07, 0.02, 0.3, skin)); put(hp, cyl(0.115, 0.125, 0.18, shorts), 0, -0.05, 0); const kn = grp(hp, 0, -0.46, 0); put(kn, sph(0.07, skin)); put(kn, limb(0.44, 0.07, 0.048, 0.02, 0.3, skin)); const ft = grp(kn, 0, -0.44, 0); put(ft, sph(0.085, shoe, 0.9, 0.6, 1.6), 0, -0.04, 0.06); put(ft, box(0.12, 0.025, 0.24, accent), 0, -0.1, 0.06); return { hp, kn, ft }; };
  const aL = mkArm(-1), aR = mkArm(1), lL = mkLeg(-1), lR = mkLeg(1);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(0.5, 20), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.3 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.01; root.add(sh);
  cS.add(root); return { root, hips, torso, head, aL, aR, lL, lR, cur: {} };
}
const COACH = makeCoach();
// pose pelatih: u = fase 0..1 dalam satu repetisi
function coachPose(ex, u) {
  const e = 0.5 - 0.5 * Math.cos(u * 2 * Math.PI), s = Math.sin(u * 2 * Math.PI), P = { hipY: 0.95, armL: 0.12, armR: 0.12, elL: 0, elR: 0, legL: 0.08, legR: 0.08, thL: 0, thR: 0, knL: 0, knR: 0, tX: 0, tZ: 0, shX: 0 };
  if (ex === 'jj') { P.armL = P.armR = lerp(0.12, 3.0, e); P.legL = P.legR = lerp(0.07, 0.42, e); P.hipY = 0.95 + 0.07 * Math.max(0, Math.sin(u * 4 * Math.PI)) * e; }
  else if (ex === 'squat') { P.hipY = 0.95 - 0.34 * e; P.thL = P.thR = -1.3 * e; P.knL = P.knR = 1.55 * e; P.tX = -0.3 * e; P.shX = -1.45 * e; P.armL = P.armR = 0.12 * (1 - e); P.legL = P.legR = 0.2 * e + 0.07; }
  else if (ex === 'knees') { const l = Math.max(0, s), r = Math.max(0, -s); P.thL = -1.35 * l; P.knL = 1.3 * l; P.thR = -1.35 * r; P.knR = 1.3 * r; P.hipY = 0.95 + 0.02 * (l + r); P.armL = 0.5 + 0.4 * r; P.armR = 0.5 + 0.4 * l; P.elL = P.elR = 1.3; }
  else if (ex === 'press') { const a = lerp(1.57, 3.0, e); P.armL = P.armR = a; P.elL = P.elR = lerp(1.5, 0, e); }
  else if (ex === 'side') { P.tZ = 0.42 * s; P.hipY = 0.95; P.armL = P.armR = 0.75; P.elL = P.elR = 1.6; P.legL = P.legR = 0.15; }
  return P;
}
function applyCoach(P, k) {
  const c = COACH.cur; for (const key in P) { if (c[key] === undefined) c[key] = P[key]; c[key] += (P[key] - c[key]) * k; }
  COACH.hips.position.y = c.hipY; COACH.torso.rotation.x = c.tX; COACH.torso.rotation.z = c.tZ; COACH.hips.rotation.z = -c.tZ * 0.3;
  COACH.aL.sh.rotation.z = -c.armL; COACH.aR.sh.rotation.z = c.armR; COACH.aL.sh.rotation.x = c.shX; COACH.aR.sh.rotation.x = c.shX; COACH.aL.el.rotation.z = -c.elL; COACH.aR.el.rotation.z = c.elR;
  COACH.lL.hp.rotation.z = -c.legL; COACH.lR.hp.rotation.z = c.legR; COACH.lL.hp.rotation.x = c.thL; COACH.lR.hp.rotation.x = c.thR; COACH.lL.kn.rotation.x = c.knL; COACH.lR.kn.rotation.x = c.knR;
  COACH.head.rotation.z = -c.tZ * 0.5;
}
let coachEx = 'jj', coachT = 0;

// ======================= AUDIO & SUARA =======================
let AC = null, master = null;
function initAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.5; master.connect(AC.destination); } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!AC || settings.mute) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
const sfx = { rep(q) { tone(0.1, q === 'perfect' ? 900 : 640, q === 'perfect' ? 1500 : 960, 0.2, 'triangle'); if (q === 'perfect') tone(0.12, 1300, 1900, 0.12, 'triangle', 0.07); }, miss() { tone(0.2, 300, 180, 0.12, 'triangle'); }, tick() { tone(0.08, 700, 700, 0.14, 'square'); }, go() { [660, 880, 1320].forEach((f, i) => tone(0.14, f, f * 1.01, 0.2, 'triangle', i * 0.08)); }, done() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(0.2, f, f * 1.01, 0.22, 'triangle', i * 0.12)); }, rest() { tone(0.3, 500, 400, 0.16, 'sine'); } };
function speak(text) { if (!settings.voice || settings.mute || !window.speechSynthesis) return; try { const u = new SpeechSynthesisUtterance(text); u.lang = 'id-ID'; u.rate = 1.15; u.volume = 0.9; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch (e) {} }

// ======================= STATE =======================
let state = 'menu', versus = false, useCam = false, elapsed = 0;
let prog = null, exI = 0, exT = 0, restT = 0, introT = 0, PLY = [];
const NP = () => versus ? 2 : 1;
const mkPly = i => ({ i, f: null, valid: false, miss: 0, base: { ok: false, sep0: 0.3, ksep0: 0.3, dy0: 0.95, krL: -0.95, krR: -0.95 }, cal: [], calOk: false, reps: [], score: 0, streak: 0, tot: 0, qual: [], R: mkRep(), R2: mkRep(), meter: 0, fb: '', fbT: 0, popT: 0, kcal: 0, best: 0, scr: null, done: false });
const PCOL = [['#7fffd0', '#ffb35a'], ['#6fc8ff', '#6fc8ff']];
