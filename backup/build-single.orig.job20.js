// 한 파일 빌드 (의존성 없음): dist/single.html — 그림·스크립트·CSS를 모두 한 HTML에 넣어요
//   npm run build:single              → dist/single.html (web 어댑터, 광고 없음)
//   npm run build:single -- --preview → dist/single-preview.html (미리보기용: 2D/3D 비교 버튼 + 진단 표시)
// 왜: iOS Claude 앱은 여러 파일로 된 아티팩트를 못 열어요 (사용자 "ㅇㅇ 된다 아이폰에서", 2026-11-25 · 팀장 single-file-inline.py를 옮김)
// 방법: 그림을 data URI로 window.__A 에 넣고, <img>.src 를 넣을 때 'assets/...' 경로를 data URI로 바꿔 줘요
const fs = require('fs');
const path = require('path');
const { renderIndex, adapterPath, ROOT } = require('./platforms');
const SRC = path.join(ROOT, 'src'), DIST = path.join(ROOT, 'dist');
const preview = process.argv.includes('--preview');
const LIMIT_MB = 16;   // 아티팩트 한 파일 한도

const MIME = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg' };
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const assets = {};
for (const f of walk(path.join(SRC, 'assets'))) {
  const m = MIME[path.extname(f).toLowerCase()]; if (!m) continue;
  assets[path.relative(SRC, f).split(path.sep).join('/')] = `data:${m};base64,${fs.readFileSync(f).toString('base64')}`;
}
const shim = `<script>window.__A=${JSON.stringify(assets)};(function(){var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{get:function(){return d.get.call(this)},set:function(v){var k=String(v).replace(/^\\.\\//,'');d.set.call(this,window.__A[k]||v)},configurable:true});})();</script>`;

// 미리보기 전용: 2D/3D 비교 버튼 + 진단 표시(아이폰에서 캡처해 보내기용)
const extra = preview ? `<style>#rt{position:fixed;left:50%;bottom:6px;transform:translateX(-50%);z-index:5;font:700 12px system-ui,sans-serif;color:#F2E3C6;background:rgba(24,22,26,.85);border:1px solid #8C6B32;border-radius:10px;padding:6px 12px;min-height:32px;cursor:pointer}</style>
<button id="rt" type="button" hidden></button>
<script>(function(){var k="aw.settings",st={};try{st=JSON.parse(localStorage.getItem(k))||{}}catch(e){}var b=document.getElementById("rt"),is2=st.render==="2d";b.textContent=is2?"지금: 2D (예전) · 3D로 보기":"지금: 3D (B안) · 2D로 보기";b.onclick=function(){st.render=is2?"3d":"2d";try{localStorage.setItem(k,JSON.stringify(st))}catch(e){}location.reload()};
})();</script>
` : '';

let html = renderIndex('web');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>${fs.readFileSync(path.join(SRC, href), 'utf8')}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  if (/^https?:/.test(src)) return m;
  const file = src === 'platform.js' ? adapterPath('web') : path.join(SRC, src);
  return `<script>${fs.readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`;
});
html = html.replace('<head>', '<head>' + shim);
if (extra) html = html.replace('<canvas id="game"></canvas>', '<canvas id="game"></canvas>\n' + extra);

fs.mkdirSync(DIST, { recursive: true });
const out = path.join(DIST, preview ? 'single-preview.html' : 'single.html');
fs.writeFileSync(out, html);
const mb = fs.statSync(out).size / 1024 / 1024;
console.log(`✔ ${path.relative(ROOT, out)}  (그림 ${Object.keys(assets).length}개, ${mb.toFixed(2)}MB)${mb > LIMIT_MB ? `\n  ⚠ ${LIMIT_MB}MB(아티팩트 한도)를 넘었어요` : ''}`);
