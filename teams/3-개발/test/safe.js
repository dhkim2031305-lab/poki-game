// 안전 영역 (QA M14·M15): 568·667·844에서 오른쪽 무리·취소 원·무적·조이스틱·HUD가 화면/안전 영역 안인지 + 캡처 (node safe.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  for (const [w, h, safe] of [[568, 320, ''], [667, 375, ''], [844, 390, ''], [844, 390, '47,0,47,21'], [667, 375, '44,0,44,21']]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/?render=2d' + (safe ? '&safe=' + safe : '')); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.msgs = []; });
    // 스킬2(→)를 꾹 눌러 취소 원 띄우기
    await p.evaluate(() => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos().skill2; const ev = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 5, pointerType: 'touch', clientX: r.left + x * s, clientY: r.top + y * s, bubbles: true })); ev('pointerdown', B.x, B.y); });
    await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const s = document.getElementById('game').getBoundingClientRect().width / UI.VW, B = G.btnPos(), VW = UI.VW, VH = UI.VH, SA = G.safeArea(), px = v => +(v * s).toFixed(1);
      return { arrow: px(66), cancelR: px(VW - (B.skill2.x + 33 + 14)), skill2R: px(VW - (B.skill2.x + 33)), invB: px(VH - (B.invuln.y + 33)), skill1T: px(B.skill.y - 33), safeR: px(SA.r), safeB: px(SA.b) }; });
    await p.screenshot({ path: `${S}/shots/safe-${w}${safe ? '-s' : ''}.png` });
    out.push(`${w}×${h}${safe ? ' safe=' + safe : ''}: 화살표 ${m.arrow}px · 취소 원 오른쪽 여백 ${m.cancelR}px · 스킬2 오른쪽 ${m.skill2R}px · 무적 아래 ${m.invB}px (안전 오른쪽 ${m.safeR}, 아래 ${m.safeB})${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
