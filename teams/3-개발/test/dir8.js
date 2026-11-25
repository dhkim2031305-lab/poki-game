// 8방향 몸 + 무기: 나라별로 8개 각도 캡처
const { chromium } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  for (const [ci, tag] of [[14, 'kor'], [2, 'sui'], [3, 'usa'], [1, 'irl']]) {
    await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 346; G.hero.y = 230; G.hero.inv = 0; });
    for (let i = 0; i < 8; i++) {
      await p.evaluate(i => { const a = i * Math.PI / 4; G.hero.dir = { x: Math.cos(a), y: Math.sin(a) }; G.hero.inv = 0; }, i);
      await p.waitForTimeout(60);
      await p.screenshot({ path: `${S}/shots/d8-${tag}-${i}.png`, clip: { x: 75 + 346 - 70, y: 230 - 100, width: 140, height: 140 } });
    }
    await p.evaluate(() => { G.scene = 'title'; });
  }
  console.log('errors:', errs.join('|') || 'none'); await b.close(); })();
