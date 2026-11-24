'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('lari_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lari_' + k, JSON.stringify(v)); } catch (e) {} }
};
const SET_DEF = { lean: 6, jump: 6, duck: 6 };
const settings = Object.assign({ mute: false, prev: true }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const thrLean = () => 1.15 - 0.1 * settings.lean;      // geser badan (dalam lebar bahu)
const thrJump = () => 0.46 - 0.04 * settings.jump;     // bahu jauh di atas posisi netral (mutlak)
const thrRise = () => 0.2 - 0.012 * settings.jump;     // minimal naik cepat (lebar bahu)
const thrVel = () => 2.4 - 0.2 * settings.jump;        // kecepatan naik minimal (lebar bahu / detik)
const thrDuck = () => 0.6 - 0.04 * settings.duck;      // bahu turun
