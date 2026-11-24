'use strict';
// ======================= AUDIO SINTETIS =======================
let AC = null, master = null, noiseBuf = null, eng = null;
function initAudio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = settings.mute ? 0 : 0.55; master.connect(AC.destination); noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) { AC = null; }
}
const on = () => AC && !settings.mute;
function tone(dur, f0, f1, gain, type = 'sine', delay = 0) { if (!on()) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }
function noise(dur, type, f0, gain, f1) { if (!on()) return; const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = AC.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
function startEngine() {
  if (!AC || eng) return;
  const o = AC.createOscillator(), o2 = AC.createOscillator(); const PF = (typeof ENG_PROFILES !== 'undefined' && ENG_PROFILES[settings.model | 0]) || { t1: 'sawtooth', t2: 'square', fm: 1, cm: 1, gm: 1, knock: 0, pop: 0 }; o.type = PF.t1; o2.type = PF.t2; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = AC.createGain(); g.gain.value = 0; o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start();
  const w = AC.createBufferSource(); w.buffer = noiseBuf; w.loop = true; const wf = AC.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 800; wf.Q.value = 0.6; const wg = AC.createGain(); wg.gain.value = 0; w.connect(wf); wf.connect(wg); wg.connect(master); w.start();
  const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const sf = AC.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 2600; sf.Q.value = 3; const sg = AC.createGain(); sg.gain.value = 0; s.connect(sf); sf.connect(sg); sg.connect(master); s.start();
  const r = AC.createBufferSource(); r.buffer = noiseBuf; r.loop = true; const rf = AC.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 170; const rg = AC.createGain(); rg.gain.value = 0; r.connect(rf); rf.connect(rg); rg.connect(master); r.start();   // deru angin rendah (makin kencang makin dalam)
  const q = AC.createBufferSource(); q.buffer = noiseBuf; q.loop = true; const qf = AC.createBiquadFilter(); qf.type = 'bandpass'; qf.frequency.value = 2400; qf.Q.value = 9; const qg = AC.createGain(); qg.gain.value = 0; q.connect(qf); qf.connect(qg); qg.connect(master); q.start();   // ban berdecit saat rem keras
  let kn = null; if (PF.knock) { kn = AC.createOscillator(); const kg = AC.createGain(); kn.frequency.value = PF.knock; kg.gain.value = 0.022; kn.connect(kg); kg.connect(g.gain); kn.start(); }   // derak mesin diesel (pickup)
  eng = { o, o2, f, g, w, wf, wg, s, sg, sf, r, rg, q, qf, qg, prof: PF, kn, lastThr: 0 };
}
function engineSet(v, thr, lat, brk) {   // nada mesin naik-turun mengikuti "gigi"
  if (!eng) return; const t = AC.currentTime, gear = Math.min(5, Math.floor(v / 11)), fr = (v % 11) / 11, f = (52 + fr * 105 + gear * 9) * (eng.prof ? eng.prof.fm : 1), PF = eng.prof || { cm: 1, gm: 1, pop: 0 };
  eng.o.frequency.setTargetAtTime(f, t, 0.05); eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05); eng.f.frequency.setTargetAtTime((260 + v * 16 + thr * 120) * PF.cm, t, 0.08);
  eng.g.gain.setTargetAtTime(settings.mute ? 0 : (0.045 + clamp(thr, 0, 1) * 0.035 + v / 60 * 0.03) * PF.gm, t, 0.08);
  if (PF.pop && eng.lastThr > 0.5 && thr < 0.1 && v > 15) { for (let k = 0; k < 3; k++) setTimeout(() => noise(0.05, 'bandpass', 700 + k * 200, 0.16, 300), 60 + k * 90 + Math.random() * 40); }   // letupan knalpot coupe saat gas dilepas
  eng.lastThr = thr;
  eng.wg.gain.setTargetAtTime(settings.mute ? 0 : clamp(v / 60, 0, 1) * 0.1, t, 0.1); eng.wf.frequency.setTargetAtTime(500 + v * 22, t, 0.1);
  eng.sg.gain.setTargetAtTime(settings.mute ? 0 : (Math.abs(lat) > 6.5 && v > 24 ? 0.035 : 0), t, 0.08);
  eng.rg.gain.setTargetAtTime(settings.mute ? 0 : Math.pow(clamp(v / 60, 0, 1), 2) * 0.17, t, 0.15);
  const wet = typeof wxGrip === 'function' ? 1 - wxGrip() : 0, sq = brk && v > 15 ? clamp((v - 15) / 30, 0, 1) * (0.05 + wet * 0.12) : 0;      // jalan basah: decit lebih mudah terdengar
  eng.qg.gain.setTargetAtTime(settings.mute ? 0 : sq, t, 0.04); eng.qf.frequency.setTargetAtTime(2500 + v * 16, t, 0.1);
}
function stopEngine() { if (!eng) return; const e = eng; eng = null; try { const t = AC.currentTime; e.g.gain.setTargetAtTime(0, t, 0.05); e.wg.gain.setTargetAtTime(0, t, 0.05); e.sg.gain.setTargetAtTime(0, t, 0.05); e.rg.gain.setTargetAtTime(0, t, 0.05); e.qg.gain.setTargetAtTime(0, t, 0.05); setTimeout(() => { try { e.o.stop(); e.o2.stop(); e.w.stop(); e.s.stop(); e.r.stop(); e.q.stop(); if (e.kn) e.kn.stop(); } catch (x) {} }, 400); } catch (x) {} }
const sfx = {
  crash() { noise(0.55, 'lowpass', 900, 0.5, 120); tone(0.4, 150, 40, 0.4, 'triangle'); noise(0.25, 'bandpass', 2200, 0.25); },
  horn() { tone(0.5, 420, 418, 0.18, 'square'); tone(0.5, 530, 528, 0.14, 'square'); },
  near() { noise(0.35, 'bandpass', 600, 0.22, 2400); },
  tick() { tone(0.08, 800, 800, 0.12, 'square'); }, go() { [660, 880, 1320].forEach((f, i) => tone(0.15, f, f * 1.01, 0.18, 'triangle', i * 0.08)); },
  done() { [523, 659, 784, 1047].forEach((f, i) => tone(0.25, f, f * 1.01, 0.2, 'triangle', i * 0.12)); }
};

// ---- suara berposisi (pan stereo) & klakson bervariasi ----
const stereo = pan => { if (!AC || !AC.createStereoPanner) return master; const p = AC.createStereoPanner(); p.pan.value = clamp(pan || 0, -1, 1); p.connect(master); return p; };
function toneP(dur, f0, f1, gain, type, delay, pan) { if (!on()) return; const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(stereo(pan)); o.start(t); o.stop(t + dur + 0.05); }
function noiseP(dur, type, f0, f1, gain, pan, q) { if (!on()) return; const t = AC.currentTime, s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q || 1; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(stereo(pan)); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); }
const HORNS = [
  { n: 'Standar', play() { tone(0.5, 420, 418, 0.18, 'square'); tone(0.5, 530, 528, 0.14, 'square'); } },
  { n: 'Truk', play() { tone(0.95, 165, 163, 0.2, 'sawtooth'); tone(0.95, 208, 206, 0.16, 'sawtooth'); noise(0.9, 'lowpass', 500, 0.05, 200); } },
  { n: 'Melodi', play() { [[523, 0], [659, 0.14], [784, 0.28], [1047, 0.45]].forEach(([f, d]) => tone(0.2, f, f * 1.01, 0.16, 'square', d)); } }
];
Object.assign(sfx, {
  horn() { (HORNS[settings.horn | 0] || HORNS[0]).play(); },
  hornFar(pan, k) { const f = 330 + (Math.abs(k | 0) % 5) * 38; toneP(0.34, f, f * 0.995, 0.055, 'square', 0, pan); toneP(0.34, f * 1.26, f * 1.255, 0.04, 'square', 0, pan); },   // klakson mobil lain (lebih pelan, dari arah mobilnya)
  pass(pan, k) { noiseP(0.55, 'bandpass', 1500, 420, 0.17 * k, pan, 1.2); },                                                                       // mobil melintas (efek Doppler sederhana)
  thump() { noise(0.3, 'lowpass', 320, 0.55, 60); tone(0.25, 90, 38, 0.35, 'sine'); },
  warn() { [0, 0.2].forEach(d => tone(0.14, 880, 880, 0.14, 'square', d)); },
  coin() { tone(0.1, 988, 988, 0.14, 'square'); tone(0.2, 1319, 1319, 0.14, 'square', 0.09); },
  buy() { [523, 659, 784, 1047].forEach((f, i) => tone(0.16, f, f * 1.005, 0.15, 'triangle', i * 0.07)); }
});
// ---- sirene ambulans (wail) / polisi (yelp), volume & pan mengikuti posisi kendaraan ----
let siren = null;
function sirenStart(police) {
  if (!AC || siren) return;
  const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = police ? 780 : 860;
  const lfo = AC.createOscillator(); lfo.type = police ? 'square' : 'sine'; lfo.frequency.value = police ? 1.7 : 0.7; const lg = AC.createGain(); lg.gain.value = police ? 160 : 240; lfo.connect(lg); lg.connect(o.frequency);
  const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400; const g = AC.createGain(), pn = AC.createStereoPanner ? AC.createStereoPanner() : null; g.gain.value = 0;
  o.connect(f); f.connect(g); if (pn) { g.connect(pn); pn.connect(master); } else g.connect(master); o.start(); lfo.start(); siren = { o, lfo, g, pn };
}
function sirenSet(dist, relx, closing) {
  if (!siren) return; const t = AC.currentTime; siren.g.gain.setTargetAtTime(settings.mute ? 0 : Math.pow(clamp(1 - dist / 150, 0, 1), 1.4) * 0.16, t, 0.06);
  if (siren.pn) siren.pn.pan.setTargetAtTime(clamp(relx / 6, -1, 1), t, 0.06); siren.o.detune.setTargetAtTime(closing > 0 ? 45 : -60, t, 0.15);
}
function sirenMute() { if (siren) siren.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); }
function sirenStop() { if (!siren) return; const s = siren; siren = null; try { s.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => { try { s.o.stop(); s.lfo.stop(); } catch (e) {} }, 300); } catch (e) {} }
