const { chromium } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${S}/shots/portrait.png` });
  const a = await p.evaluate(() => G.scene + ' hits=' + UI.hits.length);
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(300);
  const c = await p.evaluate(() => G.scene + ' hits=' + UI.hits.map(h => h.id).join(','));
  console.log('세로(첫 터치 전):', a, '| 가로로 돌림:', c, '| errors:', errs.join('|') || 'none'); await b.close(); })();
