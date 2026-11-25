const { chromium } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 0; }); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 300; G.hero.y = 220; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
    G.aliens.push({ type: 'grunt', x: 345, y: 220, dx: 0, dy: 0, entering: false, hp: 1, max: 30, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 },
                  { type: 'shooter', x: 470, y: 180, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 0, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }); });
  await p.keyboard.down('KeyJ'); await p.waitForTimeout(220); await p.keyboard.up('KeyJ');
  await p.screenshot({ path: `${S}/shots/kill.png`, clip: { x: 300, y: 120, width: 300, height: 150 } }); await b.close(); })();
