'use strict';
const $ = id => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('ular3d_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ular3d_' + k, JSON.stringify(v)); } catch (e) {} }
};

// ---------- konstanta ----------
const N = 18;                                  // ukuran papan (N x N)
const DIRS = { U: { x: 0, y: -1, k: 'U' }, D: { x: 0, y: 1, k: 'D' }, L: { x: -1, y: 0, k: 'L' }, R: { x: 1, y: 0, k: 'R' } };
const ARROW = { U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' };
const wx = i => i - (N - 1) / 2, wz = j => j - (N - 1) / 2;   // sel -> dunia
const CAM_DEF = { sens: 6, confirm: 2, ratio: 1.15 };
const settings = Object.assign({ wrap: false, prev: true, mute: false }, CAM_DEF, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);
