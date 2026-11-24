'use strict';
// ---------- HUD ----------
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function updateHud() {
  const score = Math.floor(dist) + coinCount * 10;
  $('score').textContent = score; $('distHud').textContent = Math.floor(dist) + ' m'; $('coinHud').textContent = '🪙 ' + coinCount;
  $('bestHud').textContent = 'TERBAIK ' + Math.max(best, score);
  let h = ''; for (let i = 0; i < MAXLIVES; i++) h += `<span class="${i >= lives ? 'lost' : ''}">❤</span>`; $('lives').innerHTML = h;
}
const finalScore = () => Math.floor(dist) + coinCount * 10;
