'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('penalti_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('penalti_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rr = (a, b) => a + Math.random() * (b - a), pick = a => a[(Math.random() * a.length) | 0], sgn = v => v < 0 ? -1 : 1;
const SET_DEF = { sens: 5, aim: 0, skill: 1, atmo: 0, team: 0, mode: 0, dim: 0 };
const settings = Object.assign({ mute: false }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
const show = (id, on) => $(id).classList.toggle('hidden', !on);
let toastTimer = 0;
function toast(msg, ms = 3000) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), ms); }
// ---- ukuran sebenarnya (meter), sumbu: x kanan, y atas, z menuju penendang; garis gawang z = 0 ----
const GOAL_W = 7.32, GOAL_H = 2.44, GOAL_D = 2.0, SPOT_Z = 11, POST_R = 0.06, BALL_R = 0.11, BALL_M = 0.43, GRAV = 9.81;
const TEAMS = [{ n: 'Garuda', c1: 0xd8222a, c2: 0xffffff, sh: 0xffffff }, { n: 'Samudra', c1: 0x1f5ad8, c2: 0xffffff, sh: 0x10306a }, { n: 'Rimba', c1: 0x1f9a4a, c2: 0xf2f2f2, sh: 0x0e4a24 }, { n: 'Mentari', c1: 0xf2c21c, c2: 0x222222, sh: 0x222222 }, { n: 'Petir', c1: 0x7a3ad8, c2: 0xffffff, sh: 0x3a1a6a }, { n: 'Langit', c1: 0x62c8f0, c2: 0xffffff, sh: 0xffffff }];
const SKILLS = [{ n: '😊 Pemula', read: 0.18, react: 0.12, dive: 0.85, acc: 0.55 }, { n: '😎 Profesional', read: 0.34, react: 0.03, dive: 1.0, acc: 0.38 }, { n: '🔥 Kelas Dunia', read: 0.5, react: -0.05, dive: 1.15, acc: 0.26 }];
const MODES = ['⚽ Adu Penalti (tendang & jaga gawang)', '🎯 Latihan Menendang (10 tendangan)'];
