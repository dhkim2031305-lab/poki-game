// QA: 체코 충격파(원거리)가 3D·2D에서 실제로 보이는지 — 프레임을 직접 넘기며 여러 장 캡처
// node quake3d.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const mode of ['3d', '2d']) for (const ci of [16, 0]) {   // 체코, 비교용 룩셈부르크 검기
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/${mode === '2d' ? '?render=2d' : ''}`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 200; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; window.__manual = true; }); await p.waitForTimeout(400);
    await p.evaluate(() => { let t = performance.now(); window.__step = k => { for (let i = 0; i < k; i++) { t += 1000 / 60; window.__cb(t); } }; __step(1);
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK' })); __step(2); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyK' })); });
    const shots = [];
    for (const f of [4, 8, 12, 18]) { await p.evaluate(f => __step(f), f === 4 ? 4 : 4 + (f > 8 ? 0 : 0) && 4); const s = await p.evaluate(() => G.shots.map(s => `${s.kind}@${Math.round(s.x)}`).join(',') || '없음');
      const file = `${OUT}/quake-${mode}-${ci + 1}-f${f}.png`; await p.screenshot({ path: file, clip: { x: 100, y: 110, width: 600, height: 220 } }); shots.push(`f${f}:${s}`); }
    out.push(`${mode} ${await p.evaluate(() => G.country.ko)}: ${shots.join(' · ')} ${errs.join('|')}`); await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
