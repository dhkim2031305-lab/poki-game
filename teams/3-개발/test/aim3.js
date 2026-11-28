// 천자총통 탑승: 왼쪽 = 이동, 오른쪽 큰 원 = 조준, 탄 동안 무적 — 폰 터치로 기록 + 캡처
// 사용: node aim3.js 출력폴더
const { chromium } = require('playwright');
(async () => { const OUT = process.argv[2]; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 420; h.y = 230; h.inv = 0;
    const mk = (x, y) => ({ type: 'shooter', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: .2, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens.push(mk(600, 150), mk(250, 320)); });
  const st = () => p.evaluate(() => { const h = G.hero, c = h.koreaBattery; const a = c && c.aim && c.aim(); return `장수 ${Math.round(h.x)},${Math.round(h.y)} hp ${Math.round(h.hp ?? G.run.hp ?? 0)} ` + (c ? `조준 ${Math.round(a.x)},${Math.round(a.y)}` : 'off'); });
  const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
  const cdp = await p.context().newCDPSession(p), T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x: x * U, y: y * U, id })) });
  const hp0 = await p.evaluate(() => JSON.stringify({ hp: G.hero.hp, run: G.run.hp }));
  await T('touchStart', [[B.skill2.x, B.skill2.y, 1]]); await p.waitForTimeout(80); await T('touchEnd', []); await p.waitForTimeout(1000);
  const o = ['시작 체력 ' + hp0, '처음 ' + await st()];
  const jx = 150, jy = 250, sx = B.stick.x, sy = B.stick.y;
  await T('touchStart', [[jx, jy, 2]]); await T('touchMove', [[jx + 50, jy, 2]]); await p.waitForTimeout(200); o.push('왼쪽 조이스틱 오른쪽으로 이동 ' + await st());
  await T('touchStart', [[jx + 50, jy, 2], [sx, sy, 3]]); await T('touchMove', [[jx + 50, jy, 2], [sx, sy - 50, 3]]); await p.waitForTimeout(200); o.push('+ 오른쪽 조이스틱 위로 ' + await st());
  await p.screenshot({ path: OUT + '/a1.png' });
  await T('touchMove', [[jx + 50, jy, 2], [sx - 50, sy, 3]]); await p.waitForTimeout(200); o.push('+ 오른쪽 조이스틱 왼쪽 ' + await st());
  await p.screenshot({ path: OUT + '/a2.png' });
  await T('touchEnd', []); await p.waitForTimeout(300); o.push('뗀 뒤 ' + await st());
  await p.waitForTimeout(1200); o.push('끝난 뒤 ' + await st() + ' 체력 ' + await p.evaluate(() => JSON.stringify({ hp: G.hero.hp, run: G.run.hp })));
  console.log(o.join('\n')); await b.close(); })();
