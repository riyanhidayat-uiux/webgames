'use strict';
// ======================= MODE 2 PLAYER SPARRING =======================
let versus = false;
const VOK = { jab: { block: 1, lean: 1, duck: 0 }, hook: { block: 1, lean: 0, duck: 1 }, upper: { block: 1, lean: 1, duck: 0 } };
const VDMG = { jab: 6, hook: 9, upper: 12 }, VTRAVEL = { jab: 0.26, hook: 0.34, upper: 0.3 }, VPOS = [-1.2, 1.2];
const mkVF = i => ({ i, hp: 100, stam: 100, sup: 0, guard: false, lean: 0, duck: false, combo: 0, comboT: 0, stun: 0, state: 'idle', anim: null, hitT: 0, noGuard: 0, slip: 0, wins: 0, dealt: 0, perfectD: 0, hands: 0 });
let VF = [mkVF(0), mkVF(1)], vr = { round: 1, t: 60, locked: false, max: 5 }, pend = [];
const vflags = [{ guard: false, leanL: false, leanR: false, duck: false }, { guard: false, leanL: false, leanR: false, duck: false }], vTog = [0, 0];
const headPos = i => new THREE.Vector3(VB[i].root.position.x, 1.85, VB[i].root.position.z);
function popAt(wp, text, color, size = 34) { projV.copy(wp).project(camera); const el = document.createElement('div'); el.className = 'dmg'; el.style.left = ((projV.x * 0.5 + 0.5) * innerWidth) + 'px'; el.style.top = ((-projV.y * 0.5 + 0.5) * innerHeight) + 'px'; el.style.fontSize = size + 'px'; el.style.color = color || '#fff'; el.textContent = text; $('hud').appendChild(el); setTimeout(() => el.remove(), 950); }
function vsInputs() { VF.forEach((f, i) => { if (useCam) { const c = camStates[i]; f.guard = c.guard; f.lean = c.lean; f.duck = c.duck; } else { const v = vflags[i]; f.guard = v.guard; f.lean = v.leanL ? -1 : v.leanR ? 1 : 0; f.duck = v.duck; } }); }
function vsPunch(pi, kind, hand, power) {
  const f = VF[pi]; if (!versus || state !== 'fight' || vr.locked || f.state === 'ko' || f.stun > 0 || VF[1 - pi].state === 'ko') return;
  if (f.stam < 12) power *= 0.5; f.stam = Math.max(0, f.stam - 12); f.hands++; f.noGuard = 0.4; f.anim = { kind, hand, t: 0, dur: kind === 'hook' ? 0.32 : 0.26 }; sfx.swish();
  pend.push({ att: pi, def: 1 - pi, kind, power: clamp(power, 0.5, 1.5), t: VTRAVEL[kind] });
}
function vsDefense(d, kind) { const o = VOK[kind]; if ((d.lean !== 0 && o.lean) || (d.duck && o.duck)) return 'dodge'; if (d.guard && d.noGuard <= 0 && o.block) return 'block'; return 'hit'; }
function vsResolve(pd) {
  const a = VF[pd.att], d = VF[pd.def]; if (vr.locked || a.state === 'ko' || d.state === 'ko') return;
  const res = vsDefense(d, pd.kind), sup = a.sup >= 100; if (sup) a.sup = 0; const hp3 = headPos(d.i);
  if (res === 'dodge' && !sup) { a.stun = 0.8; d.sup = Math.min(100, d.sup + 14); d.perfectD++; a.combo = 0; popAt(hp3, 'HINDAR!', '#7fffd0', 38); sfx.dodge(); $('flashB').classList.remove('on'); void $('flashB').offsetWidth; $('flashB').classList.add('on'); return; }
  let dmg = VDMG[pd.kind] * pd.power, tag = ''; if (a.combo >= 2) dmg *= 1 + Math.min(0.5, a.combo * 0.06); if (sup) dmg *= 2.5;
  if (res === 'block') { dmg *= sup ? 0.6 : (pd.kind === 'upper' ? 0.4 : 0.2); tag = 'TANGKIS'; }
  if (d.stun > 0) { dmg *= 1.5; tag = 'BUKA!'; } if (sup) tag = 'SUPER!!';
  dmg = Math.round(dmg * 10) / 10; d.hp = Math.max(0, d.hp - dmg); d.hitT = res === 'block' ? 0.12 : 0.28; a.dealt += dmg;
  if (res !== 'block' || sup) { a.combo++; a.comboT = 2.2; d.combo = 0; } a.sup = Math.min(100, a.sup + dmg * 1.4);
  burst(hp3.x, hp3.y - 0.1, hp3.z + 0.2, sup ? 24 : (res === 'block' ? 5 : 12), res === 'block' ? ['#9fe7ff', '#ffffff'] : ['#ffffff', '#ffd23f', '#ff7a3a'], sup ? 5 : 3);
  if (res === 'block') sfx.block(); else { sfx.hit(clamp(0.5 + pd.power * 0.6, 0.5, 1.2)); shake = Math.max(shake, sup ? 1 : 0.45); hitStop = sup ? 0.12 : 0.05; if (sup) sfx.big(); }
  popAt(hp3, '-' + Math.round(dmg) + (tag ? ' ' + tag : ''), res === 'block' ? '#9fe7ff' : sup ? '#ffe36a' : '#fff', sup ? 52 : 34); updateHudVs();
  if (d.hp <= 0) vsEndRound(a.i, 'KO');
}
function vsEndRound(w, how) {
  if (vr.locked) return; vr.locked = true; pend = [];
  if (how === 'KO') { VF[1 - w].state = 'ko'; sfx.ko(); shake = 1.2; slow = 0.8; say('K.O.!', '#ff5a3a'); } else { say(w < 0 ? 'SERI RONDE' : 'WAKTU HABIS', '#ffd23f'); sfx.bell(); }
  if (w >= 0) { VF[w].wins++; popAt(headPos(w), 'MENANG RONDE!', '#7fffd0', 38); } updateHudVs(); state = 'between';
  setTimeout(() => { if (state !== 'between' || !versus) return; if (VF.some(f => f.wins >= 2) || vr.round >= vr.max) vsFinish(); else { vr.round++; beginVsRound(); } }, 2600);
}
function beginVsRound() {
  VF.forEach(f => { f.hp = 100; f.stam = 100; f.sup = 0; f.stun = 0; f.state = 'idle'; f.anim = null; f.hitT = 0; f.combo = 0; f.noGuard = 0; }); VB.forEach(b => { b.cur = {}; });
  vr.t = 60; vr.locked = false; pend = []; updateHudVs(); sfx.bell(); say('RONDE ' + vr.round, '#ffd23f'); startCountdown(() => { state = 'fight'; });
}
function startVersus() { VF = [mkVF(0), mkVF(1)]; vr = { round: 1, t: 60, locked: false, max: 5 }; pend = []; VB.forEach((b, i) => { b.root.position.set(VPOS[i], 0, 0); b.cur = {}; }); beginVsRound(); }
function vsFinish() {
  state = 'over'; stopCamera(); const w = VF[0].wins === VF[1].wins ? (VF[0].dealt >= VF[1].dealt ? 0 : 1) : (VF[0].wins > VF[1].wins ? 0 : 1);
  $('overTitle').textContent = '🏆 P' + (w + 1) + ' MENANG!'; $('overScore').textContent = VF[0].wins + ' : ' + VF[1].wins;
  $('overInfo').textContent = `Ronde dimenangkan P1 ${VF[0].wins} / P2 ${VF[1].wins} · kerusakan P1 ${Math.round(VF[0].dealt)} / P2 ${Math.round(VF[1].dealt)} · menghindar tepat P1 ${VF[0].perfectD} / P2 ${VF[1].perfectD}`;
  ['hud', 'gameBtns', 'ctl', 'ctl2'].forEach(i => show(i, false)); show('over', true); sfx.win();
}
function updateVersus(dt) {
  vsInputs();
  VF.forEach(f => { f.stam = Math.min(100, f.stam + dt * 18); f.stun = Math.max(0, f.stun - dt); f.hitT = Math.max(0, f.hitT - dt); f.noGuard = Math.max(0, f.noGuard - dt); f.comboT -= dt; if (f.comboT <= 0) f.combo = 0; if (f.anim) { f.anim.t += dt; if (f.anim.t >= f.anim.dur) f.anim = null; } });
  if (state !== 'fight' || vr.locked) return;
  for (let i = pend.length - 1; i >= 0; i--) { pend[i].t -= dt; if (pend[i].t <= 0) { const pd = pend.splice(i, 1)[0]; vsResolve(pd); } }
  vr.t -= dt; if (vr.t <= 0 && !vr.locked) { vr.t = 0; vsEndRound(VF[0].hp > VF[1].hp ? 0 : VF[1].hp > VF[0].hp ? 1 : -1, 'time'); }
}
function animateVersus(dt) {
  VF.forEach((f, i) => {
    const B = VB[i], dir = i === 0 ? 1 : -1; let key = 'idle', mir = false;
    if (f.state === 'ko') key = 'ko'; else if (f.hitT > 0.1) key = 'hit'; else if (f.stun > 0) key = 'stun';
    else if (f.anim) { const k = f.anim.kind; key = k === 'jab' ? 'strikeJab' : k === 'hook' ? 'strikeHookL' : 'strikeUpper'; mir = k === 'upper' ? f.anim.hand === 0 : f.anim.hand === 1; }
    else if (f.duck) key = 'duck'; else if (f.guard || f.lean) key = 'guard';
    let T = Object.assign({}, POSES[key]); if (mir) T = mirrorPose(T);
    if (key === 'idle' || key === 'guard') { const fw = Math.sin(elapsed * 5.5 + i); T.lA += fw * 0.13; T.lB -= fw * 0.13; T.tZ += Math.sin(elapsed * 3.2 + i) * 0.04; }
    applyPose(B, T, (key === 'hit' || key.startsWith('strike')) ? 0.5 : key === 'ko' ? 0.08 : 0.22);
    const lunge = f.anim ? Math.sin(clamp(f.anim.t / f.anim.dur, 0, 1) * Math.PI) * 0.4 : 0, recoil = f.hitT > 0 ? f.hitT * 0.9 : 0;
    B.root.position.x += (VPOS[i] + dir * (lunge - recoil) - B.root.position.x) * Math.min(1, dt * 14); B.root.position.z += (f.lean * 0.38 - B.root.position.z) * Math.min(1, dt * 12);
    B.root.rotation.y = dir * (Math.PI / 2 - 0.5); B.torso.scale.y = 1 + 0.012 * Math.sin(elapsed * 4.2 + i); updateBruises(B, f.hp / 100);
    B.star.visible = f.stun > 0 && f.hitT <= 0; B.warn.visible = false; B.mat.glove.emissive.setHex(f.anim ? 0x331a0a : 0x000000);
  });
}
function updateHudVs() {
  VF.forEach((f, i) => { $('vhp' + (i + 1)).style.width = f.hp + '%'; $('pips' + (i + 1)).innerHTML = [0, 1].map(k => `<span class="pip ${k < f.wins ? 'on' : ''}"></span>`).join(''); });
  $('vround').textContent = 'RONDE ' + vr.round; $('vtime').textContent = Math.ceil(vr.t); $('vtime').classList.toggle('low', vr.t <= 10);
}
let vsT = 0;
function vsLight() { vsT += 0.016; if (vsT < 0.05) return; vsT = 0; $('vtime').textContent = Math.ceil(vr.t); $('vtime').classList.toggle('low', vr.t <= 10); VF.forEach((f, i) => { const n = i + 1; $('vhp' + n).style.width = f.hp + '%'; $('vst' + n).style.width = f.stam + '%'; $('vsu' + n).style.width = f.sup + '%'; $('vsl' + n).textContent = f.sup >= 100 ? '⚡ SUPER SIAP!' : 'SUPER'; $('v' + n + 'g').classList.toggle('on', f.guard); $('v' + n + 'l').classList.toggle('on', f.lean !== 0); $('v' + n + 'd').classList.toggle('on', f.duck); }); }
function setVersus(v) { versus = v; $('btnM1').classList.toggle('on', !v); $('btnM2').classList.toggle('on', v); show('vsHelp', v); show('diffBox', !v); }
