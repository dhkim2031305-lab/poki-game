// QA: 최신 커밋 다시 보기 — 나라 고르기 ???, HUD 체력 숫자 없음, 결과 화면 출처 없음, 무적 1.5초, 1위 ×2 보정
// node recheck.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  for (const ci of [0, 14]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/re-select-${ci + 1}.png` });
    await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; }); await p.screenshot({ path: `${OUT}/re-hud-${ci + 1}.png` });
    const st = await p.evaluate(() => ({ F: G.run.st.F, hp: G.hero.maxHp, sp: G.run.st.speed || G.run.st.spd, st: JSON.stringify(G.run.st) }));
    await p.keyboard.press('Space'); const inv = await p.evaluate(() => new Promise(r => { const t0 = performance.now(); const iv = setInterval(() => { if (!(G.hero.skillT > 0)) { clearInterval(iv); r((performance.now() - t0) / 1000); } }, 20); }));
    await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; }); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/re-between-${ci + 1}.png` });
    await p.waitForTimeout(3000); await p.evaluate(() => { G.hero.hp = 0; G.hero.dead = true; G.hero.deadT = 0; }); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/re-result-${ci + 1}.png` });
    out.push(`${ci + 1}위: 능력치 ${st.st} · 무적 지속 ${inv.toFixed(2)}초 · 에러 ${errs.join('|') || '없음'}`); await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
