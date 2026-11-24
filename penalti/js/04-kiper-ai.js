'use strict';
// ======================= PEMAIN DI LAPANGAN, KIPER AI, PENENDANG AI =======================
let kicker = null, keeper = null, oppTeam = 1;
const SKIN = [0xe0b090, 0xc89070, 0xb87850, 0xd8a880, 0x8a5a3a, 0xf0c8a8], HAIR = [0x2a1a10, 0x111111, 0x3a2a10, 0x6a4a20, 0x111111];
const KEEPER_KITS = [{ shirt: 0x62e03a, trim: 0x111111 }, { shirt: 0xff8a1c, trim: 0x111111 }, { shirt: 0xe8e820, trim: 0x222222 }, { shirt: 0xf050a8, trim: 0x111111 }];
function disposeRig(r) { if (r) scene.remove(r.root); }
// role: 'kick' = kamu menendang (kiper lawan); 'defend' = kamu kiper (penendang lawan)
function buildActors(role, keeperKit) {
  disposeRig(kicker); disposeRig(keeper); const me = TEAMS[settings.team % TEAMS.length], op = TEAMS[oppTeam % TEAMS.length], kt = role === 'kick' ? me : op, kk = KEEPER_KITS[keeperKit % KEEPER_KITS.length];
  kicker = makeHuman({ shirt: kt.c1, trim: kt.c2, shorts: kt.sh, socks: kt.c1, skin: pick(SKIN), hair: pick(HAIR), number: pick([9, 10, 7, 11, 8, 14]) });
  keeper = makeHuman({ shirt: kk.shirt, trim: kk.trim, shorts: 0x151515, socks: 0x151515, skin: pick(SKIN), hair: pick(HAIR), number: 1, keeper: true });
  keeper.root.position.set(0, 0, 0.35); keeper.root.rotation.y = Math.PI; setPoseNow(keeper, keeperReady(0));
  kicker.root.position.set(0, 0, SPOT_Z + 3.6); setPoseNow(kicker, poseWaiting(0)); kicker.root.rotation.y = 0;
  KEEP.rig = keeper; KEEP.spheres = []; KP.mode = 'ready'; KP.t = 0; KP.x0 = 0; KP.dive = null; keeper.root.visible = true;
}
// --- kiper AI ---
const KP = { mode: 'ready', t: 0, dive: null, x0: 0, hold: 0 };
function keeperPlanDive(aim, speed, skill) {
  const D = SKILLS[skill], trueSide = Math.abs(aim.x) < 0.7 ? 0 : sgn(aim.x), reads = Math.random() < D.read;
  let dir, dist, hi;
  if (reads) { dir = trueSide || pick([-1, 1]); dist = trueSide === 0 ? 0.3 : clamp(Math.abs(aim.x) * 0.82 + 0.3, 0.7, 2.5); hi = clamp((aim.y - 0.6) / 1.6, 0, 1); }
  else { const r = Math.random(); dir = r < 0.42 ? -1 : r < 0.84 ? 1 : 0; dist = dir === 0 ? 0.2 : rr(1.4, 2.4); hi = pick([0, 0.2, 0.5, 0.8]); if (dir === 0) dir = pick([-1, 1]); }
  const delay = D.react + rr(-0.05, 0.06) - (speed < 22 ? 0.04 : 0);        // waktu reaksi setelah bola ditendang (dtk)
  return { dir, dist, hi, delay, reads };
}
function keeperStartDive(plan, skill) { KP.mode = 'dive'; KP.t = 0; KP.dive = plan; KP.x0 = keeper.root.position.x; KP.dur = (0.4 + 0.07 * Math.abs(plan.dist)) / SKILLS[skill].dive; KP.hold = 0; }
function keeperUpdate(dt, shotT, skill) {
  const r = keeper.root;
  if (KP.mode === 'ready') { KP.t += dt; const tense = (typeof A !== 'undefined' && A && A.phase === 'approach') ? smooth(A.t / Math.max(0.5, A.approachDur - 0.2)) : 0; easePose(keeper, keeperReady(KP.t, 0, tense), dt, 10); r.position.x += (Math.sin(KP.t * 1.3) * 0.22 * (1 - tense) - r.position.x) * (1 - Math.exp(-dt * 3)); r.position.y = 0; }
  else if (KP.mode === 'dive') {
    KP.t += dt; const u = clamp(KP.t / KP.dur, 0, 1), d = KP.dive;
    if (typeof A !== 'undefined' && A && A.role === 'kick' && shotT > 0 && u < 0.6 && BALL.v.z < -1) {          // refleks: koreksi arah sambil di udara dengan membaca lintasan bola
      const tt = (BALL.p.z - 0.35) / -BALL.v.z;
      if (tt > 0.04) { const px = BALL.p.x + BALL.v.x * tt, py = BALL.p.y + BALL.v.y * tt - 0.5 * GRAV * tt * tt, need = (px - KP.x0) * d.dir, k = SKILLS[skill].read * 0.9 + 0.1;
        if (need > 0.25) d.dist += clamp((clamp(need, 0.3, 3.0) - d.dist) * k, -dt * 3, dt * 3); d.hi += clamp((clamp((py - 0.6) / 1.6, 0, 1) - d.hi) * k, -dt * 2, dt * 2); } }
    const dv = keeperDive(u, d.dir, d.hi); r.position.x = KP.x0 + d.dir * d.dist * diveEase(u * 1.05); r.position.y = 0; setPoseNow(keeper, Object.assign({}, dv.pose, { py: dv.py }));
    if (u >= 1) { KP.mode = 'lying'; KP.t = 0; }
  } else if (KP.mode === 'lying') { KP.t += dt; }
  else if (KP.mode === 'catch') { KP.t += dt; easePose(keeper, keeperCatchPose(KP.t), dt, 8); }
  else if (KP.mode === 'celebrate') { KP.t += dt; easePose(keeper, poseCelebrate(KP.t), dt, 9); r.position.z += 0; }
  else if (KP.mode === 'dejected') { KP.t += dt; easePose(keeper, poseDejected(KP.t), dt, 6); }
  keeper.shadow.scale.setScalar(KP.mode === 'dive' || KP.mode === 'lying' ? 1.6 : 1);
}
// --- penendang AI: pilih sasaran, kekuatan, putaran ---
const ZONES = [[-3.2, 0.45, 0.2], [3.2, 0.45, 0.2], [-3.2, 2.0, 0.17], [3.2, 2.0, 0.17], [-2.0, 0.6, 0.08], [2.0, 0.6, 0.08], [0, 1.3, 0.05], [-1.4, 2.1, 0.04], [1.4, 2.1, 0.04], [0, 0.5, 0.03], [-3.0, 1.2, 0.01], [3.0, 1.2, 0.01]];
function aiShotPlan(skill) {
  const D = SKILLS[skill]; let r = Math.random() * ZONES.reduce((a, z) => a + z[2], 0), z = ZONES[0]; for (const q of ZONES) { r -= q[2]; if (r <= 0) { z = q; break; } }
  const sigma = D.acc * 0.55, g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.9;
  const tx = z[0] + g() * sigma * 1.5, ty = Math.max(0.15, z[1] + g() * sigma), speed = rr(22, 31), curve = Math.random() < 0.25 ? rr(-0.6, 0.6) : 0;
  return { tx, ty, speed, spin: new THREE.Vector3(Math.random() < 0.3 ? rr(0, 20) : 0, -curve * 45, 0), side: Math.abs(tx) < 0.8 ? 0 : sgn(tx), tell: Math.random() < 0.62 };
}
// --- parameter tendangan pemain -> sasaran + kecepatan + putaran (dengan sebaran sesuai tenaga) ---
function userShotParams(aimX, aimY, power, curve, loft) {
  const speed = lerp(17, 33, clamp(power, 0, 1)), sigma = lerp(0.04, 0.6, Math.pow(clamp(power, 0, 1), 1.7)), g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.9;
  const tx = aimX + g() * sigma * 1.4, ty = Math.max(0.12, aimY + g() * sigma);
  return { tx, ty, speed, spin: new THREE.Vector3(loft * 32, -curve * 52, 0), aim: { x: aimX, y: aimY } };
}
