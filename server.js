// Server sederhana Al Games: file statis + penghitung "dimainkan" global.
// Jalankan: node server.js [port]   (default 8765)
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = +(process.argv[2] || process.env.PORT || 8765), DB = path.join(ROOT, 'plays.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const DENY = new Set(['plays.json', 'server.js', 'scores.json', 'tools']);
const SC_DB = path.join(ROOT, 'scores.json');
let plays = {}; try { plays = JSON.parse(fs.readFileSync(DB, 'utf8')) || {}; } catch (e) { plays = {}; }
let dirty = false; const save = () => { if (!dirty) return; dirty = false; try { fs.writeFileSync(DB + '.tmp', JSON.stringify(plays)); fs.renameSync(DB + '.tmp', DB); } catch (e) { console.error('gagal simpan', e.message); } };
setInterval(save, 2000).unref(); process.on('SIGINT', () => { save(); process.exit(0); }); process.on('SIGTERM', () => { save(); process.exit(0); });
// ---- papan peringkat global: scores[game][board] = [{ name, value, t, pid }] (terurut turun, maks 50) ----
let scores = {}; try { scores = JSON.parse(fs.readFileSync(SC_DB, 'utf8')) || {}; } catch (e) { scores = {}; }
let scDirty = false; const saveScores = () => { if (!scDirty) return; scDirty = false; try { fs.writeFileSync(SC_DB + '.tmp', JSON.stringify(scores)); fs.renameSync(SC_DB + '.tmp', SC_DB); } catch (e) { console.error('gagal simpan skor', e.message); } };
setInterval(saveScores, 2000).unref(); process.on('exit', saveScores);
const MAX_ROWS = 50, MAX_VALUE = 1e6, scLast = new Map();
const cleanName = n => String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
const pub = rows => (rows || []).slice(0, 20).map(r => ({ name: r.name, value: r.value, t: r.t }));
const isGame = key => /^[a-z0-9-]+\/$/.test(key) && key !== 'img/' && fs.existsSync(path.join(ROOT, key, 'index.html'));
const last = new Map();                                                         // batas: 1 hitungan / 4 dtk per IP per game
const json = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'); let p;
  try { p = decodeURIComponent(url.pathname); } catch (e) { res.writeHead(400); return res.end(); }
  if (p === '/api/plays' && req.method === 'GET') return json(res, 200, { plays });
  if (p === '/api/scores' && req.method === 'GET') {
    const g = (url.searchParams.get('game') || '') + '/'; if (!isGame(g)) return json(res, 404, { error: 'unknown game' });
    const out = {}, src = scores[g] || {}; for (const b of Object.keys(src)) out[b] = pub(src[b]); return json(res, 200, { game: g, boards: out });
  }
  if (p === '/api/score' && req.method === 'POST') {
    let body = ''; req.on('data', c => { body += c; if (body.length > 2048) req.destroy(); });
    req.on('end', () => {
      let d; try { d = JSON.parse(body); } catch (e) { return json(res, 400, { error: 'bad' }); }
      const g = String(d.game || '') + '/', b = String(d.board || ''), name = cleanName(d.name), pid = String(d.pid || '').slice(0, 40), v = Math.floor(Number(d.value));
      if (!isGame(g) || !/^[a-z0-9-]{1,20}$/.test(b)) return json(res, 404, { error: 'unknown board' });
      if (!name) return json(res, 400, { error: 'Nama kosong' });
      if (!/^[A-Za-z0-9_-]{8,40}$/.test(pid)) return json(res, 400, { error: 'bad pid' });
      if (!(v >= 1 && v <= MAX_VALUE)) return json(res, 400, { error: 'Nilai tidak valid' });
      const id = (req.socket.remoteAddress || '') + '|' + g, now = Date.now();
      if (now - (scLast.get(id) || 0) < 3000) return json(res, 429, { error: 'Terlalu cepat, coba lagi sebentar' });
      scLast.set(id, now); if (scLast.size > 5000) for (const [k, t] of scLast) if (now - t > 60000) scLast.delete(k);
      const rows = ((scores[g] = scores[g] || {})[b] = scores[g][b] || []), key = name.toLowerCase(), ex = rows.find(r => r.name.toLowerCase() === key);
      if (ex && ex.pid !== pid) return json(res, 409, { error: 'Nama itu sudah dipakai pemain lain. Pilih nama lain.' });
      let improved = false;
      if (ex) { if (v > ex.value) { ex.value = v; ex.t = now; improved = true; } } else { rows.push({ name, value: v, t: now, pid }); improved = true; }
      rows.sort((a, c) => c.value - a.value || a.t - c.t); if (rows.length > MAX_ROWS) rows.length = MAX_ROWS;
      scDirty = true; const rank = rows.findIndex(r => r.name.toLowerCase() === key) + 1;
      return json(res, 200, { ok: true, improved, rank, name, board: pub(rows) });
    }); return;
  }
  if (p === '/api/hit' && req.method === 'POST') {
    let body = ''; req.on('data', c => { body += c; if (body.length > 1024) req.destroy(); });
    req.on('end', () => {
      let key; try { key = JSON.parse(body).path; } catch (e) { return json(res, 400, { error: 'bad' }); }
      if (typeof key !== 'string' || !isGame(key)) return json(res, 404, { error: 'unknown game' });
      const id = (req.socket.remoteAddress || '') + '|' + key, now = Date.now();
      if (now - (last.get(id) || 0) < 4000) return json(res, 200, { ok: true, counted: false, plays });
      last.set(id, now); if (last.size > 5000) for (const [k, t] of last) if (now - t > 60000) last.delete(k);
      plays[key] = (plays[key] || 0) + 1; dirty = true; json(res, 200, { ok: true, counted: true, plays });
    }); return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  let f = path.normalize(path.join(ROOT, p));
  if (!f.startsWith(ROOT + path.sep) && f !== ROOT) { res.writeHead(403); return res.end(); }
  const rel = path.relative(ROOT, f).split(path.sep);
  if (rel.some(s => s.startsWith('.')) || DENY.has(rel[0])) { res.writeHead(404); return res.end('Not found'); }
  fs.stat(f, (e, st) => {
    if (!e && st.isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search }); return res.end(); } f = path.join(f, 'index.html'); }
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
      const ext = path.extname(f).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' || ext === '.js' || ext === '.css' ? 'no-cache' : 'public, max-age=3600' });
      res.end(req.method === 'HEAD' ? undefined : data);
    });
  });
}).listen(PORT, '0.0.0.0', () => console.log('Al Games berjalan di http://localhost:' + PORT));
