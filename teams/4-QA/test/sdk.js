// QA: 빌드한 ZIP(풀어서 서버에 올린 것)에 가짜 SDK를 넣어 호출 순서·광고 중 소리/입력·광고 차단을 검사
// node sdk.js OUT site [port=8090] [block]
const { chromium } = require('playwright');
const STUB = {
  poki: `window.PokiSDK={init:()=>Promise.resolve(),setDebug(){},gameLoadingFinished(){__L('gameLoadingFinished')},gameplayStart(){__L('gameplayStart')},gameplayStop(){__L('gameplayStop')},
    commercialBreak(cb){__L('commercialBreak');cb&&cb();return __AD()},rewardedBreak(cb){__L('rewardedBreak');cb&&cb();return __AD().then(()=>true)}};`,
  crazygames: `window.CrazyGames={SDK:{init:async()=>{__L('init')},game:{loadingStart(){__L('loadingStart')},loadingStop(){__L('loadingStop')},gameplayStart(){__L('gameplayStart')},gameplayStop(){__L('gameplayStop')}},
    ad:{requestAd(t,c){__L('requestAd:'+t);c.adStarted&&c.adStarted();__AD().then(()=>c.adFinished&&c.adFinished())}}}};`,
  gamedistribution: `window.gdsdk={preloadAd(){return Promise.resolve()},showAd(t){__L('showAd:'+(t||'interstitial'));GD_OPTIONS.onEvent({name:'SDK_GAME_PAUSE'});return __AD().then(()=>GD_OPTIONS.onEvent({name:'SDK_GAME_START'}))}};setTimeout(()=>GD_OPTIONS.onEvent({name:'SDK_READY'}),50);`,
};
const URL = { poki: /poki-sdk\.js/, crazygames: /crazygames-sdk/, gamedistribution: /gamedistribution\.com\/main/ };
(async () => {
  const [OUT, site, port = 8090, block] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 } });
  const ext = [];
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(`http://localhost:${port}/`)) return r.continue();
    if (!block && URL[site] && URL[site].test(u)) return r.fulfill({ contentType: 'text/javascript', body: STUB[site] });
    ext.push(u); return r.abort(); });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.addInitScript(() => { window.__log = []; window.__L = s => __log.push(s + '@' + (window.G ? G.scene : '-'));
    window.__adSamples = []; window.__AD = () => new Promise(r => { const t0 = Date.now(); const iv = setInterval(() => { __adSamples.push({ mute: window.AUDIO && AUDIO.adMute, scene: G.scene, hx: G.hero && G.hero.x }); }, 100); setTimeout(() => { clearInterval(iv); r(); }, 900); }); });
  const t0 = Date.now();
  await p.goto(`http://localhost:${port}/${site}/index.html`);
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 15000 });
  const tTitle = Date.now() - t0;
  await p.waitForTimeout(500);
  const tap = async id => { const xy = await p.evaluate(id => { const h = UI.hits.find(h => h.id === id); if (!h) return null; const u = Math.min(innerWidth / 844, innerHeight / 390); return [(h.x + h.w / 2) * u, (h.y + h.h / 2) * u]; }, id); if (!xy) return false; await p.mouse.click(xy[0], xy[1]); return true; };
  const btns = () => p.evaluate(() => UI.hits.map(h => h.id).join(','));
  const out = { site, tTitle, steps: [] };
  const step = async name => out.steps.push(`${name}: scene=${await p.evaluate(() => G.scene)} btns=[${await btns()}] log=${await p.evaluate(() => __log.splice(0).join(' '))}`);
  await step('타이틀');
  await tap('start'); await p.waitForTimeout(300); await tap('confirm'); await p.waitForTimeout(600); await step('플레이 시작');
  // 일시정지
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); await step('ESC 일시정지'); await p.keyboard.press('Escape'); await p.waitForTimeout(200); await step('ESC 다시');
  // 쓰러짐 → 결과
  await p.evaluate(() => { G.hero.hp = 0; G.hero.dead = true; G.hero.deadT = 0; }); await p.waitForTimeout(1500); await step('쓰러짐 결과');
  await p.screenshot({ path: `${OUT}/sdk-${site}${block ? '-block' : ''}-fail.png` });
  // 광고보기(보상형) → 광고 중 입력 시험
  const hasRevive = await tap('revive');
  if (hasRevive) { await p.waitForTimeout(150); await p.keyboard.down('KeyD'); await p.waitForTimeout(500); await p.keyboard.up('KeyD'); await p.waitForTimeout(800);
    const s = await p.evaluate(() => __adSamples.splice(0)); out.adRevive = s.map(x => `${x.mute ? '무음' : '소리'}/${x.scene}/x${Math.round(x.hx)}`).join(' '); await step('보상형 끝(이어하기)'); await p.waitForTimeout(400);
    out.muteAfter = await p.evaluate(() => AUDIO.adMute); }
  else out.steps.push('광고보기 버튼 없음');
  // 6라운드 클리어 → 다시하기 → 판 사이 광고
  await p.evaluate(() => { const r = G.run; r.round = 6; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; }); await p.waitForTimeout(7000); await step('6라운드 클리어');
  await tap('restart'); await p.waitForTimeout(1300); out.adInter = await p.evaluate(() => __adSamples.splice(0)); await step('클리어 다시하기(보상형 본 판 → 한 번 건너뜀)');
  await p.evaluate(() => { const r = G.run; r.round = 6; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; }); await p.waitForTimeout(7000);
  await tap('restart'); await p.waitForTimeout(150); await p.keyboard.down('KeyD'); await p.waitForTimeout(500); await p.keyboard.up('KeyD'); await p.waitForTimeout(800);
  out.adInter = await p.evaluate(() => __adSamples.splice(0)).then(a => a.map(x => `${x.mute ? '무음' : '소리'}/${x.scene}`).join(' ')); out.muteAfter2 = await p.evaluate(() => AUDIO.adMute); await step('두 번째 클리어 다시하기(판 사이 광고)');
  out.ext = ext; out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
