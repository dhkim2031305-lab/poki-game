// QA: iOS 대비 — WebGL이 없을 때 2D로 바뀌는지, ?debug=1 진단 표시, 한 파일 빌드(single.html)가 바깥 요청 없이 뜨는지
// node ios.js OUT SINGLE_HTML_PATH [port]
const { chromium, devices } = require('playwright');
(async () => {
  const [OUT, SINGLE, port = 8080] = process.argv.slice(2); const out = [];
  const iphone = devices['iPhone 13 landscape'] || { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 };
  const probe = p => p.evaluate(() => ({ scene: G.scene, gl: !!document.querySelector('canvas#game') && !!(window.R3D && R3D.ok !== false && R3D.renderer), r3d: typeof R3D, dbg: (document.body.innerText || '').slice(0, 300) }));
  // 1) WebGL 끔
  { const b = await chromium.launch({ args: ['--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] }); const ctx = await b.newContext(iphone); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?debug=1`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 15000 });
    const webgl = await p.evaluate(() => { try { return !!document.createElement('canvas').getContext('webgl'); } catch { return false; } });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/ios-nowebgl-debug.png` });
    const use3d = await p.evaluate(() => { try { return typeof use3d !== 'undefined' ? use3d : null; } catch { return null; } });
    const diag = await p.evaluate(() => { const els = [...document.querySelectorAll('div,pre')].filter(e => e.offsetParent && /render|webgl|2d|3d/i.test(e.textContent)); return els.map(e => e.textContent.slice(0, 200)).join(' | '); });
    out.push(`WebGL 끔: 브라우저 webgl=${webgl}, 플레이 진입=${await p.evaluate(() => G.scene)}, 진단 글=${diag || '(DOM에 없음 · 캡처로 확인)'}, 에러=${errs.join(' | ') || '없음'}`);
    await b.close(); }
  // 2) 한 파일 빌드: 바깥 요청 모두 막고 file:// 로 열기
  { const b = await chromium.launch(); const ctx = await b.newContext(iphone); const req = [];
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file://') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); req.push(u); return r.abort(); });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    const t0 = Date.now(); await p.goto('file://' + SINGLE + '?debug=1'); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 }); const tt = Date.now() - t0;
    await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/single-title.png` });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/single-play-debug.png` });
    out.push(`한 파일 빌드: 타이틀까지 ${tt}ms, 바깥 요청 ${req.length}개${req.length ? ' ' + req.join(', ') : ''}, 에러=${errs.join(' | ') || '없음'}`);
    await b.close(); }
  console.log(out.join('\n'));
})();
