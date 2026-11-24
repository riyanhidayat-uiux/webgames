'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('bad3d_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bad3d_' + k, JSON.stringify(v)); } catch (e) {} }
};
const CAM_DEF = { range: 0.8, smooth: 0.35 };
const settings = Object.assign({ mute: false, diff: 1 }, CAM_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
