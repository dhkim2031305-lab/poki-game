// 광고 흐름 점검: 라운드를 강제로 끝내 파산·쓰러짐을 만들고 버튼을 눌러 봐요. Platform 호출을 기록해요.
const { chromium } = require('playwright');
(async () => {
  const [S, site] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:8080/${site}/`);
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 });
  await p.evaluate(() => {
    window.__calls = [];
    for (const k of ['gameplayStart', 'gameplayStop', 'commercialBreak', 'rewardedBreak']) {
      const f = Platform[k].bind(Platform);
      Platform[k] = (...a) => { __calls.push(k); if (k === 'rewardedBreak' || k === 'commercialBreak') return Promise.resolve(k === 'rewardedBreak' ? true : undefined); return f(...a); };
    }
  });
  const clearRound = () => p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
  const tapHit = async id => { const xy = await p.evaluate(id => { const h = UI.hits.find(h => h.id === id); if (!h) return null; const u = Math.min(innerWidth / 844, innerHeight / 390); return [(h.x + h.w / 2) * u, (h.y + h.h / 2) * u]; }, id); if (!xy) return false; await p.touchscreen.tap(xy[0], xy[1]); return true; };
  const st = () => p.evaluate(() => ({ scene: G.scene, round: G.run && G.run.round, money: G.run && +G.run.money.toFixed(2), kind: G.result && G.result.kind, hits: UI.hits.map(h => h.id).join(','), calls: __calls.join(' ') }));
  const out = [];
  await tapHit('start'); await p.waitForTimeout(200);
  await p.evaluate(() => { G.sel = 29; }); await p.waitForTimeout(100); await tapHit('confirm'); await p.waitForTimeout(300);
  out.push('콜롬비아 시작: ' + JSON.stringify(await st()));
  await clearRound(); await p.waitForTimeout(3800); out.push('R1 클리어 후: ' + JSON.stringify(await st()));
  await clearRound(); await p.waitForTimeout(1500); out.push('R2 클리어 후(파산 예상): ' + JSON.stringify(await st()));
  await p.screenshot({ path: `${S}/shots/ad-bankrupt1.png` });
  out.push('다음 라운드(보상형) 누름: ' + await tapHit('bankruptGo')); await p.waitForTimeout(600); out.push('  → ' + JSON.stringify(await st()));
  await p.screenshot({ path: `${S}/shots/ad-continue-msg.png` });
  await clearRound(); await p.waitForTimeout(1500); out.push('R3 클리어 후(또 파산): ' + JSON.stringify(await st()));
  await p.screenshot({ path: `${S}/shots/ad-bankrupt2.png` });
  out.push('다시하기 누름(보상형 본 판 → 판 사이 광고 건너뜀 예상): ' + await tapHit('restart')); await p.waitForTimeout(600); out.push('  → ' + JSON.stringify(await st()));
  await p.evaluate(() => { __calls = []; });
  await p.evaluate(() => { G.hero.hp = 1; G.hero.inv = 0; G.aliens.push({ type: 'grunt', x: G.hero.x + 5, y: G.hero.y, dx: 0, dy: 0, entering: false, hp: 30, max: 30, speed: 0, r: 15, flash: 0, shootT: 9, seed: 0, vx: 0, recoil: 0 }); });
  await p.waitForTimeout(1500); out.push('쓰러짐: ' + JSON.stringify(await st()));
  await p.screenshot({ path: `${S}/shots/ad-fail.png` });
  out.push('그 자리에서(보상형) 누름: ' + await tapHit('revive')); await p.waitForTimeout(500); out.push('  → ' + JSON.stringify(await p.evaluate(() => ({ scene: G.scene, hp: G.hero.hp, inv: +G.hero.inv.toFixed(2), calls: __calls.join(' ') }))));
  await p.evaluate(() => { G.hero.hp = 1; G.hero.inv = 0; G.hero.skillT = 0; G.aliens.push({ type: 'grunt', x: G.hero.x + 5, y: G.hero.y, dx: 0, dy: 0, entering: false, hp: 30, max: 30, speed: 0, r: 15, flash: 0, shootT: 9, seed: 0, vx: 0, recoil: 0 }); });
  await p.waitForTimeout(1500); out.push('두 번째 쓰러짐(이어하기 버튼 없어야 함): ' + JSON.stringify(await st()));
  await p.screenshot({ path: `${S}/shots/ad-fail2.png` });
  await tapHit('restart'); await p.waitForTimeout(500); out.push('다시하기(이 판도 보상형 봄 → 건너뜀): ' + JSON.stringify(await st()));
  await p.evaluate(() => { __calls = []; G.hero.dead = true; G.hero.deadT = 0; }); await p.waitForTimeout(1200);
  await tapHit('restart'); await p.waitForTimeout(500); out.push('보상형 안 본 판 다시하기(판 사이 광고 예상): ' + JSON.stringify(await st()));
  // 일시정지
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); out.push('ESC: paused=' + await p.evaluate(() => G.paused));
  await p.screenshot({ path: `${S}/shots/pause.png` });
  await tapHit('lang'); await p.waitForTimeout(200); await p.screenshot({ path: `${S}/shots/pause-lang.png` });
  await tapHit('lang:ko'); await p.keyboard.press('Escape'); await p.waitForTimeout(200); out.push('ESC 다시: paused=' + await p.evaluate(() => G.paused) + ' lang=' + await p.evaluate(() => I18N.lang));
  console.log(out.join('\n') + '\nerrors: ' + (errs.join(' | ') || 'none'));
  await b.close();
})();
