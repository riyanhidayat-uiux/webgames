'use strict';
// ======================= CUACA =======================
// Cerah · Gerimis · Badai (hujan lebat + petir) · Kabut. Memengaruhi tampilan (langit kelabu, kabut, jalan basah, butiran hujan),
// suara (hujan, guruh), dan fisika (grip: setir & rem kurang responsif, tarikan keluar di tikungan lebih kuat).
const WEATHERS = [
  { n: '☀️ Cerah', rain: 0, fogK: 1, grip: 1, dark: 0, wet: 0, help: 'Jalan kering, visibilitas penuh.' },
  { n: '🌦️ Gerimis', rain: 0.4, fogK: 0.8, grip: 0.9, dark: 0.15, wet: 0.6, help: 'Gerimis: jalan agak licin, setir & rem sedikit kurang responsif.' },
  { n: '⛈️ Badai', rain: 1, fogK: 0.55, grip: 0.78, dark: 0.35, wet: 1, storm: true, help: 'Badai: hujan lebat & petir, jalan licin, jarak pandang pendek. Mobil lebih mudah tertarik keluar di tikungan!' },
  { n: '🌫️ Kabut', rain: 0, fogK: 0.3, grip: 0.95, dark: 0.1, wet: 0.2, mist: true, help: 'Kabut tebal: jarak pandang sangat pendek, mobil muncul mendadak.' }
];
const WX = () => WEATHERS[settings.weather | 0] || WEATHERS[0];
const wx = { n: 0, fall: 16, wind: 0, lt: 0, lt2: 0, nextLt: 7, thunder: -1, hemiBase: 1, ra: null };

// --- butiran hujan: garis pendek relatif terhadap kamera (jatuh + tertiup ke arah mobil karena kecepatan) ---
const RAIN_N = 900, rainPos = new Float32Array(RAIN_N * 6), rainD = new Float32Array(RAIN_N * 3), rainG = new THREE.BufferGeometry();
rainG.setAttribute('position', new THREE.BufferAttribute(rainPos, 3)); rainG.setDrawRange(0, 0);
const rainMat = new THREE.LineBasicMaterial({ color: 0xdfe9ff, transparent: true, opacity: 0.38, depthWrite: false, fog: false }); rainMat.userData.noBend = true;
const rainMesh = new THREE.LineSegments(rainG, rainMat); rainMesh.frustumCulled = false; rainMesh.renderOrder = 20; rainMesh.visible = false; rainMesh.userData.on = false; scene.add(rainMesh);
for (let i = 0; i < RAIN_N; i++) { rainD[i * 3] = rr(-15, 15); rainD[i * 3 + 1] = rr(-2.5, 13); rainD[i * 3 + 2] = rr(-55, 6); }
const rainAt = cam => { rainMesh.position.copy(cam.position); };

// --- jalan basah: lapisan pantulan langit yang makin kuat ke kejauhan (sudut datar) ---
const sheenMat = new THREE.MeshBasicMaterial({ map: (() => { const c = mkCanvas(4, 256), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,1)'); g.addColorStop(0.88, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 4, 256); return mkTex(c); })(), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
const sheen = new THREE.Mesh(new THREE.PlaneGeometry(PAVED * 2, 300, 1, 150), sheenMat); sheen.position.z = 0.02; sheen.visible = false; road.add(sheen);

const _gc = new THREE.Color(), grayTo = (c, k, dark) => { const l = (c.r + c.g + c.b) / 3; _gc.setRGB(l * 0.92, l * 0.96, l); c.lerp(_gc, k); c.multiplyScalar(1 - dark); };
// dipanggil di akhir applyEnv(): mengubah warna/kabut/cahaya yang baru diatur sesuai cuaca
function applyWeather(E) {
  const W = WX(), k = clamp(W.dark * 2.4, 0, 0.85), d = W.dark * 0.45;
  if (W.dark > 0) {
    ['top', 'mid', 'bot'].forEach(n => grayTo(skyMat.uniforms[n].value, k, d)); grayTo(scene.fog.color, k, d); scene.background.copy(scene.fog.color);
    mountains.forEach(m => grayTo(m.material.color, k, d)); grayTo(grassMat.color, k * 0.4, d * 0.6); hemi.intensity *= 1 - W.dark * 0.6; sun.intensity *= 1 - W.dark * 0.85;
    stars.material.opacity *= clamp(1 - W.dark * 2.5, 0, 1);
  }
  scene.fog.far *= W.fogK; scene.fog.near = Math.max(4, scene.fog.near * W.fogK); sunSpr.visible = sunSpr.visible && !(W.rain || W.mist);
  const wet = Math.max(W.wet, MAP_WET); road.material.roughness = lerp(0.9, 0.28, wet); road.material.color.setScalar(1 - 0.3 * wet);
  sheenMat.color.copy(scene.fog.color).lerp(_gc.setRGB(1, 1, 1), 0.2); sheenMat.opacity = 0.5 * wet * (1 - E.night * 0.45); sheen.visible = wet > 0;
  const night = E.night > 0.5; rainMat.color.setHex(night ? 0x8aa0d8 : 0xdfe9ff); rainMat.opacity = (night ? 0.5 : 0.38) * (0.6 + 0.4 * W.rain);
  if (typeof SH !== 'undefined' && SH.on) { hemi.intensity *= 0.8; sun.intensity *= 1.32; }   // bayangan aktif: kurangi cahaya langit, perkuat matahari agar bayangan terlihat (terang total ± sama)
  wx.n = Math.round(RAIN_N * W.rain * (W.storm ? 1 : 0.45) * (typeof GFXC !== 'undefined' ? GFXC.rain : 1)); wx.fall = 14 + 10 * W.rain; wx.wind = W.storm ? -3 : -0.8; wx.hemiBase = hemi.intensity;
  rainG.setDrawRange(0, wx.n * 2); rainMesh.userData.on = wx.n > 0; rainMesh.visible = wx.n > 0;
}
function rainSound(level) {
  if (!AC || !noiseBuf) return;
  if (level > 0.01) {
    if (!wx.ra) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1100; const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000; const g = AC.createGain(); g.gain.value = 0; s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); s.start(); wx.ra = { s, g }; }
    wx.ra.g.gain.setTargetAtTime(level * 0.085, AC.currentTime, 0.4);
  } else if (wx.ra) { const r = wx.ra; wx.ra = null; try { r.g.gain.setTargetAtTime(0, AC.currentTime, 0.2); setTimeout(() => { try { r.s.stop(); } catch (e) {} }, 900); } catch (e) {} }
}
function thunderSound() { if (!on()) return; noise(2.4, 'lowpass', 240, 0.6, 50); tone(1.4, 70, 32, 0.32, 'sine'); }
// per frame: simulasi hujan, petir, suara. v = kecepatan mobil (m/s)
function weatherFrame(dt, v) {
  const W = WX(), active = state === 'play' || state === 'count' || state === 'dying' || state === 'calib';
  if (wx.n > 0) {
    const fall = wx.fall, wind = wx.wind, spd = active ? v : 4;
    for (let i = 0; i < wx.n; i++) {
      const j = i * 3; let x = rainD[j] + wind * dt, y = rainD[j + 1] - fall * dt, z = rainD[j + 2] + spd * dt;
      if (y < -2.5) { x = rr(-15, 15); y = rr(3, 13); z = rr(-55, 6); } else if (z > 7) { x = rr(-15, 15); y = rr(-1, 13); z = -50 - rr(0, 10); }
      rainD[j] = x; rainD[j + 1] = y; rainD[j + 2] = z; const o = i * 6; rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 2] = z; rainPos[o + 3] = x - wind * 0.03; rainPos[o + 4] = y + fall * 0.03; rainPos[o + 5] = z - spd * 0.03;
    }
    rainG.attributes.position.needsUpdate = true;
  }
  // petir (hanya saat badai & bermain): kilat berkedip dua kali lalu guruh menyusul
  if (W.storm && state === 'play') {
    wx.nextLt -= dt; if (wx.nextLt <= 0) { wx.lt = 1; wx.lt2 = 0.13; wx.thunder = 0.5 + Math.random() * 2; wx.nextLt = 6 + Math.random() * 9; }
  }
  if (wx.lt2 > 0) { wx.lt2 -= dt; if (wx.lt2 <= 0) wx.lt = Math.max(wx.lt, 0.8); }
  if (wx.thunder > 0) { wx.thunder -= dt; if (wx.thunder <= 0) { thunderSound(); if (typeof shake !== 'undefined') shake = Math.max(shake, 0.25); } }
  wx.lt = Math.max(0, wx.lt - dt * 3.5); hemi.intensity = wx.hemiBase + wx.lt * 2.2; const lg = $('lightning'); if (lg) lg.style.opacity = settings.reduceFx ? 0 : (wx.lt * 0.55).toFixed(2);
  rainSound(active && !settings.mute ? W.rain * (W.storm ? 1 : 0.55) : 0);
}
applyEnv(settings.env);
