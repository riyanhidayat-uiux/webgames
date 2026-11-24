'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('ikuti_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ikuti_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rad = d => d * Math.PI / 180;
const SET_DEF = { tol: 5, dim: 0.4 };
const settings = Object.assign({ mute: false, song: 0 }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
