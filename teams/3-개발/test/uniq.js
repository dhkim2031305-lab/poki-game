// 나라별 스킬 1·2번 장면 캡처 + 피해 기록: node uniq.js S tag "ci:n:frame,..." 
const { chromium } = require('playwright');
(async () => { const [S, tag, list] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const out = [];
  for (const item of list.split(',')) {
    const [ci, n, fr] = item.split(':').map(Number);
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 260; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; G.hero.inv = 0; G.items = [];
      const mk = (type, x, y, ex) => Object.assign({ type, x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }, ex);
      G.aliens.push(mk('grunt', 320, 208), mk('grunt', 400, 222), mk('grunt', 205, 165), mk('grunt', 300, 280), mk('shooter', 560, 200, { shootT: .2 })); window.__manual = true; });
    await p.waitForTimeout(120);
    await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    await p.evaluate(fr => { for (let i = 0; i < fr; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } }, fr);
    await p.screenshot({ path: `${S}/shots/u-${tag}-${ci}-${n}.png`, clip: { x: 90, y: 60, width: 520, height: 280 } });
    await p.evaluate(() => { for (let i = 0; i < 200; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } });
    const r = await p.evaluate(() => ({ key: G.country.key, F: +G.run.st.F.toFixed(3), hp: G.aliens.map(a => 999 - Math.round(a.hp)), heroHp: G.hero.hp, left: G.run.skillsLeft.slice(1) }));
    out.push(`${r.key} ${n}번: 80F=${(80 * r.F).toFixed(1)} 피해=[${r.hp}] 남은=${r.left}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
