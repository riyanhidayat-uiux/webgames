'use strict';
// ======================= MUSIK SINTETIS =======================
let AC = null, master = null, noiseBuf = null;
function initAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.55; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
function osc(freq, t, dur, type, gain, f1) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
function noiseHit(t, dur, type, f0, gain) { const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = f0; const g = AC.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05); }
function playStep(sg, i, t) {
  const beat = Math.floor(i / 2), off = i % 2, bar = Math.floor(beat / 4), bt = beat % 4, chord = sg.prog[bar % sg.prog.length], root = sg.root + MINOR[chord % 7] - (chord > 4 ? 12 : 0);
  const count = beat < INTRO, loud = beat >= INTRO;
  if (count) { if (!off && (bt === 0 || beat >= 4)) osc(bt === 0 ? 1400 : 1000, t, 0.05, 'square', 0.12); }
  if (!off && (loud || beat >= 4)) osc(150, t, 0.16, 'sine', 0.5, 45);                                   // kick
  if (!off && (bt === 1 || bt === 3) && (loud || beat >= 6)) { noiseHit(t, 0.12, 'bandpass', 1800, 0.35); osc(220, t, 0.08, 'triangle', 0.1); }   // snare
  if (beat >= 2) noiseHit(t, off ? 0.05 : 0.025, 'highpass', 7000, off ? 0.16 : 0.08);                    // hi-hat
  if (loud) {
    if (sg.style === 'edm') { if (off || bt !== 0) osc(mtof(root - 12), t, 0.2, 'sawtooth', 0.13); }
    else if (!off) osc(mtof(root - 12), t, 0.28, sg.style === 'disco' ? 'sawtooth' : 'triangle', 0.16);
    const arp = [0, 7, 12, 7][(i >> 0) % 4] + (bt >= 2 ? 3 : 0); if (off || sg.style !== 'pop') osc(mtof(root + 12 + arp), t, 0.18, sg.style === 'edm' ? 'square' : 'triangle', 0.07);
    if (!off && bt === 0 && sg.style !== 'edm') { [0, 3, 7].forEach(n => osc(mtof(root + n), t, 0.9, 'sine', 0.05)); }
  }
}
let nextStep = 0, songT = 0;
function scheduleAudio(sg) {
  if (!AC || settings.mute) return; const bd = 60 / sg.bpm / 2, ahead = 0.3, base = AC.currentTime - songT;
  if (nextStep * bd < songT - 0.05) nextStep = Math.ceil(songT / bd);
  while (nextStep * bd < songT + ahead) { const tt = base + nextStep * bd; if (tt >= AC.currentTime) { try { playStep(sg, nextStep, tt); } catch (e) {} } nextStep++; }
}
const sfx = { tick() { if (AC && !settings.mute) osc(900, AC.currentTime, 0.06, 'square', 0.12); }, hit(g) { if (!AC || settings.mute) return; const t = AC.currentTime; if (g === 'perfect') { osc(1100, t, 0.1, 'triangle', 0.16); osc(1650, t + 0.06, 0.12, 'triangle', 0.12); } else if (g === 'great') osc(900, t, 0.1, 'triangle', 0.14); else if (g === 'good') osc(700, t, 0.1, 'triangle', 0.1); else if (g === 'miss') osc(220, t, 0.18, 'sawtooth', 0.1, 120); }, end() { if (!AC || settings.mute) return; const t = AC.currentTime; [523, 659, 784, 1047].forEach((f, i) => osc(f, t + i * 0.12, 0.2, 'triangle', 0.18)); } };

// ======================= STATE =======================
let state = 'menu', versus = false, useCam = false, elapsed = 0, song = null, choreo = [], beatDur = 0.6, lastBeat = -1, pulse = 0;
const mkPly = i => ({ i, J: null, valid: false, miss: 0, score: 0, combo: 0, maxCombo: 0, counts: { perfect: 0, great: 0, good: 0, ok: 0, miss: 0 }, sim: 0, scr: null, bones: [], raw: null });
let PLY = [mkPly(0)];
const NP = () => versus ? 2 : 1, PCOL = [['#ff9ae0', '#ffb35a'], ['#6fc8ff', '#6fc8ff']];

// ======================= HUD =======================
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
function popText(txt, px, py, color) { const el = document.createElement('b'); el.textContent = txt; el.style.left = px + 'px'; el.style.top = py + 'px'; el.style.color = color || '#fff'; $('pops').appendChild(el); setTimeout(() => el.remove(), 950); }
function updateHud() { PLY.forEach((p, i) => { $('sc' + i).textContent = p.score; $('cb' + i).textContent = p.combo >= 3 ? '🔥 x' + p.combo : ''; $('pn' + i).textContent = versus ? 'P' + (i + 1) : 'KAMU'; }); }
