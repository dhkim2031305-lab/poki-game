// QA: 첫 다운로드 = 첫 Platform.gameplayStart() 호출까지 받은 바이트 (CrazyGames 기준, teams/5-출시/용량-기준.md)
// 실제 사람 흐름: 첫 화면 → 시작 → 나라 고르기(기본·한국) → 시작 → 로딩 → 첫 판. CDP Network.loadingFinished의 encodedDataLength 합.
// 폰 흉내(844×390, DPR 3, 터치)와 PC(1280×720) 두 번. node firstdl.js BASEURL [나라번호] [느린4G=1]
// BASEURL 예: http://localhost:8080/crazygames/  또는 압축 푼 dist ZIP을 띄운 주소
const { chromium } = require('playwright');
(async () => {
  const [BASE = 'http://localhost:8080/crazygames/', ci = '14', slow = '0'] = process.argv.slice(2); const out = [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const dev of [{ tag: '폰 844×390 DPR3', viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true }, { tag: 'PC 1280×720', viewport: { width: 1280, height: 720 } }]) {
    const ctx = await b.newContext(dev); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (slow === '1') await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });   // 느린 4G
    const reqs = new Map(); let total = 0, atStart = null, tStart = null; const t0 = Date.now(); const byType = {};
    cdp.on('Network.responseReceived', e => reqs.set(e.requestId, { url: e.response.url, type: e.type }));
    cdp.on('Network.loadingFinished', e => { total += e.encodedDataLength; const r = reqs.get(e.requestId) || {}; const k = /\.(webp|png|jpg)/.test(r.url || '') ? 'image' : /\.(mp3|ogg|wav)/.test(r.url || '') ? 'audio' : /\.js/.test(r.url || '') ? 'js' : (r.type || 'other'); byType[k] = (byType[k] || 0) + e.encodedDataLength; });
    await p.exposeFunction('__qaGameplayStart', () => { if (atStart == null) { atStart = { total, byType: { ...byType } }; tStart = Date.now() - t0; } });
    await p.addInitScript(() => { let P; Object.defineProperty(window, 'Platform', { configurable: true, get: () => P, set: v => { P = v; const g = v && v.gameplayStart; if (g) v.gameplayStart = function () { window.__qaGameplayStart(); return g.apply(this, arguments); }; } }); try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} });
    await p.goto(BASE); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 180000 });
    const tTitle = Date.now() - t0, atTitle = total;
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, +ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => window.G && G.scene === 'play', null, { timeout: 300000 }); await p.waitForTimeout(1500);
    const mb = x => (x / 1048576).toFixed(2) + 'MB';
    out.push(`${dev.tag}${slow === '1' ? ' 느린4G' : ''}: 첫 화면까지 ${mb(atTitle)} (${(tTitle / 1000).toFixed(1)}초) · 첫 gameplayStart까지 ${atStart ? mb(atStart.total) + ` (${(tStart / 1000).toFixed(1)}초) [그림 ${mb(atStart.byType.image || 0)} · 소리 ${mb(atStart.byType.audio || 0)} · js ${mb(atStart.byType.js || 0)}]` : '호출 없음'} · 1.5초 뒤 합계 ${mb(total)}`);
    await ctx.close();
  }
  console.log(out.join('\n')); await b.close();
})();
