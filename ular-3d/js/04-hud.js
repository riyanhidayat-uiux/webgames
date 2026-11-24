'use strict';
// ---------- HUD ----------
const v3 = new THREE.Vector3();
function popText(txt, x, y, z) {
  v3.set(x, y, z).project(camera);
  const el = document.createElement('b');
  el.textContent = txt;
  el.style.left = ((v3.x * 0.5 + 0.5) * innerWidth) + 'px';
  el.style.top = ((-v3.y * 0.5 + 0.5) * innerHeight) + 'px';
  $('pops').appendChild(el);
  setTimeout(() => el.remove(), 950);
}
function heartsHtml(p) { let h = ''; for (let i = 0; i < LIVES_VS; i++) h += `<span class="${i >= p.lives ? 'lost' : ''}">❤</span>`; return h; }
function updateHud(pop, pi = 0) {
  if (versus) {
    $('vs1').textContent = players[0] ? players[0].score : 0; $('vs2').textContent = players[1] ? players[1].score : 0;
    if (players[0]) $('vl1').innerHTML = heartsHtml(players[0]);
    if (players[1]) $('vl2').innerHTML = heartsHtml(players[1]);
  } else {
    const p = players[0] || { score: 0, snake: [] };
    $('score').textContent = p.score;
    $('bestHud').textContent = 'TERBAIK ' + Math.max(best, p.score);
    $('lenHud').textContent = 'PANJANG ' + p.snake.length;
  }
  if (pop) { const s = $(versus ? 'vs' + (pi + 1) : 'score'); s.classList.add('pop'); setTimeout(() => s.classList.remove('pop'), 130); }
}
let toastTimer = 0;
function toast(msg, ms = 3000) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
const show = (id, on) => $(id).classList.toggle('hidden', !on);
