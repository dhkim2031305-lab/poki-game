// QA: 기록 저장(새로고침 뒤), 저장소 막힘(시크릿 모드 흉내)에서 에러 없음, 스페이스·방향키로 페이지 스크롤 안 됨
// node misc.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8080; const b = await chromium.launch(); const out = [];
  { const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 0; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; }); await p.waitForTimeout(4000);
    await p.evaluate(() => { G.hero.hp = 0; G.hero.dead = true; G.hero.deadT = 0; }); await p.waitForTimeout(1500);
    const ls1 = await p.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k).slice(0, 120)]))));
    await p.reload(); await p.waitForFunction(() => window.G && G.scene === 'title');
    const ls2 = await p.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k).slice(0, 120)]))));
    const sy0 = await p.evaluate(() => scrollY); await p.keyboard.press('Space'); await p.keyboard.press('ArrowDown'); await p.keyboard.press('PageDown'); const sy1 = await p.evaluate(() => scrollY);
    out.push(`저장: 판 끝난 뒤 ${ls1}\n새로고침 뒤 ${ls2}\n스크롤 ${sy0}→${sy1}\n에러: ${errs.join(' | ') || '없음'}`); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { const bad = () => { throw new DOMException('denied', 'SecurityError'); }; Object.defineProperty(window, 'localStorage', { get: bad }); Object.defineProperty(window, 'sessionStorage', { get: bad }); });
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 10000 }).catch(() => errs.push('타이틀까지 못 감'));
    await p.evaluate(() => { G.scene = 'select'; G.sel = 0; }); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
    await p.evaluate(() => { G.hero.hp = 0; G.hero.dead = true; G.hero.deadT = 0; }); await p.waitForTimeout(1500);
    out.push(`저장소 막힘: 장면=${await p.evaluate(() => G.scene)} 에러: ${errs.join(' | ') || '없음'}`); await ctx.close(); }
  console.log(out.join('\n')); await b.close();
})();
