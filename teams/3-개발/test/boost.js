// 무적 3초 + 무적 중 공격 속도 2.5배: 무적 시간 · 초당 쏘기/치기 수 (보통 vs 무적) (node boost.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.items = []; G.msgs = []; window.__n = { shot: 0, sw: 0 }; let ls = G.hero.shotT, lc = G.hero.meleeCd;
    const f = () => { const h = G.hero; if (h) { if (h.shotT !== ls) { __n.shot++; ls = h.shotT; } if (h.meleeCd > lc + .05) __n.sw++; lc = h.meleeCd; } requestAnimationFrame(f); }; f(); });
  const rate = async (key, ms) => { await p.evaluate(() => { __n = { shot: 0, sw: 0 }; window.__t0 = G.t; }); await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); return p.evaluate(() => ({ shot: __n.shot, sw: __n.sw, dt: G.t - __t0 })); };
  let r = await rate('KeyK', 2000); out.push(`보통 쏘기: ${r.shot}발 / ${r.dt.toFixed(2)}초 = 초당 ${(r.shot / r.dt).toFixed(2)}`);
  r = await rate('KeyJ', 2000); out.push(`보통 치기: ${r.sw}번 / ${r.dt.toFixed(2)}초 = 초당 ${(r.sw / r.dt).toFixed(2)}`);
  await p.keyboard.press('Space'); const t0 = await p.evaluate(() => [G.t, G.hero.skillT, G.hero.boostT]);
  r = await rate('KeyK', 1200); out.push(`무적 중 쏘기: ${r.shot}발 / ${r.dt.toFixed(2)}초 = 초당 ${(r.shot / r.dt).toFixed(2)}`);
  await p.screenshot({ path: `${S}/shots/boost.png`, clip: { x: 250, y: 120, width: 360, height: 200 } });
  r = await rate('KeyJ', 1200); out.push(`무적 중 치기: ${r.sw}번 / ${r.dt.toFixed(2)}초 = 초당 ${(r.sw / r.dt).toFixed(2)}`);
  await p.waitForFunction(() => !(G.hero.boostT > 0), null, { timeout: 8000 }); const t1 = await p.evaluate(() => G.t);
  out.push(`무적 시작 skillT ${t0[1].toFixed(2)} · boostT ${t0[2].toFixed(2)} → 끝까지 게임 시간 ${(t1 - t0[0]).toFixed(2)}초`);
  r = await rate('KeyK', 1500); out.push(`무적 끝난 뒤 쏘기: 초당 ${(r.shot / r.dt).toFixed(2)} (원래대로)`);
  console.log(out.join('\n') + '\nerrors: ' + (errs.join('|') || 'none')); await b.close(); })();
