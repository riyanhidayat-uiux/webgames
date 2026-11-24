'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('mobil_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('mobil_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rr = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0];
const SET_DEF = { sens: 5, invert: false, env: 0, carc: 0, dim: 0, view: 0, mode: 0, gtype: 0, players: 1, rlen: 1, rdiff: 1, weather: 0, terrain: true, model: 0, neon: 0, horn: 0, quality: 1, map: 0 };
const settings = Object.assign({ mute: false, chill: false }, SET_DEF, store.get('settings', {})); if (settings.chill && !settings.mode) settings.mode = 1;   // migrasi dari versi lama
const saveSettings = () => store.set('settings', settings);
// kualitas grafis: 0 Rendah · 1 Sedang · 2 Tinggi. gfxAuto = governor FPS menurunkan/menaikkan level sendiri (batas atas = gfx). Dideteksi sekali dari perangkat.
if (settings.gfx == null) { const ua = navigator.userAgent || '', mob = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform || '')), cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 4; settings.gfx = mob ? (cores >= 8 && mem >= 6 ? 1 : 0) : (cores >= 8 ? 2 : 1); settings.gfxAuto = true; settings.gfxDetected = settings.gfx; }
settings.gfx = clamp(settings.gfx | 0, 0, 2); settings.quality = settings.gfx >= 1 ? 1 : 0;
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }
// ---- dunia (meter) ----
const ROAD_HALF = 5.4, PAVED = 6.2, RAIL_X = 6.9, LANE_X = [-3.6, 0, 3.6], PW = 1.8, PL = 4.5, SCEN_LEN = 280;
const V_CRUISE = 28, V_MAX = 56, V_MIN = 6, CHILL_TIME = 180;
const CAR_COLORS = [{ n: 'Merah', c: 0xd8222a, css: '#d8222a' }, { n: 'Biru', c: 0x2a6ae0, css: '#2a6ae0' }, { n: 'Kuning', c: 0xf2b81c, css: '#f2b81c' }, { n: 'Putih', c: 0xf0f0f0, css: '#f0f0f0' }, { n: 'Hijau', c: 0x2a9a4a, css: '#2a9a4a' },
  { n: 'Hitam', c: 0x1b1c20, css: '#2a2b30' }, { n: 'Oranye', c: 0xf07a1a, css: '#f07a1a' }, { n: 'Ungu', c: 0x7a3ad8, css: '#7a3ad8' }, { n: 'Merah Muda', c: 0xff7ab8, css: '#ff7ab8' }, { n: 'Emas', c: 0xd8b040, css: '#d8b040' }];   // 5 pertama gratis, sisanya dibeli di Garasi
const FREE_COLORS = 5, PLAYER_KINDS = ['sedan', 'hatch', 'suv', 'mpv', 'coupe', 'pickup'], NEON_HEX = [null, 0x2ab8ff, 0x3aff8a, 0xb06aff, 0xff3a5a];
let FORCE_ENV = null, MAP_WET = 0, MAP_GRIP = 1;   // diatur peta (mis. Kota Malam: selalu malam & basah; Salju: licin)
const ENVS = [
  { n: '☀️ Siang', sky: [0x2a7be0, 0x7ec0ff, 0xd8efff], fog: 0xcfe8ff, hemi: [0xcfe0ff, 0x4a6a40, 1.0], sun: [0xffffff, 0.95], far: 0x8aaad0, grass: 0xffffff, lamps: 0, night: 0 },
  { n: '🌇 Senja', sky: [0x3a3a8a, 0xe0704a, 0xffc27a], fog: 0xf0a878, hemi: [0xffd0b0, 0x5a4a40, 0.75], sun: [0xffb070, 0.8], far: 0x9a6a7a, grass: 0xffc8a0, lamps: 0.6, night: 0.25 },
  { n: '🌙 Malam', sky: [0x050a24, 0x0e1a4a, 0x26306a], fog: 0x121838, hemi: [0x6a7ab8, 0x10142a, 0.55], sun: [0x8aa0ff, 0.25], far: 0x1a2450, grass: 0x6a78a8, lamps: 1, night: 1 }
];
const envNow = () => ENVS[(FORCE_ENV != null ? FORCE_ENV : settings.env) % ENVS.length];
