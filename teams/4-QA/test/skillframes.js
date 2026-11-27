// QA: 스킬을 누른 순간부터 0.6초까지 0.05초(3프레임) 간격 캡처 — 프레임을 직접 넘겨서 정확한 시각에 찍어요 (3D 기본, 2d 선택)
// node skillframes.js OUT [port] "나라번호:스킬번호:번째,..." [3d|2d]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, list = '14:1:1,14:2:1', mode = '3d', DUR = '0.6'] = process.argv.slice(2); const NF = Math.round(+DUR / .05);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const out = [];
  for (const item of list.split(',')) {
    const [ci, n, k] = item.split(':').map(Number);
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/${mode === '2d' ? '?render=2d' : ''}`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 30000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(800);
    // 외계인 몇 마리 (봇 플레이처럼 앞쪽에 무리) · 장수 왼쪽
    await p.evaluate(k => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 200; h.y = 230; h.hp = 1e5;
      const mk = (x, y, t = 'grunt') => G.aliens.push({ type: t, x, y, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed: 0, r: t === 'boss' ? 30 : 15, flash: 0, shootT: 99, ringT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      const ox = k === 2 ? 40 : 0; mk(410 + ox, 200); mk(440 + ox, 245); mk(470 + ox, 210); mk(430 + ox, 170); mk(480 + ox, 260); }, k);
    const FX = (844 - 1280 * 390 / 720) / 2;
    if (mode === '2d') { await p.mouse.move(400, 200); await p.mouse.move(445 + FX, 215); }
    else { await p.mouse.move(400, 200); await p.mouse.move(560, 200); await p.waitForTimeout(100); await p.mouse.move(575, 205); }   // 3D: 화면 좌표 ≈ 무리 쪽
    await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(250);
    await p.evaluate(() => { let t = performance.now(); window.__step = n => { for (let i = 0; i < n; i++) { t += 1000 / 60; window.__cb(t); } }; __step(2); });
    const name = await p.evaluate(n => (n === 2 ? G.country.skill2 : G.country.skill).mod.k, n);
    await p.screenshot({ path: `${OUT}/f-${ci + 1}-${n}-${k}-t-0.05.png` });
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    const log = [];
    for (let i = 0; i <= NF; i++) {
      if (i) await p.evaluate(() => __step(3));
      await p.screenshot({ path: `${OUT}/f-${ci + 1}-${n}-${k}-t${(i * .05).toFixed(2)}.png` });
      log.push(await p.evaluate(() => { const h = G.hero; const dmg = G.aliens.reduce((s, a) => s + (9999 - a.hp), 0); return `${(h.cast ? h.cast.k + ':' + h.cast.t.toFixed(2) : '-')}|x${Math.round(h.x)}|피해${dmg.toFixed(0)}|흔들${(G.shake || 0).toFixed(1)}|멈춤${(G.hitstop || 0).toFixed(2)}`; }));
    }
    out.push(`${ci + 1}-${n} (${name}) [${mode}] ` + log.map((s, i) => `${(i * .05).toFixed(2)}s ${s}`).join(' · ') + (errs.length ? ' ERR ' + errs[0] : ''));
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
