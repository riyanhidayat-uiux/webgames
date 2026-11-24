'use strict';
// ---------- audio ----------
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.55; master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function noise(dur, type, f0, f1, gain, q = 1) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  hit(p = 1) { noise(0.07, 'bandpass', 2200 * p, 900, 0.5, 1.5); tone(0.07, 900 * p, 400, 0.25, 'triangle'); },
  smash() { noise(0.14, 'highpass', 1800, 700, 0.7, 0.8); tone(0.12, 520, 150, 0.45, 'square'); tone(0.3, 3200, 2400, 0.04, 'triangle'); },
  net() { noise(0.18, 'lowpass', 700, 150, 0.45); tone(0.12, 200, 80, 0.2); },
  floor() { noise(0.05, 'bandpass', 1200, 500, 0.3, 2); },
  point() { tone(0.12, 660, 990, 0.18, 'triangle'); tone(0.16, 990, 1480, 0.18, 'triangle', 0.1); },
  lose() { tone(0.25, 400, 200, 0.18, 'triangle'); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(0.18, f, f * 1.02, 0.2, 'triangle', i * 0.13)); }
};
