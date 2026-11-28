// 폰(아이폰 가로) 화질 비교 캡처: 스킬 쓰는 순간 장수 둘레를 확대 — node dprcap.js 폴더 "1:1,14:1,14:2" (BASE로 서버 고름)
const { chromium, devices } = require('playwright');
(async () => { const [OUT, L = '1:1,14:1,14:2'] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const dev = devices['iPhone 13 landscape'];
  for (const [ci, n] of L.split(',').map(s => s.split(':').map(Number))) {
    const ctx = await b.newContext({ ...dev }); const p = await ctx.newPage();
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 120000 });
    if (!process.env.AUTOLOW) await p.evaluate(() => { R3D.lowQuality = () => {}; });   // 서버 CPU 렌더는 느려서 저사양 자동이 켜져요 — 화질 비교에선 끔
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.evaluate(() => { const e = new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' }); window.dispatchEvent(e); document.dispatchEvent(e); });
    await p.waitForFunction(() => G.scene === 'play', null, { timeout: 120000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 300; h.y = 230; h.dir = { x: 1, y: 0 };   // 무적(inv)을 켜면 깜빡임이 찍혀요 — 끔
      G.aliens.forEach(a => a.speed = 0);
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, dx: 0, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(380, 230), mk(420, 210), mk(430, 255)); });
    const info = await p.evaluate(() => ({ dpr: devicePixelRatio }));
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    await p.waitForTimeout(n === 2 ? 1300 : 450);
    const gl = await p.evaluate(() => { const c = document.getElementById('game3d'), h = G.hero; return (c ? c.width + 'x' + c.height : '?') + ' dead ' + h.dead + ' hp ' + Math.round(h.hp ?? G.run.hp ?? -1) + ' inv ' + h.inv + ' cut ' + !!G.cutin + ' scene ' + G.scene + ' t ' + G.t.toFixed(2) + ' cast ' + (h.cast ? h.cast.k + ':' + h.cast.t.toFixed(2) : '-'); });
    await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}-${n}.png` });
    console.log(ci + 1, n, 'dpr', info.dpr, '3D 캔버스', gl); await ctx.close(); }
  await b.close(); })();
