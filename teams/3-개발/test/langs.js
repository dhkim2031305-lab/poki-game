// 언어별 화면 캡처 (나라를 고르면 그 나라 말): node langs.js S "ci,..."
const { chromium } = require('playwright');
(async () => { const [S, list] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const ci of list.split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.keyboard.press('Enter'); await p.waitForTimeout(300); await p.evaluate(ci => { G.sel = ci; }, ci); await p.waitForTimeout(200);
    const lang = await p.evaluate(() => I18N.lang); await p.screenshot({ path: `${S}/shots/lang-${ci}-select.png` });
    await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === "play"); await p.waitForTimeout(500);
    await p.screenshot({ path: `${S}/shots/lang-${ci}-play.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.screenshot({ path: `${S}/shots/lang-${ci}-pause.png` }); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    await p.evaluate(() => { G.result = { kind: 'far', rounds: 6, kills: 132, isNew: true, line: I18N.t('end.far.01'), t: 0, time: 142.34 }; G.scene = 'result'; }); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/lang-${ci}-far.png` });
    await p.evaluate(() => { G.result = { kind: 'bankrupt', rounds: 4, kills: 61, isNew: false, line: I18N.t('bankrupt.first.08'), t: 0, time: null }; G.scene = 'result'; }); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/shots/lang-${ci}-bank.png` });
    console.log(ci, await p.evaluate(() => I18N.lang), errs.length ? errs : 'ok'); await p.close();
  }
  await b.close(); })();
