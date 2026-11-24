'use strict';
// ======================= MUSIK LATAR (prosedural, gaya synthwave) =======================
// MUS.int (0..1) naik seiring jumlah dinding, combo panjang, dan nyawa tinggal satu: tempo, taiko/kick, bass, arpeggio, dan lead ikut menegang.
const MUS = { on: false, bus: null, nextT: 0, step: 0, int: 0, tgt: 0, timer: 0 };
const mHz = n => 440 * Math.pow(2, (n - 69) / 12);
const ROOTS = [33, 29, 36, 31];                                   // A1 F1 C2 G1 (tiap 8 langkah)
const CHORD = [[0, 3, 7, 12, 15, 19, 24, 19], [0, 4, 7, 12, 16, 19, 24, 19], [0, 4, 7, 12, 16, 19, 24, 16], [0, 4, 7, 12, 14, 19, 23, 19]];
const LEAD = [12, -1, 15, -1, 19, -1, 15, 12, 17, -1, 15, -1, 12, -1, 10, 12, 12, -1, 15, 19, 24, -1, 19, -1, 22, 19, 17, -1, 15, -1, 12, -1];
function mTone(t, dur, f0, f1, g, type, cut, att = 0.008) {
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + att); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  if (cut) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; o.connect(f); f.connect(gn); } else o.connect(gn);
  gn.connect(MUS.bus); o.start(t); o.stop(t + dur + 0.05);
}
function mNoise(t, dur, type, f0, f1, g, q = 1) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(gn); gn.connect(MUS.bus); s.start(t); s.stop(t + dur + 0.05);
}
function musicStep(s, t) {
  const I = MUS.int, st = s & 31, bar = (s >> 3) & 3, root = ROOTS[bar];
  if (st % 8 === 0 || (I > 0.15 && st % 4 === 0)) { const v = st % 8 === 0 ? 1 : 0.7; mTone(t, 0.2, 140, 42, (0.26 + 0.12 * I) * v, 'sine', 0, 0.004); mNoise(t, 0.04, 'lowpass', 900, 200, 0.1 * v); }   // kick
  if (I > 0.3 && st % 8 === 4) { mNoise(t, 0.13, 'bandpass', 2200, 1200, 0.1 + 0.06 * I, 1.5); mTone(t, 0.1, 220, 120, 0.07, 'triangle'); }                                                  // snare
  if (I > 0.2 && st % 2 === 1) mNoise(t, 0.035, 'highpass', 7500, 9500, 0.012 + 0.035 * I, 0.8);                                                                                              // hat offbeat
  if (I > 0.55 && st % 2 === 0) mNoise(t, 0.03, 'highpass', 8000, 9500, 0.02 * I, 0.8);
  if (st % 2 === 0 || I > 0.6) { const oct = st % 4 === 2 ? 12 : 0; mTone(t, 0.16, mHz(root + oct), mHz(root + oct), 0.07 + 0.06 * I, 'sawtooth', 220 + 700 * I, 0.004); }                             // bass
  if (st % 8 === 0) for (const iv of CHORD[bar].slice(0, 3)) mTone(t, 1.5, mHz(root + 24 + iv), mHz(root + 24 + iv), 0.02 * (1 - 0.4 * I), 'triangle', 1800, 0.2);                                // pad
  if (I > 0.1) { const n = root + 24 + CHORD[bar][st & 7]; mTone(t, 0.18, mHz(n), mHz(n), 0.03 + 0.03 * Math.min(1, I * 1.4), 'triangle', 0, 0.004); }                                                // arpeggio
  if (I > 0.6 && LEAD[st] >= 0) { const n = 57 + LEAD[st]; mTone(t, 0.2, mHz(n), mHz(n) * 1.003, 0.04 * (I - 0.35), 'sawtooth', 2600, 0.005); }                                                      // lead
  if (I > 0.85 && st % 4 === 3) mTone(t, 0.04, 1760, 1760, 0.022, 'square');                                                                                                                       // sirene tipis
}
function musicTick() {
  if (!MUS.on || !AC) return; const bpm = 100 + 34 * MUS.int + (MUS.bpmAdd || 0), dur = 60 / bpm / 4;
  if (MUS.nextT < AC.currentTime - 0.1) MUS.nextT = AC.currentTime + 0.05;
  let n = 0; while (MUS.nextT < AC.currentTime + 0.3 && n++ < 8) { musicStep(MUS.step++, MUS.nextT); MUS.nextT += dur; }
}
function musicStart() {
  if (!AC || MUS.on || settings.music === false || !master) return;
  MUS.bus = AC.createGain(); MUS.bus.gain.setValueAtTime(0.0001, AC.currentTime); MUS.bus.gain.linearRampToValueAtTime(0.75, AC.currentTime + 0.8); MUS.bus.connect(master);
  MUS.on = true; MUS.step = 0; MUS.nextT = AC.currentTime + 0.1; MUS.int = MUS.tgt = 0; MUS.timer = setInterval(musicTick, 60); musicTick();
}
function musicStop() {
  if (!MUS.on) return; MUS.on = false; clearInterval(MUS.timer); const b = MUS.bus; MUS.bus = null;
  try { b.gain.cancelScheduledValues(AC.currentTime); b.gain.setValueAtTime(Math.max(0.0001, b.gain.value), AC.currentTime); b.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.5); setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 800); } catch (e) {}
}
function musicFrame(dt) {
  const want = (state === 'play' || state === 'count') && settings.music !== false && AC && !settings.mute;
  if (want && !MUS.on) musicStart(); else if (!want && MUS.on) musicStop();
  if (!MUS.on) return;
  let t = Math.min(0.7, wallNo / 32);                                          // makin lama makin menegang
  const cb = Math.max(...PL.map(p => p.combo)); if (cb >= 3) t += 0.12 + 0.04 * Math.min(4, cb - 3);
  if (!noLives() && PL.some(p => p.alive && p.lives === 1)) t += 0.18;
  if (practice) t = 0.18;
  MUS.tgt = Math.min(1, t); MUS.int += (MUS.tgt - MUS.int) * Math.min(1, dt * (MUS.tgt > MUS.int ? 1.6 : 0.7));
}
