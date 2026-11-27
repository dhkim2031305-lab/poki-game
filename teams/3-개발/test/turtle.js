// 한국 1 거북선 돌격: 돌진으로 부딪힌 외계인(470)과 앞쪽 외계인(530)의 피해 기록 — 끝 연기(×0.4)가 둘 다 맞아야 해요
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; const h = G.hero; h.x = 260; h.y = 230; h.inv = 99;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens.push(mk(470, 230), mk(530, 230)); window.__log = []; const f = () => { const a = G.aliens; __log.push([+G.t.toFixed(2), Math.round(G.hero.x), Math.round(a[0].x)+"/"+a[0].y.toFixed(1), Math.round(99999 - a[0].hp), Math.round(a[1].x), Math.round(99999 - a[1].hp), G.hero.dash ? "D" : "-", (G.fx.find(e => e.type === "turtleSmoke") || {}).x]); requestAnimationFrame(f); }; f(); });
  await p.mouse.move(545, 230); await p.keyboard.press('KeyL'); await p.waitForTimeout(1200);
  const l = await p.evaluate(() => __log); let prev = ''; for (const r of l) { const s = r.slice(1).join(','); if (s !== prev) console.log(r.join(' ')); prev = s; } await b.close(); })();
