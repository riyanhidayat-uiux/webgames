'use strict';
// ======================= HUD =======================
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function updateHud() {
  $('phpF').style.width = (P.hp) + '%'; $('stamF').style.width = P.stam + '%'; $('supF').style.width = P.sup + '%'; $('supLbl').textContent = P.sup >= 100 ? '⚡ SUPER SIAP! (pukul!)' : 'SUPER';
  if (E) { const p = Math.max(0, E.hp / E.maxHp * 100); $('ehpF').style.width = p + '%'; $('ehpG').style.width = p + '%'; $('ename').textContent = E.F.name; $('roundTxt').textContent = 'RONDE ' + (E.idx + 1) + ' / ' + FIGHTERS.length; }
  $('score').textContent = P.score; $('combo').textContent = P.combo >= 2 ? '🔥 COMBO x' + P.combo : '';
}
const detUI = () => { $('dG').classList.toggle('on', P.guard); $('dL').classList.toggle('on', P.lean === -1); $('dR').classList.toggle('on', P.lean === 1); $('dD').classList.toggle('on', P.duck); };
