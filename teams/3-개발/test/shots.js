const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2], site = process.argv[3] || 'web';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text()); });
  await p.goto(`http://localhost:8080/${site}/`);
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 15000 });
  await p.waitForTimeout(400); await p.screenshot({ path: `${S}/shots/1-title.png` });
  await p.touchscreen.tap(422, 257); await p.waitForTimeout(300);
  await p.screenshot({ path: `${S}/shots/2-select.png` });
  // 한국(15번) 고르기
  await p.evaluate(() => { G.sel = 14; }); await p.waitForTimeout(200);
  await p.screenshot({ path: `${S}/shots/2b-select-korea.png` });
  await p.evaluate(() => { document.dispatchEvent(new Event('x')); });
  await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${S}/shots/3-play.png` });
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${S}/shots/3b-play-later.png` });
  console.log(JSON.stringify(await p.evaluate(() => ({ scene: G.scene, aliens: G.aliens.length, items: G.items.length, hp: G.hero.hp, lang: I18N.lang, touch: G.touchUI }))));
  console.log(errs.join('\n') || 'no errors');
  await b.close();
})();
