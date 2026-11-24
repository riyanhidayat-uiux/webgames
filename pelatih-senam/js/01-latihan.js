'use strict';
// ======================= LATIHAN =======================
// amplitudo: 0 = diam, 1 = gerakan mencapai target. 'cycle' = naik lalu turun; 'alt' = dua sisi bergantian
const EXS = {
  jj:    { name: 'LOMPAT BINTANG', desc: 'Lompat sambil membuka kaki dan mengangkat kedua tangan ke atas kepala, lalu kembali.', tip: 'Angkat tangan lebih tinggi dan buka kaki lebih lebar', kcal: 0.2, kind: 'cycle' },
  squat: { name: 'SQUAT', desc: 'Turunkan pinggul seperti akan duduk (lutut menekuk), lalu berdiri tegak lagi.', tip: 'Turunkan pinggul lebih dalam', kcal: 0.32, kind: 'cycle' },
  knees: { name: 'ANGKAT LUTUT', desc: 'Angkat lutut kiri dan kanan bergantian setinggi pinggang, seperti berlari di tempat.', tip: 'Angkat lutut lebih tinggi', kcal: 0.15, kind: 'alt2' },
  press: { name: 'ANGKAT TANGAN', desc: 'Dorong kedua tangan lurus ke atas kepala, lalu turunkan ke bahu.', tip: 'Luruskan tangan sampai ke atas kepala', kcal: 0.1, kind: 'cycle' },
  side:  { name: 'MIRING SAMPING', desc: 'Miringkan badan ke kiri, kembali tegak, lalu ke kanan (tangan di pinggang).', tip: 'Miringkan badan lebih jauh ke samping', kcal: 0.08, kind: 'side' }
};
const PROGS = [
  { name: 'Singkat', list: [['jj', 12, 40], ['squat', 10, 40], ['press', 12, 35]] },
  { name: 'Standar', list: [['jj', 15, 45], ['squat', 12, 45], ['knees', 20, 45], ['press', 12, 40], ['side', 12, 40]] },
  { name: 'Tantangan', list: [['jj', 25, 60], ['squat', 20, 60], ['knees', 30, 60], ['press', 20, 50], ['side', 20, 50], ['jj', 20, 50]] }
];
