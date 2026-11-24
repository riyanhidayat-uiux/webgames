'use strict';
// ======================= LOOP =======================
let last = performance.now();
function update(dt) {
  elapsed += dt; pulse = Math.max(0, pulse - dt * 4); flashT = Math.max(0, flashT - dt * 2.5);
  if (state === 'wait') { const ok = PLY.every(p => p.valid); waitT = ok ? waitT + dt : 0; $('waitS').textContent = ok ? 'Terdeteksi! Siap menari…' : (versus ? `Terdeteksi ${PLY.filter(p => p.valid).length}/2 orang — berdirilah berdampingan, badan atas terlihat.` : 'Tubuhmu belum terlihat. Mundur sedikit sampai kepala, bahu, dan lengan terlihat.'); if (waitT > 0.9) { show('waitBox', false); startSong(true); } }
  else if (state === 'play') {
    songT += dt; scheduleAudio(song); const b = Math.floor(songT / beatDur); if (b !== lastBeat) { lastBeat = b; pulse = 1; if (!AC) sfx.tick(); }
    judgeFrame(); const last = choreo[choreo.length - 1]; $('songPb').style.width = clamp(songT / ((last.beat + 3) * beatDur), 0, 1) * 100 + '%';
    if (songT > (last.beat + 3) * beatDur) endSong();
    if (b < INTRO) { const left = INTRO - b; if (b !== cdB) { cdB = b; if (left <= 4) { show('count', true); $('count').textContent = left; $('count').classList.remove('go'); void $('count').offsetWidth; $('count').classList.add('go'); } } } else if (cdB < INTRO) { cdB = INTRO; show('count', false); }
    $('stage').style.opacity = 0.22 + 0.3 * pulse + 0.25 * flashT;
    // penari: tiba di pose berikutnya sedikit sebelum ketukan penilaian
    let nm = null, prev = POSES[1]; for (const m of choreo) { const tt = m.beat * beatDur - 0.35 * beatDur; if (songT < tt + 0.05 || m === choreo[choreo.length - 1]) { nm = m; break; } prev = m.pose; }
    if (!nm) nm = choreo[choreo.length - 1]; const idx = choreo.indexOf(nm), pv = idx > 0 ? choreo[idx - 1].pose : POSES[0]; const tArr = nm.beat * beatDur - 0.35 * beatDur, u = clamp(1 - (tArr - songT) / (beatDur * 0.9), 0, 1);
    const e = u * u * (3 - 2 * u), spec = { a: nm.pose.spec.a.map((v, k) => lerp(pv.spec.a[k], v, e)), leg: 0, legL: lerp(pv.spec.legL != null ? pv.spec.legL : (pv.spec.leg || 0), nm.pose.spec.legL != null ? nm.pose.spec.legL : (nm.pose.spec.leg || 0), e), legR: lerp(pv.spec.legR != null ? pv.spec.legR : (pv.spec.leg || 0), nm.pose.spec.legR != null ? nm.pose.spec.legR : (nm.pose.spec.leg || 0), e), lean: lerp(pv.spec.lean || 0, nm.pose.spec.lean || 0, e) };
    applyDancer(spec, 1, pulse); $('danceNm').textContent = u >= 1 || songT < INTRO * beatDur ? nm.pose.name : 'SIAP: ' + nm.pose.name;
  } else if (state === 'menu' || state === 'over') { applyDancer(POSES[3 + ((elapsed / 1.2) | 0) % 3].spec, Math.min(1, dt * 8), 0); }
  dR.render(dS, dC);
}
let cdB = -1;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  detectPose(now); if (state !== 'paused') update(dt); drawFx(dt); requestAnimationFrame(frame);
}
resize(); setVersus(false); toMenu(); requestAnimationFrame(frame);
