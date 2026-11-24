'use strict';
// ---------- kontrol: kamera (arah telunjuk) ----------
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const HAND_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const cam = { on: false, stream: null, lm: null, loading: null, lastVT: -1, lastTs: 0, has: false, pl: [{ cand: null, cnt: 0 }, { cand: null, cnt: 0 }], lastMx: [null, null] };
const video = $('camVideo');

function loadHandModel() {
  if (cam.lm) return Promise.resolve(cam.lm);
  if (cam.loading) return cam.loading;
  cam.loading = (async () => {
    const vision = await import(`${MP}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const opts = d => ({ baseOptions: { modelAssetPath: HAND_MODEL, delegate: d }, runningMode: 'VIDEO', numHands: 1,
      minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('GPU')); }
    catch (e) { cam.lm = await vision.HandLandmarker.createFromOptions(files, opts('CPU')); }
    return cam.lm;
  })();
  cam.loading.catch(() => { cam.loading = null; });
  return cam.loading;
}
