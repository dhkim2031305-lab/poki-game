// 연결체가 날아가는 중 일시정지 1초 → 재개: 정지 동안 효과 시계·피해가 같이 멈추는지 (아일랜드 1)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 1; }); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 260; h.y = 230; h.inv = 99;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }); G.aliens.push(mk(560, 230)); });
  await p.mouse.move(75 + 560, 230); await p.keyboard.press('KeyL'); await p.waitForTimeout(220);
  const s = () => p.evaluate(() => { const l = G.fx.find(e => e.type === 'link'); return { link: l ? +l.t.toFixed(2) : null, dmg: 99999 - G.aliens[0].hp }; });
  const a = await s(); await p.keyboard.press('Escape'); await p.waitForTimeout(1000); const b2 = await s();
  await p.keyboard.press('Escape'); await p.waitForTimeout(80); const c = await s(); await p.waitForTimeout(600); const d = await s();
  console.log('정지 전', JSON.stringify(a), '| 정지 1초 뒤', JSON.stringify(b2), '| 재개 직후', JSON.stringify(c), '| 0.6초 뒤', JSON.stringify(d), '| errors', errs.length ? errs : 'none');
  await b.close(); })();
