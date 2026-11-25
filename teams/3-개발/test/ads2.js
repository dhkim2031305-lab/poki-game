// 광고 흐름 점검 2 (리뷰 반영 후): 버튼 3개 · 다시하기 광고 규칙 · 광고 실패/거부 · SDK 막힘
const { chromium } = require('playwright');
(async () => {
  const [S, site] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(`http://localhost:8080/${site}/`);
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 });
  await p.evaluate(() => {
    window.__calls = []; window.__mode = 'ok';
    Platform.adsReady = () => true;
    Platform.commercialBreak = cb => { __calls.push('commercial'); cb && cb(); return Promise.resolve(); };
    Platform.rewardedBreak = cb => { __calls.push('rewarded:' + __mode); if (__mode === 'reject') { cb && cb(); return Promise.reject(new Error('no fill')); } if (__mode === 'false') return Promise.resolve(false); return Promise.resolve(true); };
  });
  const clearRound = () => p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
  const die = () => p.evaluate(() => { G.hero.hp = 0; G.hero.dead = true; G.hero.deadT = 0; });
  const tap = async id => { const xy = await p.evaluate(id => { const h = UI.hits.find(h => h.id === id); if (!h) return null; const u = Math.min(innerWidth / 844, innerHeight / 390); return [(h.x + h.w / 2) * u, (h.y + h.h / 2) * u]; }, id); if (!xy) return 'NO BUTTON'; await p.touchscreen.tap(xy[0], xy[1]); return 'tap'; };
  const st = () => p.evaluate(() => `${G.scene} r=${G.run && G.run.round} btns=[${UI.hits.map(h => h.id).join(',')}] mute=${AUDIO.adMute} calls=${__calls.join(' ')}`);
  const reset = () => p.evaluate(() => { __calls = []; });
  const out = [];
  await tap('start'); await p.waitForTimeout(200); await p.evaluate(() => { G.sel = 29; }); await p.waitForTimeout(80); await tap('confirm'); await p.waitForTimeout(300);
  // 1) 실패 화면: 버튼 3개
  await die(); await p.waitForTimeout(1200); out.push('① 실패 화면: ' + await st());
  await p.screenshot({ path: `${S}/shots/r1-fail.png` });
  // 2) 보상형 거부(시작 후 reject) → 결과 화면으로, 소리 복구, 광고 버튼 숨김
  await p.evaluate(() => { __mode = 'reject'; }); await tap('revive'); await p.waitForTimeout(400); out.push('② 보상형 거부: ' + await st());
  // 3) 다시하기(실패) → 광고 없이 새 판
  await reset(); await tap('restart'); await p.waitForTimeout(400); out.push('③ 실패 다시하기: ' + await st());
  // 4) 파산 → 광고보기 성공 → 다음 라운드
  await p.evaluate(() => { __mode = 'ok'; });
  await clearRound(); await p.waitForTimeout(3800); await clearRound(); await p.waitForTimeout(1400);
  out.push('④ 파산 화면: ' + await st()); await p.screenshot({ path: `${S}/shots/r1-bankrupt.png` });
  await reset(); await tap('bankruptGo'); await p.waitForTimeout(400); out.push('   광고보기 → ' + await st());
  // 5) 파산 다시하기 → 광고 없음
  await clearRound(); await p.waitForTimeout(1400); await reset(); await tap('restart'); await p.waitForTimeout(400); out.push('⑤ 파산 다시하기: ' + await st());
  // 6) 클리어 다시하기 → 판 사이 광고
  await p.evaluate(() => { G.run.round = 6; }); await clearRound(); await p.waitForTimeout(6500);
  out.push('⑥ 클리어 화면: ' + await st()); await p.screenshot({ path: `${S}/shots/r1-clear.png` });
  await reset(); await tap('restart'); await p.waitForTimeout(400); out.push('   다시하기 → ' + await st());
  // 7) 종료 → 시작 화면
  await die(); await p.waitForTimeout(1200); await tap('quit'); await p.waitForTimeout(300); out.push('⑦ 종료: ' + await st());
  // 8) SDK 막힘 → 광고 버튼 없음
  await p.evaluate(() => { Platform.adsReady = () => false; }); await tap('start'); await p.waitForTimeout(200); await tap('confirm'); await p.waitForTimeout(300);
  await die(); await p.waitForTimeout(1200); out.push('⑧ SDK 막힘 실패 화면: ' + await st());
  console.log(out.join('\n') + '\nerrors: ' + (errs.join(' | ') || 'none'));
  await b.close();
})();
