// 체코 우클릭 충격파 모양 (QA M6: 둥근 물결) — 2D·3D 캡처 (node quake.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const q of (process.env.Q != null ? [process.env.Q] : ['', '?render=2d'])) { const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.goto('http://localhost:8080/web/' + q); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 16; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 200; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; });
    await p.keyboard.press('KeyK'); for (const ms of [120, 240, 400]) { await p.waitForTimeout(ms === 120 ? 120 : 120); await p.screenshot({ path: `${S}/shots/quake${q ? '-2d' : '-3d'}-${ms}.png`, clip: { x: 100, y: 60, width: 700, height: 300 } }); } await p.close(); }
  await b.close(); })();
