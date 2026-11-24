'use strict';
// ---------- draw ----------
function drawBlade(b, now) {
  const pts = b.pts;
  if (pts.length < 2) return;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const gl = fever[fidx(b.owner)].t > 0 ? '255,150,30' : (b.owner != null ? PCOL[b.owner] : '110,215,255');
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      const w = Math.min(1, Math.max(0, 1 - (now - c.t) / TRAIL_MS));
      if (w <= 0) continue;
      const taper = 0.25 + 0.75 * (i / (pts.length - 1)), n = pts[i + 1];
      ctx.strokeStyle = pass ? `rgba(255,255,255,${0.95 * w})` : `rgba(${gl},${(fever[fidx(b.owner)].t > 0 ? 0.6 : 0.35) * w})`;
      ctx.lineWidth = (pass ? 5 : 16) * S * w * taper;
      // kurva kuadratik lewat titik tengah: jejak melengkung halus, bukan garis patah
      const sx = i > 1 ? (a.x + c.x) / 2 : a.x, sy = i > 1 ? (a.y + c.y) / 2 : a.y;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      if (n) ctx.quadraticCurveTo(c.x, c.y, (c.x + n.x) / 2, (c.y + n.y) / 2); else ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }
  }
}

function draw(now) {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * 24 * shake, (Math.random() - 0.5) * 24 * shake);
  ctx.drawImage(bg, 0, 0, W, H);
  if (versus && (state === 'play' || state === 'paused' || state === 'dying')) {
    ctx.fillStyle = 'rgba(255,90,90,.07)'; ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = 'rgba(90,160,255,.07)'; ctx.fillRect(W / 2, 0, W / 2, H);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.setLineDash([10 * S, 10 * S]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
  }

  for (const s of splats) {
    ctx.globalAlpha = Math.max(0, s.life) * 0.5;
    ctx.fillStyle = s.c;
    const rnd = mulberry(s.seed);
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.65, 0, Math.PI * 2); ctx.fill();
    if (s.drip) { const age = 1 - s.life, L = s.r * (0.35 + age * s.drip.len * 1.4), w = Math.max(1.5, s.r * 0.09); ctx.fillRect(s.x + s.drip.dx - w / 2, s.y, w, L); ctx.beginPath(); ctx.arc(s.x + s.drip.dx, s.y + L, w * 0.85, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 9; i++) {
      const a = rnd() * 6.28, d = s.r * (0.55 + rnd() * 1.0);
      ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, s.r * (0.06 + rnd() * 0.18), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  for (const h of halves) {
    const im = emojiImg(h.e, h.r);
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot + h.cut);
    const R = h.r * 1.5;
    ctx.beginPath(); ctx.rect(-R, h.side > 0 ? 0 : -R, 2 * R, R); ctx.clip();
    ctx.rotate(-h.cut);
    ctx.drawImage(im, -im.sz / 2, -im.sz / 2, im.sz, im.sz);
    ctx.rotate(h.cut);
    ctx.strokeStyle = h.c; ctx.lineWidth = 4 * S; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-h.r * 0.62, 0); ctx.lineTo(h.r * 0.62, 0); ctx.stroke();
    ctx.restore();
  }

  drawBoss();
  for (const f of fruits) {
    const im = emojiImg(f.e, f.r);
    ctx.save();
    ctx.translate(f.x, f.y);
    if (f.bomb) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 14);
      const gr = ctx.createRadialGradient(0, 0, f.r * 0.3, 0, 0, f.r * 1.7);
      gr.addColorStop(0, `rgba(255,40,20,${0.35 + 0.3 * pulse})`); gr.addColorStop(1, 'rgba(255,40,20,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, f.r * 1.7, 0, Math.PI * 2); ctx.fill();
    }
    if (f.kind || f.star) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 8 + f.x);
      const gr = ctx.createRadialGradient(0, 0, f.r * 0.3, 0, 0, f.r * 1.9);
      gr.addColorStop(0, hexA(f.t.c, 0.45 + 0.3 * pulse)); gr.addColorStop(1, hexA(f.t.c, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, f.r * 1.9, 0, Math.PI * 2); ctx.fill();
    }
    { const zi = frozenIdx(f);
      if (zi >= 0 && freeze[zi].a > 0.05) {
        const gr = ctx.createRadialGradient(0, 0, f.r * 0.5, 0, 0, f.r * 1.5);
        gr.addColorStop(0, `rgba(160,230,255,${0.1 * freeze[zi].a})`); gr.addColorStop(0.8, `rgba(160,230,255,${0.5 * freeze[zi].a})`); gr.addColorStop(1, 'rgba(160,230,255,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, f.r * 1.5, 0, Math.PI * 2); ctx.fill();
      } }
    if (f.t && f.t.sq) { const w = Math.sin(elapsed * 11 + f.ph); ctx.scale(1 + 0.1 * w, 1 - 0.1 * w); }
    ctx.rotate(f.rot);
    ctx.drawImage(im, -im.sz / 2, -im.sz / 2, im.sz, im.sz);
    ctx.restore();
  }

  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    if (p.g) {
      ctx.font = `${Math.round(p.size)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(p.g, p.x, p.y);
    } else if (p.drop) {
      ctx.strokeStyle = p.c; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.2, p.size);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.028, p.y - p.vy * 0.028); ctx.stroke();
    } else if (p.seed) {
      ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot || 0) + p.life * 7);
      ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    } else if (p.shard) {
      ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 9);
      ctx.fillRect(-p.size * 1.6, -p.size * 0.4, p.size * 3.2, p.size * 0.8); ctx.restore();
    } else {
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  for (const rg of rings) {
    const k = Math.max(0, rg.life / rg.max);
    if (rg.type === 'slash') {
      ctx.save(); ctx.translate(rg.x, rg.y); ctx.rotate(rg.ang);
      const L = rg.len * (1.5 - k * 0.5), gr = ctx.createLinearGradient(-L, 0, L, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${k})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(-L, -(1 + 3 * k) * S, 2 * L, (2 + 6 * k) * S);
      ctx.restore();
    } else {
      ctx.strokeStyle = `rgba(${rg.c},${k})`; ctx.lineWidth = rg.w * S * k + 0.5;
      ctx.beginPath(); ctx.arc(rg.x, rg.y, Math.max(1, rg.r1 * (1 - k * k)), 0, Math.PI * 2); ctx.stroke();
    }
  }

  for (let i = 0; i < (versus ? 2 : 1); i++) {
    const x0 = versus ? i * W / 2 : 0, w = versus ? W / 2 : W, fz = freeze[i], fv = fever[i];
    if (fz.a > 0.01) {
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, w, H); ctx.clip();
      const gr = ctx.createRadialGradient(x0 + w / 2, H / 2, Math.min(w, H) * 0.25, x0 + w / 2, H / 2, Math.max(w, H) * 0.75);
      gr.addColorStop(0, 'rgba(120,210,255,0)'); gr.addColorStop(1, `rgba(120,210,255,${0.5 * fz.a})`);
      ctx.fillStyle = gr; ctx.fillRect(x0, 0, w, H);
      ctx.fillStyle = `rgba(150,220,255,${0.07 * fz.a})`; ctx.fillRect(x0, 0, w, H);
      ctx.restore();
    }
    if (fv.a > 0.01) {
      const pulse = 0.65 + 0.35 * Math.sin(elapsed * 9);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, w, H); ctx.clip();
      const gr = ctx.createRadialGradient(x0 + w / 2, H / 2, Math.min(w, H) * 0.3, x0 + w / 2, H / 2, Math.max(w, H) * 0.8);
      gr.addColorStop(0, 'rgba(255,120,20,0)'); gr.addColorStop(1, `rgba(255,110,20,${(0.3 + 0.2 * pulse) * fv.a})`);
      ctx.fillStyle = gr; ctx.fillRect(x0, 0, w, H);
      const lg = ctx.createLinearGradient(0, H, 0, H * 0.7);
      lg.addColorStop(0, `rgba(255,140,0,${0.5 * fv.a * pulse})`); lg.addColorStop(1, 'rgba(255,140,0,0)');
      ctx.fillStyle = lg; ctx.fillRect(x0, H * 0.7, w, H * 0.3);
      ctx.restore();
    }
  }

  drawBlade(sensorBlade, now);
  drawBlade(camBlade, now);
  drawBlade(vc[0].blade, now); drawBlade(vc[1].blade, now);
  for (const b of touchBlades.values()) drawBlade(b, now);
  for (const b of deadBlades) drawBlade(b, now);

  const drawCursor = (x, y, col = '160,230,255') => {
    const r = 9 * S;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    gr.addColorStop(0, `rgba(${col},0.9)`); gr.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, Math.PI * 2); ctx.fill();
  };
  if (state === 'play' || state === 'paused') {
    if (sens.on) drawCursor(sens.x, sens.y);
    if (cam.on && cam.has) drawCursor(cam.x, cam.y);
    if (cam.on && versus) vc.forEach((v, k) => { if (v.has) drawCursor(v.x, v.y, PCOL[k]); });
  }

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const m of misses) {
    ctx.globalAlpha = Math.min(1, m.life);
    ctx.font = `${Math.round(40 * S)}px Bangers, Impact, sans-serif`;
    ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#3a0000'; ctx.lineWidth = 4;
    ctx.strokeText('✕', m.x, H - 40 * S); ctx.fillText('✕', m.x, H - 40 * S);
  }
  for (const t of texts) {
    ctx.globalAlpha = Math.min(1, t.life * 1.5);
    const big = t.big || 1;
    ctx.font = `${Math.round(34 * S * big)}px Bangers, Impact, sans-serif`;
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(60,20,0,.9)'; ctx.fillStyle = t.color;
    const x = Math.max(80 * S, Math.min(W - 80 * S, t.x));
    const k = Math.min(1, (t.age || 0) / 0.28), sc = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    ctx.save(); ctx.translate(x, t.y); ctx.scale(sc, sc); ctx.rotate((1 - k) * -0.15);
    ctx.strokeText(t.s, 0, 0); ctx.fillText(t.s, 0, 0);
    if (t.sub) {
      ctx.font = `${Math.round(26 * S * Math.min(big, 1.2))}px Bangers, Impact, sans-serif`;
      ctx.strokeText(t.sub, 0, 30 * S * big); ctx.fillText(t.sub, 0, 30 * S * big);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (state === 'play' || state === 'paused' || state === 'dying') drawCamPreview();

  if (flash > 0) {
    ctx.fillStyle = `rgba(255,250,235,${Math.min(1, flash)})`;
    ctx.fillRect(0, 0, W, H);
  }
}
