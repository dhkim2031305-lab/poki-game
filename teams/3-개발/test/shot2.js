// 쏘기 한 장면 캡처 (전/후): 미국 빔
const { chromium } = require('playwright');
(async () => { const [S, port, tag, ci] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, +ci); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 260; G.hero.y = 220; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
    G.aliens.push({ type: 'grunt', x: 420, y: 220, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }); });
  await p.keyboard.down('KeyK'); await p.waitForTimeout(450); await p.keyboard.up('KeyK');
  await p.screenshot({ path: `${S}/shots/shot-${tag}.png`, clip: { x: 300, y: 150, width: 260, height: 100 } }); await b.close(); })();
