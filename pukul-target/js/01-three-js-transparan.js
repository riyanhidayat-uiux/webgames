'use strict';
// ======================= THREE.JS (transparan di atas video) =======================
const D = 10, FOV = 50, TAN = Math.tan(FOV * Math.PI / 360);
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 120); camera.position.set(0, 0, D);
scene.add(new THREE.AmbientLight(0xffffff, 0.85)); const dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(3, 5, 8); scene.add(dl);
let SW = innerWidth, SH = innerHeight;
const pxToWorld = (px, py) => ({ x: (px / SW - 0.5) * 2 * D * TAN * (SW / SH), y: (0.5 - py / SH) * 2 * D * TAN });
const tmpV = new THREE.Vector3();
const worldToPx = (x, y, z) => { tmpV.set(x, y, z).project(camera); return { x: (tmpV.x * 0.5 + 0.5) * SW, y: (-tmpV.y * 0.5 + 0.5) * SH }; };
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; };
const glowTex = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })();
const iconTex = emoji => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.font = '92px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 64, 70); return mkTex(c); };
const ICON = { gold: iconTex('⭐'), big: iconTex('🛡️'), heart: iconTex('💗'), bomb: iconTex('💣') };
const PALETTE = [0x3aa8ff, 0xff5aa8, 0x5aff9a, 0xffb02a, 0xb06aff, 0x2affe0];
const bubGeo = new THREE.SphereGeometry(1, 26, 20), ringGeo = new THREE.TorusGeometry(1.18, 0.07, 8, 32);
const matCache = {};
const bubMat = (hex, op) => matCache[hex + '_' + op] || (matCache[hex + '_' + op] = new THREE.MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.55, transparent: true, opacity: op, roughness: 0.15, metalness: 0.2 }));
const coreMat = {}; const getCore = hex => coreMat[hex] || (coreMat[hex] = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.55 }));

// ---------- efek pecah ----------
const PART = [];
for (let i = 0; i < 160; i++) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); m.visible = false; scene.add(m); PART.push({ m, vx: 0, vy: 0, vz: 0, life: 0, max: 1 }); }
const RINGS = [];
for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.visible = false; scene.add(m); RINGS.push({ m, life: 0, max: 0.5, r: 1 }); }
function burst(x, y, z, n, colors, speed = 5) {
  for (const p of PART) { if (n <= 0) break; if (p.life > 0) continue; n--; const a = Math.random() * 6.283, e = (Math.random() - 0.5) * 3, s = (0.3 + Math.random()) * speed;
    p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s + 1; p.vz = e * s * 0.4 + 2; p.life = p.max = 0.5 + Math.random() * 0.6; p.m.position.set(x, y, z); p.m.material.color.set(colors[(Math.random() * colors.length) | 0]); p.m.visible = true; p.m.scale.setScalar(0.5 + Math.random() * 1.3); }
}
function ringFx(x, y, z, r, color) { const q = RINGS.find(g => g.life <= 0); if (!q) return; q.life = q.max = 0.45; q.r = r; q.m.position.set(x, y, z); q.m.material.color.set(color); q.m.visible = true; }
