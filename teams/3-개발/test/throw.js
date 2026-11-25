const { chromium } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  for (const [ci, tag] of [[0, 'lux'], [14, 'kor'], [17, 'isr'], [2, 'sui']]) {
    await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 250; G.hero.y = 230; G.hero.dir = { x: 1, y: -.3 }; G.hero.inv = 0; });
    await p.keyboard.down('KeyK'); await p.waitForTimeout(140); await p.keyboard.up('KeyK');
    await p.screenshot({ path: `${S}/shots/th-${tag}.png`, clip: { x: 260, y: 110, width: 280, height: 150 } });
    await p.evaluate(() => { G.scene = 'title'; });
  } await b.close(); })();
