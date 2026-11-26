// 미국·핀란드 총 동작 캡처: node usa.js S tag ci  → 쏘기 1·3·6프레임, 총검 0.06·0.10·0.16초
const { chromium } = require('playwright');
(async () => { const [S, tag, ci0] = process.argv.slice(2); const ci = +ci0; const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  const setup = (ax) => p.evaluate(ax => { G.run.spawnT = 99; G.msgs = []; G.items = []; G.shots = []; G.fx = []; G.hero.x = 300; G.hero.y = 230; G.hero.dir = { x: 1, y: 0 }; G.hero.meleeCd = 0; G.hero.rangedCd = 0; G.hero.swing = null;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens = [mk(ax, 230)]; window.__manual = true; }, ax);
  const step = n => p.evaluate(n => { for (let i = 0; i < n; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } }, n);
  const shot = async name => p.screenshot({ path: `${S}/shots/usa-${tag}-${name}.png`, clip: { x: 200, y: 110, width: 260, height: 130 } });
  await setup(400); await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
  await p.keyboard.down('KeyK'); await step(1); await p.keyboard.up('KeyK'); await shot('s1'); await step(2); await shot('s3'); await step(8); await shot('s11');
  await setup(345); await step(30);
  await p.keyboard.down('KeyJ'); await step(4); await p.keyboard.up('KeyJ'); await shot('m4'); await step(3); await shot('m7'); await step(4); await shot('m11');
  console.log(tag, errs.length ? errs : 'ok'); await b.close(); })();
