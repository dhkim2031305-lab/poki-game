// 시전 중 스킬 입력 기억 (QA ①): 한국 1 거북선 시전 중 ;(2번) → 끝나는 순간 천자총통이 시작되는지
// 사용: GAP=700 node queue.js (거북선 누르고 GAP ms 뒤 ;)  (npm run dev 켜 두고)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 260; h.y = 230; h.inv = 99;
    window.__ev = []; let k = null; const f = () => { const c = G.hero.cast; const kk = c ? c.k : null; if (kk !== k) { __ev.push([kk, +G.t.toFixed(2)]); k = kk; } requestAnimationFrame(f); }; f(); });
  await p.mouse.move(600, 230); await p.keyboard.press('KeyL'); await p.waitForTimeout(+(process.env.GAP || 700)); await p.keyboard.press('Semicolon'); await p.waitForTimeout(2500);
  const ev = await p.evaluate(() => __ev), left = await p.evaluate(() => JSON.stringify(G.run.skillsLeft));
  console.log('시전 순서:', ev.map(([k, t]) => `${k || '-'}@${t}`).join(' → '), '| 남은 횟수', left);
  await b.close(); })();
