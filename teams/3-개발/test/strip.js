// 치기 한 번을 프레임별로 캡처 (전/후 비교): 장수 오른쪽에 외계인 2마리
const { chromium } = require('playwright');
(async () => {
  const [S, port, tag] = process.argv.slice(2); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, +(process.argv[5] || 14)); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 300; G.hero.y = 220; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens.push(mk(345, 210), mk(340, 245)); });
  await p.waitForTimeout(100);
  // 프레임을 멈춰 두고 정확히 30ms씩 진행 (화면 캡처 지연과 무관하게)
  await p.evaluate(() => { const raf = window.requestAnimationFrame; window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
  await p.waitForTimeout(150);   // 이미 예약된 실제 프레임이 지나가게
  await p.evaluate(() => { __step(16); __step(16); __step(16); });
  await p.keyboard.down('KeyJ'); await p.evaluate(() => __step(16)); await p.keyboard.up('KeyJ');
  for (let i = 0; i < 10; i++) {
    await p.screenshot({ path: `${S}/shots/strip-${tag}-${i}.png`, clip: { x: 300, y: 140, width: 180, height: 130 } });
    await p.evaluate(() => __step(30));
  }
  await b.close();
})();
