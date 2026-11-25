// QA: 폰 첫 화면(첫 터치 전) PC 안내 숨김·터치 버튼 보임, 치기+쏘기 같이 누르기 = 무적, 3D에서 PC 더블클릭
// node phone-first.js OUT [port]
const { chromium } = require('playwright');
(async () => { const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  { const b = await chromium.launch();
    for (const [w, h] of [[667, 375], [568, 320]]) { const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
      await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
      await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(800);
      const st = await p.evaluate(() => ({ touchUI: G.touchUI, hint: G.msgs.some(m => m.hint) })); await p.screenshot({ path: `${OUT}/폰-${w}x${h}-첫터치전.png` });
      // 치기+쏘기 같이
      const U = h / 390, VW = w / U, B = { melee: [VW * .87 * U, 390 * .72 * U], ranged: [VW * .73 * U, 390 * .84 * U] };
      await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; });
      const cdp = await p.context().newCDPSession(p);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: B.melee[0], y: B.melee[1], id: 1 }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: B.melee[0], y: B.melee[1], id: 1 }, { x: B.ranged[0], y: B.ranged[1], id: 2 }] });
      await p.waitForTimeout(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(300);
      const inv = await p.evaluate(() => `무적 ${G.run.invuln} 스킬 ${G.run.skillsLeft.slice(1)} skillT ${G.hero.skillT.toFixed(2)}`);
      out.push(`폰 ${w}×${h} 첫 터치 전: touchUI=${st.touchUI} PC 안내=${st.hint} · 치기+쏘기 같이 → ${inv} (기대 무적 1)`); await p.close(); }
    await b.close(); }
  { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 1; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(800); await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; });
    await p.mouse.move(800, 360);
    const r = []; for (const [btn, gap] of [['right', 120], ['left', 120]]) { await p.mouse.click(800, 360, { button: btn }); await p.waitForTimeout(gap); await p.mouse.click(800, 360, { button: btn }); await p.waitForTimeout(1500); r.push(`${btn} 두 번 → ${await p.evaluate(() => G.run.skillsLeft.slice(1))}`); }
    await p.mouse.down({ button: 'left' }); await p.mouse.down({ button: 'right' }); await p.waitForTimeout(50); await p.mouse.up({ button: 'left' }); await p.mouse.up({ button: 'right' }); await p.waitForTimeout(800);
    r.push(`좌우 동시 → 무적 ${await p.evaluate(() => G.run.invuln)}`);
    out.push(`3D(초당 4~5장) PC: ${r.join(' · ')} (기대 4,5 → 4,4 → 무적 1)`); await b.close(); }
  console.log(out.join('\n')); })();
