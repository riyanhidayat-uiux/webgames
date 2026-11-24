'use strict';
// ======================= HUD =======================
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function popText(txt, px, py, color) { const el = document.createElement('b'); el.textContent = txt; el.style.left = px + 'px'; el.style.top = py + 'px'; el.style.color = color || '#fff36a'; $('pops').appendChild(el); setTimeout(() => el.remove(), 950); }
function updateHud(pop) {
  if (versus) { for (let i = 0; i < 2; i++) { $('vs' + (i + 1)).textContent = PL[i].score; $('vc' + (i + 1)).textContent = PL[i].combo >= 2 ? '🔥 x' + Math.min(5, PL[i].combo) : ''; } return; }
  const p = PL[0]; $('score').textContent = p.score; $('hitHud').textContent = p.hits + ' target'; $('comboHud').textContent = p.combo >= 2 ? '🔥 COMBO x' + Math.min(5, p.combo) : ''; $('bestHud').textContent = 'TERBAIK ' + Math.max(best, p.score);
  let h = ''; for (let i = 0; i < 5; i++) h += `<span class="${i >= lives ? 'lost' : ''}">❤</span>`; $('lives').innerHTML = h;
  if (pop) { const s = $('score'); s.classList.add('pop'); setTimeout(() => s.classList.remove('pop'), 110); }
}
const fmtT = t => { const s = Math.max(0, Math.ceil(t)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function updateFever() { $('feverFill').style.width = Math.round((fever.t > 0 ? fever.t / 8 : fever.c) * 100) + '%'; $('fever').classList.toggle('on', fever.t > 0); $('feverTxt').textContent = fever.t > 0 ? '🔥 HUJAN BOLA x2 🔥' : 'ISI UNTUK HUJAN BOLA'; }
