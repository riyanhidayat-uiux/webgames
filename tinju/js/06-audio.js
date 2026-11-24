'use strict';
// ======================= AUDIO =======================
let AC = null, master = null, noiseBuf = null;
function initAudio() { try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.6; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function noise(dur, type, f0, f1, gain, q = 1) { if (!AC || settings.mute) return; const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05); }
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!AC || settings.mute) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
const sfx = {
  swish() { noise(0.12, 'bandpass', 600, 2000, 0.2, 1.2); }, hit(p = 1) { noise(0.12, 'lowpass', 1500, 150, 0.7 * p); tone(0.12, 180, 55, 0.5 * p, 'square'); }, big() { noise(0.25, 'lowpass', 2200, 100, 0.9); tone(0.25, 120, 40, 0.7, 'sawtooth'); },
  block() { noise(0.1, 'bandpass', 900, 400, 0.3, 2); tone(0.08, 260, 160, 0.2, 'triangle'); }, hurt() { noise(0.25, 'lowpass', 1200, 100, 0.8); tone(0.3, 150, 40, 0.6, 'sawtooth'); },
  dodge() { noise(0.18, 'bandpass', 1500, 500, 0.22, 1.5); tone(0.12, 700, 1100, 0.14, 'triangle'); }, bell() { [1320, 1320, 1320].forEach((f, i) => tone(0.5, f, f * 0.99, 0.25, 'sine', i * 0.25)); },
  ko() { tone(0.8, 300, 40, 0.5, 'sawtooth'); noise(0.5, 'lowpass', 800, 80, 0.8); }, win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(0.2, f, f * 1.01, 0.22, 'triangle', i * 0.12)); }, tick() { tone(0.08, 700, 700, 0.14, 'square'); }, warn() { tone(0.12, 900, 900, 0.2, 'square'); tone(0.12, 900, 900, 0.2, 'square', 0.15); }
};

// ======================= STATE =======================
let state = 'menu', useCam = false, elapsed = 0, shake = 0, slow = 0, best = store.get('best', 0), hitStop = 0;
const P = { hp: 100, stam: 100, sup: 0, guard: false, lean: 0, duck: false, combo: 0, comboT: 0, score: 0, dealt: 0, perfectD: 0, hands: 0 };
let fi = 0, E = null, roundT = 0, dmgFloat = [];
const newEnemy = idx => { const F = FIGHTERS[Math.min(idx, FIGHTERS.length - 1)], dm = DIFFM[settings.diff]; skinBoxer(EN, F); return { F, idx, hp: F.hp, maxHp: F.hp, state: 'idle', t: 1.0, atk: null, guardHits: 0, hitT: 0, dmgM: F.dmg * dm.dmg, windM: dm.wind, slip: 0, koT: 0 }; };

// ---------- serangan balik: gerakan masukan pemain ----------
const flags = { guard: false, leanL: false, leanR: false, duck: false };     // dari keyboard / tombol layar
const camState = { guard: false, lean: 0, duck: false };                      // dari kamera
const camStates = [camState, { guard: false, lean: 0, duck: false }];
function updateDefense() {
  const g = useCam ? camState.guard : flags.guard, ln = useCam ? camState.lean : (flags.leanL ? -1 : flags.leanR ? 1 : 0), dk = useCam ? camState.duck : flags.duck;
  P.guard = g; P.lean = ln; P.duck = dk;
}
