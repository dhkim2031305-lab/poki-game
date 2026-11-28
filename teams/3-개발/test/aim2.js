// 천자총통 쏘는 중 2번 스킬로 방향 다시 정하기: PC ; 키(커서 자리) · 폰 2번 버튼 끌기 — 조준 방향·남은 횟수 기록
// 사용: node aim2.js
const { chromium } = require('playwright');
async function start(b, touch) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: touch, isMobile: touch });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(600);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 420; h.y = 230; h.inv = 99; });
  return p;
}
const st = p => p.evaluate(() => { const c = G.hero.koreaBattery; if (!c) return 'off'; const a = c.aim(); return `조준 ${Math.round(a.x)},${Math.round(a.y)} 남은 ${JSON.stringify(G.run.skillsLeft)}`; });
(async () => { const b = await chromium.launch();
  { const p = await start(b, false); await p.mouse.move(700, 230); await p.keyboard.press('Semicolon'); await p.waitForTimeout(1100);
    const o = ['PC 처음(오른쪽 커서) ' + await st(p)];
    await p.mouse.move(420, 60); await p.keyboard.press('Semicolon'); await p.waitForTimeout(60); o.push('PC ; 위쪽 커서 ' + await st(p));
    await p.mouse.move(120, 230); await p.keyboard.press('Semicolon'); await p.waitForTimeout(60); o.push('PC ; 왼쪽 커서 ' + await st(p));
    console.log(o.join('\n')); await p.close(); }
  { const p = await start(b, true); const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
    const cdp = await p.context().newCDPSession(p), T = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: x * U, y: y * U, id: 1 }] });
    await T('touchStart', B.skill2.x, B.skill2.y); await p.waitForTimeout(80); await T('touchEnd'); await p.waitForTimeout(1100);
    const o = ['폰 톡 처음 ' + await st(p)];
    await T('touchStart', B.skill2.x, B.skill2.y); await p.waitForTimeout(300);
    for (const [dx, dy, l] of [[-60, 0, '왼쪽'], [0, -60, '위'], [0, 50, '아래']]) { await T('touchMove', B.skill2.x + dx, B.skill2.y + dy); await p.waitForTimeout(120); o.push(`폰 2번 끄는 중 ${l} ` + await st(p)); }
    await T('touchEnd'); await p.waitForTimeout(80); o.push('폰 뗀 뒤 ' + await st(p));
    console.log(o.join('\n')); await p.close(); }
  await b.close(); })();
