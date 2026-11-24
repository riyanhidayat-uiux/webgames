'use strict';
// ---------- MUSIK LATAR PROSEDURAL + VARIASI SUARA TEBAS ----------
// Musik dibuat dari WebAudio (tanpa berkas): gaya dojo pentatonik (A minor) — taiko, petikan koto, pad, bass.
// MUS.int (0..1) = tingkat ketegangan: tenang di 0, FEVER = 1. Tempo, lapisan ritme, bass, dan lead ikut naik-turun mulus.
const MUS = { on: false, bus: null, nextT: 0, step: 0, int: 0, tgt: 0, timer: 0 };
const mHz = n => 440 * Math.pow(2, (n - 69) / 12);
const PENT = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];                    // A3 C4 D4 E4 G4 A4 C5 D5 E5 G5
const ROOTS = [33, 29, 31, 28];                                          // A1 F1 G1 E1 (tiap 8 langkah)
const ARP = [0, -1, 2, -1, 4, -1, 2, -1, 3, -1, 1, -1, 4, -1, 6, -1, 5, -1, 4, -1, 2, -1, 3, -1, 1, -1, 0, -1, 2, -1, 4, 5];
const RIFF = [0, 0, 2, 0, 4, 0, 2, 0, 5, 4, 2, 0, 4, 2, 4, 5, 6, 5, 4, 2, 5, 4, 2, 0, 2, 4, 5, 6, 7, 6, 5, 4];
function mTone(t, dur, f0, f1, g, type, cut, att = 0.008) {
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + att); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = gn; if (cut) { const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut; o.connect(f); f.connect(gn); } else o.connect(gn);
  gn.connect(MUS.bus); o.start(t); o.stop(t + dur + 0.05);
}
function mNoise(t, dur, type, f0, f1, g, q = 1) {
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = AC.createGain(); gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(Math.max(0.0002, g), t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(gn); gn.connect(MUS.bus); s.start(t); s.stop(t + dur + 0.05);
}
function mTaiko(t, v) { mTone(t, 0.28, 150, 42, 0.34 * v, 'sine', 0, 0.004); mNoise(t, 0.09, 'lowpass', 1200, 200, 0.16 * v); }
function musicStep(s, t) {
  const I = MUS.int, st = s & 31, root = ROOTS[(s >> 3) & 3];
  // taiko: dasar di awal birama, makin rapat saat tegang
  if (st === 0 || st === 16) mTaiko(t, 0.5 + 0.5 * I);
  else if (st % 8 === 0 && I > 0.2) mTaiko(t, 0.35 + 0.5 * I);
  else if (st % 4 === 0 && I > 0.5) mTaiko(t, 0.3 + 0.4 * I);
  else if (I > 0.8 && (st === 14 || st === 30 || st === 15 || st === 31)) mTaiko(t, 0.3);
  // hi-hat / woodblock
  if (st % 2 === 0 && I > 0.12) mNoise(t, 0.04, 'highpass', 7000, 9000, 0.018 + 0.05 * I, 0.8);
  if (st % 4 === 2 && I > 0.55) mNoise(t, 0.09, 'highpass', 6000, 8500, 0.05 * I, 0.8);
  if (st % 8 === 4 && I < 0.5) mTone(t, 0.05, 1100, 800, 0.03 * (1 - I), 'triangle');
  // petikan koto (tenang) ↔ riff tajam (tegang)
  const ga = 0.075 * Math.max(0, 1 - I * 1.3), gr = 0.07 * Math.max(0, (I - 0.3) / 0.7);
  if (ga > 0.002 && ARP[st] >= 0) { const n = PENT[ARP[st]]; mTone(t, 0.45, mHz(n), mHz(n) * 0.995, ga, 'triangle', 0, 0.004); mTone(t, 0.22, mHz(n + 12), mHz(n + 12), ga * 0.25, 'sine', 0, 0.003); }
  if (gr > 0.002) { const n = PENT[RIFF[st] % PENT.length] + (I > 0.75 && st % 2 ? 12 : 0); mTone(t, 0.16 + 0.05 * (1 - I), mHz(n), mHz(n), gr, 'sawtooth', 1100 + 3200 * I, 0.003); }
  // bass: sustain lembut ↔ denyut saw
  if (st % 8 === 0) mTone(t, 0.9, mHz(root), mHz(root), 0.1 * (1 - 0.5 * I), 'sine', 0, 0.02);
  if (I > 0.3 && st % 2 === 0) { const n = root + (st % 4 === 2 && I > 0.6 ? 12 : 0); mTone(t, 0.12, mHz(n), mHz(n), 0.09 * I, 'sawtooth', 280 + 600 * I, 0.004); }
  // pad
  if (st % 8 === 0) { const g = 0.022 * (1 - 0.5 * I); for (const iv of [12, 19, 24]) mTone(t, 1.4, mHz(root + iv), mHz(root + iv), g, 'triangle', 1800, 0.25); }
  // ketegangan: tritone & sirene pendek
  if (I > 0.7 && st % 8 === 6) mTone(t, 0.22, mHz(root + 18), mHz(root + 18) * 1.02, 0.035 * (I - 0.5), 'sawtooth', 1400);
  if (I > 0.85 && st % 4 === 3) mTone(t, 0.04, 1760, 1760, 0.028, 'square');
}
function musicTick() {
  if (!MUS.on || !AC) return;
  const bpm = 90 + 58 * MUS.int, dur = 60 / bpm / 4;
  if (MUS.nextT < AC.currentTime - 0.1) MUS.nextT = AC.currentTime + 0.05;       // tertinggal (tab di latar) → sinkron ulang
  let n = 0; while (MUS.nextT < AC.currentTime + 0.3 && n++ < 8) { musicStep(MUS.step++, MUS.nextT); MUS.nextT += dur; }
}
function musicStart() {
  if (!AC || MUS.on || settings.music === false || !master) return;
  MUS.bus = AC.createGain(); MUS.bus.gain.setValueAtTime(0.0001, AC.currentTime); MUS.bus.gain.linearRampToValueAtTime(0.75, AC.currentTime + 0.9); MUS.bus.connect(master);
  MUS.on = true; MUS.step = 0; MUS.nextT = AC.currentTime + 0.12; MUS.int = MUS.tgt = 0; MUS.timer = setInterval(musicTick, 60); musicTick();
}
function musicStop() {
  if (!MUS.on) return; MUS.on = false; clearInterval(MUS.timer); const b = MUS.bus; MUS.bus = null;
  try { b.gain.cancelScheduledValues(AC.currentTime); b.gain.setValueAtTime(Math.max(0.0001, b.gain.value), AC.currentTime); b.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.5); setTimeout(() => { try { b.disconnect(); } catch (e) {} }, 800); } catch (e) {}
}
// dipanggil tiap frame: menyalakan/mematikan musik menurut state, dan menentukan tingkat ketegangan
function musicFrame(dt) {
  const want = state === 'play' && settings.music !== false && AC && !settings.mute;
  if (want && !MUS.on) musicStart(); else if (!want && MUS.on) musicStop();
  if (!MUS.on) return;
  let t = 0;
  if (fever[0].t > 0 || fever[1].t > 0) t = 1;
  if (gm !== 'classic' && boss) t = Math.max(t, boss.phase === 1 ? 0.3 : boss.phase === 2 ? 0.58 : 0.85);
  if (!chill && !versus && lives <= 1) t = Math.max(t, 0.42);
  if (gm === 'classic' && settings.timed && !versus && timeLeft <= 15 && timeLeft > 0) t = Math.max(t, 0.5);
  if (freeze[0].t > 0) t = Math.min(t, 0.2);                                     // beku: musik meredam
  MUS.tgt = t; MUS.int += (t - MUS.int) * Math.min(1, dt * (t > MUS.int ? 2.6 : 0.9));
}

// ---------- suara tebas bervariasi menurut jenis buah ----------
const KIND_OF = {};
[['🍉🍊🍋🍑🍍🥭🍇🍓🍒🍈🍅🫐', 'juicy'], ['🍎🍐🍏🥕🥝🍠🧅🍌', 'crunch'], ['🥥', 'hollow'], ['🥦🫑🌶️🍆🍄🌽🥑', 'leaf']].forEach(([s, k]) => { for (const ch of Array.from(s)) KIND_OF[ch] = k; });
const PENT_UP = [0, 2, 4, 7, 9, 12, 14, 16, 19];                          // naik tangga pentatonik tiap buah beruntun
function noiseD(dur, type, f0, f1, gain, q = 1, delay = 0) {
  if (!AC || settings.mute) return;
  const t = AC.currentTime + delay, s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
}
Object.assign(sfx, {
  swoosh(sp = 1) { const v = 0.85 + Math.random() * 0.4, g = Math.min(0.26, 0.09 + 0.07 * sp); noise(0.15 + 0.05 * Math.random(), 'bandpass', 420 * v, 2600 * v * (0.8 + sp * 0.3), g, 1.2); },
  // f: buah yang ditebas, combo: jumlah tebasan beruntun (nada lonceng naik)
  slice(f, combo = 1) {
    if (!AC || settings.mute) return;
    const v = 0.9 + Math.random() * 0.22, up = Math.pow(2, PENT_UP[Math.min(Math.max(1, combo) - 1, PENT_UP.length - 1)] / 12);
    const t = f && f.t, e = t && t.e, kind = f && f.star ? 'star' : f && f.kind === 'ice' ? 'ice' : f && f.kind === 'heart' ? 'heart' : t && t.sq ? 'plush' : (KIND_OF[(e || '').replace(/\uFE0F/g, '')] || 'juicy');
    noise(0.07, 'highpass', 3200 * v, 9500 * v, 0.3, 0.8);                                   // desing bilah (semua jenis)
    if (kind === 'juicy') { noise(0.18, 'bandpass', 1100 * v, 320, 0.36, 2.2); tone(0.13, 280 * v, 90, 0.3); noiseD(0.05, 'bandpass', 2600, 1500, 0.1, 3, 0.05 + Math.random() * 0.05); tone(0.05, 1800 * v, 2800 * v, 0.035, 'sine', 0.06); tone(0.05, 2400 * v, 3300 * v, 0.03, 'sine', 0.11); }
    else if (kind === 'crunch') { noise(0.05, 'bandpass', 2000 * v, 1100, 0.5, 3); noiseD(0.06, 'bandpass', 1500 * v, 800, 0.42, 3, 0.035); noiseD(0.05, 'highpass', 3500, 1800, 0.18, 1, 0.07); tone(0.1, 230 * v, 95, 0.28); }
    else if (kind === 'hollow') { tone(0.14, 330 * v, 175, 0.42, 'triangle'); tone(0.1, 660 * v, 310, 0.16, 'sine'); noise(0.05, 'bandpass', 3000, 1600, 0.25, 4); tone(0.35, 150 * v, 120, 0.08, 'sine', 0.04); }
    else if (kind === 'leaf') { noise(0.16, 'bandpass', 4800 * v, 2400, 0.3, 1.6); noiseD(0.1, 'highpass', 5500, 3000, 0.15, 1, 0.05); tone(0.09, 190 * v, 80, 0.22); }
    else if (kind === 'plush') { tone(0.12, 200 * v, 75, 0.34); noise(0.1, 'lowpass', 900, 250, 0.3); }
    else if (kind === 'ice') { for (let i = 0; i < 4; i++) tone(0.2 + 0.1 * Math.random(), (2400 + Math.random() * 2400) * v, 1200 + Math.random() * 800, 0.07, 'triangle', i * 0.025); noise(0.3, 'highpass', 6000, 9500, 0.2); tone(0.22, 160, 70, 0.28); }
    else if (kind === 'heart') { tone(0.14, 200, 80, 0.3); tone(0.2, 1047 * up, 1047 * up, 0.08, 'triangle', 0.02); tone(0.25, 1568 * up, 1568 * up, 0.06, 'sine', 0.08); }
    else if (kind === 'star') { tone(0.1, 190, 70, 0.3); for (const [fq, d] of [[1568, 0], [2093, 0.06], [2637, 0.12]]) tone(0.4, fq * up, fq * up, 0.07, 'triangle', d); noise(0.2, 'highpass', 7000, 9500, 0.1); }
    if (combo >= 2 && kind !== 'star' && kind !== 'heart') { const q = 880 * up; tone(0.26, q, q * 0.998, 0.06, 'triangle', 0.01); tone(0.18, q * 2, q * 2, 0.02, 'sine', 0.01); }    // nada naik saat combo
  },
  bossHit(dmg = 1, ph = 1) { const v = 0.92 + Math.random() * 0.16; tone(0.2, 150 * v, 55, 0.5, 'square'); noise(0.08, 'highpass', 3000, 9000, 0.35); tone(0.45, (900 + ph * 120) * v, 700 * v, 0.07, 'triangle', 0.01); if (dmg > 1) tone(0.3, 1400 * v, 900, 0.07, 'sawtooth', 0.02); noise(0.12, 'lowpass', 900, 150, 0.4); }
});
