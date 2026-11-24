'use strict';
// ======================= SUARA KHAS PER KENDARAAN =======================
// 1) Mesin mobilmu punya karakter per model (sedan, hatchback, SUV, MPV, coupe, pickup diesel) — dipakai oleh startEngine/engineSet di 04-audio.js.
// 2) Mesin lalu lintas di sekitarmu (maks. 4 suara serentak, berposisi: volume, pan stereo, nada naik-turun mengikuti kecepatan + efek Doppler saat mendekat/menjauh).
//    Tiap jenis punya karakter: sedan/hatch berdengung, SUV berat, coupe serak, pickup/angkot diesel berderak, truk & bus bergemuruh dalam, motor melengking (matic / bebek berdetak / sport).
// 3) Klakson khas: truk = klakson udara, bus = "telolet", angkot = tin-tin pendek, motor = tiiit tipis, taksi/mobil = klakson biasa. Pengemudi lain kadang membalas klaksonmu.
// 4) Suara lain: desis rem angin (truk/bus mengerem), lewatnya truk/bus (gemuruh angin) vs motor (nada turun cepat), klik lampu sein (pindah jalur & hazard), notifikasi ojol.
const ENG_PROFILES = [
  { t1: 'sawtooth', t2: 'square', fm: 1, cm: 1, gm: 1, knock: 0, pop: 0 },          // sedan
  { t1: 'sawtooth', t2: 'square', fm: 1.16, cm: 1.2, gm: 1, knock: 0, pop: 0 },     // hatchback: berdengung
  { t1: 'sawtooth', t2: 'sawtooth', fm: 0.84, cm: 0.85, gm: 1.12, knock: 0, pop: 0 }, // SUV: berat
  { t1: 'triangle', t2: 'square', fm: 0.92, cm: 0.7, gm: 0.85, knock: 0, pop: 0 },  // MPV: halus
  { t1: 'sawtooth', t2: 'sawtooth', fm: 1.32, cm: 1.7, gm: 1.15, knock: 0, pop: 1 }, // coupe: serak + letupan knalpot
  { t1: 'square', t2: 'square', fm: 0.72, cm: 0.8, gm: 1.15, knock: 13, pop: 0 }    // pickup diesel: berderak
];
const VPROF = {
  sedan: { t1: 'sawtooth', t2: 'square', f0: 70, f1: 60, cut: 380, g: 0.05, nz: 0.012, range: 52 },
  hatch: { t1: 'sawtooth', t2: 'square', f0: 88, f1: 72, cut: 520, g: 0.048, nz: 0.012, range: 50 },
  suv: { t1: 'sawtooth', t2: 'sawtooth', f0: 58, f1: 48, cut: 330, g: 0.058, nz: 0.014, range: 54 },
  mpv: { t1: 'triangle', t2: 'square', f0: 64, f1: 50, cut: 300, g: 0.045, nz: 0.01, range: 50 },
  coupe: { t1: 'sawtooth', t2: 'sawtooth', f0: 96, f1: 92, cut: 950, g: 0.058, nz: 0.03, range: 56 },
  taxi: { t1: 'sawtooth', t2: 'square', f0: 68, f1: 58, cut: 360, g: 0.05, nz: 0.012, range: 52 },
  pickup: { t1: 'square', t2: 'square', f0: 44, f1: 40, cut: 300, g: 0.065, knock: 12, kd: 0.55, nz: 0.018, range: 56 },
  angkot: { t1: 'square', t2: 'sawtooth', f0: 52, f1: 44, cut: 430, g: 0.065, knock: 15, kd: 0.5, nz: 0.022, range: 54 },
  minibus: { t1: 'square', t2: 'sawtooth', f0: 46, f1: 40, cut: 380, g: 0.07, knock: 13, kd: 0.5, nz: 0.02, range: 60 },
  truck: { t1: 'sawtooth', t2: 'square', f0: 34, f1: 30, cut: 260, g: 0.1, knock: 9, kd: 0.45, nz: 0.034, range: 82 },
  truckm: { t1: 'sawtooth', t2: 'square', f0: 40, f1: 34, cut: 290, g: 0.085, knock: 11, kd: 0.45, nz: 0.028, range: 72 },
  bus: { t1: 'sawtooth', t2: 'square', f0: 38, f1: 32, cut: 280, g: 0.095, knock: 8, kd: 0.4, nz: 0.03, range: 82 },
  busdd: { t1: 'sawtooth', t2: 'square', f0: 33, f1: 28, cut: 250, g: 0.105, knock: 7, kd: 0.4, nz: 0.034, range: 86 },
  motor0: { t1: 'sawtooth', t2: 'square', f0: 190, f1: 170, cut: 1700, g: 0.034, nz: 0.02, r2: 0.5, sub: 0.4, range: 40 },                       // matic: berdengung CVT
  motor1: { t1: 'sawtooth', t2: 'square', f0: 105, f1: 125, cut: 950, g: 0.044, knock: 16, kd: 0.6, nz: 0.015, r2: 0.5, sub: 0.5, range: 42 },   // bebek: berdetak
  motor2: { t1: 'sawtooth', t2: 'sawtooth', f0: 240, f1: 310, cut: 2700, g: 0.04, nz: 0.03, r2: 1.5, sub: 0.3, range: 48 }                        // sport: melengking
};
const VS = { voices: [], honkT: 4, answer: 0, ready: false };
function makeVoice() {
  const o = AC.createOscillator(), o2 = AC.createOscillator(), n = AC.createBufferSource(), lfo = AC.createOscillator(); o.type = 'sawtooth'; o2.type = 'square'; n.buffer = noiseBuf; n.loop = true;
  const f = AC.createBiquadFilter(), nf = AC.createBiquadFilter(); f.type = 'lowpass'; nf.type = 'bandpass'; nf.Q.value = 0.7; nf.frequency.value = 900;
  const g1 = AC.createGain(), g2 = AC.createGain(), gn = AC.createGain(), am = AC.createGain(), out = AC.createGain(), lg = AC.createGain(); g1.gain.value = 1; g2.gain.value = 0.5; gn.gain.value = 0.01; am.gain.value = 1; lg.gain.value = 0; out.gain.value = 0;
  o.connect(g1); o2.connect(g2); n.connect(nf); nf.connect(gn); g1.connect(f); g2.connect(f); gn.connect(f); f.connect(am); am.connect(out); lfo.connect(lg); lg.connect(am.gain);
  const pan = AC.createStereoPanner ? AC.createStereoPanner() : null; if (pan) { out.connect(pan); pan.connect(master); } else out.connect(master);
  o.start(); o2.start(); n.start(); lfo.start(); lfo.frequency.value = 10; return { o, o2, n, lfo, f, nf, g1, g2, gn, am, lg, out, pan, car: null };
}
const vsProf = c => c.kind === 'motor' ? VPROF['motor' + ((c.vr | 0) === 2 ? 2 : (c.vr | 0) === 1 ? 1 : 0)] : c.kind === 'motor2' ? VPROF['motor' + ((c.vr | 0) ? 1 : 0)] : (VPROF[c.kind] || VPROF.sedan);
function vsAssign(v, c, pf) {
  v.car = c; v.pf = pf; v.out.gain.cancelScheduledValues(0); v.out.gain.value = 0; v.o.type = pf.t1; v.o2.type = pf.t2; v.f.frequency.value = pf.cut; v.g2.gain.value = pf.sub == null ? 0.5 : pf.sub; v.gn.gain.value = pf.nz || 0.01;
  v.lg.gain.value = pf.knock ? pf.kd * 0.5 : 0; v.am.gain.value = pf.knock ? 1 - pf.kd * 0.5 : 1; v.lfo.frequency.value = pf.knock || 10;
}
function vsMute() { if (VS.voices.length && AC) { const t = AC.currentTime; VS.voices.forEach(v => v.out.gain.setTargetAtTime(0, t, 0.05)); } }
function vsStop() { VS.voices.forEach(v => { try { v.o.stop(); v.o2.stop(); v.n.stop(); v.lfo.stop(); v.out.disconnect(); } catch (e) {} }); VS.voices = []; }
const panOf = c => clamp((c.x - P.x) / 5, -1, 1);
function vehicleSoundFrame(dt) {
  if (!AC || !noiseBuf) return;
  if (state !== 'play') { vsMute(); return; }
  if (!VS.voices.length) for (let i = 0; i < 4; i++) VS.voices.push(makeVoice());
  const t = AC.currentTime, cand = [];
  for (const c of traffic) { if (c.em || c.stat) continue; const pf = vsProf(c), dx = c.x - P.x, d = Math.hypot(dx, c.z, 1.5); if (d < pf.range) cand.push({ c, pf, d, dx, score: d / pf.range }); }
  cand.sort((a, b) => a.score - b.score); const top = cand.slice(0, 4);
  VS.voices.forEach(v => { if (v.car && !top.some(x => x.c === v.car)) { v.car = null; v.out.gain.setTargetAtTime(0, t, 0.1); } });
  for (const x of top) {
    let v = VS.voices.find(q => q.car === x.c); if (!v) { v = VS.voices.find(q => !q.car); if (!v) continue; vsAssign(v, x.c, x.pf); }
    const c = x.c, pf = x.pf, sp = clamp(c.speed / 28, 0, 1.4), dzd = P.v - c.speed, vr = (c.z * dzd) / x.d, dop = clamp(1 / (1 + vr / 160), 0.88, 1.14), f = (pf.f0 + pf.f1 * sp) * dop;   // vr<0 = mendekat → nada naik (Doppler dilebihkan ±2×)
    v.o.frequency.setTargetAtTime(f, t, 0.06); v.o2.frequency.setTargetAtTime(f * (pf.r2 || 0.5), t, 0.06); if (pf.knock) v.lfo.frequency.setTargetAtTime(pf.knock * (0.7 + sp * 0.9), t, 0.1);
    v.out.gain.setTargetAtTime(settings.mute ? 0 : pf.g * Math.pow(clamp(1 - x.d / pf.range, 0, 1), 1.5), t, 0.08); if (v.pan) v.pan.pan.setTargetAtTime(clamp(x.dx / 6, -1, 1), t, 0.08);
  }
  VS.voices.forEach(v => { if (!v.car) v.out.gain.setTargetAtTime(0, t, 0.1); });
  // rem angin, klik sein, hazard
  const now = elapsed;
  for (const c of traffic) {
    if (c.em) continue; const d = Math.hypot(c.x - P.x, c.z), pan = panOf(c);
    if (c.sPrev !== undefined && d < 60 && isBigKind(c.kind) && c.sPrev - c.speed > 0.1 && now - (c.abT || -9) > 4) { c.abT = now; sfx.airBrake(pan, clamp(1 - d / 60, 0.25, 1)); }
    c.sPrev = c.speed;
    if ((c.haz || c.lc) && d < 38) { const ph = Math.floor(now * 3.2); if (ph !== c.tickPh) { c.tickPh = ph; sfx.tickClick(pan, clamp(1 - d / 38, 0.15, 1) * (c.haz ? 0.8 : 1)); } }
  }
  // klakson acak & balasan klaksonmu
  VS.honkT -= dt; if (VS.honkT <= 0) { VS.honkT = rr(5, 11) * ({ desa: 0.6, tol: 0.9, gunung: 1.3, pantai: 1.1, batu: 1.4, salju: 1.5, hutan: 1.0, neon: 0.5 }[typeof MAP !== 'undefined' ? MAP.id : 'tol'] || 1); vsHonkOne(60); }
  if (VS.answer > 0) { VS.answer -= dt; if (VS.answer <= 0 && Math.random() < 0.6) vsHonkOne(45); }
}
function vsHonkOne(range) {
  const pool = traffic.filter(c => !c.em && !c.stat && Math.hypot(c.x - P.x, c.z) < range); if (!pool.length) return; const c = pick(pool), k = c.kind, bike = k.indexOf('motor') === 0, prob = k === 'angkot' ? 1 : bike ? 0.8 : isBigKind(k) ? 0.7 : 0.5;
  if (bike && (c.vr | 0) === 3 && Math.random() < 0.5) { sfx.notif(panOf(c)); return; }   // ojol: notifikasi pesanan
  if (Math.random() < prob) sfx.hornKind(k, panOf(c), traffic.indexOf(c) + (c.vr | 0));
}
// ---------------- efek suara ----------------
const TELOLET = [
  [[784, 0.06], [988, 0.06], [1175, 0.06], [1319, 0.06], [1175, 0.06], [988, 0.06], [1319, 0.06], [1568, 0.12], [1319, 0.06], [1175, 0.2]],
  [[659, 0.07], [784, 0.07], [988, 0.07], [784, 0.07], [1175, 0.07], [988, 0.07], [1319, 0.14], [1175, 0.07], [988, 0.22]],
  [[880, 0.06], [1109, 0.06], [1319, 0.06], [1109, 0.06], [1319, 0.06], [1760, 0.06], [1568, 0.06], [1319, 0.06], [1109, 0.14], [1319, 0.22]]
];
Object.assign(sfx, {
  hornKind(kind, pan, k) {
    k = Math.abs(k | 0);
    if (kind === 'truck' || kind === 'truckm') { toneP(0.9, 185, 178, 0.09, 'sawtooth', 0, pan); toneP(0.9, 233, 226, 0.07, 'sawtooth', 0, pan); noiseP(0.5, 'bandpass', 600, 300, 0.03, pan, 1); }   // klakson udara
    else if (kind === 'bus' || kind === 'busdd') {
      if (Math.random() < 0.65) { let t = 0; TELOLET[k % TELOLET.length].forEach(([f, d]) => { toneP(d + 0.03, f, f * 1.004, 0.045, 'square', t, pan); toneP(d + 0.03, f * 2, f * 2, 0.014, 'triangle', t, pan); t += d; }); }   // "om telolet om"
      else { toneP(0.7, 245, 240, 0.08, 'sawtooth', 0, pan); toneP(0.7, 310, 304, 0.06, 'sawtooth', 0, pan); }
    }
    else if (kind === 'angkot' || kind === 'minibus') { [0, 0.2].forEach(d => { toneP(0.13, 640, 632, 0.06, 'square', d, pan); toneP(0.13, 800, 790, 0.04, 'square', d, pan); }); }
    else if (kind.indexOf('motor') === 0) { const f = 820 + (k % 3) * 70; toneP(0.28, f, f * 0.99, 0.045, 'square', 0, pan); toneP(0.28, f * 1.5, f * 1.49, 0.02, 'square', 0, pan); }
    else if (kind === 'suv' || kind === 'pickup' || kind === 'mpv') { toneP(0.45, 300, 298, 0.06, 'square', 0, pan); toneP(0.45, 380, 377, 0.05, 'square', 0, pan); }
    else if (kind === 'taxi') { [0, 0.18].forEach(d => { toneP(0.12, 520, 516, 0.055, 'square', d, pan); toneP(0.12, 650, 645, 0.045, 'square', d, pan); }); }
    else sfx.hornFar(pan, k);
  },
  passKind(kind, pan, k) {
    if (isBigKind(kind)) { noiseP(1.0, 'lowpass', 520, 120, 0.38 * k, pan, 0.7); noiseP(0.9, 'bandpass', 1100, 260, 0.14 * k, pan, 0.9); toneP(0.7, 74, 44, 0.12 * k, 'sawtooth', 0, pan); }       // gemuruh angin truk/bus
    else if (kind.indexOf('motor') === 0) { toneP(0.5, 780, 360, 0.06 * k, 'sawtooth', 0, pan); toneP(0.5, 1560, 720, 0.02 * k, 'square', 0, pan); noiseP(0.35, 'bandpass', 2200, 900, 0.05 * k, pan, 1.5); }   // "nyiiiuuum"
    else sfx.pass(pan, k);
  },
  airBrake(pan, k) { noiseP(0.8, 'highpass', 4200, 2600, 0.1 * k, pan, 0.8); noiseP(0.5, 'bandpass', 2800, 1400, 0.05 * k, pan, 2); },
  tickClick(pan, k) { toneP(0.025, 1900, 1200, 0.05 * k, 'square', 0, pan); toneP(0.03, 1100, 800, 0.03 * k, 'square', 0.17, pan); },
  notif(pan) { toneP(0.12, 1319, 1319, 0.04, 'sine', 0, pan); toneP(0.2, 1760, 1760, 0.04, 'sine', 0.11, pan); }
});
{ const _h = sfx.horn; sfx.horn = function () { _h.apply(this, arguments); if (typeof state !== 'undefined' && state === 'play') VS.answer = rr(0.45, 1.1); }; }   // pengemudi lain kadang membalas klaksonmu
