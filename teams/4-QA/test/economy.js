// QA: 경제력 규칙 — 30개국 모두 라운드를 강제로 깨며 돈·파산 시점·6라운드 클리어 가능 여부 확인 + 화면 캡처(???·라운드 사이·파산)
// node economy.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, from = 0, to = 30] = process.argv.slice(2);
  const b = await chromium.launch(); const out = [];
  for (let ci = +from; ci < +to; ci++) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.waitForTimeout(250);
    if (ci === 0 || ci === 29) await p.screenshot({ path: `${OUT}/select-${ci + 1}.png` });
    await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    const log = [];
    const money0 = await p.evaluate(() => G.run.money);
    for (let k = 0; k < 7; k++) {
      const st = await p.evaluate(() => ({ scene: G.scene, round: G.run.round, money: +G.run.money.toFixed(2), kind: G.result && G.result.kind }));
      if (st.scene !== 'play') { log.push(`결과=${st.kind || st.scene}(r${st.round}, 돈 ${st.money})`); if ([0, 14, 15, 29].includes(ci)) await p.screenshot({ path: `${OUT}/result-${ci + 1}-${st.kind || st.scene}.png` }); break; }
      log.push(`r${st.round}:${st.money}`);
      await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
      if (ci === 0 && k === 0) { await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/between-1.png` }); }
      await p.waitForFunction(r0 => G.scene === 'result' || (G.scene === 'play' && G.run.round > r0), st.round, { timeout: 20000 }).catch(() => {});
      await p.waitForTimeout(300);
    }
    console.log(`${ci + 1} ${await p.evaluate(() => G.country.ko)} 시작 ${money0}: ${log.join(' → ')}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  await b.close();
})();
