'use strict';
// ======================= HUD =======================
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function popText(txt, px, py, color) { const el = document.createElement('b'); el.textContent = txt; el.style.left = px + 'px'; el.style.top = py + 'px'; el.style.color = color || '#fff36a'; $('pops').appendChild(el); setTimeout(() => el.remove(), 950); }
const curEx = () => prog && prog[exI] ? prog[exI] : null;
function updateHud() {
  const c = curEx(); if (!c) return; const E = EXS[c.ex];
  $('exName').textContent = E.name; $('exSub').textContent = 'LATIHAN ' + (exI + 1) + ' / ' + prog.length;
  PLY.forEach((p, i) => { $('rep' + i).textContent = p.tot; $('of' + i).textContent = '/ ' + c.reps; $('sc' + i).textContent = p.score + ' poin'; $('fb' + i).textContent = p.fb; $('pn' + i).textContent = versus ? 'P' + (i + 1) : 'KAMU'; });
}
