'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('boling_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('boling_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rr = (a, b) => a + Math.random() * (b - a);
const SET_DEF = { sens: 5, hand: 0, assist: true, dim: 0 };      // hand: 0 otomatis, 1 kanan, 2 kiri
const settings = Object.assign({ mute: false, ball: 0 }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
function say(text, color) { const m = $('msg'); m.textContent = text; m.style.color = color || '#fff'; m.classList.remove('show'); void m.offsetWidth; m.classList.add('show'); }

// ---- ukuran dunia (1 satuan ≈ 2x ukuran asli agar pin terlihat jelas) ----
const LANE_W = 2.13, GUT_W = 0.5, Z_START = 1.6, Z_HEAD = -24, PIN_DX = 0.62, PIN_DZ = 0.536, BALL_R = 0.22, PIN_R = 0.11, PIN_H = 0.7;
const Z_PIT = -26.45, Z_BACK = -27.7, Z_NEAR = 8, Z_FAR = -27.7;
const BALLS = [{ n: 'Biru', c: 0x2a6ae0, c2: 0x9ad8ff, css: '#2a6ae0' }, { n: 'Merah', c: 0xd8322a, c2: 0xffb09a, css: '#d8322a' }, { n: 'Hijau', c: 0x1f9a4a, c2: 0xa8f0b8, css: '#1f9a4a' }, { n: 'Ungu', c: 0x7a3ad8, c2: 0xd8b8ff, css: '#7a3ad8' }, { n: 'Oranye', c: 0xe87a1e, c2: 0xffd89a, css: '#e87a1e' }];
const POWER_MIN = 13, POWER_MAX = 21;     // kecepatan bola (satuan/detik)
