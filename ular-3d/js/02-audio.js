'use strict';
// ---------- audio ----------
let AC = null, master = null;
function initAudio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.5; master.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  turn() { tone(0.05, 500, 700, 0.05, 'triangle'); },
  eat() { tone(0.1, 500, 900, 0.2, 'square'); tone(0.14, 900, 1400, 0.15, 'triangle', 0.07); },
  gold() { tone(0.12, 700, 1050, 0.18, 'triangle'); tone(0.12, 1050, 1570, 0.18, 'triangle', 0.09); tone(0.2, 1570, 2100, 0.16, 'triangle', 0.18); },
  die() { tone(0.5, 260, 50, 0.35, 'sawtooth'); tone(0.3, 120, 40, 0.4, 'square', 0.05); },
  miss() { tone(0.3, 600, 200, 0.12, 'sine'); }
};
