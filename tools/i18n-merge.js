// 기획팀 번역을 src/i18n.js 안 "번역 18개" 칸에 넣어요. 영어와 한국어는 T에 직접 써요.
// 사용: node tools/i18n-merge.js   (번역이 바뀌면 다시 돌려요)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), dir = path.join(root, 'teams/1-기획/translations'), file = path.join(root, 'src/i18n.js');
const LANGS = ['fr', 'de', 'nl', 'da', 'sv', 'fi', 'it', 'es', 'cs', 'he', 'lt', 'ja', 'pt', 'pl', 'hu', 'sk', 'el', 'tr'];
const subdirs = fs.readdirSync(dir, { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
let src = fs.readFileSync(file, 'utf8');
const en = src.match(/en: \{([\s\S]*?)\n    \},/)[1], keys = [...en.matchAll(/'([a-z0-9.]+)':/gi)].map(m => m[1]);
const ph = s => (String(s).match(/\{[a-z]+\}/g) || []).sort().join();
const enVal = k => { const m = en.match(new RegExp(`'${k.replace(/\./g, '\\.')}': '((?:[^'\\\\]|\\\\.)*)'`)); return m ? m[1] : ''; };
const out = {};
for (const l of LANGS) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, l + '.json'), 'utf8'));
  for (const subdir of subdirs) {
    const translation = path.join(dir, subdir, l + '.json');
    if (fs.existsSync(translation)) Object.assign(j, JSON.parse(fs.readFileSync(translation, 'utf8')));
  }
  const miss = keys.filter(k => !(k in j)); if (miss.length) throw new Error(`${l}: 빠진 키 ${miss.join(',')}`);
  for (const k of keys) if (ph(j[k]) !== ph(enVal(k))) throw new Error(`${l} ${k}: 자리표시자 다름 (${j[k]})`);
  out[l] = j;
}
const block = `  // ↓ 번역 18개 (tools/i18n-merge.js가 teams/1-기획/translations와 하위 폴더에서 만들어요 — 손으로 고치지 마세요)\n  Object.assign(T, ${JSON.stringify(out)});\n  // ↑ 번역 18개 끝\n`;
const re = /  \/\/ ↓ 번역 18개[\s\S]*?\/\/ ↑ 번역 18개 끝\n/;
if (re.test(src)) src = src.replace(re, () => block);
else { const anchor = '\n  // 설정 Language 목록'; if (!src.includes(anchor)) throw new Error('자리 못 찾음'); src = src.replace(anchor, () => '\n' + block + anchor); }
fs.writeFileSync(file, src);
const count = Object.values(out).reduce((sum, translations) => sum + Object.keys(translations).length, 0);
console.log(`i18n.js: ${LANGS.length}개 언어에 번역 ${count}개 넣음 (${(block.length / 1024).toFixed(1)}KB)`);
