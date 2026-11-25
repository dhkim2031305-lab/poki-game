// 6라운드 능력치 실측 (F 공식 확인): 라운드를 강제로 깨며 6라운드의 체력·원거리·F를 읽어요 (node fstat.js 0,1,7,14)
const { chromium } = require('playwright');
(async () => { const list = (process.argv[2] || '0,1,7,14').split(',').map(Number); const b = await chromium.launch(); const out = [];
  for (const ci of list) { const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play');
    for (let k = 0; k < 5; k++) { await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; }); await p.waitForFunction(k => G.scene === 'play' && G.run.round === k + 2, k, { timeout: 15000 }); }
    const r = await p.evaluate(() => ({ key: G.country.key, rank: G.country.rank, start: G.country.money, money: +G.run.money.toFixed(2), F: +G.run.st.F.toFixed(3), hp: G.run.st.hp, ranged: +G.run.st.ranged.toFixed(1) }));
    out.push(`${r.rank}위 ${r.key}: 시작 ${r.start} → 6라운드 돈 ${r.money} · F ${r.F} · 체력 ${r.hp} · 원거리 ${r.ranged}`); await p.close(); }
  console.log(out.join('\n')); await b.close(); })();
