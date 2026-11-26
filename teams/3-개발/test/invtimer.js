// 무적 남은 시간 표시 캡처 (폰): node invtimer.js S
const { chromium, devices } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['iPhone 13 landscape'] }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 1; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 380; G.hero.y = 260; window.__manual = true; }); await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(__t); });
  const step = n => p.evaluate(n => { for (let i = 0; i < n; i++) { __t += 1000 / 60; __cb(__t); } }, n);
  await p.keyboard.press('Space'); await step(30); await p.screenshot({ path: `${S}/shots/inv-a.png` });
  await step(68); await p.screenshot({ path: `${S}/shots/inv-b.png` });
  await step(40); await p.evaluate(() => { G.run.invuln = 2; }); await p.keyboard.press('Space'); await p.keyboard.press('KeyL'); await step(12); await p.screenshot({ path: `${S}/shots/inv-c.png` });
  console.log(await p.evaluate(() => `touch=${G.touchUI} boost=${G.hero.boostT.toFixed(2)}`), errs.length ? errs : 'ok'); await b.close(); })();
