// QA: M14·M15 안전 영역 — 스킬2 취소 원·글자 화면 안, ↓ 무적 아래 여백 ≥12px, ?safe= 흉내에서 HUD·조이스틱·일시정지도 안쪽, 화살표 ≥44px
// node safe.js OUT [port]
const { chromium } = require('playwright');
(async () => { const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  for (const q of ['', '47,0,47,21']) for (const [W, H] of [[568, 320], [667, 375], [844, 390]]) {
    const p = await b.newPage({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?render=2d${q ? '&safe=' + q : ''}`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(1800);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.touchUI = true; }); await p.waitForTimeout(200);
    const r = await p.evaluate(async () => {
      const U = Math.min(innerWidth / 844, innerHeight / 390), B = G.btnPos(), SA = G.safeArea();
      const box = k => ({ x0: (B[k].x - B[k].r) * U, x1: (B[k].x + B[k].r) * U, y0: (B[k].y - B[k].r) * U, y1: (B[k].y + B[k].r) * U });
      const pause = UI.hits.find(h => h.id === 'pause');
      // 스킬2 끌기 → 취소 상태의 원 (반지름 = 버튼 + 14) · 글자는 원 위 9px, 12px 굵게
      const c = document.querySelector('canvas'), bb = c.getBoundingClientRect(), ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', pointerId: 9, clientX: bb.left + x * U, clientY: bb.top + y * U, bubbles: true, cancelable: true, buttons: t === 'pointerup' ? 0 : 1 }));
      const k2 = B.skill2; ev('pointerdown', k2.x, k2.y); await new Promise(r => setTimeout(r, 250)); ev('pointermove', k2.x - 80, k2.y - 40); await new Promise(r => setTimeout(r, 60)); ev('pointermove', k2.x, k2.y); await new Promise(r => setTimeout(r, 120));
      const a = G.dbgAim(); const cb = a && a.b; const cr = cb ? cb.r + 14 : 0;
      return { U, SA: [SA.l, SA.t, SA.r, SA.b].map(v => +(v * U).toFixed(1)), arrows: ['melee', 'skill', 'skill2', 'invuln'].map(k => [k, box(k)]), size: B.skill.r * 2 * U,
        cancel: cb ? { x0: (cb.x - cr) * U, x1: (cb.x + cr) * U, y0: (cb.y - cr - 9 - 8) * U, y1: (cb.y + cr) * U, on: a.cancel } : null, pause: pause && { x0: pause.x * U, x1: (pause.x + pause.w) * U, y0: pause.y * U },
        stick: { x: B.stick.x * U, y: B.stick.y * U } };
    });
    await p.screenshot({ path: `${OUT}/safe-${q ? 'sim' : 'none'}-${W}x${H}.png` });
    await p.evaluate(() => { const c = document.querySelector('canvas'); c.dispatchEvent(new PointerEvent('pointerup', { pointerType: 'touch', pointerId: 9, bubbles: true })); });
    const [sl, st, sr, sb] = r.SA; const inv = r.arrows.find(a => a[0] === 'invuln')[1], s2 = r.arrows.find(a => a[0] === 'skill2')[1];
    const okArrows = r.arrows.every(([, x]) => x.x0 >= sl - .5 && x.x1 <= W - sr + .5 && x.y1 <= H - sb + .5);
    const okCancel = r.cancel && r.cancel.x1 <= W && r.cancel.x0 >= 0 && r.cancel.y0 >= 0 && r.cancel.on;
    const okPause = !r.pause || (r.pause.x1 <= W - sr + .5);
    out.push(`${q ? '안전영역 47,0,47,21' : '안전영역 없음(최소 12)'} ${W}×${H}: 여백(l,t,r,b)=${r.SA} · 화살표 ${r.size.toFixed(0)}px ${r.size >= 44 ? '✅' : '❌'} · 화살표 화면/안전영역 안 ${okArrows ? '✅' : '❌'} · ↓ 아래 여백 ${(H - inv.y1).toFixed(1)}px ${H - inv.y1 >= 12 ? '✅' : '❌'} · → 오른쪽 여백 ${(W - s2.x1).toFixed(1)}px · 취소 원 x ${r.cancel ? r.cancel.x0.toFixed(0) + '~' + r.cancel.x1.toFixed(0) + ' (글자 위 끝 y ' + r.cancel.y0.toFixed(0) + ')' : '없음'} ${okCancel ? '✅' : '❌'} · 일시정지 오른쪽 끝 ${r.pause ? r.pause.x1.toFixed(0) : '-'} ${okPause ? '✅' : '❌'}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
