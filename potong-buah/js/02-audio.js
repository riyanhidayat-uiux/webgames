'use strict';
// ---------- audio ----------
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.5;
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;   // cegah pecah saat musik + banyak efek bertumpuk
      master.connect(comp); comp.connect(AC.destination);
      const len = AC.sampleRate;
      noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function noise(dur, type, f0, f1, gain, q = 1) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime;
  const s = AC.createBufferSource(); s.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  swoosh() { noise(0.18, 'bandpass', 500, 3200, 0.45, 1.3); },
  splat() {
    const v = 0.92 + Math.random() * 0.16;
    noise(0.09, 'highpass', 2500 * v, 9000 * v, 0.5, 0.8);          // desing tajam saat bilah lewat
    noise(0.45, 'bandpass', 7000 * v, 2400, 0.3, 3);                // ekor "shiiing" panjang ala katana
    tone(0.55, 3400 * v, 2600 * v, 0.05, 'triangle');               // dering logam panjang
    tone(0.4, 5100 * v, 4300 * v, 0.02, 'sine', 0.02);              // harmonik logam lebih tinggi
    tone(0.14, 200, 55, 0.4);                                       // thump kuat
    noise(0.13, 'lowpass', 1500, 200, 0.35);                        // hantaman basah
  },
  toss() { tone(0.22, 180, 380, 0.06, 'sine'); },
  bomb() { noise(1.1, 'lowpass', 1600, 50, 1.0); tone(0.9, 110, 28, 0.8, 'triangle'); },
  miss() { tone(0.28, 320, 110, 0.22, 'square'); },
  squeak() { const v = 0.85 + Math.random() * 0.5; tone(0.1, 700 * v, 1500 * v, 0.12, 'sine'); tone(0.14, 1500 * v, 600 * v, 0.08, 'sine', 0.08); },
  ice() { tone(0.45, 1800, 500, 0.16, 'sine'); tone(0.3, 2600, 900, 0.08, 'triangle', 0.05); noise(0.3, 'highpass', 5000, 9000, 0.08); },
  heal() { tone(0.14, 520, 780, 0.2, 'triangle'); tone(0.18, 780, 1170, 0.2, 'triangle', 0.1); tone(0.26, 1170, 1560, 0.18, 'triangle', 0.2); },
  fever() { tone(0.7, 220, 880, 0.2, 'sawtooth'); tone(0.5, 440, 1320, 0.14, 'square', 0.1); noise(0.6, 'bandpass', 800, 3500, 0.15); },
  combo() { tone(0.12, 660, 990, 0.18, 'triangle'); tone(0.16, 990, 1480, 0.18, 'triangle', 0.09); },
  fuse() { noise(0.05, 'highpass', 4000, 6000, 0.05); }
};
const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
