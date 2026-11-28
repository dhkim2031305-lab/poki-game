// QA M22: 천자총통 왼쪽 위치·왼쪽 조준 — 화포가 불 기운에 가려지지 않는지, 범위 표시가 왼쪽 조이스틱 위에서 옅은지 (폰 터치 캡처)
// 사용: BASE=http://localhost:8080 node m22.js 출력폴더
const { chromium } = require('playwright');
(async () => { const OUT = process.argv[2]; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 230; h.y = 250; h.inv = 99; });
  const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
  const cdp = await p.context().newCDPSession(p), T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x: x * U, y: y * U, id })) });
  await T('touchStart', [[B.skill2.x, B.skill2.y, 1]]); await p.waitForTimeout(80); await T('touchEnd', []); await p.waitForTimeout(1000);
  const sx = B.stick.x, sy = B.stick.y;
  await T('touchStart', [[sx, sy, 3]]); await T('touchMove', [[sx - 50, sy, 3]]); await p.waitForTimeout(250);
  await p.screenshot({ path: OUT + '/m22-left.png' });
  await T('touchMove', [[sx - 36, sy - 36, 3]]); await p.waitForTimeout(250);
  await p.screenshot({ path: OUT + '/m22-upleft.png' });
  await T('touchEnd', []); console.log('ok'); await b.close(); })();
