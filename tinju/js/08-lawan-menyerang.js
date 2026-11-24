'use strict';
// ---------- lawan menyerang ----------
function pickAttack() { const F = E.F; return F.atk[(Math.random() * F.atk.length) | 0]; }
function startAttack(k) {
  E.atk = k; E.state = 'windup'; E.t = Math.max(0.42, E.F.windup * E.windM) * rr(0.95, 1.1); E.tTotal = E.t; E.hitDone = false;
  const a = ATK[k]; $('cueTxt').textContent = a.label; show('cue', true); sfx.warn();
  $('cB').className = 'chip' + (a.ok.block ? ' ok' : ' no'); $('cD').className = 'chip' + (a.ok.duck ? ' ok' : ' no'); $('cL').className = 'chip' + (a.ok.leanL ? ' ok' : ' no'); $('cR').className = 'chip' + (a.ok.leanR ? ' ok' : ' no'); EN.warn.visible = true;
}
function evalDefense(k) { const o = ATK[k].ok; if ((P.lean === -1 && o.leanL) || (P.lean === 1 && o.leanR) || (P.duck && o.duck)) return 'dodge'; if (P.guard && o.block) return 'block'; return 'hit'; }
function resolveEnemyStrike() {
  const k = E.atk, a = ATK[k], res = evalDefense(k); show('cue', false); EN.warn.visible = false; E.hitDone = true;
  if (res === 'dodge') { P.sup = Math.min(100, P.sup + 12); P.perfectD++; P.score += 80; say('MENGHINDAR!', '#7fffd0'); sfx.dodge(); $('flashB').classList.remove('on'); void $('flashB').offsetWidth; $('flashB').classList.add('on'); E.state = 'stun'; E.t = 0.95; E.stunBonus = true; E.recoverAfter = 0; }
  else if (res === 'block') { const d = Math.round(a.dmg * E.dmgM * (k === 'upper' ? 0.4 : 0.2)); hurtPlayer(d, true); E.state = 'recover'; E.t = 0.55; }
  else { hurtPlayer(Math.round(a.dmg * E.dmgM), false); E.state = 'recover'; E.t = 0.6; }
}
function hurtPlayer(d, blocked) {
  P.hp = Math.max(0, P.hp - d); P.combo = 0; if (!blocked) { shake = 0.9; sfx.hurt(); $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on'); try { navigator.vibrate && navigator.vibrate([60, 30, 120]); } catch (e) {} say('AUW!', '#ff5a5a'); } else { sfx.block(); shake = 0.25; say('TERTANGKIS', '#9fe7ff'); }
  updateHud(); if (P.hp <= 0) { state = 'ko'; E.state = 'idle'; show('cue', false); sfx.ko(); say('KO!', '#ff3a3a'); setTimeout(() => finishGame(false), 1600); }
}
function updateEnemy(dt) {
  if (!E) return;
  E.hitT = Math.max(0, E.hitT - dt); E.slip = Math.max(0, E.slip - dt);
  if (state !== 'fight') return;
  if (E.state === 'ko') { E.koT += dt; if (E.koT > 1.8 && state === 'fight') { state = 'roundEnd'; endRound(); } return; }
  E.t -= dt;
  if (E.state === 'idle') { if (E.t <= 0) { if (Math.random() < E.F.guardP) { E.state = 'guard'; E.t = rr(0.7, 1.3); E.guardHits = 0; } else startAttack(pickAttack()); } }
  else if (E.state === 'windup') { if (E.t <= 0) { E.state = 'strike'; E.t = 0.14; resolveEnemyStrike(); E.state = E.state === 'stun' || E.state === 'recover' ? E.state : 'recover'; E.strikeAnim = 0.16; } }
  else if (E.state === 'guard' || E.state === 'recover' || E.state === 'stun') { if (E.t <= 0) { E.state = 'idle'; E.t = rr(E.F.gap[0], E.F.gap[1]); } }
}
function animateEnemy(dt) {
  if (!E) return; const B = EN; let key = 'idle';
  const sw = Math.sin(elapsed * 3.2) * 0.04;
  if (E.state === 'ko') key = 'ko'; else if (E.hitT > 0) key = 'hit'; else if (E.state === 'stun') key = 'stun'; else if (E.state === 'guard') key = 'guard';
  else if (E.state === 'windup') key = { jab: 'windJab', hookL: 'windHookL', hookR: 'windHookR', upper: 'windUpper' }[E.atk];
  else if (E.strikeAnim > 0) { key = { jab: 'strikeJab', hookL: 'strikeHookL', hookR: 'strikeHookR', upper: 'strikeUpper' }[E.atk]; E.strikeAnim -= dt; }
  const T = Object.assign({}, POSES[key]); if (key === 'idle' || key === 'guard') { T.tZ += sw; T.hipY += Math.abs(sw) * 0.5; }
  if (key === 'idle' || key === 'guard') { const fw = Math.sin(elapsed * 5.5); T.lA += fw * 0.13; T.lB -= fw * 0.13; }
  B.torso.scale.y = 1 + 0.012 * Math.sin(elapsed * 4.2); B.torso.scale.x = 1 + 0.008 * Math.sin(elapsed * 4.2); updateBruises(B, E.hp / E.maxHp);
  let k = (key === 'hit' || key.startsWith('strike')) ? 0.55 : (key === 'ko' ? 0.08 : 0.2); applyPose(B, T, k);
  B.root.position.x += ((E.slip > 0 ? 0.55 * (E.slip > 0.17 ? 1 : 0.3) : 0) - B.root.position.x) * Math.min(1, dt * 14);
  const advance = key.startsWith('strike') ? 0.5 : key.startsWith('wind') ? -0.12 : 0; B.root.position.z += (-0.2 + advance - B.root.position.z) * Math.min(1, dt * 12);
  B.root.rotation.z = key === 'ko' ? 0 : (E.state === 'stun' ? Math.sin(elapsed * 9) * 0.07 : 0);
  B.star.visible = E.state === 'stun' && E.hitT <= 0; B.warn.visible = E.state === 'windup'; if (B.warn.visible) { const arm = E.atk === 'hookL' ? B.aL : E.atk === 'hookR' ? B.aR : E.atk === 'upper' ? B.aR : B.aL; arm.gl.getWorldPosition(projV); B.warn.position.copy(B.root.worldToLocal(projV)); B.warn.material.opacity = 0.5 + 0.5 * Math.sin(elapsed * 26); }
  B.mat.glove.emissive.setHex(E.state === 'windup' ? 0x771111 : 0x000000);
}
