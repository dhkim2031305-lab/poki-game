// 창·도끼 던지기 프레임 묶음 + 놓는 시각 실측: node throwm.js S tag ci [boost]
const { chromium } = require('playwright');
(async () => { const [S, tag, ci0, boost] = process.argv.slice(2); const ci = +ci0; const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  await p.evaluate(boost => { G.run.spawnT = 99; G.msgs = []; G.items = []; G.shots = []; G.aliens = []; G.hero.x = 300; G.hero.y = 230; G.hero.dir = { x: 1, y: 0 }; G.hero.rangedCd = 0; if (boost) { G.hero.boostT = 3; } window.__manual = true; }, !!boost);
  await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
  await p.keyboard.down('KeyK'); const frames = [2, 4, 6, 7, 9, 12, 18]; let f = 0; const log = [];
  for (let i = 1; i <= 24; i++) {
    await p.evaluate(() => { window.__t += 1000 / 60; window.__cb(window.__t); });
    if (i === 1) await p.keyboard.up('KeyK');
    const st = await p.evaluate(() => ({ t: G.hero.throwM ? +G.hero.throwM.t.toFixed(3) : null, n: G.shots.length, empty: !!G.hero.handEmpty }));
    log.push(`${i}:${st.t}/${st.n}${st.empty ? 'E' : ''}`);
    if (!boost && frames.includes(i)) await p.screenshot({ path: `${S}/shots/thr-${tag}-${f++}.png`, clip: { x: 230, y: 90, width: 300, height: 150 } });
  }
  console.log(tag, log.join(' '), errs.length ? errs : 'ok'); await b.close(); })();
