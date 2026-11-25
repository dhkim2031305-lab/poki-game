// 입체감 전/후: 같은 장면(장수 + 외계인 여러 마리, 위쪽 문으로 들어오는 외계인, 날아가는 무기)
const { chromium } = require('playwright');
(async () => { const [S, port, tag] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 8; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 330; G.hero.y = 210; G.hero.dir = { x: -1, y: -.4 }; G.hero.inv = 0; G.items = [];
    const mk = (type, x, y, extra) => Object.assign({ type, x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: type === 'boss' ? 38 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }, extra);
    G.aliens.push(mk('grunt', 180, 120), mk('grunt', 470, 300), mk('shooter', 520, 150), mk('grunt', 346, 34, { entering: true, dy: 1 }), mk('boss', 200, 320, { r: 38 }));
    G.shots.push({ kind: 'blade', x: 260, y: 180, vx: -300, vy: -110, dmg: 0, life: 9, age: .2 }); });
  await p.waitForTimeout(80);
  await p.evaluate(() => { const raf = requestAnimationFrame; window.requestAnimationFrame = () => 0; });
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${S}/shots/depth-${tag}.png` }); await b.close(); })();
