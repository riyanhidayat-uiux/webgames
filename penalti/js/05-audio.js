'use strict';
// ======================= AUDIO SINTETIS: sorak penonton, peluit, tendangan, tiang, jaring =======================
let AC = null, master = null, noiseBuf = null, crowdN = null;
function initAudio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.65; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate); const d = noiseBuf.getChannelData(0); let b = 0; for (let i = 0; i < d.length; i++) { b = 0.97 * b + (Math.random() * 2 - 1) * 0.3; d[i] = b; } }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
const on = () => AC && !settings.mute;
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!on()) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
function noise(dur, type, f0, gain, f1, delay = 0, q = 1) { if (!on()) return; const t = AC.currentTime + delay, s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = q; const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); }
// dengung penonton (kontinu), volume mengikuti "kehebohan"
function startCrowd() { if (!AC || crowdN) return; const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.5; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); crowdN = { s, f, g }; }
function crowdSet(exc) { if (!crowdN) return; const t = AC.currentTime; crowdN.g.gain.setTargetAtTime(settings.mute ? 0 : 0.06 + exc * 0.32, t, 0.25); crowdN.f.frequency.setTargetAtTime(420 + exc * 520, t, 0.3); }
function stopCrowd() { if (!crowdN) return; const c = crowdN; crowdN = null; try { c.g.gain.setTargetAtTime(0, AC.currentTime, 0.1); c.s.stop(AC.currentTime + 0.6); } catch (e) {} }
const sfx = {
  whistle(long) { if (!on()) return; const t = AC.currentTime, d = long ? 0.7 : 0.32, o = AC.createOscillator(), o2 = AC.createOscillator(), lfo = AC.createOscillator(), lg = AC.createGain(), g = AC.createGain(); o.type = 'sine'; o2.type = 'sine'; o.frequency.value = 2900; o2.frequency.value = 3150; lfo.frequency.value = 38; lg.gain.value = 90; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.03); g.gain.setValueAtTime(0.22, t + d - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); o2.connect(g); g.connect(master); o.start(t); o2.start(t); lfo.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05); lfo.stop(t + d + 0.05); },
  kick(v) { const k = clamp(v / 30, 0.3, 1); tone(0.12, 150, 55, 0.5 * k, 'sine'); noise(0.07, 'highpass', 1400, 0.45 * k, 700); noise(0.09, 'lowpass', 500, 0.35 * k, 200); },
  bounce(v) { const k = clamp(v / 8, 0.15, 1); tone(0.1, 130, 70, 0.3 * k, 'sine'); noise(0.05, 'lowpass', 600, 0.15 * k, 250); },
  post(v) { const k = clamp(v / 18, 0.3, 1); [820, 1230, 1840, 2650].forEach((f, i) => tone(0.9 - i * 0.12, f, f * 0.995, 0.16 * k / (i + 1), 'sine')); noise(0.05, 'highpass', 3000, 0.3 * k, 2000); },
  net(v) { const k = clamp(v / 22, 0.15, 1); noise(0.5, 'highpass', 2500, 0.28 * k, 900, 0, 0.7); noise(0.3, 'bandpass', 1200, 0.14 * k, 400); },
  glove(v) { const k = clamp(v / 24, 0.3, 1); noise(0.1, 'bandpass', 900, 0.5 * k, 400, 0, 1.2); tone(0.1, 200, 90, 0.25 * k, 'triangle'); },
  catchB() { noise(0.12, 'bandpass', 700, 0.45, 350); tone(0.12, 180, 100, 0.3, 'triangle'); },
  body() { noise(0.1, 'lowpass', 400, 0.3, 200); },
  cheer() { if (!on()) return; noise(1.8, 'bandpass', 600, 0.5, 1500, 0, 0.5); noise(1.4, 'bandpass', 1400, 0.25, 2400, 0.1, 0.8); [523, 659, 784].forEach((f, i) => tone(0.25, f, f, 0.12, 'triangle', 0.05 + i * 0.1)); },
  groan() { noise(1.3, 'lowpass', 900, 0.4, 250, 0, 0.5); tone(1.0, 220, 110, 0.12, 'sawtooth'); },
  ooh() { noise(0.9, 'bandpass', 700, 0.3, 1200, 0, 0.6); },
  tick() { tone(0.05, 1000, 1000, 0.1, 'square'); }, done() { [523, 659, 784, 1047].forEach((f, i) => tone(0.25, f, f * 1.01, 0.2, 'triangle', i * 0.12)); }
};
