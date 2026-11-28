// 플랫폼 등록부. 새 사이트를 추가할 땐 여기에 한 항목 + platforms/<id>.js 파일.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'platforms.config.json'), 'utf8'));

const PLATFORMS = {
  poki: {
    label: 'Poki',
    sdk: () => '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
  },
  crazygames: {
    label: 'CrazyGames',
    sdk: () => '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
  },
  gamedistribution: {
    label: 'GameDistribution',
    sdk: () => {
      const id = (config.gamedistribution || {}).gameId || '';
      return `<script>window.GD_OPTIONS={gameId:${JSON.stringify(id)},onEvent:function(e){window.__gdEvent?window.__gdEvent(e):(window.__gdQ=window.__gdQ||[]).push(e)}};</script>\n  <script src="https://html5.api.gamedistribution.com/main.min.js"></script>`;
    },
    check: () => ((config.gamedistribution || {}).gameId ? null : 'platforms.config.json에 gamedistribution.gameId가 비어 있어요 (GD 대시보드에서 발급)'),
  },
  web: {
    label: '일반 웹 (itch.io·개인 사이트, 광고 없음)',
    sdk: () => '<!-- no ad SDK -->',
  },
};

// 개발 서버와 두 빌드에서 현재 배포할 그림 목록을 같은 방식으로 만들어요.
function imagePaths(dir, prefix = '') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const name = prefix + entry.name;
    if (entry.isDirectory()) return imagePaths(path.join(dir, entry.name), name + '/');
    return entry.isFile() && /\.(webp|svg)$/.test(name) ? [name] : [];
  });
}

// index.html에 해당 플랫폼 SDK 끼워 넣기
function renderIndex(id) {
  const html = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
  const images = JSON.stringify(imagePaths(path.join(ROOT, 'src', 'assets')).sort()).replace(/</g, '\\u003c');
  return html.replace('<!-- PLATFORM_SDK -->', () => PLATFORMS[id].sdk())
    .replace('<!-- ASSET_PATHS -->', () => `<script>window.ASSET_PATHS = new Set(${images});</script>`);
}
const adapterPath = id => path.join(ROOT, 'platforms', `${id}.js`);

module.exports = { PLATFORMS, renderIndex, adapterPath, ROOT };
