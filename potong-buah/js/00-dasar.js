'use strict';
const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');

// ---------- storage ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('bns_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bns_' + k, JSON.stringify(v)); } catch (e) {} }
};
const settings = Object.assign({ sens: 1.2, flick: 1, invY: false, mute: false, camRange: 0.75, camPreview: true, timed: true, music: true }, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
function makeBlade(minSpeed, owner) { return { pts: [], prev: null, minSpeed, owner, combo: 0, comboT: 0, cx: 0, cy: 0, lastSwoosh: 0, dead: false, sw: false }; }
