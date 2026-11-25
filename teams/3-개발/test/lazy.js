// 첫 로딩에 나라 그림(dir/·weapon/)이 없는지, 나라를 고르면 그 나라 것만 불러오는지
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const req = []; p.on('request', r => { const u = r.url(); if (/assets\//.test(u)) req.push(u.split('assets/')[1]); });
  const t0 = Date.now(); await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  const first = req.slice(), tTitle = Date.now() - t0;
  await p.keyboard.press('Enter'); await p.waitForTimeout(200); await p.evaluate(() => { G.sel = 14; }); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play', null, { timeout: 10000 });
  const after = req.slice(first.length);
  console.log('첫 화면까지', tTitle + 'ms · 요청', first.length + '개 · dir/weapon 포함:', first.filter(x => /^(dir|weapon)\//.test(x)).length);
  console.log('한국 고른 뒤 요청:', after.join(', '));
  await b.close(); })();
