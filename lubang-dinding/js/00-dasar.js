'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('lubang_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('lubang_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const SET_DEF = { tol: 5 };
const settings = Object.assign({ mute: false, prev: true, diff: 1, music: true, pracSpeed: 1, pracPoses: [], legs: true }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
