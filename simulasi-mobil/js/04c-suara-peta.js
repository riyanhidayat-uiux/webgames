'use strict';
sfx.moo = function (kind) { if (!on()) return; const big = kind === 'kerbau', f = big ? 105 : kind === 'babi' ? 190 : 330; toneP(big ? 1.2 : 0.6, f, big ? f * 0.82 : f * 1.15, big ? 0.16 : 0.1, 'sawtooth', 0, 0); toneP(big ? 1.2 : 0.6, f * 2.01, f * 1.7, 0.04, 'triangle', 0, 0); };
sfx.splash = function () { if (!on()) return; noiseP(0.7, 'bandpass', 2600, 600, 0.22, 0, 0.7); noiseP(1.1, 'lowpass', 500, 120, 0.2, 0, 0.5); };
sfx.rockfall = function () { if (!on()) return; noiseP(1.2, 'lowpass', 300, 80, 0.3, -0.4, 0.6); };

// ======================= SUARA LATAR PER PETA =======================
// Lapisan kontinu (angin, ombak, jangkrik/tonggeret) + kicau acak (burung, camar). Level menurut peta; jangkrik lebih keras malam hari; badai debu/kabut menaikkan angin.
const AMB = { n: null, map: '', t: 0, next: 0, wave: 0 };
const AMBLV = { tol: { wind: 0.012 }, salju: { wind: 0.075 }, hutan: { wind: 0.012, cricket: 1.2, birds: 1.5 }, neon: { wind: 0.008 }, desa: { wind: 0.014, cricket: 0.5, birds: 1 }, gunung: { wind: 0.06, birds: 0.35 }, pantai: { wind: 0.02, wave: 0.07, gulls: 1 }, batu: { wind: 0.05 } };
function ambBuild() {
  const mkN = (type, f, q) => { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.7; const g = AC.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(master); s.start(); return { s, fl, g }; };
  const wind = mkN('bandpass', 500, 0.5), wave = mkN('lowpass', 420, 0.4);
  const co = AC.createOscillator(); co.type = 'sine'; co.frequency.value = 4300; const am = AC.createGain(); am.gain.value = 0; const lfo = AC.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 22; const lg = AC.createGain(); lg.gain.value = 0.5; const off = AC.createConstantSource ? AC.createConstantSource() : null;
  lfo.connect(lg); lg.connect(am.gain); co.connect(am); const cg = AC.createGain(); cg.gain.value = 0; am.connect(cg); cg.connect(master); co.start(); lfo.start(); if (off) { off.offset.value = 0.5; off.connect(am.gain); off.start(); }
  AMB.n = { wind, wave, cg };
}
function ambFrame(dt, active) {
  if (!AC) return; if (!AMB.n) ambBuild(); const N = AMB.n, now = AC.currentTime, L = AMBLV[MAP.id] || {}, night = envNow().night > 0.5 ? 1 : 0, act = active && !settings.mute, wx = MEV.gust;
  AMB.t += dt; const gust = 0.6 + 0.4 * Math.sin(AMB.t * 0.37) * Math.sin(AMB.t * 0.91 + 1);
  const wl = act ? ((L.wind || 0) * (0.7 + 0.6 * gust) + wx * 0.07) : 0;
  N.wind.g.gain.setTargetAtTime(wl, now, 0.5); N.wind.fl.frequency.setTargetAtTime(MAP.id === 'batu' || MEV.fogKind === 'debu' ? 900 : MAP.id === 'gunung' || MAP.id === 'salju' ? 420 : 600, now, 0.5);
  AMB.wave = (AMB.wave || 0) + dt * 0.55; const sw = Math.pow(0.5 + 0.5 * Math.sin(AMB.wave), 1.6);   // ombak datang-pergi ±11 dtk
  N.wave.g.gain.setTargetAtTime(act ? (L.wave || 0) * (0.35 + 0.9 * sw) : 0, now, 0.3); N.wave.fl.frequency.setTargetAtTime(260 + 700 * sw, now, 0.3);
  N.cg.gain.setTargetAtTime(act && L.cricket ? L.cricket * (night ? 0.07 : 0.012) : 0, now, 0.8);
  AMB.next -= dt;
  if (act && AMB.next <= 0) {
    AMB.next = rr(3, 9);
    if (L.birds && !night && Math.random() < L.birds) { const f = rr(2200, 3600), pan = rr(-0.7, 0.7); for (let i = 0; i < 2 + ((Math.random() * 3) | 0); i++) toneP(0.09, f * (1 + i * 0.06), f * (1.25 + i * 0.05), 0.03, 'sine', i * 0.13, pan); }
    if (L.gulls && !night && Math.random() < 0.8) { const pan = rr(-0.8, 0.8); toneP(0.5, 1500, 1050, 0.04, 'sawtooth', 0, pan); toneP(0.4, 1750, 1200, 0.03, 'sawtooth', 0.35, pan); }
  }
}
