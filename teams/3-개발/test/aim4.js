// 천자총통 조준 거리 자유 (사용자 2026-11-28 "범위 안에서 마음대로"): 폰 오른쪽 조이스틱 민 만큼 · PC 커서 자리 — 화포↔조준 거리 기록 + 캡처
// 사용: node aim4.js [캡처폴더]
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(), OUT = process.argv[2]; const o = [];
  const dist = p => p.evaluate(() => { const c = G.hero.koreaBattery; if (!c) return 'off'; const a = c.aim(), s = c.basicTarget(); return `조준 거리 ${Math.round(Math.hypot(a.x - c.x, a.y - c.y))} (기본 포탄 ${Math.round(Math.hypot(s.x - c.x, s.y - c.y))})`; });
  const start = async p => { await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(600);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 300; h.y = 230; h.inv = 99; }); };
  { const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); await start(p);
    const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
    const cdp = await p.context().newCDPSession(p), T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x: x * U, y: y * U, id })) });
    await T('touchStart', [[B.skill2.x, B.skill2.y, 1]]); await p.waitForTimeout(80); await T('touchEnd', []); await p.waitForTimeout(900);
    const R = await p.evaluate(() => G.btnPos().stick.r || 50); const sx = B.stick.x, sy = B.stick.y;
    o.push('폰 처음 ' + await dist(p));
    await T('touchStart', [[sx, sy, 3]]);
    for (const k of [.35, .6, 1]) { await T('touchMove', [[sx + R * k, sy, 3]]); await p.waitForTimeout(150); o.push(`폰 오른쪽 조이스틱 ${Math.round(k * 100)}% ` + await dist(p)); if (OUT && k === 1) await p.screenshot({ path: OUT + '/aim4-phone-max.png' }); }
    await T('touchEnd', []); await p.waitForTimeout(100); o.push('폰 뗀 뒤 ' + await dist(p)); await p.close(); }
  { const p = await b.newPage({ viewport: { width: 844, height: 390 } }); await start(p);
    await p.mouse.move(500, 200); await p.keyboard.press('Semicolon'); await p.waitForTimeout(900);
    for (const d of [80, 180, 280, 500]) { const s = await p.evaluate(d => { const c = G.hero.koreaBattery; return G.dbgField(c.x + d, c.y); }, d); await p.mouse.move(s.x, s.y); await p.waitForTimeout(120); o.push(`PC 커서 ${d}px ` + await dist(p)); if (OUT && d === 180) await p.screenshot({ path: OUT + '/aim4-pc-180.png' }); }
    await p.close(); }
  console.log(o.join('\n')); await b.close(); })();
