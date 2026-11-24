'use strict';
// ======================= AUDIO SINTETIS =======================
let AC = null, master = null, noiseBuf = null, rollN = null;
function initAudio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.6; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate * 1, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
const on = () => AC && !settings.mute;
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!on()) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
function noise(dur, type, f0, gain, delay = 0, q = 1) { if (!on()) return; const t = AC.currentTime + delay, s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type; f.frequency.value = f0; f.Q.value = q; const g = AC.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
const sfx = {
  release() { noise(0.18, 'bandpass', 900, 0.18, 0, 0.8); tone(0.12, 180, 90, 0.2); },
  rollStart() { if (!on() || rollN) return; const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); rollN = { s, f, g }; },
  rollSet(v) { if (!rollN) return; const t = AC.currentTime; rollN.g.gain.setTargetAtTime(clamp(v / 20, 0, 1) * 0.3, t, 0.05); rollN.f.frequency.setTargetAtTime(180 + v * 28, t, 0.05); },
  rollStop() { if (!rollN) return; const r = rollN; rollN = null; try { r.g.gain.setTargetAtTime(0, AC.currentTime, 0.08); r.s.stop(AC.currentTime + 0.4); } catch (e) {} },
  crash(n, sp) {   // tabrakan pin: dentuman + banyak "tok" kayu
    if (!on()) return; const k = Math.min(18, 3 + n * 2), v = clamp(sp / 14, 0.3, 1);
    tone(0.25, 140, 60, 0.35 * v, 'triangle'); noise(0.3, 'lowpass', 500, 0.35 * v);
    for (let i = 0; i < k; i++) { const d = Math.random() * 0.8 * (0.4 + n * 0.08); noise(0.07, 'bandpass', rr(700, 2400), 0.28 * v, d, 4); tone(0.05, rr(500, 900), rr(250, 400), 0.12 * v, 'square', d); }
  },
  gutter() { noise(0.6, 'lowpass', 220, 0.3); tone(0.5, 110, 55, 0.22, 'sine'); },
  strike() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(0.28, f, f * 1.01, 0.2, 'triangle', i * 0.09)); },
  spare() { [659, 880, 1175].forEach((f, i) => tone(0.22, f, f * 1.01, 0.18, 'triangle', i * 0.09)); },
  miss() { tone(0.3, 300, 150, 0.14, 'triangle'); },
  tick() { tone(0.06, 900, 900, 0.1, 'square'); },
  done() { [523, 659, 784, 1047].forEach((f, i) => tone(0.25, f, f * 1.01, 0.2, 'triangle', i * 0.12)); }
};
