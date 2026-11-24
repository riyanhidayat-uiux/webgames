'use strict';
// ---------- layout ----------
let W = 0, H = 0, DPR = 1, S = 1, resScale = 1;
const bg = document.createElement('canvas'), bctx = bg.getContext('2d');
const imgCache = new Map();

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1) * resScale;
  W = window.innerWidth; H = window.innerHeight;
  S = Math.max(0.75, Math.min(1.6, Math.min(W, H) / 400));
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bg.width = cv.width; bg.height = cv.height;
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  paintBg();
  imgCache.clear();
}

function paintBg() {
  const g = bctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5f3819'); g.addColorStop(1, '#2b1607');
  bctx.fillStyle = g; bctx.fillRect(0, 0, W, H);
  const pw = Math.max(70, W / 5);
  const rnd = mulberry(7);
  for (let x = 0; x < W + pw; x += pw) {
    bctx.fillStyle = `rgba(0,0,0,${0.04 + rnd() * 0.14})`;
    bctx.fillRect(x, 0, pw, H);
    bctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      bctx.strokeStyle = `rgba(255,215,160,${0.03 + rnd() * 0.05})`;
      const gx = x + rnd() * pw, amp = 2 + rnd() * 5, ph = rnd() * 10;
      bctx.beginPath(); bctx.moveTo(gx, 0);
      for (let y = 0; y <= H + 40; y += 30) bctx.lineTo(gx + Math.sin(y * 0.012 + ph) * amp, y);
      bctx.stroke();
    }
    if (rnd() < 0.6) {
      const ky = rnd() * H;
      bctx.strokeStyle = 'rgba(0,0,0,0.16)';
      for (let k = 1; k < 4; k++) { bctx.beginPath(); bctx.ellipse(x + pw * (0.3 + rnd() * 0.4), ky, 5 * k, 13 * k, 0, 0, Math.PI * 2); bctx.stroke(); }
    }
    bctx.fillStyle = 'rgba(0,0,0,0.5)'; bctx.fillRect(x - 1.5, 0, 3, H);
    bctx.fillStyle = 'rgba(255,220,170,0.06)'; bctx.fillRect(x + 1.5, 0, 1, H);
  }
  const v = bctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.62)');
  bctx.fillStyle = v; bctx.fillRect(0, 0, W, H);
}

function emojiImg(e, r) {
  const key = e + '|' + Math.round(r);
  let c = imgCache.get(key);
  if (c) return c;
  const sz = Math.ceil(r * 2.7);
  c = document.createElement('canvas');
  c.width = c.height = Math.ceil(sz * DPR);
  const x = c.getContext('2d');
  x.scale(DPR, DPR);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `${Math.round(r * 2.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.fillText(e, sz / 2, sz / 2 + r * 0.08);
  c.sz = sz;
  imgCache.set(key, c);
  return c;
}
