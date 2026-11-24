'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('senam_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('senam_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const SET_DEF = { tol: 5, voice: true, dim: 0.35 };
const settings = Object.assign({ mute: false, prog: 1 }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
const HI = () => 1.02 - 0.03 * settings.tol, LO = 0.35;       // ambang tercapai / kembali (satuan amplitudo)
