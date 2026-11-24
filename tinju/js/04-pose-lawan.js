'use strict';
// ---------- pose lawan ----------
const POSES = {
  guard: { hipY: 0.98, tX: -0.12, tY: 0, tZ: 0, hX: 0.05, sLx: -0.95, sLz: 0.25, eLx: -2.1, sRx: -0.95, sRz: -0.25, eRx: -2.1, rx: 0, rz: 0, ry: 0, lA: 0.15, lB: -0.15 },
  idle: { hipY: 1.0, tX: 0, tY: 0, tZ: 0, hX: 0, sLx: -0.6, sLz: 0.3, eLx: -1.6, sRx: -0.6, sRz: -0.3, eRx: -1.6, rx: 0, rz: 0, ry: 0, lA: 0.1, lB: -0.1 },
  windJab: { hipY: 0.98, tX: 0.08, tY: 0.35, tZ: 0, hX: 0, sLx: 0.5, sLz: 0.5, eLx: -0.5, sRx: -0.9, sRz: -0.2, eRx: -2.0, rx: 0, rz: 0, ry: 0, lA: 0.3, lB: -0.2 },
  strikeJab: { hipY: 0.98, tX: -0.3, tY: -0.4, tZ: 0, hX: 0, sLx: -1.55, sLz: 0.12, eLx: -0.1, sRx: -0.9, sRz: -0.2, eRx: -2.0, rx: 0, rz: 0, ry: 0, lA: 0.2, lB: -0.1 },
  windHookL: { hipY: 0.98, tX: 0, tY: -0.5, tZ: 0.1, hX: 0, sLx: -0.3, sLz: 1.9, eLx: -1.3, sRx: -0.9, sRz: -0.2, eRx: -2.1, rx: 0, rz: 0, ry: 0.15, lA: 0.2, lB: -0.2 },
  strikeHookL: { hipY: 0.98, tX: -0.1, tY: 0.55, tZ: 0, hX: 0, sLx: -1.3, sLz: -0.5, eLx: -1.5, sRx: -0.9, sRz: -0.2, eRx: -2.1, rx: 0, rz: 0, ry: -0.2, lA: 0.2, lB: -0.2 },
  windHookR: { hipY: 0.98, tX: 0, tY: 0.5, tZ: -0.1, hX: 0, sRx: -0.3, sRz: -1.9, eRx: -1.3, sLx: -0.9, sLz: 0.2, eLx: -2.1, rx: 0, rz: 0, ry: -0.15, lA: 0.2, lB: -0.2 },
  strikeHookR: { hipY: 0.98, tX: -0.1, tY: -0.55, tZ: 0, hX: 0, sRx: -1.3, sRz: 0.5, eRx: -1.5, sLx: -0.9, sLz: 0.2, eLx: -2.1, rx: 0, rz: 0, ry: 0.2, lA: 0.2, lB: -0.2 },
  windUpper: { hipY: 0.78, tX: 0.35, tY: 0, tZ: 0, hX: -0.1, sRx: 0.5, sRz: -0.3, eRx: -0.4, sLx: -0.9, sLz: 0.2, eLx: -2.1, rx: 0, rz: 0, ry: 0, lA: 0.9, lB: -0.7 },
  strikeUpper: { hipY: 1.02, tX: -0.4, tY: 0, tZ: 0, hX: 0.1, sRx: -2.3, sRz: -0.15, eRx: -0.5, sLx: -0.9, sLz: 0.2, eLx: -2.1, rx: 0, rz: 0, ry: 0, lA: 0.3, lB: -0.4 },
  hit: { hipY: 0.96, tX: 0.45, tY: 0.1, tZ: 0, hX: -0.6, sLx: -0.2, sLz: 0.8, eLx: -1.2, sRx: -0.2, sRz: -0.8, eRx: -1.2, rx: 0, rz: 0, ry: 0, lA: 0.2, lB: -0.2 },
  stun: { hipY: 0.92, tX: 0.3, tY: 0, tZ: 0.12, hX: 0.5, sLx: 0.1, sLz: 0.7, eLx: -0.6, sRx: 0.1, sRz: -0.7, eRx: -0.6, rx: 0, rz: 0.08, ry: 0, lA: 0.2, lB: -0.2 },
  ko: { hipY: 0.25, tX: -1.4, tY: 0, tZ: 0, hX: 0.3, sLx: 0.2, sLz: 1.2, eLx: -0.3, sRx: 0.2, sRz: -1.2, eRx: -0.3, rx: 0, rz: 0, ry: 0, lA: 0.3, lB: -0.3 }
};
POSES.duck = { hipY: 0.62, tX: -0.6, tY: 0, tZ: 0, hX: 0.2, sLx: -0.95, sLz: 0.25, eLx: -2.1, sRx: -0.95, sRz: -0.25, eRx: -2.1, rx: 0, rz: 0, ry: 0, lA: 1.0, lB: 1.0 };
function mirrorPose(T) { const o = Object.assign({}, T); o.sLx = T.sRx; o.sRx = T.sLx; o.sLz = -T.sRz; o.sRz = -T.sLz; o.eLx = T.eRx; o.eRx = T.eLx; o.lA = T.lB; o.lB = T.lA; o.tY = -T.tY; o.tZ = -T.tZ; o.ry = -T.ry; return o; }
function applyPose(B, T, k) {
  const c = B.cur; for (const key in T) { if (c[key] === undefined) c[key] = T[key]; c[key] += (T[key] - c[key]) * k; }
  B.hips.position.y = c.hipY; B.torso.rotation.x = c.tX; B.torso.rotation.y = c.tY; B.torso.rotation.z = c.tZ; B.head.rotation.x = c.hX;
  B.aL.sh.rotation.x = c.sLx; B.aL.sh.rotation.z = c.sLz; B.aL.el.rotation.x = c.eLx; B.aR.sh.rotation.x = c.sRx; B.aR.sh.rotation.z = c.sRz; B.aR.el.rotation.x = c.eRx;
  B.lL.hp.rotation.x = c.lA; B.lR.hp.rotation.x = c.lB; B.lL.kn.rotation.x = -Math.abs(c.lA) * 0.6; B.lR.kn.rotation.x = -Math.abs(c.lB) * 0.6;
}
const shade = (hex, f) => { const r = Math.min(255, ((hex >> 16) & 255) * f) | 0, g = Math.min(255, ((hex >> 8) & 255) * f) | 0, bl = Math.min(255, (hex & 255) * f) | 0; return (r << 16) | (g << 8) | bl; };
function skinBoxer(B, F) {
  const m = B.mat, P = B.parts, hs = F.hairStyle || 'short';
  m.skin.color.setHex(F.skin); m.skinD.color.setHex(shade(F.skin, 0.8)); m.trunks.color.setHex(F.trunks); m.trim.color.setHex(F.trim || 0xffffff); m.glove.color.setHex(F.glove); m.hair.color.setHex(F.hairCol || 0x2a1a10); m.gear.color.setHex(F.glove);
  P.gear.visible = !!F.gear; P.beard.visible = !!F.beard; P.tatChest.visible = !!F.tattoo; P.tatArms.forEach(t => { t.visible = !!F.tattoo; });
  P.hair.short.visible = hs === 'short' && !F.gear || hs === 'fade'; P.hair.mohawk.visible = hs === 'mohawk'; P.hair.afro.visible = hs === 'afro';
  if (F.gear) P.hair.short.visible = true;
  const c = P.nameTex.image, x = c.getContext('2d'); x.clearRect(0, 0, 256, 64); x.fillStyle = 'rgba(0,0,0,0)'; x.fillRect(0, 0, 256, 64); x.font = 'bold 38px Impact,Arial Black,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#' + (F.trim === 0xffd23f ? 'ffffff' : '1a1a2a'); x.fillText(F.name, 128, 34); P.nameTex.needsUpdate = true;
}
function updateBruises(B, ratio) { const a = clamp((0.72 - ratio) / 0.5, 0, 1) * 0.65; B.parts.bruises.forEach(b => { b.material.opacity = a; }); B.parts.lids.forEach((l, i) => { l.scale.y = 0.55 + (i ? 0.5 : 0.2) * a; }); }
const VFACE = [{ name: 'P1', skin: 0xe0b890, trunks: 0xe0702a, trim: 0xffffff, glove: 0xd9401a, hairStyle: 'short', hairCol: 0x2a1a10 }, { name: 'P2', skin: 0xb98a62, trunks: 0x2a7ae0, trim: 0xffffff, glove: 0x2a5ad0, hairStyle: 'fade', hairCol: 0x120a06, beard: true }];
const VB = VFACE.map(F => { const bx = makeBoxer(); skinBoxer(bx, F); bx.root.visible = false; return bx; });
