// QA: GDD 0-14 — PC 마우스 클릭은 언제나 공격(오른쪽 위 연속 클릭해도 일시정지 안 됨), Esc만 설정 창, 포커스 잃으면 조용히 멈춤, 터치는 일시정지 버튼
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = [];
  const go = async (p) => { await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title'); await p.evaluate(() => { G.scene = 'select'; G.sel = 1; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400); await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; }); };
  const st = p => p.evaluate(() => `paused=${G.paused} 설정창=${UI.hits.some(h => h.id === 'resume')} 버튼=[${UI.hits.map(h => h.id)}]`);
  { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await go(p);
    for (let i = 0; i < 6; i++) { await p.mouse.click(1240, 40); await p.waitForTimeout(90); } await p.waitForTimeout(300); out.push('PC 오른쪽 위 6번 클릭 → ' + await st(p));
    await p.keyboard.press('KeyP'); await p.waitForTimeout(200); out.push('PC P 키 → ' + await st(p));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); out.push('PC Esc → ' + await st(p));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200); out.push('PC Esc 다시 → ' + await st(p));
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('blur')); }); await p.waitForTimeout(300); out.push('창 숨김/포커스 잃음 → ' + await st(p));
    await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')); }); await p.waitForTimeout(300); out.push('돌아옴 → ' + await st(p));
    await p.close(); }
  { const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true }); await go(p); await p.touchscreen.tap(200, 200); await p.waitForTimeout(200);
    const xy = await p.evaluate(() => { const h = UI.hits.find(h => h.id === 'pause'); if (!h) return null; const u = Math.min(innerWidth / 844, innerHeight / 390); return [(h.x + h.w / 2) * u, (h.y + h.h / 2) * u]; });
    if (xy) { await p.touchscreen.tap(xy[0], xy[1]); await p.waitForTimeout(300); } out.push('터치 일시정지 버튼 ' + (xy ? '탭 → ' + await st(p) : '없음')); await p.close(); }
  console.log(out.join('\n')); await b.close(); })();
