'use strict';
// --- fasad gedung realistis: bata, plester, beton, dinding kaca; jendela berbingkai, tirai, balkon, AC ---
const winMats = [];
function makeFacade(cols, floors, kind) {
  const cw = 52, ch = 56, W = cols * cw, H = floors * ch;
  const c = mkCanvas(W, H), x = c.getContext('2d'), e = mkCanvas(W, H), ex = e.getContext('2d');
  ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  const wallCol = kind === 'brick' ? pick(['#9c5640', '#8a4a36', '#a8644a', '#7e4634']) : kind === 'plaster' ? pick(['#e6dccb', '#d9cdb8', '#d3dadc', '#e8d4c0', '#cdd6c6']) : kind === 'concrete' ? pick(['#a9acb0', '#9ea2a8', '#b8b5ae']) : '#2e4b60', base = parseInt(wallCol.slice(1), 16);
  if (kind === 'brick') {
    x.fillStyle = '#b7a995'; x.fillRect(0, 0, W, H);
    for (let r = 0, y = 0; y < H; r++, y += 6) for (let xx = -(r % 2) * 7; xx < W; xx += 14) { x.fillStyle = shade(base, rr(0.86, 1.12)); x.fillRect(xx + 1, y + 1, 12, 4.4); }
  } else if (kind !== 'glass') {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, shade(base, 1.06)); g.addColorStop(1, shade(base, 0.88)); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 90; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)'; x.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 1 + Math.random() * 3); }
    if (kind === 'concrete') { x.fillStyle = 'rgba(0,0,0,.14)'; for (let i = 0; i <= cols; i++) x.fillRect(i * cw - 1, 0, 2, H); }
  }
  // pelat lantai
  for (let f = 0; f <= floors; f++) { x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(0, f * ch - 3, W, 3); x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(0, f * ch, W, 3); }
  if (kind === 'glass') {
    x.fillStyle = '#2b4a5f'; x.fillRect(0, 0, W, H);
    for (let f = 0; f < floors; f++) for (let i = 0; i < cols; i++) {
      const px = i * cw + 2, py = f * ch + 2, pw = cw - 4, ph = ch - 12, t = rf();
      const gg = x.createLinearGradient(px, py, px + pw * 0.4, py + ph); gg.addColorStop(0, t < 0.3 ? '#cfe6f4' : '#9fc6de'); gg.addColorStop(0.5, t < 0.3 ? '#8cb8d4' : '#5f90b4'); gg.addColorStop(1, '#2d526e');
      x.fillStyle = gg; x.fillRect(px, py, pw, ph);
      x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.moveTo(px, py + ph * 0.7); x.lineTo(px + pw * 0.7, py); x.lineTo(px + pw, py); x.lineTo(px, py + ph); x.closePath(); x.fill();
      x.fillStyle = '#1c2d3a'; x.fillRect(i * cw, f * ch + ch - 9, cw, 9); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(i * cw, f * ch + ch - 9, cw, 1.5);
      if (rf() < 0.42) { ex.fillStyle = pick(['#ffe2a0', '#fff1cc', '#ffd890']); ex.fillRect(px, py, pw, ph); }
    }
    x.fillStyle = '#c3cad0'; for (let i = 0; i <= cols; i++) x.fillRect(i * cw - 1, 0, 3, H);
  } else for (let f = 0; f < floors; f++) for (let i = 0; i < cols; i++) {
    const wx = i * cw + 10, wy = f * ch + 10, ww = cw - 20, wh = ch - 26;
    x.fillStyle = kind === 'brick' ? '#d8cfbd' : 'rgba(252,250,244,.9)'; x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    const gg = x.createLinearGradient(wx, wy, wx, wy + wh); gg.addColorStop(0, '#a5c7df'); gg.addColorStop(0.55, '#6189a8'); gg.addColorStop(1, '#3b5873'); x.fillStyle = gg; x.fillRect(wx, wy, ww, wh);
    const sty = rf();
    if (sty < 0.3) { x.fillStyle = 'rgba(238,232,216,.88)'; for (let yy = wy; yy < wy + wh * (0.35 + rf() * 0.5); yy += 3.4) x.fillRect(wx, yy, ww, 2); }
    else if (sty < 0.58) { x.fillStyle = pick(['#c9a46a', '#b85a4a', '#6a8ab0', '#e0d6c0', '#7aa078']); x.fillRect(wx, wy, ww * 0.32, wh); x.fillRect(wx + ww * 0.68, wy, ww * 0.32, wh); }
    x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(wx, wy + wh * 0.65); x.lineTo(wx + ww * 0.6, wy); x.lineTo(wx + ww, wy); x.lineTo(wx, wy + wh); x.closePath(); x.fill();
    x.fillStyle = 'rgba(246,246,242,.96)'; x.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); x.fillRect(wx, wy + wh * 0.38, ww, 3);
    x.fillStyle = '#d8d2c4'; x.fillRect(wx - 5, wy + wh + 3, ww + 10, 4); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(wx - 4, wy + wh + 7, ww + 8, 3);
    const sg = x.createLinearGradient(0, wy + wh + 7, 0, wy + wh + 30); sg.addColorStop(0, 'rgba(30,24,18,.16)'); sg.addColorStop(1, 'rgba(30,24,18,0)'); x.fillStyle = sg; x.fillRect(wx + 2, wy + wh + 7, ww - 4, 23);   // bekas air hujan
    if (f > 0 && rf() < 0.2) {   // balkon
      x.fillStyle = '#cfc9bd'; x.fillRect(wx - 8, wy + wh + 1, ww + 16, 6); x.fillStyle = 'rgba(25,28,34,.9)'; x.fillRect(wx - 8, wy + wh - 13, ww + 16, 2); for (let k = 0; k <= 6; k++) x.fillRect(wx - 8 + k * (ww + 14) / 6, wy + wh - 13, 2, 14);
      if (rf() < 0.6) { x.fillStyle = '#7a5238'; x.fillRect(wx + 3, wy + wh - 6, 8, 6); x.fillStyle = '#3f8a3a'; x.beginPath(); x.arc(wx + 7, wy + wh - 9, 6, 0, 6.283); x.fill(); }
    } else if (rf() < 0.1) { x.fillStyle = '#d6d9dc'; x.fillRect(wx + ww * 0.1, wy + wh + 9, ww * 0.8, 11); x.fillStyle = 'rgba(0,0,0,.3)'; for (let k = 0; k < 4; k++) x.fillRect(wx + ww * 0.15, wy + wh + 11 + k * 2.4, ww * 0.7, 1); }   // AC
    if (rf() < 0.46) { ex.fillStyle = pick(['#ffd98a', '#fff0c0', '#ffc870', '#f4e6b0']); ex.fillRect(wx, wy, ww, wh); ex.fillStyle = 'rgba(0,0,0,.55)'; ex.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); ex.fillRect(wx, wy + wh * 0.38, ww, 3); }
  }
  const gr = x.createLinearGradient(0, H * 0.85, 0, H); gr.addColorStop(0, 'rgba(40,34,28,0)'); gr.addColorStop(1, 'rgba(40,34,28,.22)'); x.fillStyle = gr; x.fillRect(0, H * 0.85, W, H * 0.15);   // kotor di bagian bawah
  const m = new THREE.MeshStandardMaterial({ map: mkTex(c), emissiveMap: mkTex(e), emissive: 0xffffff, emissiveIntensity: 0, roughness: kind === 'glass' ? 0.3 : 0.85 });
  winMats.push(m); return m;
}
const rf = Math.random;
const NAMES = ['KOPI', 'TOKO', 'BAKERY', 'PIZZA', 'BUKU', 'MARKET', 'FASHION', 'APOTEK', 'MIE', 'TEH', 'BURGER', 'GAME'];
function makeShop() {
  const W = 512, H = 96, c = mkCanvas(W, H), x = c.getContext('2d'), e = mkCanvas(W, H), ex = e.getContext('2d');
  x.fillStyle = '#4a4640'; x.fillRect(0, 0, W, H); ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
  const col = pick(['#b8412e', '#2f6aa8', '#3f8a4a', '#c8922a', '#7a4aa8', '#2a2a2e']), nm = pick(NAMES), cream = '#efe6d2';
  x.fillStyle = col; x.fillRect(14, 4, W - 28, 20); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(14, 4, W - 28, 4);   // papan nama
  x.font = 'bold 17px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(nm, W / 2, 15);
  ex.fillStyle = '#6a5a40'; ex.fillRect(14, 4, W - 28, 20); ex.font = 'bold 17px system-ui,sans-serif'; ex.textAlign = 'center'; ex.textBaseline = 'middle'; ex.fillStyle = '#fff'; ex.fillText(nm, W / 2, 15);
  for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? cream : col; x.fillRect(8 + i * 15.5, 26, 15.5, 14); x.beginPath(); x.arc(8 + i * 15.5 + 7.75, 40, 7.75, 0, Math.PI); x.fill(); }   // kanopi kain bergaris
  const ag = x.createLinearGradient(0, 26, 0, 50); ag.addColorStop(0, 'rgba(0,0,0,.05)'); ag.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = ag; x.fillRect(8, 26, W - 16, 24);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(8, 48, W - 16, 4);
  [[22, 200], [290, 200]].forEach(([wx, ww]) => {
    x.fillStyle = '#26282c'; x.fillRect(wx - 4, 52, ww + 8, 40);
    const gg = x.createLinearGradient(wx, 54, wx, 90); gg.addColorStop(0, '#a9cfe6'); gg.addColorStop(1, '#58829e'); x.fillStyle = gg; x.fillRect(wx, 54, ww, 36);
    x.fillStyle = 'rgba(40,30,24,.55)'; x.fillRect(wx, 70, ww, 20); for (let k = 0; k < 9; k++) { x.fillStyle = pick(['#c8483a', '#e0b030', '#3f8a4a', '#2f6aa8', '#efe6d2']); x.fillRect(wx + 8 + k * 21, 74 + (k % 2) * 3, 13, 12); }   // barang dagangan
    x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.moveTo(wx, 82); x.lineTo(wx + ww * 0.45, 54); x.lineTo(wx + ww * 0.7, 54); x.lineTo(wx + 12, 90); x.lineTo(wx, 90); x.closePath(); x.fill();
    ex.fillStyle = '#ffe2a0'; ex.fillRect(wx, 54, ww, 36);
  });
  x.fillStyle = '#26282c'; x.fillRect(236, 52, 48, 44); x.fillStyle = '#7a5438'; x.fillRect(240, 56, 40, 40); x.fillStyle = 'rgba(160,210,236,.8)'; x.fillRect(244, 60, 32, 20); x.fillStyle = '#e8c85a'; x.fillRect(272, 78, 4, 4);   // pintu
  ex.fillStyle = '#ffe2a0'; ex.fillRect(244, 60, 32, 20);
  x.fillStyle = '#2a2a2e'; x.fillRect(0, 90, W, 6);
  const m = new THREE.MeshStandardMaterial({ map: mkTex(c), emissiveMap: mkTex(e), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.6 });
  winMats.push(m); return m;
}
const FAC = [], FAC2 = [], SHOPS = [];
const mkKind = list => { const r = rf(); let a = 0; for (const [k, w] of list) { a += w; if (r < a) return k; } return list[0][0]; };
for (let i = 0; i < 10; i++) { const cols = 3 + ((Math.random() * 3) | 0), fl = 4 + ((Math.random() * 6) | 0); FAC.push({ cols, fl, mat: makeFacade(cols, fl, mkKind([['brick', 0.34], ['plaster', 0.36], ['concrete', 0.2], ['glass', 0.1]]))}); }
for (let i = 0; i < 6; i++) { const cols = 4 + ((Math.random() * 3) | 0), fl = 9 + ((Math.random() * 7) | 0); FAC2.push({ cols, fl, mat: makeFacade(cols, fl, mkKind([['glass', 0.5], ['concrete', 0.3], ['plaster', 0.1], ['brick', 0.1]])) }); }
for (let i = 0; i < 6; i++) SHOPS.push(makeShop());
const billTexs = [['LARI! 🏃', '#ff7a3c'], ['☕ KOPI', '#7a4a28'], ['🎮 GAME ZONE', '#6a3ae0'], ['🍔 BURGER', '#e0483a'], ['🍎 FRESH', '#3aa04a'], ['📷 KAMERA', '#2a8ae0']].map(([t, col]) => {
  const c = mkCanvas(256, 128), x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 256, 128); g.addColorStop(0, col); g.addColorStop(1, shade(parseInt(col.slice(1), 16), 0.65));
  x.fillStyle = g; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#fff'; x.lineWidth = 6; x.strokeRect(5, 5, 246, 118);
  x.font = 'bold 38px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(t, 128, 66); return mkTex(c);
});

function makeBuilding(v, shop, depth) {
  const g = new THREE.Group(), fh = 1.12, w = v.cols * 1.5, H = v.fl * fh, sh = shop ? 1.5 : 0;
  const sideM = v.mat, topM = MATS.roof;
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, H, depth), [sideM, sideM, topM, MATS.dark, sideM, sideM]);
  body.position.y = sh + H / 2; g.add(body);
  if (shop) {
    const sm = pick(SHOPS), st = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, sh, depth + 0.1), [sm, sm, MATS.dark, MATS.dark, sm, sm]); st.position.y = sh / 2; g.add(st);
  }
  const top = sh + H;
  const par = new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.3, depth + 0.2), MATS.concrete); par.position.y = top + 0.1; g.add(par);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w - 0.25, 0.05, depth - 0.25), MATS.roof); cap.position.y = top + 0.27; g.add(cap);
  const cor = new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.16, depth + 0.12), MATS.concrete); cor.position.y = top - 0.08; g.add(cor);   // lis atas
  if (shop) { const bs = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.1, depth + 0.14), MATS.dark); bs.position.y = sh + 0.02; g.add(bs); }
  const r = Math.random();
  if (r < 0.3) {   // AC + tangki air
    const ac = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.8), MATS.metal); ac.position.set(w * 0.2, top + 0.55, depth * 0.15); g.add(ac);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.8, 12), MATS.trunkL); tank.position.set(-w * 0.2, top + 0.7, -depth * 0.15); g.add(tank);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 12), MATS.dark); roof.position.set(-w * 0.2, top + 1.28, -depth * 0.15); g.add(roof);
  } else if (r < 0.62) {   // antena berkedip
    const an = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 3, 6), MATS.metal); an.position.set(w * 0.25, top + 1.7, 0); g.add(an);
    const bc = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), MATS.beacon); bc.position.set(w * 0.25, top + 3.2, 0); g.add(bc);
    const pent = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 0.7, depth * 0.4), MATS.concrete); pent.position.set(-w * 0.15, top + 0.62, 0); g.add(pent);
  } else if (r < 0.82) {   // papan reklame di atap
    const bb = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshBasicMaterial({ map: pick(billTexs), side: THREE.DoubleSide })); bb.position.set(0, top + 1.8, 0); g.add(bb);
    [-1.2, 1.2].forEach(px => { const lg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.3, 0.1), MATS.metal); lg.position.set(px, top + 0.85, 0); g.add(lg); });
  }
  g.userData.h = top; return g;
}
// baris gedung kiri-kanan jalan
[-1, 1].forEach(sd => {
  for (const [rowX, list, shop] of [[10.4, FAC, true], [10.4 + 9.5, FAC2, false]]) {
    let z = ZTOP + 2, minX = rowX; 
    while (z > ZTOP - SC_LEN + 7) {
      const v = pick(list), depth = rr(6, 9.5), b = makeBuilding(v, shop, depth), w = v.cols * 1.5;
      addScenery(b, sd * (rowX + w / 2 + (shop ? 0 : rr(0, 4))), z - depth / 2);
      z -= depth + rr(0.4, 1.6);
      if (z < ZTOP - SC_LEN + 7) break;
    }
  }
});
