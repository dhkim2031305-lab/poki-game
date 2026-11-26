// 끝 화면 세 경우 캡처: node endfar.js S "ci,..."  (라운드를 바로 깨서 끝까지)
const { chromium } = require('playwright');
(async () => { const [S, list] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const ci of list.split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
    const log = []; let shot = 0;
    for (let i = 1; i <= 7; i++) {
      const sc = await p.evaluate(() => G.scene); if (sc === 'result') break;
      if (sc === 'play') await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
      await p.waitForTimeout(800);
      if (await p.evaluate(() => G.scene) === 'ending') { await p.waitForTimeout(700); await p.screenshot({ path: `${S}/shots/end-${ci}-a.png` }); await p.waitForTimeout(1700); await p.screenshot({ path: `${S}/shots/end-${ci}-b.png` }); shot = 1; await p.waitForTimeout(3000); break; }
      await p.waitForTimeout(3100);
    }
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ scene: G.scene, time: G.result && G.result.time, kind: G.result && G.result.kind, line: G.result && G.result.line, far: localStorage.getItem('aw.far'), best: localStorage.getItem('aw.best'), btn: UI.hits.map(h => h.id).join(',') }));
    await p.screenshot({ path: `${S}/shots/end-${ci}-r.png` });
    console.log(ci, JSON.stringify(r), errs.length ? errs : 'ok'); await p.close();
  }
  await b.close(); })();
