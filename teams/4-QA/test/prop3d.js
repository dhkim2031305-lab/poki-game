// QA: 소품 그림 3D 빌보드 캡처 — 스킬을 쓰고 0.1·0.25·0.6·1.2초 화면 (render=3d, swiftshader)
// node prop3d.js OUT [port] [ci:n,ci:n,...] [render]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, list = '14:2,3:2,9:2,2:1,18:2,10:2', render = '3d'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const log = [];
  for (const it of list.split(',')) { const [ci, n] = it.split(':').map(Number);
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/?render=${render}`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(800);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; const h = G.hero; h.x = 300; h.y = 230; h.dir = { x: 1, y: 0 };
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t); } }; window.__manual = true; });
    await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const is3d = await p.evaluate(() => !!document.querySelector('canvas') && (window.R3D ? 1 : 0));
    await p.mouse.move(560, 240); await p.mouse.move(600, 230); await p.evaluate(() => __step(2));
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); let done = 0; const ko = await p.evaluate(() => G.country.ko);
    for (const [f, t] of [[6, '0.10'], [15, '0.25'], [36, '0.60'], [72, '1.20']]) { await p.evaluate(k => __step(k), f - done); done = f; await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}${ko}${n}-${t}.png` }); }
    log.push(`${ci + 1} ${ko} ${n}: 에러 ${errs.length ? errs.join('|') : 0}`); await p.close(); }
  console.log(log.join('\n')); await b.close();
})();
