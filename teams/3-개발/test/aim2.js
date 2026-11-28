// 천자총통 쏘는 중 공격 방향 = 이동 조이스틱(폰 왼쪽 끌기) · PC WASD — 조준 방향·남은 횟수 기록
// 사용: node aim2.js
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 420; h.y = 230; h.inv = 99; });
  const st = () => p.evaluate(() => { const c = G.hero.koreaBattery; if (!c) return 'off'; const a = c.aim(); return `화포 ${Math.round(c.x)},${Math.round(c.y)} → 조준 ${Math.round(a.x)},${Math.round(a.y)} 남은 ${JSON.stringify(G.run.skillsLeft)}`; });
  const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
  const cdp = await p.context().newCDPSession(p), T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x: x * U, y: y * U, id })) });
  await T('touchStart', [[B.skill2.x, B.skill2.y, 1]]); await p.waitForTimeout(80); await T('touchEnd', []); await p.waitForTimeout(1100);
  const o = ['처음 ' + await st()];
  const jx = 150, jy = 250; await T('touchStart', [[jx, jy, 2]]);
  for (const [dx, dy, l] of [[-50, 0, '왼쪽'], [0, -50, '위'], [50, 0, '오른쪽'], [0, 50, '아래']]) { await T('touchMove', [[jx + dx, jy + dy, 2]]); await p.waitForTimeout(150); o.push(`조이스틱 ${l} ` + await st()); }
  await T('touchEnd', []); await p.waitForTimeout(80); o.push('뗀 뒤 ' + await st());
  await T('touchStart', [[B.skill2.x, B.skill2.y, 3]]); await p.waitForTimeout(80); await T('touchEnd', []); await p.waitForTimeout(80); o.push('쏘는 중 2번 톡 ' + await st());
  console.log(o.join('\n')); await b.close(); })();
