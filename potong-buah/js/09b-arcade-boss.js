'use strict';
// ---------- ARCADE (berbasis level) & BOSS ----------
// gm: 'classic' | 'arcade' | 'boss'  (deklarasi di 03-game-data.js)
// Arcade : level 1,2,3… dengan target (tebas N buah / buat N combo). Tiap level ke-5 = BOSS. Nyawa dibawa antar level.
// Boss   : maraton bos berurutan (Boss Rush), HP makin besar.
const camp = { level: 1, phase: 'intro', t: 0, kills: 0, combos: 0, goal: 0, spec: null, livesAtStart: 5, bossesDown: 0 };
let boss = null;
const BOSSES = [
  { e: '🍉', n: 'RAJA SEMANGKA', c: '#ff3b4e' }, { e: '🍍', n: 'JENDERAL NANAS', c: '#ffd84a' }, { e: '🥥', n: 'KAPTEN KELAPA', c: '#d8c8b0' },
  { e: '🍈', n: 'BARON MELON', c: '#c8f58a' }, { e: '🍇', n: 'RATU ANGGUR', c: '#a64ae0' }, { e: '🌶️', n: 'JAGO CABAI', c: '#ff3b2f' }, { e: '🍆', n: 'PANGLIMA TERONG', c: '#8a4ae0' }
];
const bestA = { lv: store.get('bestArcadeLv', 0), boss: store.get('bestBoss', 0) };

function levelSpec(n) {
  if (gm === 'boss') return { type: 'boss', idx: n - 1 };
  if (n % 5 === 0) return { type: 'boss', idx: n / 5 - 1 };
  if ((n - 1) % 2 === 1) return { type: 'combo', goal: 2 + Math.floor(n / 4) };
  return { type: 'slice', goal: Math.min(60, 8 + n * 3) };
}
const campDesc = sp => sp.type === 'slice' ? `Tebas ${sp.goal} buah` : sp.type === 'combo' ? `Buat ${sp.goal}× combo 3 buah atau lebih` : 'Kalahkan bos sebelum waktu habis';

// ---- HUD ----
function campHudRefresh() {
  const on = gm !== 'classic' && state !== 'menu' && state !== 'over';
  show('campHud', on); show('bossHud', on && !!boss); if (!on) return;
  const sp = camp.spec; if (!sp) return;
  $('campLv').textContent = gm === 'boss' ? 'BOS KE-' + camp.level : 'LEVEL ' + camp.level;
  let txt, pct = 0;
  if (sp.type === 'slice') { txt = `Tebas ${Math.min(camp.kills, sp.goal)} / ${sp.goal} buah`; pct = camp.kills / sp.goal; }
  else if (sp.type === 'combo') { txt = `Combo 3+: ${Math.min(camp.combos, sp.goal)} / ${sp.goal}`; pct = camp.combos / sp.goal; }
  else { txt = 'Kalahkan bos!'; pct = boss ? 1 - boss.hp / boss.max : 0; }
  $('campGoal').textContent = txt; $('campBar').style.width = Math.round(Math.max(0, Math.min(1, pct)) * 100) + '%';
  if (boss) { $('bossName').textContent = boss.e + ' ' + boss.n; $('bossHp').style.width = Math.max(0, boss.hp / boss.max * 100) + '%'; $('bossHud').classList.toggle('rage', boss.phase === 3); }
}
const setBossT = () => { if (!boss) return; const el = $('bossT'); el.textContent = '⏱ ' + fmtT(boss.timeLeft); el.classList.toggle('low', boss.timeLeft <= 10); };

// ---- alur level ----
function campStart() {
  boss = null;
  if (gm === 'classic') { show('campHud', false); show('bossHud', false); return; }
  versus = false; chill = false; lives = 5; camp.level = 1; camp.bossesDown = 0; show('btnInf', false);
  beginLevel();
}
function beginLevel() {
  camp.spec = levelSpec(camp.level); camp.phase = 'intro'; camp.t = 0; camp.kills = 0; camp.combos = 0; camp.livesAtStart = lives;
  boss = null; queue.length = 0; fruits = []; spawnT = 0.6;
  const sp = camp.spec, B = sp.type === 'boss' ? BOSSES[sp.idx % BOSSES.length] : null;
  texts.push({ x: W / 2, y: H * 0.34, s: sp.type === 'boss' ? '⚠ BOS ⚠' : (gm === 'boss' ? 'BOS KE-' + camp.level : 'LEVEL ' + camp.level), sub: B ? B.e + ' ' + B.n : campDesc(sp), life: 2.1, color: sp.type === 'boss' ? '#ff6a5a' : '#ffd23f', big: 1.9 });
  if (sp.type === 'boss') { flash = Math.max(flash, 0.25); shake = Math.max(shake, 0.4); sfx.bomb && sfx.bomb(); }
  campHudRefresh();
}
function campUpdate(dt) {
  camp.t += dt;
  if (camp.phase === 'intro') { if (camp.t >= 2.1) { camp.phase = 'run'; camp.t = 0; if (camp.spec.type === 'boss') spawnBoss(); } return; }
  if (camp.phase === 'clear') { if (camp.t >= 2.7) { camp.level++; beginLevel(); } return; }
  if (boss) { bossUpdate(dt); return; }
  spawnT -= dt;
  if (spawnT <= 0) { const ex = spawnWave(); spawnT = Math.max(0.7, 1.75 - 0.06 * camp.level) + Math.random() * 0.35 + ex; }
}
function levelClear(kind) {
  if (camp.phase !== 'run') return;
  camp.phase = 'clear'; camp.t = 0; queue.length = 0;
  for (let k = fruits.length - 1; k >= 0; k--) { const f = fruits[k]; if (f.bomb) { burst(f.x, f.y, 14, ['#ffcc33', '#fff6a0'], 260, 0.5, {}); ringFx(f.x, f.y, f.r * 2.4, 0.35, '255,210,80', 4); fruits.splice(k, 1); } }
  const lost = Math.max(0, camp.livesAtStart - lives), stars = kind === 'escape' ? 0 : lost === 0 ? 3 : lost <= 1 ? 2 : 1, bonus = kind === 'escape' ? 0 : camp.level * 10 * stars;
  score += bonus;
  const heal1 = lives < 5 && kind !== 'escape'; if (heal1) lives++;
  const boss_ = camp.spec.type === 'boss';
  texts.push({ x: W / 2, y: H * 0.34, s: kind === 'escape' ? 'BOS KABUR!' : (boss_ ? 'BOS KALAH!' : 'LEVEL SELESAI!'), sub: (stars ? '★'.repeat(stars) + '☆'.repeat(3 - stars) + '  +' + bonus : 'tanpa bonus') + (heal1 ? '  · +1 ❤' : ''), life: 2.4, color: kind === 'escape' ? '#ff9a7a' : '#7fff6a', big: 1.8 });
  ringFx(W / 2, H * 0.4, Math.max(W, H) * 0.7, 0.8, '127,255,106', 12); flash = Math.max(flash, 0.25); sfx.fever && sfx.fever();
  if (boss_ && kind !== 'escape') camp.bossesDown++;
  updateHud(); campHudRefresh();
}
// ---- hook dari penebasan ----
function campOnSlice() {
  if (gm !== 'arcade' || camp.phase !== 'run' || boss || camp.spec.type !== 'slice') return;
  camp.kills++; campHudRefresh(); if (camp.kills >= camp.spec.goal) levelClear();
}
function campOnCombo() {
  if (gm === 'classic' || camp.phase !== 'run' || boss || camp.spec.type !== 'combo') return;
  camp.combos++; campHudRefresh(); if (camp.combos >= camp.spec.goal) levelClear();
}

// ---- BOS ----
function spawnBoss() {
  const idx = camp.spec.idx, B = BOSSES[idx % BOSSES.length], lap = Math.floor(idx / BOSSES.length);
  const max = (gm === 'boss' ? 28 + 12 * idx : 24 + 10 * idx), r = Math.min(W, H) * 0.19;
  boss = { e: B.e, n: B.n + (lap ? ' ' + (lap + 1) : ''), c: B.c, r, x: W / 2, y: -r * 1.6, hp: max, max, t: 0, hitFlash: 0, cd: 0, squash: 0, phase: 1, atkT: 2.4, atkN: 0, alive: true, timeLeft: Math.min(75, 40 + 4 * idx), idx };
  setBossT(); campHudRefresh();
}
function bossUpdate(dt) {
  const b = boss; b.t += dt; b.cd = Math.max(0, b.cd - dt); b.hitFlash = Math.max(0, b.hitFlash - dt * 4); b.squash += (0 - b.squash) * Math.min(1, dt * 9);
  const hpf = b.hp / b.max, ph = hpf > 0.66 ? 1 : hpf > 0.33 ? 2 : 3;
  if (ph !== b.phase) {
    b.phase = ph; ringFx(b.x, b.y, b.r * 3, 0.7, ph === 3 ? '255,60,40' : '255,200,80', 12); shake = Math.max(shake, 0.6); flash = Math.max(flash, 0.2); sfx.bomb && sfx.bomb();
    texts.push({ x: b.x, y: b.y + b.r * 1.15, s: ph === 3 ? 'BOS MENGAMUK!' : 'BOS MARAH!', sub: '', life: 1.4, color: '#ff6a5a', big: 1.4 });
    if (lives < 5) queue.push({ t: elapsed + 0.4, bomb: false, kind: 'heart', o: { x: 0.5, tx: 0.5, h: 0.62 } });
    campHudRefresh();
  }
  const sp = 0.55 + 0.25 * (ph - 1), tx = W / 2 + Math.sin(b.t * sp) * W * 0.27, ty = H * 0.4 + Math.sin(b.t * sp * 1.7 + 1) * H * 0.06;
  b.y += (ty - b.y) * Math.min(1, dt * 3); b.x += (tx - b.x) * Math.min(1, dt * (b.t < 1.5 ? 2 : 6));
  b.timeLeft -= dt; setBossT(); if (b.timeLeft <= 0) { bossEscape(); return; }
  b.atkT -= dt;
  if (b.atkT <= 0 && b.t > 1.4) { bossAttack(); b.atkT = [2.7, 2.1, 1.6][ph - 1] + Math.random() * 0.5; }
}
function bossAttack() {
  const b = boss, n = 3 + b.phase, slots = PATTERNS.fan(n), bombs = (b.atkN % 2 === 1 || (b.phase === 3 && b.atkN % 4 === 0)) ? Math.min(3, b.phase + 1) : 0, set = new Set();
  while (set.size < bombs) set.add(Math.floor(Math.random() * n));
  slots.forEach((sl, i) => { sl.x = 0.5 + (b.x / W - 0.5) * 0.6 + (Math.random() - 0.5) * 0.05; sl.d += 0.1; queue.push({ t: elapsed + sl.d, bomb: set.has(i), kind: set.has(i) ? undefined : 'minion', o: sl }); });
  b.atkN++;
  if (bombs) { ringFx(b.x, b.y, b.r * 1.7, 0.4, '255,70,40', 6); }
}
function bossTrySlice(ax, ay, bx, by, bl) {
  const b = boss; if (!b || !b.alive || camp.phase !== 'run' || b.cd > 0 || b.t < 0.6) return;
  if (segDist(b.x, b.y, ax, ay, bx, by) > b.r * 0.92) return;
  const ang = Math.atan2(by - ay, bx - ax), dmg = 1 + (fever[0].t > 0 ? 1 : 0), hx = Math.max(b.x - b.r * 0.8, Math.min(b.x + b.r * 0.8, (ax + bx) / 2)), hy = Math.max(b.y - b.r * 0.8, Math.min(b.y + b.r * 0.8, (ay + by) / 2));
  b.hp -= dmg; b.cd = 0.17; b.hitFlash = 1; b.squash = 0.14; award(undefined, dmg);
  bl.combo++; bl.comboT = 0.28; bl.cx = hx; bl.cy = hy; addCharge(undefined, 0.02);
  for (let i = 0; i < 14; i++) { const a = ang + (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.4, s = (260 + Math.random() * 520) * S, life = 0.4 + Math.random() * 0.5; parts.push({ x: hx, y: hy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40 * S, life, max: life, size: (1.8 + Math.random() * 3) * S, c: b.c, drop: 1 }); }
  burst(hx, hy, 6, [b.c, '#fff'], 260, 0.5, {});
  rings.push({ type: 'slash', x: hx, y: hy, ang, len: b.r * 1.3, life: 0.2, max: 0.2 });
  texts.push({ x: hx, y: hy - b.r * 0.2, s: '-' + dmg, sub: '', life: 0.5, color: dmg > 1 ? '#ffb000' : '#fff3a0', big: 0.8 + dmg * 0.15 });
  shake = Math.max(shake, 0.12); sfx.bossHit(dmg, b.phase); vibrate(14); updateHud();
  if (b.hp <= 0) { b.hp = 0; bossDefeated(); } else campHudRefresh();
}
function bossDefeated() {
  const b = boss; b.alive = false; const bonus = 100 * (b.idx + 1);
  score += bonus;
  for (const side of [-1, 1]) halves.push({ x: b.x + side * 6, y: b.y, vx: side * 220 * S, vy: -260 * S, rot: 0, vr: side * 2.2, cut: Math.PI / 2, side, e: b.e, r: b.r, c: b.c });
  burst(b.x, b.y, 70, [b.c, '#ffffff', '#ffd23f'], 760, 1.1, {}); burst(b.x, b.y, 30, [b.c, '#ffd23f'], 520, 1.4, { shard: 1 });
  ringFx(b.x, b.y, Math.max(W, H) * 0.7, 0.9, '255,230,120', 16); ringFx(b.x, b.y, b.r * 2.6, 0.6, '255,255,255', 8);
  texts.push({ x: b.x, y: b.y - b.r * 0.4, s: '+' + bonus, sub: 'BONUS BOS', life: 1.8, color: '#ffd23f', big: 1.6 });
  flash = 1; shake = 1; slowT = Math.max(slowT, 0.9); sfx.bomb && sfx.bomb(); sfx.fever && sfx.fever(); vibrate([60, 40, 120]);
  boss = null; show('bossHud', false); levelClear('boss');
}
function bossEscape() {
  const b = boss; ringFx(b.x, b.y, b.r * 2.4, 0.6, '255,120,90', 10); burst(b.x, b.y, 20, ['#ccc', '#fff'], 300, 0.8, {});
  boss = null; show('bossHud', false);
  lives = Math.max(0, lives - 2); flash = Math.max(flash, 0.5); shake = Math.max(shake, 0.6); sfx.miss && sfx.miss(); vibrate([60, 40, 60]); updateHud();
  if (lives <= 0) { state = 'dying'; dieT = 1.2; camp.phase = 'dead'; return; }
  levelClear('escape');
}

// ---- gambar bos ----
function drawBoss() {
  const b = boss; if (!b) return; const en = b.phase === 3, pul = 0.5 + 0.5 * Math.sin(elapsed * (en ? 14 : 6));
  ctx.save(); ctx.translate(b.x, b.y);
  const gr = ctx.createRadialGradient(0, 0, b.r * 0.5, 0, 0, b.r * 2); const gc = en ? '255,50,30' : '255,200,90';
  gr.addColorStop(0, `rgba(${gc},${0.28 + 0.25 * pul})`); gr.addColorStop(1, `rgba(${gc},0)`); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, b.r * 2, 0, 6.283); ctx.fill();
  ctx.save(); ctx.rotate(Math.sin(b.t * 1.3) * 0.1 + b.hitFlash * 0.12 * Math.sin(b.t * 45)); ctx.scale(1 + b.squash, 1 - b.squash);
  const im = emojiImg(b.e, b.r); ctx.drawImage(im, -im.sz / 2, -im.sz / 2, im.sz, im.sz);
  // wajah marah
  const er = b.r * 0.17, ex = b.r * 0.3, ey = -b.r * 0.1, look = Math.sin(b.t * 0.9) * er * 0.25;
  for (const sd of [-1, 1]) {
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2a0a0a'; ctx.lineWidth = Math.max(2, b.r * 0.03); ctx.beginPath(); ctx.ellipse(sd * ex, ey, er, er * 1.15, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.fillStyle = en ? '#d00' : '#111'; ctx.beginPath(); ctx.arc(sd * ex + look, ey + er * 0.25, er * 0.5, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#2a0a0a'; ctx.lineWidth = Math.max(3, b.r * 0.06); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sd * (ex + er * 1.3), ey - er * (1.9 + (en ? 0.2 : 0))); ctx.lineTo(sd * (ex - er * 1.2), ey - er * (1.0 - (b.phase > 1 ? 0.1 : -0.1))); ctx.stroke();
  }
  ctx.strokeStyle = '#2a0a0a'; ctx.lineWidth = Math.max(3, b.r * 0.05); ctx.beginPath();
  if (b.phase === 1) { ctx.moveTo(-b.r * 0.22, b.r * 0.32); ctx.quadraticCurveTo(0, b.r * 0.26, b.r * 0.22, b.r * 0.32); }
  else { const mx = b.r * 0.3, my = b.r * 0.34; ctx.moveTo(-mx, my); for (let i = 1; i <= 6; i++) ctx.lineTo(-mx + (2 * mx) * i / 6, my + (i % 2 ? -1 : 1) * b.r * 0.05); }
  ctx.stroke(); ctx.restore();
  if (b.hitFlash > 0) { ctx.globalAlpha = b.hitFlash * 0.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, b.r * 0.95, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---- menu: pilih mode ----
const GM_HELP = {
  arcade: '<b>Arcade:</b> selesaikan level demi level. Tiap level punya target (tebas N buah atau buat combo). Level ke-5, 10, 15… adalah <b>BOS</b>. Nyawa dibawa antar level (+1 ❤ tiap level selesai); bom atau buah jatuh = −1 ❤. Bintang ★ tergantung banyaknya nyawa yang hilang. Hanya 1 Player.',
  boss: '<b>Boss Rush:</b> hadapi bos raksasa satu per satu — tebas bos berkali-kali sebelum waktu habis! Bos melempar buah dan bom, dan makin marah di bawah 66% dan 33% HP. Bos kabur kalau waktu habis (−2 ❤). Hanya 1 Player.'
};
function setGm(m) {
  gm = m; settings.gm = m; saveSettings();
  [['classic', 'btnGmClassic'], ['arcade', 'btnGmArcade'], ['boss', 'btnGmBoss']].forEach(([k, id]) => $(id).classList.toggle('on', m === k));
  const cl = m === 'classic';
  if (!cl) { setVersus(false); setChill(false); }
  show('chillBox', cl); show('vsBox', cl); show('chillHelp', cl && chill); show('vsHelp', cl && versus); show('gmHelp', !cl);
  if (!cl) $('gmHelp').innerHTML = GM_HELP[m];
  lbMenuRefresh();
}
$('btnGmClassic').onclick = () => setGm('classic'); $('btnGmArcade').onclick = () => setGm('arcade'); $('btnGmBoss').onclick = () => setGm('boss');

// ---- papan peringkat global (Arcade = level tertinggi, Boss = bos dikalahkan) ----
const LB_GAME = 'potong-buah', LB_UNIT = { arcade: 'level', boss: 'bos' };
let lbCache = null;
async function lbMenuRefresh() {
  if (gm === 'classic') { show('lbMenu', false); return; }
  show('lbMenu', true); $('lbMenuList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const b = await Leaderboard.top(LB_GAME); lbCache = b;
  if (gm === 'classic') return;
  if (!b) { $('lbMenuList').innerHTML = '<li class="lb-empty">Peringkat tidak tersedia (server peringkat tidak terhubung)</li>'; return; }
  Leaderboard.renderList($('lbMenuList'), b[gm], Leaderboard.name(), LB_UNIT[gm]);
}
async function lbAfterGame(board, value) {
  const box = $('lbBox'), msg = $('lbMsg'), form = $('lbForm'), save = $('lbSave'), inp = $('lbName');
  box.classList.add('hidden'); if (board === 'classic') return;
  box.classList.remove('hidden'); msg.textContent = ''; msg.className = 'lbmsg'; $('lbTitle').textContent = '🏆 PERINGKAT GLOBAL · ' + (board === 'boss' ? 'BOSS RUSH' : 'ARCADE');
  $('lbList').innerHTML = '<li class="lb-empty">Memuat…</li>';
  const top = await Leaderboard.top(LB_GAME);
  if (!top) { form.classList.add('hidden'); $('lbList').innerHTML = ''; msg.className = 'lbmsg err'; msg.textContent = 'Server peringkat tidak terhubung — skor hanya tersimpan di perangkat ini.'; return; }
  const draw = rows => Leaderboard.renderList($('lbList'), rows, Leaderboard.name(), LB_UNIT[board]);
  draw(top[board]);
  if (!(value >= 1)) { form.classList.add('hidden'); return; }
  const send = async () => {
    const nm = inp.value.trim(); if (!nm) { msg.className = 'lbmsg err'; msg.textContent = 'Isi nama dulu.'; return; }
    save.disabled = true; msg.className = 'lbmsg'; msg.textContent = 'Mengirim…';
    const r = await Leaderboard.submit(LB_GAME, board, value, nm); save.disabled = false;
    if (r.error) { msg.className = 'lbmsg err'; msg.textContent = r.error; form.classList.remove('hidden'); return; }
    form.classList.add('hidden'); msg.textContent = r.improved ? `Skor terkirim! Kamu peringkat #${r.rank}` : `Rekormu sudah lebih tinggi — peringkat #${r.rank}`; draw(r.board);
  };
  save.onclick = send; inp.onkeydown = e => { if (e.key === 'Enter') send(); };
  inp.value = Leaderboard.name();
  if (inp.value) { form.classList.add('hidden'); send(); } else { form.classList.remove('hidden'); setTimeout(() => inp.focus(), 50); }
}

setGm(['classic', 'arcade', 'boss'].includes(settings.gm) ? settings.gm : 'classic');
