// 걷기 4단계 캡처: 방향마다 0.125초씩 4장
const { chromium } = require('playwright');
(async () => { const [S, ci] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, +ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.hero.inv = 0;
    window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
  await p.waitForTimeout(150); await p.evaluate(() => { __step(16); __step(16); });
  let n = 0;
  for (const keys of [['KeyD'], ['KeyD', 'KeyS'], ['KeyS'], ['KeyW']]) {
    await p.evaluate(() => { G.hero.x = 346; G.hero.y = 220; G.hero.walkT = 0; });
    for (const k of keys) await p.keyboard.down(k);
    for (let i = 0; i < 4; i++) {
      await p.evaluate(() => { __step(16); G.hero.x = 346; G.hero.y = 220; G.hero.walkT = (G.__wi || 0) * .125 + .01; __step(1); });
      await p.evaluate(i => { G.__wi = i + 1; }, i);
      await p.screenshot({ path: `${S}/shots/walk-${n++}.png`, clip: { x: 75 + 346 - 45, y: 220 - 80, width: 90, height: 95 } });
    }
    await p.evaluate(() => { G.__wi = 0; });
    for (const k of keys) await p.keyboard.up(k);
  }
  console.log('errors:', errs.join('|') || 'none'); await b.close(); })();
