'use strict';
// ---------- audio ----------
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.5; master.connect(AC.destination);
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
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  jump() { tone(0.2, 300, 700, 0.16, 'triangle'); },
  duck() { noise(0.18, 'bandpass', 1200, 400, 0.25, 1.2); },
  lane() { noise(0.1, 'bandpass', 900, 1800, 0.15, 1.5); },
  coin() { tone(0.08, 988, 1318, 0.14, 'square'); tone(0.14, 1318, 1976, 0.12, 'square', 0.06); },
  hit() { noise(0.25, 'lowpass', 900, 120, 0.6); tone(0.3, 180, 50, 0.4, 'sawtooth'); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(0.22, f, f * 0.98, 0.2, 'triangle', i * 0.16)); },
  tick() { tone(0.08, 700, 700, 0.14, 'square'); }
};
