'use strict';
// ======================= DATA PERTARUNGAN =======================
const FIGHTERS = [
  { name: 'PEMULA', hp: 90, dmg: 1.0, windup: 0.95, gap: [1.4, 2.1], guardP: 0.15, skin: 0xf1c9a5, trunks: 0x3aa8ff, glove: 0x2a7ae0, hairStyle: 'short', hairCol: 0x3a2412, gear: true, atk: ['jab', 'hookL', 'hookR'] },
  { name: 'JAGOAN', hp: 120, dmg: 1.25, windup: 0.8, gap: [1.1, 1.7], guardP: 0.28, skin: 0xd9a77a, trunks: 0x2ad06a, glove: 0x1f9a44, hairStyle: 'fade', hairCol: 0x1a1008, gear: true, tattoo: true, atk: ['jab', 'hookL', 'hookR', 'upper'] },
  { name: 'PETARUNG', hp: 150, dmg: 1.5, windup: 0.68, gap: [0.9, 1.5], guardP: 0.34, skin: 0xc68a5a, trunks: 0xff9a1a, glove: 0xd9701a, hairStyle: 'mohawk', hairCol: 0x120a06, beard: true, tattoo: true, atk: ['jab', 'hookL', 'hookR', 'upper'] },
  { name: 'JUARA', hp: 190, dmg: 1.8, windup: 0.58, gap: [0.7, 1.2], guardP: 0.4, skin: 0x8a5a3a, trunks: 0x7a2ad0, trim: 0xffd23f, glove: 0x6a1ac0, hairStyle: 'bald', beard: true, tattoo: true, atk: ['jab', 'hookL', 'hookR', 'upper'] },
  { name: 'LEGENDA', hp: 240, dmg: 2.2, windup: 0.5, gap: [0.55, 1.0], guardP: 0.46, skin: 0xe0b890, trunks: 0xd02a2a, trim: 0xffd23f, glove: 0xe8b81a, hairStyle: 'afro', hairCol: 0x1a0e06, tattoo: true, atk: ['jab', 'hookL', 'hookR', 'upper'] }
];
const DIFFM = [{ dmg: 0.7, wind: 1.25 }, { dmg: 1, wind: 1 }, { dmg: 1.25, wind: 0.85 }];
// serangan lawan: arah datang + cara menghindar yang valid
const ATK = {
  jab: { dmg: 10, label: 'JAB LURUS!', ok: { block: 1, leanL: 1, leanR: 1, duck: 0 } },
  hookL: { dmg: 14, label: 'HOOK KIRI!', ok: { block: 1, leanL: 0, leanR: 1, duck: 1 } },
  hookR: { dmg: 14, label: 'HOOK KANAN!', ok: { block: 1, leanL: 1, leanR: 0, duck: 1 } },
  upper: { dmg: 18, label: 'UPPERCUT!', ok: { block: 1, leanL: 1, leanR: 1, duck: 0 } }
};
const PUNCH = { jab: { dmg: 2.6, label: 'JAB' }, hook: { dmg: 3.8, label: 'HOOK' }, upper: { dmg: 5, label: 'UPPERCUT' } };
