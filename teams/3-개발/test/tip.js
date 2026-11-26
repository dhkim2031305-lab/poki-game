// 원거리 탄이 무기 끝에서 나가는지 캡처: node tip.js S tag "ci,..." [2d]
const { chromium } = require('playwright');
(async () => { const [S, tag, list, mode] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const out = [];
  for (const ci of list.split(',').map(Number)) for (const [aname, ax, ay] of [['r', 1, 0], ['ur', .8, -.6]]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto('http://localhost:8080/web/' + (mode === '2d' ? '?render=2d' : '')); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(([ax, ay]) => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 300; G.hero.y = 230; G.hero.dir = { x: ax, y: ay }; G.items = []; window.__manual = true; }, [ax, ay]);
    await p.waitForTimeout(120);
    await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
    await p.keyboard.down('KeyK');
    await p.evaluate(() => { for (let i = 0; i < 2; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } });
    await p.keyboard.up('KeyK');
    const sh = await p.evaluate(() => G.shots.map(s => [Math.round(s.x), Math.round(s.y), Math.round(s.ox), Math.round(s.oy)]));
    await p.screenshot({ path: `${S}/shots/tip-${tag}-${ci}-${aname}.png`, clip: { x: 170, y: 90, width: 300, height: 170 } });
    out.push(`${ci} ${aname}: ${JSON.stringify(sh)}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
