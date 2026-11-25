// 플랫폼별 업로드 ZIP 만들기 (의존성 없음, Windows/Mac/Linux 공통)
//   npm run build            → 모든 플랫폼
//   npm run build -- poki    → 하나만 (여러 개면 띄어쓰기)
// 결과: dist/<플랫폼>.zip  — 루트에 index.html, 그 플랫폼 SDK만 들어가요.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { PLATFORMS, renderIndex, adapterPath, ROOT } = require('./platforms');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

function zip(entries) { // entries: [{ name, data }]
  const locals = [], centrals = []; let offset = 0;
  for (const { name: n, data: raw } of entries) {
    const name = Buffer.from(n), comp = zlib.deflateRawSync(raw, { level: 9 }), crc = crc32(raw);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
    h.writeUInt32LE(0x00210000, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26);
    locals.push(h, name, comp);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
    c.writeUInt32LE(0x00210000, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
    centrals.push(c, name);
    offset += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(PLATFORMS);
const bad = ids.filter(i => !PLATFORMS[i]);
if (bad.length) { console.error(`모르는 플랫폼: ${bad.join(', ')}  (가능: ${Object.keys(PLATFORMS).join(', ')})`); process.exit(1); }

const shared = walk(SRC).filter(f => !path.basename(f).startsWith('.') && path.relative(SRC, f) !== 'index.html')
  .map(f => ({ name: path.relative(SRC, f).split(path.sep).join('/'), data: fs.readFileSync(f) }));
fs.mkdirSync(DIST, { recursive: true });

for (const id of ids) {
  const warn = PLATFORMS[id].check && PLATFORMS[id].check();
  const entries = [
    { name: 'index.html', data: Buffer.from(renderIndex(id)) },
    { name: 'platform.js', data: fs.readFileSync(adapterPath(id)) },
    ...shared,
  ];
  const out = path.join(DIST, `${id}.zip`);
  fs.writeFileSync(out, zip(entries));
  console.log(`✔ dist/${id}.zip  (${entries.length}개 파일, ${(fs.statSync(out).size / 1024).toFixed(1)}KB)${warn ? `\n  ⚠ ${warn}` : ''}`);
}
