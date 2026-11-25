// GD SDK가 막혔을 때 첫 화면까지 걸리는 시간 (QA M7, 목표 3초 안)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.route(/gamedistribution\.com|gamemonetize|googlesyndication|doubleclick/, r => r.abort());
  const t0 = Date.now(); await p.goto('http://localhost:8080/gamedistribution/'); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 15000 });
  console.log('GD SDK 막힘 → 첫 화면 ' + ((Date.now() - t0) / 1000).toFixed(2) + '초'); await b.close(); })();
