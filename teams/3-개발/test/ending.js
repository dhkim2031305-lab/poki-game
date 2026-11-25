const { chromium } = require('playwright');
(async () => {
  const [S, ci, tag] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/');
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 });
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.evaluate(i => { G.sel = i; }, +ci); await p.waitForTimeout(100);
  await p.screenshot({ path: `${S}/shots/pc-select.png` });
  await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${S}/shots/pc-play.png` });
  const log = [];
  for (let i = 1; i <= 6; i++) {
    await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
    await p.waitForTimeout(i < 6 ? 3900 : 2000);
    log.push(await p.evaluate(() => `${G.scene} r=${G.run.round} m=${G.run.money.toFixed(2)} hp=${G.hero.maxHp}`));
    if (i === 1) { await p.evaluate(() => { G.scene = 'roundPanel'; G.panel.t = 1.6; }); }
  }
  await p.screenshot({ path: `${S}/shots/end-1.png` });
  await p.waitForTimeout(1700); await p.screenshot({ path: `${S}/shots/end-2.png` });
  await p.waitForTimeout(1200); await p.screenshot({ path: `${S}/shots/end-3.png` });
  await p.waitForTimeout(1500); log.push(await p.evaluate(() => G.scene + ' ' + (G.result && G.result.kind) + ' ' + (G.result && G.result.line)));
  await p.screenshot({ path: `${S}/shots/end-result.png` });
  console.log(tag, log.join(' | '), 'errors:', errs.join(' | ') || 'none');
  await b.close();
})();
