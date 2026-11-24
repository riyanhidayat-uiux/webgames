'use strict';
// ======================= AUDIO =======================
// Efek suara (WebAudio, tanpa berkas): nada naik tiap combo, desing dinding mendekat, kunci pose, pecahan dinding, benturan, detak nyawa terakhir.
let AC = null, master = null, noiseBuf = null;
function initAudio() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.5;
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
      master.connect(comp); comp.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) {
  if (!AC || settings.mute) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, type, f0, f1, gain, q = 1, delay = 0) {
  if (!AC || settings.mute || !noiseBuf) return; const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19];                                   // tangga pentatonik: tiap combo naik satu anak tangga
const stepMul = c => Math.pow(2, PENTA[Math.min(Math.max(1, c) - 1, PENTA.length - 1)] / 12);
const sfx = {
  perfect(c = 1) { const m = stepMul(c); [660, 880, 1100, 1480].forEach((f, i) => tone(0.15, f * m, f * m * 1.01, 0.17, 'triangle', i * 0.065)); for (let i = 0; i < 4; i++) tone(0.07, (2400 + Math.random() * 2600) * m, 1800, 0.045, 'sine', 0.12 + i * 0.045); noise(0.4, 'highpass', 6000, 9500, 0.07, 0.8, 0.05); tone(0.3, 330 * m, 330 * m, 0.08, 'sine', 0.02); },
  good(c = 1) { const m = stepMul(c); tone(0.14, 660 * m, 990 * m, 0.18, 'triangle'); tone(0.16, 990 * m, 1320 * m, 0.16, 'triangle', 0.09); noise(0.2, 'highpass', 5000, 8000, 0.04, 0.8, 0.04); },
  ok(c = 1) { const m = stepMul(c); tone(0.16, 520 * m, 660 * m, 0.16, 'triangle'); },
  // dinding pecah berkeping (lolos): retakan + dentuman + serpihan jatuh
  shatter(big = 0) {
    noise(0.4, 'bandpass', 3800, 900, 0.5 + 0.12 * big, 1.4); noise(0.12, 'highpass', 2500, 7000, 0.3); tone(0.22, 140, 48, 0.4 + 0.1 * big, 'sine');
    for (let i = 0; i < 5; i++) noise(0.05 + Math.random() * 0.05, 'bandpass', 1500 + Math.random() * 2500, 600, 0.22, 3, 0.07 + i * 0.05 + Math.random() * 0.04);
  },
  whoosh() { noise(0.4, 'bandpass', 350, 3200, 0.3, 1.2); },
  // dinding menghantam (gagal): benturan berat + serpihan
  miss() { tone(0.5, 170, 42, 0.55, 'sawtooth'); tone(0.35, 95, 32, 0.6, 'sine'); noise(0.7, 'lowpass', 2600, 110, 0.75); noise(0.25, 'highpass', 2200, 6500, 0.26); for (let i = 0; i < 4; i++) noise(0.06, 'bandpass', 1200 + Math.random() * 2000, 500, 0.2, 3, 0.12 + i * 0.07); tone(0.45, 220, 110, 0.12, 'square', 0.05); },
  // pose terkunci sebelum dinding tiba: 1 = lolos, 2 = sempurna
  lock(level = 1) { tone(0.12, 880, 1320, 0.1, 'sine'); if (level > 1) { tone(0.14, 1320, 1760, 0.1, 'sine', 0.07); tone(0.2, 1760, 2093, 0.07, 'triangle', 0.14); } },
  team() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(0.16, f, f * 1.01, 0.18, 'square', i * 0.06)); noise(0.5, 'highpass', 5000, 9000, 0.08, 0.8, 0.2); },
  tick(n = 3) { if (n <= 0) { [523, 659, 784].forEach((f, i) => tone(0.4, f, f * 1.005, 0.14, 'sawtooth', 0)); tone(0.3, 1047, 1047, 0.12, 'square', 0.02); noise(0.35, 'bandpass', 800, 5000, 0.2, 1); } else tone(0.1, 520 + (3 - n) * 100, 520 + (3 - n) * 100, 0.15, 'square'); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(0.22, f, f * 0.98, 0.2, 'triangle', i * 0.16)); },
  record() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(0.26, f, f * 1.004, 0.16, 'triangle', i * 0.09)); noise(0.8, 'highpass', 6000, 9500, 0.09, 0.8, 0.3); },
  morph() { tone(0.2, 280, 950, 0.13, 'sawtooth'); tone(0.14, 950, 420, 0.1, 'square', 0.12); noise(0.25, 'bandpass', 3000, 6000, 0.16, 3, 0.02); tone(0.1, 1500, 1500, 0.06, 'square', 0.3); },
  chain() { [523, 659, 784, 988, 1175, 1568].forEach((f, i) => tone(0.2, f, f * 1.003, 0.15, 'triangle', i * 0.07)); noise(0.6, 'highpass', 6000, 9500, 0.08, 0.8, 0.25); tone(0.5, 262, 262, 0.1, 'sine', 0.1); },
  power() { [880, 1175, 1568, 2093].forEach((f, i) => tone(0.12, f, f * 1.01, 0.12, 'square', i * 0.05)); tone(0.4, 440, 440, 0.07, 'sine', 0.05); noise(0.3, 'highpass', 7000, 9500, 0.07, 0.8, 0.15); },
  level() { [392, 523, 659, 784].forEach((f, i) => tone(0.18, f, f * 1.005, 0.14, 'triangle', i * 0.08)); noise(0.5, 'bandpass', 600, 5000, 0.12, 1, 0); },
  boss() { tone(0.7, 110, 55, 0.5, 'sawtooth'); tone(0.6, 116, 58, 0.3, 'sawtooth', 0.05); for (let i = 0; i < 3; i++) tone(0.12, 220, 220, 0.12, 'square', 0.15 + i * 0.22); noise(0.8, 'lowpass', 1400, 120, 0.4); },
  bossWin() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(0.22, f, f * 1.003, 0.15, 'triangle', i * 0.07)); noise(0.9, 'highpass', 5000, 9500, 0.1, 0.8, 0.2); tone(0.8, 196, 196, 0.12, 'sine', 0.1); },
  heartbeat() { tone(0.13, 78, 44, 0.5, 'sine'); tone(0.12, 70, 42, 0.38, 'sine', 0.17); },
  warn() { tone(0.08, 1200, 1200, 0.08, 'square'); }
};
// desing dinding mendekat: derau berlanjut yang nadanya & kerasnya naik seiring jarak dinding
const APR = { src: null, f: null, g: null };
function approachSet(prox) {
  if (!AC) return; if (!APR.src) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.3; const g = AC.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); Object.assign(APR, { src: s, f, g }); }
  const t = AC.currentTime, p = Math.max(0, Math.min(1, prox)); APR.g.gain.setTargetAtTime(settings.mute ? 0 : p * p * 0.17, t, 0.06); APR.f.frequency.setTargetAtTime(220 + p * 2300, t, 0.06);
}
let hbT = 0;
function audioFrame(dt) {
  if (!AC) return;
  let prox = 0;
  if (state === 'play') { const w = walls.filter(x => !x.done).sort((a, b) => b.z - a.z)[0]; if (w) prox = Math.pow(Math.max(0, Math.min(1, (w.z + 34) / 34)), 1.7); }
  approachSet(prox);
  if (state === 'play' && !noLives() && !versus && PL[0] && PL[0].lives === 1 && PL[0].alive) { hbT -= dt; if (hbT <= 0) { hbT = 0.85; sfx.heartbeat(); } } else hbT = 0;
  musicFrame(dt);
}
