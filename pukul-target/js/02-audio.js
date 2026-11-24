'use strict';
// ======================= AUDIO =======================
let AC = null, master = null, noiseBuf = null;
function initAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.55; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function noise(dur, type, f0, f1, gain, q = 1) { if (!AC || settings.mute) return; const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05); }
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!AC || settings.mute) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
const sfx = {
  pop(c) { const f = 500 + Math.min(c, 12) * 45; tone(0.09, f, f * 1.8, 0.2, 'sine'); noise(0.06, 'bandpass', 2400, 900, 0.18, 2); },
  gold() { [880, 1175, 1568].forEach((f, i) => tone(0.12, f, f * 1.01, 0.18, 'triangle', i * 0.06)); },
  hit2() { tone(0.1, 300, 520, 0.2, 'square'); }, big() { tone(0.14, 400, 800, 0.22, 'triangle'); noise(0.1, 'bandpass', 1800, 700, 0.2, 1.5); },
  heart() { [523, 659, 784].forEach((f, i) => tone(0.14, f, f * 1.01, 0.18, 'triangle', i * 0.08)); },
  bomb() { noise(0.4, 'lowpass', 900, 100, 0.7); tone(0.3, 150, 40, 0.45, 'sawtooth'); },
  miss() { tone(0.25, 330, 150, 0.14, 'triangle'); }, fever() { tone(0.6, 250, 900, 0.2, 'sawtooth'); noise(0.5, 'bandpass', 800, 3500, 0.14); },
  tick() { tone(0.08, 700, 700, 0.14, 'square'); }, over() { [392, 330, 262, 196].forEach((f, i) => tone(0.22, f, f * 0.98, 0.2, 'triangle', i * 0.16)); }
};

// ======================= STATE =======================
let state = 'menu', useCam = false, versus = false, elapsed = 0, best = store.get('best', 0);
let bubbles = [], spawnT = 0, tPlay = 0, hitsTot = 0, missTot = 0, lives = 5, timeLeft = 90, fever = { c: 0, t: 0 }, nextPref = 0, waitT = 0, dieT = 0, flashT = 0;
const mkP = i => ({ i, pts: [], valid: false, seen: 0, miss: 0, cx: SW / 2, cy: SH * 0.45, sww: SH * 0.2, nose: null, score: 0, combo: 0, maxCombo: 0, hits: 0, bones: [], trail: [] });
let PL = [mkP(0)];
const NP = () => versus ? 2 : 1;
const PTXT = ['#ffb35a', '#6fc8ff'], PHEX = [0xffb35a, 0x6fc8ff];
const DIFF = [{ dur: 3.8, iv: 1.3, size: 1.2, minDur: 2.2 }, { dur: 3.1, iv: 1.05, size: 1.0, minDur: 1.8 }, { dur: 2.6, iv: 0.85, size: 0.88, minDur: 1.5 }];
const HR = () => SH * 0.05;     // radius sentuh dasar (px)
