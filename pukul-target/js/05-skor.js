'use strict';
// ---------- skor ----------
function popBubble(b, owner) {
  const p = PL[owner], sc = bubbleScreen(b), colHex = b.hex, pc = versus ? PTXT[owner] : '#fff36a';
  b.dead = true; disposeBubble(b);
  const hex = '#' + colHex.toString(16).padStart(6, '0');
  if (b.type === 'bomb') {
    sfx.bomb(); burst(b.x, b.y, b.z, 40, ['#ff5a1f', '#ffcc33', '#555555'], 8); ringFx(b.x, b.y, b.z + 0.5, b.size * 2.5, 0xff6a2a); p.combo = 0;
    if (versus) { p.score = Math.max(0, p.score - 30); popText('💥 −30', sc.x, sc.y, '#ff6a4a'); } else { lives--; flashT = 1; popText('💥 BOM!', sc.x, sc.y, '#ff6a4a'); $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on'); try { navigator.vibrate && navigator.vibrate([80, 40, 160]); } catch (e) {} if (lives <= 0) endGame(); }
    updateHud(); return;
  }
  if (b.type === 'heart') { lives = Math.min(5, lives + 1); sfx.heart(); burst(b.x, b.y, b.z, 18, ['#ff7ac0', '#ffd1e6', '#ffffff'], 5); ringFx(b.x, b.y, b.z + 0.5, b.size * 2.2, 0xff7ac0); popText('+1 ❤', sc.x, sc.y, '#ff8ac8'); updateHud(true); return; }
  p.combo++; p.maxCombo = Math.max(p.maxCombo, p.combo); p.hits++; hitsTot++;
  const mult = Math.min(5, Math.max(1, p.combo)) * (fever.t > 0 ? 2 : 1), base = b.type === 'gold' ? 50 : b.type === 'big' ? 30 : 10, pts = base * mult; p.score += pts;
  (b.type === 'gold' ? sfx.gold : b.type === 'big' ? sfx.big : () => sfx.pop(p.combo))(); burst(b.x, b.y, b.z, b.type === 'gold' ? 30 : 18, [hex, '#ffffff', hex], 6); ringFx(b.x, b.y, b.z + 0.5, b.size * 2.2, versus ? PHEX[owner] : colHex);
  popText('+' + pts, sc.x, sc.y - 10, pc);
  if (!fever.t) { fever.c = Math.min(1, fever.c + 0.055); if (fever.c >= 1) { fever.t = 8; fever.c = 0; say('🔥 HUJAN BOLA!', '#ffe36a'); sfx.fever(); } }
  updateHud(true); updateFever();
}
function hitBubble(b, owner) {
  if (b.cool > 0) return; const sc = bubbleScreen(b);
  if (b.hp > 1) { b.hp--; b.cool = 0.4; sfx.hit2(); burst(b.x, b.y, b.z, 10, ['#aad0ff', '#ffffff'], 4); ringFx(b.x, b.y, b.z + 0.5, b.size * 1.8, 0xaad0ff); popText('💥', sc.x, sc.y, '#aad0ff'); if (b.ring) b.ring.visible = false; return; }
  popBubble(b, owner);
}
function missBubble(b) {
  b.dead = true; disposeBubble(b); if (b.type === 'bomb' || b.type === 'heart' || b.type === 'gold') return;
  missTot++; const sc = bubbleScreen(b); PL.forEach(p => { p.combo = 0; });
  if (!versus) { lives--; sfx.miss(); popText('LEWAT', clamp(sc.x, 40, SW - 40), clamp(sc.y, 40, SH - 40), '#ff8a8a'); $('flash').classList.remove('on'); void $('flash').offsetWidth; $('flash').classList.add('on'); updateHud(); if (lives <= 0) endGame(); } else updateHud();
}
