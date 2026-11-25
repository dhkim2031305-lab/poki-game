// 한국 베기 1:1 (리뷰 기준 장면): 20ms 간격 12장. 외계인은 제자리(추적 속도 80)
const { chromium } = require('playwright');
(async () => {
  const [S, port, tag] = process.argv.slice(2); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 300; G.hero.y = 220; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 0;
    G.aliens.push({ type: 'grunt', x: 345, y: 220, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 80, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }); });
  await p.evaluate(() => { window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
  await p.waitForTimeout(150); await p.evaluate(() => { __step(16); __step(16); __step(16); });
  await p.keyboard.down('KeyJ'); await p.evaluate(() => __step(16)); await p.keyboard.up('KeyJ');
  const xs = [];
  for (let i = 0; i < 12; i++) {
    await p.screenshot({ path: `${S}/shots/s1-${tag}-${i}.png`, clip: { x: 340, y: 150, width: 150, height: 110 } });
    xs.push(await p.evaluate(() => G.aliens[0] ? G.aliens[0].x.toFixed(1) : '-'));
    await p.evaluate(() => __step(20));
  }
  console.log(tag, '외계인 x:', xs.join(' '));
  await b.close();
})();
