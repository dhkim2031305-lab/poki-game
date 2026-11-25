// GDD 0-13 능력치 숨기기 확인: 나라 고르기 · 라운드 사이 · 결과 화면 캡처 (node hide.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 4; }); await p.waitForTimeout(500); await p.screenshot({ path: `${S}/shots/hide-select.png` });
  await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
  await p.waitForFunction(() => G.scene === 'roundPanel', null, { timeout: 8000 }).catch(() => {}); await p.waitForTimeout(1600); await p.screenshot({ path: `${S}/shots/hide-round.png` });
  const sc = await p.evaluate(() => G.scene);
  await p.waitForFunction(() => G.scene === 'play'); await p.evaluate(() => { const h = G.hero; h.hp = 1; h.inv = 0; h.skillT = 0; G.eshots.push({ x: h.x, y: h.y, vx: 0, vy: 0, dmg: 99, life: 1 }); }); await p.waitForFunction(() => G.scene === 'result', null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(800); await p.screenshot({ path: `${S}/shots/hide-result.png` });
  console.log('round scene:', sc, '| end scene:', await p.evaluate(() => G.scene), '| errors:', errs.length ? errs.join('|') : 'none'); await b.close(); })();
