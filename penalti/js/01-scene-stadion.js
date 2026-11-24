'use strict';
// ======================= SCENE 3D: STADION =======================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x0a1426, 70, 260); scene.background = new THREE.Color(0x0a1426);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 600);
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const mkTex = c => { const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t; };
const hemi = new THREE.HemisphereLight(0x8aa0d8, 0x1a3a1a, 0.6), sun = new THREE.DirectionalLight(0xfff4e0, 0.95);
sun.position.set(-9, 24, 16); sun.target.position.set(0, 0, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 14, bottom: -14, near: 5, far: 70 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
scene.add(hemi, sun, sun.target);
// --- langit ---
const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
  vertexShader: 'varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying float vY; void main(){ float y = max(vY, 0.0); vec3 c = mix(bot, mid, smoothstep(0.0, 0.3, y)); c = mix(c, top, smoothstep(0.25, 0.9, y)); gl_FragColor = vec4(c, 1.0); }' });
const dome = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat); dome.renderOrder = -10; scene.add(dome);
const stars = (() => { const n = 700, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, e = Math.random() * 1.2 + 0.15, r = 400; p[i * 3] = Math.cos(a) * Math.cos(e) * r; p[i * 3 + 1] = Math.sin(e) * r; p[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.8, fog: false, depthWrite: false })); })(); scene.add(stars);
// --- lapangan: rumput bergaris (potongan mesin), garis putih resmi ---
const PITCH_W = 68, PITCH_L = 80, PITCH_Z0 = -20;       // x ∈ [-34,34], z ∈ [-20,60]
const pitchTex = (() => {
  const W = 2048, H = 2048, c = mkCanvas(W, H), x = c.getContext('2d'), X = m => (m + PITCH_W / 2) / PITCH_W * W, Z = m => (m - PITCH_Z0) / PITCH_L * H;
  for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#2f7a2b' : '#3a8a33'; x.fillRect(0, i * H / 16, W, H / 16 + 1); }
  for (let i = 0; i < 18000; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; const s = rr(1, 4); x.fillRect(Math.random() * W, Math.random() * H, s, s * rr(1, 3)); }
  for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 90); g.addColorStop(0, Math.random() < 0.5 ? 'rgba(90,120,40,.18)' : 'rgba(10,40,10,.18)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.translate(Math.random() * W, Math.random() * H); x.fillStyle = g; x.fillRect(-90, -90, 180, 180); x.restore(); }
  x.strokeStyle = 'rgba(245,245,240,.94)'; x.fillStyle = 'rgba(245,245,240,.94)'; x.lineWidth = 0.13 * W / PITCH_W; x.lineCap = 'butt';
  const L = (a, b, c2, d) => { x.beginPath(); x.moveTo(X(a), Z(b)); x.lineTo(X(c2), Z(d)); x.stroke(); };
  L(-34, 0, 34, 0); L(-34, 0, -34, 60); L(34, 0, 34, 60); L(-34, 60, 34, 60);                                   // garis gawang, garis samping, garis tengah
  L(-20.16, 16.5, 20.16, 16.5); L(-20.16, 0, -20.16, 16.5); L(20.16, 0, 20.16, 16.5);                               // kotak penalti
  L(-9.16, 5.5, 9.16, 5.5); L(-9.16, 0, -9.16, 5.5); L(9.16, 0, 9.16, 5.5);                                         // kotak gawang
  x.beginPath(); x.arc(X(0), Z(11), 0.16 * W / PITCH_W, 0, 6.283); x.fill();                                         // titik penalti
  x.beginPath(); for (let t = -0.93; t <= 0.93; t += 0.02) { const px = X(9.15 * Math.sin(t)), pz = Z(11 + 9.15 * Math.cos(t)); t === -0.93 ? x.moveTo(px, pz) : x.lineTo(px, pz); } x.stroke();   // busur penalti
  x.beginPath(); x.arc(X(0), Z(60), 9.15 * W / PITCH_W, 0, Math.PI); x.stroke();
  const t = mkTex(c); return t;
})();
const pitch = new THREE.Mesh(new THREE.PlaneGeometry(PITCH_W, PITCH_L), new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.95 })); pitch.rotation.x = -Math.PI / 2; pitch.position.set(0, 0, PITCH_Z0 + PITCH_L / 2); pitch.receiveShadow = true; scene.add(pitch);
const apronTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'); x.fillStyle = '#1f5a22'; x.fillRect(0, 0, 128, 128); for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '0,0,0'},.06)`; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 3); } const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); return t; })();
const apron = new THREE.Mesh(new THREE.PlaneGeometry(180, 200), new THREE.MeshStandardMaterial({ map: apronTex, roughness: 1 })); apron.rotation.x = -Math.PI / 2; apron.position.set(0, -0.02, 20); apron.receiveShadow = true; scene.add(apron);
// bekas injakan di sekitar titik penalti
const spotScuff = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(120,100,60,.55)'); g.addColorStop(0.5, 'rgba(90,100,50,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return mkTex(c); })();
[[0, SPOT_Z, 1.6], [0, 0.9, 5.2]].forEach(([x, z, s]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * (z < 2 ? 0.55 : 1)), new THREE.MeshBasicMaterial({ map: spotScuff, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z); scene.add(m); });
// --- gawang resmi: lebar 7,32 m, tinggi 2,44 m, tiang bulat Ø12 cm ---
const goalG = new THREE.Group(); scene.add(goalG);
const postMat = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.3, metalness: 0.35 });
const PX = GOAL_W / 2 + POST_R, BARY = GOAL_H + POST_R, NET_D = 1.85;
[-1, 1].forEach(sd => {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(POST_R, POST_R, BARY + POST_R, 16), postMat); p.position.set(sd * PX, (BARY + POST_R) / 2, 0); p.castShadow = true; goalG.add(p);
  const len = Math.hypot(NET_D + 0.25, BARY), st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 8), postMat); st.position.set(sd * PX, BARY / 2, -(NET_D + 0.25) / 2); st.rotation.x = Math.atan2(NET_D + 0.25, BARY); st.castShadow = true; goalG.add(st);
  const gb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, NET_D + 0.25, 8), postMat); gb.rotation.x = Math.PI / 2; gb.position.set(sd * PX, 0.03, -(NET_D + 0.25) / 2); goalG.add(gb);
});
const bar = new THREE.Mesh(new THREE.CylinderGeometry(POST_R, POST_R, GOAL_W + POST_R * 4, 16), postMat); bar.rotation.z = Math.PI / 2; bar.position.set(0, BARY, 0); bar.castShadow = true; goalG.add(bar);
const rearBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, GOAL_W + POST_R * 2, 8), postMat); rearBar.rotation.z = Math.PI / 2; rearBar.position.set(0, 0.03, -(NET_D + 0.25)); goalG.add(rearBar);
const netTex = (() => { const c = mkCanvas(64, 64), x = c.getContext('2d'); x.strokeStyle = 'rgba(245,245,245,.85)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, 0); x.lineTo(64, 64); x.moveTo(64, 0); x.lineTo(0, 64); x.moveTo(0, 32); x.lineTo(32, 64); x.moveTo(32, 0); x.lineTo(64, 32); x.moveTo(0, 32); x.lineTo(32, 0); x.moveTo(32, 64); x.lineTo(64, 32); x.stroke(); const t = mkTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const netMat = (rx, ry) => { const t = netTex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0.9, fog: true }); };
// jaring belakang bisa melentur (simulasi pegas); jaring atap & samping statis
const NET_SEG_X = 44, NET_SEG_Y = 16, netGeo = new THREE.PlaneGeometry(GOAL_W + 0.12, GOAL_H - 0.06, NET_SEG_X, NET_SEG_Y);
const netBase = netGeo.attributes.position.array.slice(), netN = (NET_SEG_X + 1) * (NET_SEG_Y + 1), netDz = new Float32Array(netN), netVz = new Float32Array(netN);
const backNet = new THREE.Mesh(netGeo, netMat((GOAL_W) / 0.14, GOAL_H / 0.14)); backNet.position.set(0, GOAL_H / 2, -NET_D); goalG.add(backNet);
const topNet = new THREE.Mesh(new THREE.PlaneGeometry(GOAL_W + 0.12, NET_D), netMat(GOAL_W / 0.14, NET_D / 0.14)); topNet.rotation.x = Math.PI / 2 + 0.06; topNet.position.set(0, GOAL_H + 0.01, -NET_D / 2); goalG.add(topNet);
[-1, 1].forEach(sd => { const s = new THREE.Mesh(new THREE.PlaneGeometry(NET_D, GOAL_H), netMat(NET_D / 0.14, GOAL_H / 0.14)); s.rotation.y = Math.PI / 2; s.position.set(sd * (GOAL_W / 2 + 0.01), GOAL_H / 2, -NET_D / 2); goalG.add(s); });
let netHitT = 0;
function netImpulse(x, y, strength) {   // bola menghantam jaring belakang: dorong ke belakang di sekitar titik tumbukan
  for (let j = 0; j <= NET_SEG_Y; j++) for (let i = 0; i <= NET_SEG_X; i++) { const k = j * (NET_SEG_X + 1) + i, px = netBase[k * 3], py = netBase[k * 3 + 1] + GOAL_H / 2, d2 = (px - x) * (px - x) + (py - y) * (py - y); netVz[k] -= strength * Math.exp(-d2 / 0.55); }
}
function updateNet(dt) {
  const w = NET_SEG_X + 1, pos = netGeo.attributes.position.array, n = Math.max(1, Math.ceil(dt / 0.008)), h = dt / n; let moving = false;
  for (let s = 0; s < n; s++) for (let j = 1; j < NET_SEG_Y; j++) for (let i = 1; i < NET_SEG_X; i++) { const k = j * w + i, lap = netDz[k - 1] + netDz[k + 1] + netDz[k - w] + netDz[k + w] - 4 * netDz[k]; netVz[k] += (60 * lap - 22 * netDz[k] - 2.6 * netVz[k]) * h; }
  for (let k = 0; k < netN; k++) { const j = Math.floor(k / w), i = k % w; if (i === 0 || j === 0 || i === NET_SEG_X || j === NET_SEG_Y) { netDz[k] = 0; netVz[k] = 0; } else netDz[k] += netVz[k] * dt; if (Math.abs(netDz[k]) > 0.002) moving = true; pos[k * 3 + 2] = netBase[k * 3 + 2] + netDz[k]; }
  if (moving || netHitT > 0) { netGeo.attributes.position.needsUpdate = true; netHitT = moving ? 1 : 0; }
}
// --- tribun + penonton (instancing, bergoyang saat heboh) ---
const standRows = 24, rowD = 0.85, rowH = 0.52, crowdItems = [];
function stairGeo(len) { const pts = [[0, 0]]; for (let i = 0; i < standRows; i++) { pts.push([i * rowD, 1.0 + i * rowH], [(i + 1) * rowD, 1.0 + i * rowH]); } pts.push([standRows * rowD, 0]); const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); g.translate(0, 0, -len / 2); return g; }
const concreteMat = new THREE.MeshStandardMaterial({ color: 0x59606c, roughness: 0.95 });
function addStand(ox, oz, ax, az, bx, bz, len, density) {
  // lokal: u sepanjang (ax,az), d keluar (bx,bz) menjauhi lapangan
  const m = new THREE.Mesh(stairGeo(len), concreteMat), ang = Math.atan2(-bz, bx);     // bentuk (x=kedalaman, z=panjang) diputar ke arah B
  m.rotation.y = Math.atan2(-az, ax) * 0 + Math.atan2(-bz, bx) * 1; m.position.set(ox, 0, oz); m.rotation.y = Math.atan2(-bz, bx); scene.add(m);
  for (let r = 0; r < standRows; r++) for (let u = -len / 2 + 0.3; u < len / 2 - 0.3; u += 0.56) { if (Math.random() > density) continue; const d = r * rowD + 0.42 + rr(-0.05, 0.05), h = 1.0 + r * rowH + 0.5; crowdItems.push({ x: ox + ax * (u + rr(-0.08, 0.08)) + bx * d, y: h, z: oz + az * (u + rr(-0.08, 0.08)) + bz * d, yaw: Math.atan2(-bx, -bz), s: rr(0.92, 1.1), row: r }); }
}
addStand(0, -13, 1, 0, 0, -1, 118, 0.9);      // belakang gawang
addStand(-40, 24, 0, 1, -1, 0, 88, 0.88);      // sisi kiri
addStand(40, 24, 0, 1, 1, 0, 88, 0.88);        // sisi kanan
addStand(0, 68, 1, 0, 0, 1, 118, 0.7);         // belakang penendang
const crowdGeo = (() => { const torso = new THREE.BoxGeometry(0.44, 0.62, 0.3).translate(0, 0.0, 0), head = new THREE.SphereGeometry(0.15, 8, 6).translate(0, 0.46, 0), parts = [[torso, 0], [head, 1]]; let n = 0; parts.forEach(([g]) => n += g.attributes.position.count); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), part = new Float32Array(n), idx = []; let o = 0; parts.forEach(([g, p]) => { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); for (let i = 0; i < c; i++) part[o + i] = p; if (g.index) g.index.array.forEach(v => idx.push(v + o)); o += c; }); const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('part', new THREE.BufferAttribute(part, 1)); G.setIndex(idx); return G; })();
const crowdMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uExc: { value: 0.1 }, uLight: { value: 0.8 }, uFog: { value: new THREE.Color(0x0a1426) }, uFogN: { value: 70 }, uFogF: { value: 260 } },
  vertexShader: 'attribute float part; uniform float uTime; uniform float uExc; uniform float uFogN; uniform float uFogF; varying vec3 vCol; varying float vShade; varying float vPart; varying float vFog; varying float vFlash;\nvoid main(){ vec4 wp = instanceMatrix * vec4(position, 1.0); float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.53; float bob = max(0.0, sin(uTime * (5.0 + 3.0 * fract(ph)) + ph * 6.28)) * uExc * 0.3; wp.y += bob * (0.6 + part * 0.4);\n#ifdef USE_INSTANCING_COLOR\n vCol = instanceColor;\n#else\n vCol = vec3(0.5);\n#endif\n vShade = 0.55 + 0.45 * clamp(normal.y * 0.5 + 0.5, 0.0, 1.0); vPart = part; float fl = step(0.9985, fract(sin(ph * 91.7 + floor(uTime * 3.0 + ph * 5.0)) * 437.58)); vFlash = fl; vec4 mv = viewMatrix * wp; vFog = smoothstep(uFogN, uFogF, length(mv.xyz)); gl_Position = projectionMatrix * mv; }',
  fragmentShader: 'uniform vec3 uFog; uniform float uLight; varying vec3 vCol; varying float vShade; varying float vPart; varying float vFog; varying float vFlash;\nvoid main(){ vec3 c = vPart > 0.5 ? vec3(0.86, 0.66, 0.52) * (0.8 + 0.2 * vCol.r) : vCol; c *= vShade * uLight; c += vFlash * vec3(1.3, 1.3, 1.2); gl_FragColor = vec4(mix(c, uFog, vFog), 1.0); }' });
const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, crowdItems.length); crowd.frustumCulled = false; crowd.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(crowdItems.length * 3), 3);
(() => { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(), pal = [0xd8222a, 0xd8222a, 0xffffff, 0x2a4ad8, 0xf2c21c, 0x222222, 0x1f9a4a, 0xf0f0f0, 0xe87a1e, 0x7a3ad8]; crowdItems.forEach((it, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), it.yaw); p.set(it.x, it.y, it.z); s.setScalar(it.s); m.compose(p, q, s); crowd.setMatrixAt(i, m); c.setHex(pick(pal)).multiplyScalar(rr(0.7, 1.1)); crowd.setColorAt(i, c); }); })(); scene.add(crowd);
// --- papan iklan LED, menara lampu sorot ---
const adTex = (() => { const names = ['GARUDA AIR', 'NUSA BANK', 'KOPI SAKTI', 'TIRTA', 'SINAR MOTOR', 'BUMI FOOD', 'LANGIT TV', 'CEPAT.NET'], cols = ['#d8222a', '#1f5ad8', '#4a2a10', '#1f9a4a', '#f2c21c', '#e87a1e', '#7a3ad8', '#12a0c8']; const c = mkCanvas(2048, 64), x = c.getContext('2d'); names.forEach((n, i) => { x.fillStyle = cols[i]; x.fillRect(i * 256, 0, 256, 64); x.fillStyle = '#fff'; x.font = 'bold 34px system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, i * 256 + 128, 34); x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(i * 256, 0, 3, 64); }); const t = mkTex(c); t.wrapS = THREE.RepeatWrapping; t.repeat.set(2.2, 1); return t; })();
const adMat = new THREE.MeshBasicMaterial({ map: adTex, color: 0xdddddd });
function addBoard(x, z, w, ry) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.0), adMat); m.position.set(x, 0.6, z); m.rotation.y = ry; scene.add(m); const b = new THREE.Mesh(new THREE.BoxGeometry(w, 1.04, 0.1), new THREE.MeshStandardMaterial({ color: 0x15171c })); b.position.set(x, 0.58, z + (Math.abs(ry) < 0.1 ? -0.07 : 0)); b.rotation.y = ry; if (Math.abs(ry) > 0.1) b.position.x = x + (ry > 0 ? -0.07 : 0.07); scene.add(b); }
addBoard(0, -10.5, 110, 0); addBoard(-37, 25, 72, Math.PI / 2); addBoard(37, 25, 72, -Math.PI / 2); addBoard(0, 64, 110, Math.PI);
const lightGlowTex = (() => { const c = mkCanvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.2, 'rgba(255,250,220,.55)'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return mkTex(c); })();
const flood = [];
[[-46, -16], [46, -16], [-46, 54], [46, 54]].forEach(([x, z]) => { const g = new THREE.Group(), pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 36, 8), new THREE.MeshStandardMaterial({ color: 0x3a4250, roughness: 0.6 })); pole.position.y = 18; g.add(pole); const head = new THREE.Mesh(new THREE.BoxGeometry(9, 5, 0.6), new THREE.MeshBasicMaterial({ color: 0xfffff0 })); head.position.y = 37; g.add(head); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: lightGlowTex, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 1 })); gl.scale.set(60, 60, 1); gl.position.y = 37; g.add(gl); flood.push(gl); g.position.set(x, 0, z); g.lookAt(0, 37, 20); scene.add(g); });
// penanda kecil: titik penalti 3D (agar bola terlihat duduk di atas titik)
// --- atmosfer: malam (lampu sorot) / siang ---
const ATMO = [
  { n: '🌙 Malam', sky: [0x03061a, 0x0b1a40, 0x1c2c58], fog: 0x0a1426, fogN: 70, fogF: 260, hemi: [0x8aa0d8, 0x1a3a1a, 0.62], sun: [0xfff4e0, 0.95], flood: 1, stars: 0.85, crowd: 0.85 },
  { n: '☀️ Siang', sky: [0x2a7be0, 0x7ec0ff, 0xd8efff], fog: 0xcfe8ff, fogN: 120, fogF: 420, hemi: [0xcfe0ff, 0x4a6a40, 0.95], sun: [0xffffff, 1.15], flood: 0, stars: 0, crowd: 1.25 }];
function applyAtmo(i) { const A = ATMO[i % ATMO.length]; skyMat.uniforms.top.value.setHex(A.sky[0]); skyMat.uniforms.mid.value.setHex(A.sky[1]); skyMat.uniforms.bot.value.setHex(A.sky[2]); scene.fog.color.setHex(A.fog); scene.fog.near = A.fogN; scene.fog.far = A.fogF; scene.background.setHex(A.fog); hemi.color.setHex(A.hemi[0]); hemi.groundColor.setHex(A.hemi[1]); hemi.intensity = A.hemi[2]; sun.color.setHex(A.sun[0]); sun.intensity = A.sun[1]; flood.forEach(f => { f.material.opacity = A.flood; f.visible = A.flood > 0; }); stars.material.opacity = A.stars; crowdMat.uniforms.uFog.value.setHex(A.fog); crowdMat.uniforms.uFogN.value = A.fogN; crowdMat.uniforms.uFogF.value = A.fogF; crowdMat.uniforms.uLight.value = A.crowd; }
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);
applyAtmo(settings.atmo);
