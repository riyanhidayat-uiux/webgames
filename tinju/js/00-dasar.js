'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('tinju_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tinju_' + k, JSON.stringify(v)); } catch (e) {} }
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t, rr = (a, b) => a + Math.random() * (b - a);
const SET_DEF = { sens: 5, prev: true };
const settings = Object.assign({ mute: false, diff: 1 }, SET_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
