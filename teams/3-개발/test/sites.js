const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const site of ['poki', 'crazygames', 'gamedistribution', 'web']) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    p.on('console', m => { if (m.type() === 'error' && !/browsingTopics|Failed to load resource|ERR_|net::/.test(m.text())) errs.push(m.text()); });
    await p.goto(`http://localhost:8080/${site}/`);
    let ok = true; try { await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 }); } catch { ok = false; }
    await p.keyboard.press('Enter'); await p.waitForTimeout(300); await p.keyboard.press('Enter'); await p.waitForTimeout(2000);
    const sc = await p.evaluate(() => G.scene + ' platform=' + Platform.name);
    console.log(site.padEnd(17), ok ? 'title ✓' : 'title ✗', sc, 'errors:', errs.join(' | ') || 'none');
    await p.close();
  }
  await b.close();
})();
