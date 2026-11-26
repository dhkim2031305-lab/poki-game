// 폰 화살표 배치 (사용자 2026-11-26): → 치기 · ← 스킬1 · ↑ 스킬2 · ↓ 무적 — 568·667·844에서 스킬1·스킬2 취소 원 캡처 + 화면 안인지 (node arrows.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  for (const [w, h, safe] of [[568, 320, ''], [667, 375, ''], [844, 390, ''], [844, 390, '47,0,47,21']]) {
    for (const k of ['skill', 'skill2']) {
      const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('http://localhost:8080/web/?render=2d' + (safe ? '&safe=' + safe : '')); await p.waitForFunction(() => window.G && G.scene === 'title');
      await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
      await p.evaluate(() => { G.run.spawnT = 99; G.msgs = []; });
      const ev = (t, dx, dy) => p.evaluate(([t, k, dx, dy]) => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos()[k]; cv.dispatchEvent(new PointerEvent(t, { pointerId: 5, pointerType: 'touch', clientX: r.left + (B.x + dx) * s, clientY: r.top + (B.y + dy) * s, bubbles: true })); }, [t, k, dx, dy]);
      await ev('pointerdown', 0, 0); await p.waitForTimeout(250); await ev('pointermove', -60, -40); await p.waitForTimeout(250);
      const m = await p.evaluate(k => { const B = G.btnPos(), b = B[k], cr = b.r + 14, VW = UI.VW, VH = UI.VH; return { L: Math.round(b.x - cr), T: Math.round(b.y - cr - 16), R: Math.round(VW - (b.x + cr)), Bt: Math.round(VH - (b.y + cr)), aim: !!G.dbgAim() && G.dbgAim().drag }; }, k);
      await p.screenshot({ path: `${S}/arrows-${w}${safe ? '-s' : ''}-${k}.png` });
      await ev('pointerup', -60, -40);
      out.push(`${w}×${h}${safe ? ' safe' : ''} ${k}: 취소 원+글자 여백 왼${m.L} 위${m.T} 오른${m.R} 아래${m.Bt} 조준${m.aim ? 'O' : 'X'}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
      await p.close();
    }
  }
  console.log(out.join('\n')); await b.close(); })();
