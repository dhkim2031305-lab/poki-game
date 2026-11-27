// 스킬 한 번을 시간 순서로 캡처: 장수 왼쪽, 외계인 오른쪽 200px
const { chromium } = require('playwright');
const OUT = process.argv[2];
const LIST = [[14,1],[14,2],[0,1],[20,1],[18,1],[6,1],[26,1],[23,1],[3,1],[2,1],[1,1],[7,1]];
const TIMES = [0.05, 0.15, 0.3, 0.5, 0.8, 1.2, 1.8, 2.6];
(async () => {
  const b = await chromium.launch();
  for (const [ci, n] of LIST) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 260; G.hero.y = 230; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(470, 215), mk(480, 255), mk(450, 240)); });
    await p.evaluate(() => { window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
    await p.waitForTimeout(200);
    await p.evaluate(() => { for (let i = 0; i < 4; i++) __step(16); });
    await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon');
    let t = 0;
    for (let i = 0; i < TIMES.length; i++) {
      await p.evaluate(ms => { let k = Math.round(ms / 16); while (k-- > 0) __step(16); }, (TIMES[i] - t) * 1000); t = TIMES[i];
      await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}-${n}-${i}.png` });
    }
    const key = await p.evaluate(() => G.country.key); console.log(ci + 1, key, n);
    await p.close();
  }
  await b.close();
})();
