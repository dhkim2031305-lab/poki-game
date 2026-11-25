// 로컬 개발 서버 (의존성 없음): npm run dev → http://localhost:8080
// 주소 앞에 플랫폼을 붙여서 확인해요: /poki/  /crazygames/  /gamedistribution/  /web/
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PLATFORMS, renderIndex, adapterPath, ROOT } = require('./platforms');
const SRC = path.join(ROOT, 'src');
const PORT = process.env.PORT || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.woff2': 'font/woff2', '.wasm': 'application/wasm' };
const send = (res, code, type, body) => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const [, id, ...rest] = url.split('/');
  if (!PLATFORMS[id]) {
    const links = Object.entries(PLATFORMS).map(([k, p]) => `<li><a href="/${k}/">${p.label}</a> <code>/${k}/</code></li>`).join('');
    return send(res, 200, TYPES['.html'], `<!doctype html><meta charset="utf-8"><title>dev</title><body style="font:16px system-ui;padding:24px"><h2>어느 플랫폼으로 실행할까요?</h2><ul>${links}</ul>`);
  }
  if (rest.length === 0) { res.writeHead(302, { Location: `/${id}/` }); return res.end(); }
  const p = rest.join('/') || 'index.html';
  if (p === 'index.html') return send(res, 200, TYPES['.html'], renderIndex(id));
  if (p === 'platform.js') return fs.readFile(adapterPath(id), (e, d) => e ? send(res, 404, 'text/plain', 'no adapter') : send(res, 200, TYPES['.js'], d));
  const file = path.join(SRC, path.normalize(p));
  if (!file.startsWith(SRC)) return send(res, 403, 'text/plain', '');
  fs.readFile(file, (err, d) => err ? send(res, 404, 'text/plain', 'Not found') : send(res, 200, TYPES[path.extname(file)] || 'application/octet-stream', d));
}).listen(PORT, () => console.log(`개발 서버: http://localhost:${PORT}  (플랫폼 고르는 화면이 떠요)`));
