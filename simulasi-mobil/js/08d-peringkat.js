'use strict';
// ======================= PAPAN PERINGKAT GLOBAL =======================
// Papan terpisah per mode & peta: klasik-<peta> / santai-<peta> / bebas-<peta> (skor; makin tinggi makin baik) dan
// b<panjang>-<peta>-<kesulitan> (waktu balapan 1 Player; server hanya mengenal "nilai tertinggi", jadi waktu dikodekan: nilai = 1.000.000 − waktu_ms/10).
const LB_GAME = 'simulasi-mobil', LB_MODES = ['KLASIK', 'SANTAI', 'JALAN SANTAI'];
const lbEnc = ms => Math.max(1, 1000000 - Math.round(ms / 10)), lbDec = v => (1000000 - v) * 10;
const lbIsRace = () => gameType === 'race';
function lbBoard() { if (lbIsRace()) return settings.players === 1 ? 'b' + RACE_LENS[settings.rlen] + '-' + MAP.id + '-' + settings.rdiff : null; return ['klasik', 'santai', 'bebas'][mode] + '-' + MAP.id; }
function lbName() { const mp = MAP.n.replace(/^\S+\s/, '').toUpperCase(); if (lbIsRace()) return 'BALAPAN ' + (RACE_LENS[settings.rlen] / 1000) + ' KM · ' + RDIFF[settings.rdiff].n.replace(/^\S+\s/, '').toUpperCase() + ' · ' + mp; return LB_MODES[mode] + ' · ' + mp; }
const lbRows = rows => rows && lbIsRace() ? rows.map(r => ({ name: r.name, value: fmtRT(lbDec(r.value) / 1000) })) : rows, lbUnit = () => lbIsRace() ? '' : 'poin';
let lbToken = 0;
async function lbMenuRefresh() {
  const box = $('lbMenu'); if (!box || !window.Leaderboard) return; const board = lbBoard(); if (!board) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden'); $('lbMenuT').textContent = '🏆 PERINGKAT · ' + lbName(); $('lbMenuList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const tk = ++lbToken, b = await Leaderboard.top(LB_GAME); if (tk !== lbToken) return;
  if (!b) { $('lbMenuList').innerHTML = '<li class="lb-empty">Peringkat tidak tersedia (server peringkat tidak terhubung)</li>'; return; }
  Leaderboard.renderList($('lbMenuList'), lbRows(b[board]), Leaderboard.name(), lbUnit());
}
// board = nama papan (null = sembunyikan), value = nilai yang dikirim (skor, atau waktu terkode untuk balapan)
async function lbAfterGame(board, value) {
  const box = $('lbBox'), msg = $('lbMsg'), form = $('lbForm'), save = $('lbSave'), inp = $('lbName');
  box.classList.add('hidden'); if (!board || !window.Leaderboard) return;
  box.classList.remove('hidden'); msg.textContent = ''; msg.className = 'lbmsg'; $('lbTitle').textContent = '🏆 PERINGKAT · ' + lbName(); $('lbList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const top = await Leaderboard.top(LB_GAME);
  if (!top) { form.classList.add('hidden'); $('lbList').innerHTML = ''; msg.className = 'lbmsg err'; msg.textContent = 'Server peringkat tidak terhubung — skor hanya tersimpan di perangkat ini.'; return; }
  const draw = rows => Leaderboard.renderList($('lbList'), lbRows(rows), Leaderboard.name(), lbUnit()); draw(top[board]);
  if (!(value >= 1)) { form.classList.add('hidden'); return; }
  const send = async () => {
    const nm = inp.value.trim(); if (!nm) { msg.className = 'lbmsg err'; msg.textContent = 'Isi nama dulu.'; return; }
    save.disabled = true; msg.className = 'lbmsg'; msg.textContent = 'Mengirim…';
    const r = await Leaderboard.submit(LB_GAME, board, value, nm); save.disabled = false;
    if (r.error) { msg.className = 'lbmsg err'; msg.textContent = r.error; form.classList.remove('hidden'); return; }
    form.classList.add('hidden'); msg.textContent = r.improved ? `${lbIsRace() ? 'Waktu' : 'Skor'} terkirim! Kamu peringkat #${r.rank}` : `Rekormu sudah lebih baik — peringkat #${r.rank}`; draw(r.board);
  };
  save.onclick = send; inp.onkeydown = e => { if (e.key === 'Enter') send(); e.stopPropagation(); };
  inp.value = Leaderboard.name(); if (inp.value) { form.classList.add('hidden'); send(); } else { form.classList.remove('hidden'); setTimeout(() => inp.focus(), 50); }
}
lbMenuRefresh();
