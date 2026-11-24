'use strict';
// ======================= ATURAN & SKOR BOLING =======================
// rolls = daftar pin yang dijatuhkan per lemparan. Kembalikan posisi giliran berikutnya.
function rollsState(rolls) {
  let i = 0;
  for (let f = 0; f < 9; f++) {
    if (i >= rolls.length) return { f, r: 0, pinsLeft: 10 };
    if (rolls[i] === 10) { i++; continue; }
    if (i + 1 >= rolls.length) return { f, r: 1, pinsLeft: 10 - rolls[i] };
    i += 2;
  }
  const r = rolls.slice(i);
  if (r.length === 0) return { f: 9, r: 0, pinsLeft: 10 };
  if (r.length === 1) return { f: 9, r: 1, pinsLeft: r[0] === 10 ? 10 : 10 - r[0] };
  if (r.length === 2) { if (r[0] === 10 || r[0] + r[1] === 10) return { f: 9, r: 2, pinsLeft: (r[0] === 10 && r[1] !== 10) ? 10 - r[1] : 10 }; return { done: true }; }
  return { done: true };
}
// skor per frame: {r:[lemparan], t: skor kumulatif atau null jika belum pasti}
function scoreFrames(rolls) {
  const out = []; let i = 0, total = 0, blocked = false;
  for (let f = 0; f < 10; f++) {
    const fr = { r: [], t: null };
    if (f < 9) {
      if (rolls[i] === 10) { fr.r = [10]; if (!blocked && i + 2 < rolls.length) { total += 10 + rolls[i + 1] + rolls[i + 2]; fr.t = total; } else blocked = true; i += 1; }
      else if (i + 1 < rolls.length) {
        fr.r = [rolls[i], rolls[i + 1]];
        if (rolls[i] + rolls[i + 1] === 10) { if (!blocked && i + 2 < rolls.length) { total += 10 + rolls[i + 2]; fr.t = total; } else blocked = true; }
        else if (!blocked) { total += rolls[i] + rolls[i + 1]; fr.t = total; }
        i += 2;
      } else { if (i < rolls.length) { fr.r = [rolls[i]]; i++; } blocked = true; }
    } else {
      fr.r = rolls.slice(i); const sum = fr.r.reduce((a, b) => a + b, 0), need = (fr.r[0] === 10 || (fr.r.length >= 2 && fr.r[0] + fr.r[1] === 10)) ? 3 : 2;
      if (!blocked && fr.r.length >= need) { total += sum; fr.t = total; }
    }
    out.push(fr);
  }
  return out;
}
const totalScore = rolls => { const fs = scoreFrames(rolls); let t = 0; fs.forEach(f => { if (f.t != null) t = f.t; }); return t; };
const symR = n => n === 10 ? 'X' : n === 0 ? '-' : String(n);
function frameSyms(fr, f) {   // simbol kotak lemparan: X, /, -, angka
  const r = fr.r;
  if (f < 9) { if (r.length === 0) return ['', '']; if (r[0] === 10) return ['', 'X']; if (r.length === 1) return [symR(r[0]), '']; return [symR(r[0]), r[0] + r[1] === 10 ? '/' : symR(r[1])]; }
  const s = [];
  r.forEach((v, k) => { if (v === 10) s.push('X'); else if (k > 0 && r[k - 1] !== 10 && r[k - 1] + v === 10) s.push('/'); else s.push(symR(v)); });
  while (s.length < 3) s.push(''); return s;
}
function boardHtml(players, cur, active) {
  let h = '';
  players.forEach((p, pi) => {
    const fs = scoreFrames(p.rolls), st = rollsState(p.rolls);
    h += `<div class="brow${pi === cur && active ? ' cur' : ''}"><div class="bname">${playerName(pi)}</div>`;
    fs.forEach((fr, i) => {
      const on = pi === cur && active && !st.done && st.f === i, s = frameSyms(fr, i);
      h += `<div class="fc${on ? ' on' : ''}${i === 9 ? ' f10' : ''}"><div class="rs">${s.map(x => `<span>${x}</span>`).join('')}</div><div class="ft">${fr.t != null ? fr.t : ''}</div></div>`;
    });
    h += '</div>';
  });
  return h;
}
