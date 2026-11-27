// 스킬 시전 중 무적(GDD 0-20 9): 외계인이 장수에 붙어 있는 채로 스킬 → 시전 동작 동안 HP 그대로, 끝난 뒤엔 닳아요
// 사용: node castinv.js [나라:번호,...]  (기본 한국2 천자총통·룩셈부르크1·한국1)
const { chromium } = require('playwright');
const LIST = (process.argv[2] || '14:2,0:1,14:1').split(',').map(s => s.split(':').map(Number));
(async () => { const b = await chromium.launch();
  for (const [ci, n] of LIST) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; const h = G.hero; h.x = 260; h.y = 230; h.inv = 0; h.skillT = 0; h.hp = h.maxHp || h.hp;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 60, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens = [mk(262, 232), mk(258, 228)]; window.__l = []; window.__t0 = G.t; const f = () => { __l.push([+(G.t - __t0).toFixed(2), Math.round(G.hero.hp), G.hero.cast ? G.hero.cast.k : '-']); requestAnimationFrame(f); }; f(); });
    await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon'); await p.waitForTimeout(2000);
    const l = await p.evaluate(() => __l); if (process.env.DBG) console.log(JSON.stringify(l.slice(0, 25))); let inCast = 0, after = null, start = null, end = 0;
    for (let i = 1; i < l.length; i++) { const [t, hp, c] = l[i], [, hp0, c0] = l[i - 1]; if (c !== '-' && start == null) start = t; if (c !== '-') end = t; if (hp < hp0 && c0 !== '-' && c !== '-') inCast++; if (hp < hp0 && start != null && c0 === '-' && after == null && t > end) after = t; }
    console.log(`${String(ci + 1).padStart(2, '0')}-${n}: 시전 ${start}~${end}초 · 시전 중 피격 ${inCast ? inCast + '번 ✗' : '없음 ✓'} · 끝난 뒤 첫 피격 ${after}초 ${errs.length ? errs : ''}`);
    await p.close();
  }
  await b.close(); })();
