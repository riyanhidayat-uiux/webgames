'use strict';
// ======================= PAPAN PERINGKAT GLOBAL =======================
// Papan terpisah per mode (Klasik / Santai) dan per kesulitan: klasik-mudah, klasik-normal, klasik-sulit, santai-mudah, ... Hanya 1 Player.
const LB_GAME = 'lubang-dinding', DIFF_KEY = ['mudah', 'normal', 'sulit'], DIFF_LABEL = ['Mudah', 'Normal', 'Sulit'];
const lbBoard = () => (chill ? 'santai' : 'klasik') + '-' + DIFF_KEY[settings.diff];
const lbName = () => (chill ? 'SANTAI' : 'KLASIK') + ' · ' + DIFF_LABEL[settings.diff].toUpperCase();
let lbToken = 0;
async function lbMenuRefresh() {
  if (!window.Leaderboard) return; const box = $('lbMenu'); if (versus || (typeof practice !== 'undefined' && practice)) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden'); $('lbMenuT').textContent = '🏆 PERINGKAT GLOBAL · ' + lbName(); $('lbMenuList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const tk = ++lbToken, b = await Leaderboard.top(LB_GAME); if (tk !== lbToken || versus || practice) return;
  if (!b) { $('lbMenuList').innerHTML = '<li class="lb-empty">Peringkat tidak tersedia (server peringkat tidak terhubung)</li>'; return; }
  Leaderboard.renderList($('lbMenuList'), b[lbBoard()], Leaderboard.name(), 'poin');
}
async function lbAfterGame(board, value) {
  const box = $('lbBox'), msg = $('lbMsg'), form = $('lbForm'), save = $('lbSave'), inp = $('lbName');
  box.classList.add('hidden'); if (!board || !window.Leaderboard) return;
  box.classList.remove('hidden'); msg.textContent = ''; msg.className = 'lbmsg'; $('lbTitle').textContent = '🏆 PERINGKAT GLOBAL · ' + lbName(); $('lbList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const top = await Leaderboard.top(LB_GAME);
  if (!top) { form.classList.add('hidden'); $('lbList').innerHTML = ''; msg.className = 'lbmsg err'; msg.textContent = 'Server peringkat tidak terhubung — skor hanya tersimpan di perangkat ini.'; return; }
  const draw = rows => Leaderboard.renderList($('lbList'), rows, Leaderboard.name(), 'poin'); draw(top[board]);
  if (!(value >= 1)) { form.classList.add('hidden'); return; }
  const send = async () => {
    const nm = inp.value.trim(); if (!nm) { msg.className = 'lbmsg err'; msg.textContent = 'Isi nama dulu.'; return; }
    save.disabled = true; msg.className = 'lbmsg'; msg.textContent = 'Mengirim…';
    const r = await Leaderboard.submit(LB_GAME, board, value, nm); save.disabled = false;
    if (r.error) { msg.className = 'lbmsg err'; msg.textContent = r.error; form.classList.remove('hidden'); return; }
    form.classList.add('hidden'); msg.textContent = r.improved ? `Skor terkirim! Kamu peringkat #${r.rank}` : `Rekormu sudah lebih tinggi — peringkat #${r.rank}`; draw(r.board);
  };
  save.onclick = send; inp.onkeydown = e => { if (e.key === 'Enter') send(); e.stopPropagation(); };
  inp.value = Leaderboard.name(); if (inp.value) { form.classList.add('hidden'); send(); } else { form.classList.remove('hidden'); setTimeout(() => inp.focus(), 50); }
}
lbMenuRefresh();
