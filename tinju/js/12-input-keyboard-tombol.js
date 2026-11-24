'use strict';
// ======================= INPUT: KEYBOARD & TOMBOL =======================
let handToggle = 0;
const VKEYS = { z: [0, 'jab'], x: [0, 'hook'], c: [0, 'upper'], j: [1, 'jab'], k: [1, 'hook'], l: [1, 'upper'] };
function vsKey(k, down) {
  const m = VKEYS[k]; if (m && down) vsPunch(m[0], m[1], (vTog[m[0]] ^= 1), 1);
  if (k === 'v') vflags[0].guard = down; if (k === 'a') vflags[0].leanL = down; if (k === 's') vflags[0].duck = down;
  if (k === 'm') vflags[1].guard = down; if (k === 'arrowleft') vflags[1].leanL = down; if (k === 'arrowright') vflags[1].leanR = down; if (k === 'arrowdown') vflags[1].duck = down;
}
addEventListener('keydown', e => {
  if (e.repeat) return; const k = e.key.toLowerCase();
  if (k === ' ' || k.startsWith('arrow')) e.preventDefault();
  if (k === 'p' || k === 'escape') { if (state === 'fight') pauseGame(); else if (state === 'paused') resumeGame(); return; }
  if (versus) { if (!useCam || state === 'fight') vsKey(k, true); return; }
  if (k === 'z' || k === 'j') playerPunch('jab', (handToggle ^= 1), 1); else if (k === 'x' || k === 'k') playerPunch('hook', (handToggle ^= 1), 1); else if (k === 'c' || k === 'l') playerPunch('upper', (handToggle ^= 1), 1);
  if (!useCam) { if (k === ' ' || k === 'shift') flags.guard = true; if (k === 'a' || k === 'arrowleft') flags.leanL = true; if (k === 'd' || k === 'arrowright') flags.leanR = true; if (k === 's' || k === 'arrowdown') flags.duck = true; }
});
addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (versus) { vsKey(k, false); return; } if (k === ' ' || k === 'shift') flags.guard = false; if (k === 'a' || k === 'arrowleft') flags.leanL = false; if (k === 'd' || k === 'arrowright') flags.leanR = false; if (k === 's' || k === 'arrowdown') flags.duck = false; });
const bindCtl = (panel, pi) => Array.from(panel.querySelectorAll('button')).forEach(b => {
  const k = b.dataset.k, isP = k === 'jab' || k === 'hook' || k === 'upper', tgt = () => versus ? vflags[pi] : flags;
  const press = e => { e.preventDefault(); initAudio(); if (isP) { if (versus) vsPunch(pi, k, (vTog[pi] ^= 1), 1); else playerPunch(k, (handToggle ^= 1), 1); } else { tgt()[k] = true; b.classList.add('on'); } };
  const rel = () => { if (!isP) { tgt()[k] = false; b.classList.remove('on'); } };
  b.addEventListener('pointerdown', press); b.addEventListener('pointerup', rel); b.addEventListener('pointerleave', rel); b.addEventListener('pointercancel', rel);
});
bindCtl($('ctl'), 0); bindCtl($('ctl2'), 1);
