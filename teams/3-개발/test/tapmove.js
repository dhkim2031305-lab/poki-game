// 회귀 (GDD 0-19): 폰 톡 이동 — 톡한 바닥 지점까지 걸어감 · 다시 톡하면 바뀜 · 조이스틱 쓰면 취소 · 길게 누르기·끌기·화살표는 이동 아님 · 2D·3D (node tapmove.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const out = []; let bad = 0;
  for (const mode of ['2d', '3d']) {
    const p = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/' + (mode === '2d' ? '?render=2d' : '')); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.items = []; G.msgs = []; G.hero.x = 200; G.hero.y = 200; });
    // 바닥 점 (x, y)를 화면 좌표로 바꿔 터치 (down → (움직임) → 기다림 → up)
    const touch = (x, y, { hold = 40, dx = 0, id = 1 } = {}) => p.evaluate(([x, y, hold, dx, id]) => new Promise(res => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, P = G.dbgField(x, y), cx = r.left + P.x * s, cy = r.top + P.y * s;
      const ev = (t, X, Y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: X, clientY: Y, bubbles: true }));
      ev('pointerdown', cx, cy); if (dx) ev('pointermove', cx + dx, cy); setTimeout(() => { ev('pointerup', cx + dx, cy); res(); }, hold); }), [x, y, hold, dx, id]);
    const pos = () => p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y), G.dbgMoveTo() ? 'on' : 'off']);
    const check = (name, ok, info) => { if (!ok) bad++; out.push(`${mode} ${ok ? 'OK  ' : 'FAIL'} ${name}: ${info}`); };
    await touch(420, 260); await p.waitForTimeout(150); await p.screenshot({ path: `${S}/shots/tapmove-${mode}.png` }); await p.waitForTimeout(1500);
    let q = await pos(); check('톡 → 그 자리까지', Math.hypot(q[0] - 420, q[1] - 260) < 10 && q[2] === 'off', `장수 ${q[0]},${q[1]} 이동 ${q[2]}`);
    await touch(250, 150); await p.waitForTimeout(80); await touch(560, 150); await p.waitForTimeout(1800);
    q = await pos(); check('다시 톡 → 새 자리', Math.hypot(q[0] - 560, q[1] - 150) < 10, `장수 ${q[0]},${q[1]}`);
    await p.evaluate(() => { G.hero.x = 300; G.hero.y = 200; }); await touch(560, 260, { hold: 450 }); await p.waitForTimeout(400);
    q = await pos(); check('길게 누르기(0.45초) → 이동 없음', q[2] === 'off' && Math.hypot(q[0] - 300, q[1] - 200) < 4, `장수 ${q[0]},${q[1]}`);
    await touch(560, 260, { dx: 30 }); await p.waitForTimeout(400); q = await pos(); check('끌기(30px) → 이동 없음', q[2] === 'off', `이동 ${q[2]}`);
    await touch(560, 260); await p.waitForTimeout(150);
    await p.evaluate(() => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW; const ev = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 9, pointerType: 'touch', clientX: r.left + x * s, clientY: r.top + y * s, bubbles: true }));
      ev('pointerdown', 130, 300); ev('pointermove', 90, 300); });   // 왼쪽 조이스틱을 왼쪽으로
    await p.waitForTimeout(250); q = await pos(); check('조이스틱 쓰면 톡 이동 취소', q[2] === 'off', `이동 ${q[2]}`);
    await p.evaluate(() => { const cv = document.getElementById('game'); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 9, pointerType: 'touch', bubbles: true })); });
    const arrow = await p.evaluate(() => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos().invuln; const ev = t => cv.dispatchEvent(new PointerEvent(t, { pointerId: 10, pointerType: 'touch', clientX: r.left + B.x * s, clientY: r.top + B.y * s, bubbles: true })); ev('pointerdown'); ev('pointerup'); return G.dbgMoveTo() ? 'on' : 'off'; });
    check('화살표(무적) 톡 → 이동 아님', arrow === 'off', `이동 ${arrow}`);
    await p.evaluate(() => { G.hero.x = 300; G.hero.y = 200; }); await touch(2000, 200); await p.waitForTimeout(1800);   // 전장 밖 → 가장자리에서 멈춤
    q = await pos(); check('전장 밖 톡 → 벽에서 멈춤', q[2] === 'off', `장수 ${q[0]},${q[1]}`);
    if (errs.length) { bad++; out.push(mode + ' ERR ' + errs.join('|')); }
    await p.close();
  }
  console.log(out.join('\n') + `\n${bad ? 'FAIL ' + bad : '톡 이동 모두 통과'}`); await b.close(); process.exit(bad ? 1 : 0); })();
