'use strict';
// ---------- HUD ----------
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function updateHud() {
  $('scA').textContent = players[0] ? players[0].score : 0; $('scB').textContent = players[1] ? players[1].score : 0;
  $('nmA').textContent = versus ? 'P1' : 'KAMU'; $('nmB').textContent = versus ? 'P2' : 'AI';
  $('srvA').textContent = server === 0 ? '🏸 SERVIS' : ''; $('srvB').textContent = server === 1 ? '🏸 SERVIS' : '';
  $('rally').textContent = 'RALLY ' + rally;
}
