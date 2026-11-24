'use strict';
// ======================= MEDAN: TIKUNGAN & TANJAKAN =======================
// Jalan di logika game tetap lurus (koordinat lajur). Tikungan & bukit adalah LENGKUNGAN DUNIA di vertex shader, dihitung relatif terhadap kamera:
//   offset(u) = X(s+u) - X(s) - X'(s)·u   (u = jarak ke depan dari mobil, s = jarak tempuh)
// sehingga jalan di depan melengkung/menanjak sementara mobil selalu tampak lurus di tengah layar. Agar tikungan terasa, logika menambahkan
// gaya "melayang keluar" (terrDrift) yang harus dilawan pemain dengan setir, dan kemiringan memengaruhi kecepatan.
const TERR = { on: true, amt: 1, drift: 1 };
const TX = [[700, 22], [1100, 46], [1700, 73]], TY = [[500, 5], [800, 7]];        // [panjang gelombang m, amplitudo m]; kelengkungan puncak ≈ 0.004 /m
let TPX = [0, 1.7, 4.1], TPY = [0.6, 3.3];
function terrSeed(seed) { let a = (seed >>> 0) || 1; const r = () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 * 6.2832; }; TPX = TX.map(r); TPY = TY.map(r); }
const terrRamp = s => { const t = clamp((s - 150) / 1500, 0, 1); return t * t * (3 - 2 * t); };   // 150 m pertama lurus, lalu bertahap (mulus) sampai ±1650 m
const roadX = s => { if (!TERR.amt) return 0; let v = 0; for (let i = 0; i < TX.length; i++) v += TX[i][1] * Math.sin(6.2832 * s / TX[i][0] + TPX[i]); return v * TERR.amt * terrRamp(s); };
const roadY = s => { let v = 0; for (let i = 0; i < TY.length; i++) v += TY[i][1] * Math.sin(6.2832 * s / TY[i][0] + TPY[i]); return v * TERR.amt * terrRamp(s); };
const terrK = s => TERR.amt ? (roadX(s + 3) - 2 * roadX(s) + roadX(s - 3)) / 9 : 0;           // kelengkungan (+ = belok kanan)
const terrGrade = s => TERR.amt ? (roadY(s + 2) - roadY(s - 2)) / 4 : 0;                       // kemiringan (+ = tanjakan)
const TERR_G = 19, wxGrip = () => (typeof WX === 'function' ? WX().grip : 1) * MAP_GRIP;
// kecepatan menyamping akibat tikungan (m/s): melawan arah belok, makin besar di jalan licin
function terrDrift(s, v) { if (!TERR.amt) return 0; const slip = 1 + (1 - wxGrip()) * 1.5; return -terrK(s) * v * TERR_G * TERR.drift * slip; }
function terrSetup() {
  const race = typeof gameType !== 'undefined' && gameType === 'race', m = typeof mode === 'number' ? mode : 0;
  TERR.on = settings.terrain !== false; TERR.amt = TERR.on ? (race ? 0.9 : [1, 0.8, 0.55][m]) * (typeof MAP !== 'undefined' ? MAP.terr : 1) : 0; TERR.drift = race ? 0.9 : [1, 0.8, 0.45][m];
}
// ---- penyesuaian polinom: offset(u) ≈ c0·w² + c1·w³ + c2·w⁴, w = u/100 (kuadrat terkecil, matriks normal dibalik sekali) ----
const BU = Array.from({ length: 13 }, (_, i) => 20 * (i + 1)), BEND = { bx: { value: new THREE.Vector3() }, by: { value: new THREE.Vector3() }, pz: { value: 0 }, pad: 0 };
const BINV = (() => {
  const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (const u of BU) { const w = u / 100, b = [w * w, w * w * w, w * w * w * w]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) N[i][j] += b[i] * b[j]; }
  const [[a, b, c], [d, e, f], [g, h, i]] = N, det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  return [[(e * i - f * h), -(b * i - c * h), (b * f - c * e)], [-(d * i - f * g), (a * i - c * g), -(a * f - c * d)], [(d * h - e * g), -(a * h - b * g), (a * e - b * d)]].map(r => r.map(x => x / det));
})();
function bendFit(fn, s, out) {
  const f0 = fn(s), d = (fn(s + 1) - fn(s - 1)) / 2, r = [0, 0, 0];
  for (const u of BU) { const w = u / 100, y = fn(s + u) - f0 - d * u; r[0] += w * w * y; r[1] += w * w * w * y; r[2] += w * w * w * w * y; }
  for (let i = 0; i < 3; i++) out.setComponent(i, BINV[i][0] * r[0] + BINV[i][1] * r[1] + BINV[i][2] * r[2]);
}
// atur lengkungan untuk satu render: s = jarak tempuh mobil, pz = posisi z DUNIA mobil. Jarak ke depan u dihitung dari z dunia (bukan sumbu pandang kamera),
// jadi offset hanya bergantung pada z: aspal, rumput, dan pagar di baris z yang sama selalu bergeser identik walau kamera berputar.
function setBend(s, pz) {
  if (!TERR.amt) { BEND.bx.value.set(0, 0, 0); BEND.by.value.set(0, 0, 0); BEND.pad = 0; BEND.pz.value = 0; return; }
  bendFit(roadX, s, BEND.bx.value); bendFit(roadY, s, BEND.by.value); BEND.pz.value = pz || 0;
  const e = v => Math.abs(v.x * 6.76 + v.y * 17.6 + v.z * 45.7); BEND.pad = 20 + Math.max(e(BEND.bx.value), e(BEND.by.value));   // kotak culling dilebarkan sebesar pergeseran maksimum (u = 260 m)
}
let _bendSave = null;
function mirrorBegin() { _bendSave = [BEND.bx.value.clone(), BEND.by.value.clone(), BEND.pz.value, BEND.pad]; BEND.bx.value.set(0, 0, 0); BEND.by.value.set(0, 0, 0); BEND.pad = 0; if (typeof rainMesh !== 'undefined') rainMesh.visible = false; }
function mirrorEnd() { if (!_bendSave) return; BEND.bx.value.copy(_bendSave[0]); BEND.by.value.copy(_bendSave[1]); BEND.pz.value = _bendSave[2]; BEND.pad = _bendSave[3]; _bendSave = null; if (typeof rainMesh !== 'undefined') rainMesh.visible = rainMesh.userData.on; }
// ---- patch shader: semua material (kecuali yang ditandai userData.noBend) melengkung bersama ----
const BEND_OFS = 'float bu = max(0.0, uBPZ - BZ) * 0.01, b2 = bu * bu; ';
const BEND_MESH = 'vec4 bwp = vec4( transformed, 1.0 );\n#ifdef USE_INSTANCING\nbwp = instanceMatrix * bwp;\n#endif\nbwp = modelMatrix * bwp;\n{ ' + BEND_OFS.replace('BZ', 'bwp.z') + 'bwp.x += b2 * (uBX.x + bu * (uBX.y + bu * uBX.z)); bwp.y += b2 * (uBY.x + bu * (uBY.y + bu * uBY.z)); }\nvec4 mvPosition = viewMatrix * bwp;\ngl_Position = projectionMatrix * mvPosition;';
const BEND_SPRITE = '{ ' + BEND_OFS.replace('BZ', 'modelMatrix[3].z') + 'mvPosition.x += b2 * (uBX.x + bu * (uBX.y + bu * uBX.z)); mvPosition.y += b2 * (uBY.x + bu * (uBY.y + bu * uBY.z)); }\n';
THREE.Material.prototype.onBeforeCompile = function (shader) {
  if (this.userData && this.userData.noBend) return;
  let v = shader.vertexShader;
  if (v.indexOf('#include <project_vertex>') >= 0) v = v.replace('#include <project_vertex>', BEND_MESH);
  else if (v.indexOf('gl_Position = projectionMatrix * mvPosition;') >= 0) v = v.replace('gl_Position = projectionMatrix * mvPosition;', BEND_SPRITE + 'gl_Position = projectionMatrix * mvPosition;');   // sprite
  else return;
  shader.vertexShader = 'uniform vec3 uBX;\nuniform vec3 uBY;\nuniform float uBPZ;\n' + v; shader.uniforms.uBX = BEND.bx; shader.uniforms.uBY = BEND.by; shader.uniforms.uBPZ = BEND.pz;
};
THREE.Material.prototype.customProgramCacheKey = function () { return (this.userData && this.userData.noBend ? 'nb' : 'bd') + this.type; };
// culling memakai bola pembatas posisi ASLI, padahal gambar digeser shader: lebarkan agar objek di tepi layar tidak hilang mendadak
{
  const fo = THREE.Frustum.prototype.intersectsObject, fs = THREE.Frustum.prototype.intersectsSprite, sp = new THREE.Sphere();
  THREE.Frustum.prototype.intersectsObject = function (o) { if (!BEND.pad) return fo.call(this, o); const g = o.geometry; if (g.boundingSphere === null) g.computeBoundingSphere(); sp.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); sp.radius += BEND.pad; return this.intersectsSphere(sp); };
  THREE.Frustum.prototype.intersectsSprite = function (o) { if (!BEND.pad) return fs.call(this, o); sp.center.set(0, 0, 0); sp.radius = 0.7071; sp.applyMatrix4(o.matrixWorld); sp.radius += BEND.pad; return this.intersectsSphere(sp); };
}
