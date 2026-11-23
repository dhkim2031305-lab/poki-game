// 포키 업로드용 ZIP 만들기 (의존성 없음, Windows/Mac/Linux 공통)
// src/ 안의 파일을 루트에 index.html이 오도록 dist/poki-game.zip으로 묶어요.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'dist', 'poki-game.zip');

const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

if (!fs.existsSync(path.join(SRC, 'index.html'))) { console.error('src/index.html이 없어요.'); process.exit(1); }
const files = walk(SRC).filter(f => !path.basename(f).startsWith('.'));
const locals = [], centrals = []; let offset = 0;
for (const f of files) {
  const name = Buffer.from(path.relative(SRC, f).split(path.sep).join('/'));
  const raw = fs.readFileSync(f), comp = zlib.deflateRawSync(raw, { level: 9 }), crc = crc32(raw);
  const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(8, 8);
  h.writeUInt32LE(0x00210000, 10); h.writeUInt32LE(crc, 14); h.writeUInt32LE(comp.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26);
  locals.push(h, name, comp);
  const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(8, 10);
  c.writeUInt32LE(0x00210000, 12); c.writeUInt32LE(crc, 16); c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(offset, 42);
  centrals.push(c, name);
  offset += 30 + name.length + comp.length;
}
const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([...locals, cd, end]));
console.log(`완료: dist/poki-game.zip (${files.length}개 파일, ${(fs.statSync(OUT).size / 1024).toFixed(1)}KB)`);
