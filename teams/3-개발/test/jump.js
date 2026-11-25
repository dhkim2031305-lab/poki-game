const { chromium } = require('playwright');
(async () => { const [S, q] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
  await p.goto(`http://localhost:8080/web/${q || ''}`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 0; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 346; G.hero.y = 210; G.hero.inv = 0; G.items = [];
    const mk = (type, x, y, extra) => Object.assign({ type, x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }, extra);
    G.aliens.push(mk('grunt', 200, 150, { jumpCfg: DATA.TEMP.JUMP, jumpT: .05 }), mk('boss', 560, 260, { r: 38, jumpCfg: DATA.TEMP.BOSS_JUMP, jumpT: .3 })); window.__hp0 = G.hero.hp; window.__manual = true; });
  await p.waitForTimeout(150);
  await p.evaluate(() => { window.__t = performance.now(); });
  const step = n => p.evaluate(n => { for (let i = 0; i < n; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } }, n);
  await step(20); await p.screenshot({ path: `${S}/shots/jp-0.png` });       // 졸개 웅크림·원 / 보스 웅크림
  await step(30); await p.screenshot({ path: `${S}/shots/jp-1.png` });       // 졸개 공중
  await step(30); await p.screenshot({ path: `${S}/shots/jp-2.png` });       // 보스 공중
  const r = await p.evaluate(() => ({ hp0: window.__hp0, hp: G.hero.hp }));
  await step(30); await p.screenshot({ path: `${S}/shots/jp-3.png` });
  const r2 = await p.evaluate(() => ({ hp: G.hero.hp }));
  console.log(JSON.stringify(r), JSON.stringify(r2), 'errors:', errs.join(' | ') || 'none'); await b.close(); })();
