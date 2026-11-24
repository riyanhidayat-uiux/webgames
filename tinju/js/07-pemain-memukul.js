'use strict';
// ---------- pemain memukul ----------
const gloveAnim = [null, null];
function playerPunch(kind, hand, power) {
  if (state !== 'fight' || !E || E.state === 'ko' || P.hp <= 0) return;
  const wasGuard = P.guard; P.guard = false;
  if (P.stam < 12) power *= 0.5; P.stam = Math.max(0, P.stam - 12); P.hands++;
  gloveAnim[hand] = { kind, t: 0, dur: kind === 'hook' ? 0.32 : 0.26 }; sfx.swish();
  const sup = P.sup >= 100; if (sup) { P.sup = 0; power *= 2.2; }
  let dmg = PUNCH[kind].dmg * clamp(power, 0.5, 1.5), tag = '', mult = 1;
  // lawan menangkis / menghindar / rentan
  if (E.state === 'guard') { mult = sup ? 0.8 : 0.15; E.guardHits++; tag = 'TERTANGKIS'; if (E.guardHits >= 4 || sup) { E.state = 'stun'; E.t = 1.0; E.guardHits = 0; tag = 'GUARD JEBOL!'; mult = 1.2; } }
  else if (E.state === 'idle' && Math.random() < 0.06 + 0.07 * E.idx && !sup) { E.slip = 0.35; sfx.dodge(); say('MELESET', '#cfd8ff'); P.combo = 0; return; }
  else if (E.state === 'stun') { mult = 2.0; tag = 'BUKA!'; }
  else if (E.state === 'recover') { mult = 1.4; tag = 'COUNTER'; }
  else if (E.state === 'windup') { mult = 1.25; tag = 'TANGKAP!'; }
  dmg *= mult; if (P.combo >= 2) dmg *= 1 + Math.min(0.5, P.combo * 0.06); if (sup) { tag = 'SUPER!!'; shake = 1; sfx.big(); } else sfx.hit(clamp(0.5 + power * 0.6, 0.5, 1.2));
  damageEnemy(dmg, kind, tag, sup);
}
function damageEnemy(dmg, kind, tag, sup) {
  dmg = Math.round(dmg * 10) / 10; E.hp -= dmg; E.hitT = 0.28; P.dealt += dmg; P.combo++; P.comboT = 2.2; P.sup = Math.min(100, P.sup + dmg * 1.6); P.score += Math.round(dmg * 10 * Math.min(4, 1 + P.combo * 0.1));
  const pos = new THREE.Vector3(0, 1.75, -0.2).add(EN.root.position); hitStop = sup ? 0.12 : 0.05; burst(pos.x, pos.y - 0.1, pos.z + 0.3, sup ? 26 : 12, ['#ffffff', '#ffd23f', '#ff7a3a'], sup ? 5 : 3);
  showDmg(Math.round(dmg), pos, tag, sup); updateHud();
  if (E.hp <= 0) { E.hp = 0; E.state = 'ko'; E.koT = 0; sfx.ko(); shake = 1.2; slow = 0.8; say('K.O.!', '#ff5a3a'); updateHud(); }
}
const projV = new THREE.Vector3();
function showDmg(n, wp, tag, big) { projV.copy(wp).project(camera); const x = (projV.x * 0.5 + 0.5) * innerWidth, y = (-projV.y * 0.5 + 0.5) * innerHeight, el = document.createElement('div'); el.className = 'dmg'; el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.fontSize = (big ? 60 : 36) + 'px'; el.style.color = big ? '#ffe36a' : '#fff'; el.innerHTML = '-' + n + (tag ? `<div style="font-size:18px;color:#7fffd0">${tag}</div>` : ''); $('hud').appendChild(el); setTimeout(() => el.remove(), 950); }
