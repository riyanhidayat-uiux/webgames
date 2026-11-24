'use strict';
// ======================= LAGU & KOREOGRAFI =======================
const INTRO = 8, WIN = 0.38;
const SONGS = [
  { id: 'pagi', name: 'Pagi Ceria', e: '🌅', bpm: 96, spacing: 4, moves: 16, tier: 1, seed: 11, root: 57, prog: [0, 5, 3, 4], style: 'pop', desc: 'Santai: pose dasar tiap 4 ketukan.' },
  { id: 'disko', name: 'Disko Malam', e: '🪩', bpm: 116, spacing: 3, moves: 22, tier: 2, seed: 29, root: 52, prog: [0, 3, 5, 4], style: 'disco', desc: 'Sedang: pose lebih beragam, tiap 3 ketukan.' },
  { id: 'turbo', name: 'Turbo Dance', e: '⚡', bpm: 132, spacing: 2, moves: 30, tier: 3, seed: 47, root: 50, prog: [0, 4, 5, 3], style: 'edm', desc: 'Sulit: semua pose, tiap 2 ketukan, ada tendangan.' }
];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
function makeChoreo(sg) {
  const rnd = mulberry(sg.seed), pool = POSES.filter(p => p.tier <= sg.tier && (sg.tier < 3 || p.tier >= 1)), out = []; let last = -1, last2 = -1;
  for (let i = 0; i < sg.moves; i++) {
    let k, g = 0; do { k = (rnd() * pool.length) | 0; } while ((k === last || k === last2) && g++ < 10);
    last2 = last; last = k; out.push({ beat: INTRO + i * sg.spacing, pose: pool[k], res: [null, null], best: [Infinity, Infinity], done: false });
  }
  return out;
}
