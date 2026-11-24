'use strict';
// ======================= SCENE 3D: JALAN RAYA =======================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.info.autoReset = false;   // dihitung per frame (semua pass) di loop
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xcfe8ff, 60, 250); scene.background = new THREE.Color(0xcfe8ff);
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; };
const rep = (t, x, y) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(x, y); return t; };
const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x4a6a40, 1), sun = new THREE.DirectionalLight(0xffffff, 0.9); sun.position.set(-20, 40, 15); scene.add(hemi, sun);
const headlight = new THREE.SpotLight(0xfff2cc, 0, 70, 0.5, 0.6); headlight.position.set(0, 1, -1.5); headlight.target.position.set(0, 0, -30); scene.add(headlight, headlight.target);

// --- langit gradasi, matahari, bintang, pegunungan ---
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
  vertexShader: 'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float vY; void main(){ float y = max(vY, 0.0); vec3 c = mix(bot, mid, smoothstep(0.0, 0.3, y)); c = mix(c, top, smoothstep(0.25, 0.9, y)); gl_FragColor = vec4(c, 1.0); }' });
const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), skyMat); dome.renderOrder = -10; scene.add(dome);
const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.25, 'rgba(255,230,160,.7)'); g.addColorStop(1, 'rgba(255,200,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return mkTex(c); })(), fog: false, depthWrite: false, blending: THREE.AdditiveBlending })); sunSpr.scale.set(120, 120, 1); scene.add(sunSpr);
const stars = (() => { const n = 500, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.2 + 0.1, r = 280; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false })); })(); scene.add(stars);
function ridge(w, h, amp, seed) { const c = mkCanvas(1024, 256), x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, 256); let y = 0; for (let i = 0; i <= 1024; i += 8) { y = 120 + Math.sin(i * 0.011 + seed) * amp + Math.sin(i * 0.033 + seed * 2) * amp * 0.4 + Math.sin(i * 0.09 + seed * 3) * amp * 0.12; x.lineTo(i, y); } x.lineTo(1024, 256); x.closePath(); x.fill(); return mkTex(c); }
const mountains = [[420, 70, -250, 0], [360, 42, -230, 3]].map(([w, h, z, sd]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, h), new THREE.MeshBasicMaterial({ map: ridge(w, h, 40, sd), transparent: true, fog: false, depthWrite: false })); m.position.set(0, h / 2 - 4, z); scene.add(m); return m; });

mountains.forEach(m => { m.material.userData.noBend = true; }); sunSpr.material.userData.noBend = true; stars.material.userData.noBend = true;   // latar jauh tidak ikut melengkung
// --- tanah & jalan (tekstur bergulir) ---
const ROAD_L = 24;
const roadTex = (() => {
  const W = 512, H = 1024, c = mkCanvas(W, H), x = c.getContext('2d'), U = v => (v + PAVED) / (PAVED * 2) * W, ppu = W / (PAVED * 2);
  x.fillStyle = '#3d4048'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { const r = rr(14, 60), g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, Math.random() < 0.5 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(Math.random() * W, Math.random() * H); x.scale(1, rr(1, 3)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill(); x.restore(); }
  LANE_X.forEach(lx => [-0.85, 0.85].forEach(wx => { const g = x.createLinearGradient(U(lx + wx) - 16, 0, U(lx + wx) + 16, 0); g.addColorStop(0, 'rgba(8,8,12,0)'); g.addColorStop(0.5, 'rgba(8,8,12,.22)'); g.addColorStop(1, 'rgba(8,8,12,0)'); x.fillStyle = g; x.fillRect(U(lx + wx) - 16, 0, 32, H); }));   // jejak roda
  const img = x.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 30; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(img, 0, 0);
  for (let i = 0; i < 1400; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(200,200,205,.2)' : 'rgba(10,10,12,.3)'; const s = rr(1, 2.2); x.fillRect(Math.random() * W, Math.random() * H, s, s); }
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.4; [[U(-4.5), 120], [U(3.0), 600], [U(-1), 860]].forEach(([px, py]) => { let X = px, Y = py; x.beginPath(); x.moveTo(X, Y); for (let k = 0; k < 14; k++) { X += rr(-6, 6); Y += rr(8, 16); x.lineTo(X, Y); } x.stroke(); });
  [300, 800].forEach(y => { x.fillStyle = 'rgba(6,6,8,.5)'; x.fillRect(0, y, W, 3); });                                           // sambungan aspal
  const paint = (px, py, w, h, col) => { x.fillStyle = col; x.fillRect(px, py, w, h); const dd = x.getImageData(px | 0, py | 0, Math.ceil(w), Math.ceil(h)); for (let i = 0; i < dd.data.length; i += 4) { if (Math.random() < 0.08) { dd.data[i] = 90; dd.data[i + 1] = 90; dd.data[i + 2] = 92; } else { const n = (Math.random() - 0.5) * 10; dd.data[i] += n; dd.data[i + 1] += n; dd.data[i + 2] += n; } } x.putImageData(dd, px | 0, py | 0); };
  const DASH = 3 * (H / ROAD_L), PER = 12 * (H / ROAD_L); [-1.8, 1.8].forEach(lx => { for (let k = 0; k < 2; k++) paint(U(lx) - 4, 20 + k * PER, 8, DASH, '#eceef2'); });
  paint(U(-ROAD_HALF) - 5, 0, 10, H, '#eceef2'); paint(U(ROAD_HALF) - 5, 0, 10, H, '#eceef2');
  x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(0, 0, 10, H); x.fillRect(W - 10, 0, 10, H);
  const t = rep(mkTex(c), 1, 300 / ROAD_L); return t;
})();
const road = new THREE.Mesh(new THREE.PlaneGeometry(PAVED * 2, 300, 1, 150), new THREE.MeshStandardMaterial({ map: roadTex, bumpMap: roadTex, bumpScale: 0.6, roughness: 0.9 })); road.rotation.x = -Math.PI / 2; road.position.z = -120; scene.add(road);
const grassTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#5b7a36'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, Math.random() < 0.5 ? 'rgba(120,140,50,.25)' : 'rgba(30,60,20,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(Math.random() * 128, Math.random() * 128); x.fillStyle = g; x.fillRect(-30, -30, 60, 60); x.restore(); } for (let i = 0; i < 1200; i++) { const px = Math.random() * 128, py = Math.random() * 128; x.strokeStyle = `hsl(${rr(72, 105)},${rr(35, 55)}%,${rr(20, 42)}%)`; x.beginPath(); x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - rr(3, 7)); x.stroke(); } return rep(mkTex(c), 60, 300 / 6); })();
const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }), grass = new THREE.Mesh(new THREE.PlaneGeometry(500, 300, 1, 150), grassMat); grass.rotation.x = -Math.PI / 2; grass.position.set(0, -0.12, -120); scene.add(grass);
// pagar pengaman (guardrail) dengan tekstur bergulir
const railTex = (() => { const c = mkCanvas(64, 128), x = c.getContext('2d'); x.fillStyle = '#b9bfc8'; x.fillRect(0, 0, 64, 128); for (let y = 0; y < 128; y += 4) { x.fillStyle = y % 8 ? 'rgba(255,255,255,.35)' : 'rgba(60,70,80,.35)'; x.fillRect(0, y, 64, 2); } x.fillStyle = '#5a6068'; x.fillRect(0, 0, 64, 10); x.fillRect(0, 64, 64, 10); return rep(mkTex(c), 1, 300 / 4); })();
const railMat = new THREE.MeshStandardMaterial({ map: railTex, metalness: 0.5, roughness: 0.4 });
const railMeshes = [];
[-1, 1].forEach(sd => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 300, 1, 1, 150), railMat); r.position.set(sd * RAIL_X, 0.55, -120); scene.add(r); railMeshes.push(r); });

// --- pemandangan di tepi jalan (didaur ulang) ---
const scen = []; const addScen = (o, x, z, extra) => { o.position.set(x, 0, z); scene.add(o); scen.push(Object.assign({ o, x, bz: z }, extra || {})); return o; };
// tiang lampu jalan + cahaya
const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.5, roughness: 0.5 }), bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0 });
const glowSprMat = new THREE.SpriteMaterial({ map: (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.3, 'rgba(255,220,120,.5)'); g.addColorStop(1, 'rgba(255,200,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return mkTex(c); })(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
const lampGlows = [];
for (let k = 0; k < 8; k++) [-1, 1].forEach(sd => {
  const g = new THREE.Group(), p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 7, 8), poleMat); p.position.y = 3.5; g.add(p);
  const a = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), poleMat); a.position.set(-sd * 1.0, 7, 0); g.add(a); const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), bulbMat); b.position.set(-sd * 2.0, 6.9, 0); g.add(b);
  const gl = new THREE.Sprite(glowSprMat.clone()); gl.scale.set(7, 7, 1); gl.position.set(-sd * 2.0, 6.9, 0); g.add(gl); lampGlows.push(gl); addScen(g, sd * 7.9, -k * (SCEN_LEN / 8) - (sd > 0 ? SCEN_LEN / 16 : 0), { sd, fixed: true });
});
// papan petunjuk & gedung jauh
const signTex = ['KOTA →', 'TOL 12 km', 'ISTIRAHAT', 'BANDARA ✈'].map(t => { const c = mkCanvas(256, 96), x = c.getContext('2d'); x.fillStyle = '#0a6a3a'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#fff'; x.lineWidth = 5; x.strokeRect(5, 5, 246, 86); x.fillStyle = '#fff'; x.font = 'bold 34px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 128, 50); return mkTex(c); });
for (let k = 0; k < 4; k++) { const g = new THREE.Group(); [-2, 2].forEach(px => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 5, 6), poleMat); l.position.set(px, 2.5, 0); g.add(l); }); const bd = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), new THREE.MeshBasicMaterial({ map: signTex[k], side: THREE.DoubleSide })); bd.position.y = 5.4; g.add(bd); g.rotation.y = 0.15; addScen(g, 11 + k * 0.5, -k * (SCEN_LEN / 4) - 40, { sd: 1, fixed: true }); }
function scrollWorld(d) {
  roadTex.offset.y += d / ROAD_L; grassTex.offset.y += d / GTILE; railTex.offset.y += d / 4; if (typeof mapScroll === 'function') mapScroll(d);
  for (const s of scen) { s.o.position.z += d; if (s.o.position.z > 25) { s.o.position.z -= SCEN_LEN; if (s.rx) { s.o.position.x = s.sd * rr(s.rx[0], s.rx[1]); if (s.yf) s.o.position.y = s.yf(s.o.position.x, s.bz); } } }
}
// fokus dunia ke titik z tertentu (kamera/mobil di z = zc): jalan, rumput, pagar, pemandangan, langit mengikuti -> dunia "mutlak" untuk balapan & layar terbelah
function focusWorld(zc) {
  const cz = zc - 100, wrap1 = v => ((v % 1) + 1) % 1;
  roadTex.offset.y = wrap1(-(cz + 150) / ROAD_L); grassTex.offset.y = wrap1(-(cz + 150) / GTILE); railTex.offset.y = wrap1(-(cz + 150) / 4); if (typeof mapFocus === 'function') mapFocus(cz);
  road.position.z = cz; grass.position.z = cz; railMeshes.forEach(r => { r.position.z = cz; });
  for (const it of scen) { const k = Math.ceil((zc - 215 - it.bz) / SCEN_LEN); it.o.position.z = it.bz + k * SCEN_LEN; }
  dome.position.z = zc; stars.position.z = zc; sunSpr.position.z = zc - 270; mountains.forEach((m, i) => { m.position.z = zc + (i ? -230 : -250); });
}
// --- lingkungan (siang/senja/malam) ---
const _c = new THREE.Color();
function applyEnv(i) {
  const E = ENVS[(FORCE_ENV != null ? FORCE_ENV : i) % ENVS.length]; skyMat.uniforms.top.value.setHex(E.sky[0]); skyMat.uniforms.mid.value.setHex(E.sky[1]); skyMat.uniforms.bot.value.setHex(E.sky[2]);
  scene.fog.color.setHex(E.fog); scene.background.setHex(E.fog); scene.fog.near = E.night > 0.9 ? 30 : 60; scene.fog.far = E.night > 0.9 ? 190 : 250;
  hemi.color.setHex(E.hemi[0]); hemi.groundColor.setHex(E.hemi[1]); hemi.intensity = E.hemi[2]; sun.color.setHex(E.sun[0]); sun.intensity = E.sun[1];
  grassMat.color.setHex(E.grass); mountains.forEach(m => { m.material.color.setHex(E.far); }); stars.material.opacity = clamp((E.night - 0.5) / 0.5, 0, 1);
  lampGlows.forEach(g => { g.material.opacity = E.lamps * 0.9; }); sunSpr.material.color.setHex(E.sun[0]); sunSpr.position.set(-60, E.night > 0.9 ? 80 : E.night > 0 ? 18 : 60, -270); sunSpr.visible = E.night < 0.9;
  headlight.intensity = E.night > 0.2 ? 1.6 : 0; if (window.carEnvReady) drawEnvFaces(E); if (typeof applyBuildingEnv === 'function') applyBuildingEnv(E);
  if (typeof applyMap === 'function') applyMap(E);
  if (typeof applyWeather === 'function') applyWeather(E);
  if (typeof updateCarEnv === 'function') updateCarEnv(E);
}
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
applyEnv(settings.env);
