// 폰(아이폰 가로) 화질 비교 캡처: 스킬 쓰는 순간 장수 둘레를 확대 — node dprcap.js 폴더 "1:1,14:1,14:2" (BASE로 서버 고름)
const { chromium, devices } = require('playwright');
(async () => { const [OUT, L = '1:1,14:1,14:2'] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const dev = devices['iPhone 13 landscape'];
  for (const [ci, n] of L.split(',').map(s => s.split(':').map(Number))) {
    const ctx = await b.newContext({ ...dev }); const p = await ctx.newPage();
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 120000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.evaluate(() => { const e = new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' }); window.dispatchEvent(e); document.dispatchEvent(e); });
    await p.waitForFunction(() => G.scene === 'play', null, { timeout: 120000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 300; h.y = 230; h.dir = { x: 1, y: 0 }; h.inv = 99;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(380, 230), mk(420, 210), mk(430, 255)); });
    const info = await p.evaluate(n => { const B = G.btnPos(); return { B: n === 2 ? B.skill2 : B.skill1, dpr: devicePixelRatio, gl: (document.getElementById('game3d') || {}).width }; }, n);
    await p.touchscreen.tap(info.B.x * dev.viewport.width / 844, info.B.y * dev.viewport.width / 844).catch(() => {});
    await p.waitForTimeout(n === 2 ? 1300 : 450);
    const gl = await p.evaluate(() => { const c = document.getElementById('game3d'); return c ? c.width + 'x' + c.height : '?'; });
    await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}-${n}.png` });
    console.log(ci + 1, n, 'dpr', info.dpr, '3D 캔버스', gl); await ctx.close(); }
  await b.close(); })();
