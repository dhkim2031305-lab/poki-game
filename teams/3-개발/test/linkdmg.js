// 연결체 길 피해 + 스킬 뒤 공격 재개: 장수(260,230) → 목표(470,230) 사이 (365,232)에 외계인 1마리 (체력 큼)
// 길 피해 = 80×F×0.3 한 번 · 목표 외계인은 본 피해 그대로 · 스킬 1초 뒤 클릭 한 번 → 일반 공격 나감
// 사용: node linkdmg.js  [나라:번호,...]
const { chromium } = require('playwright');
const LIST = (process.argv[2] || '1:1,2:1,3:2,11:2,13:1,19:1,27:2,14:1,9:2,7:2,10:2,16:1,18:2,17:1').split(',').map(s => s.split(':').map(Number));
(async () => { const b = await chromium.launch(); const rows = [];
  for (const [ci, n] of LIST) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
    const r = await p.evaluate(async n => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 260; h.y = 230; h.dir = { x: 1, y: 0 }; h.inv = 99;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      const mid = mk(365, 232), tgt = mk(470, 230); G.aliens.push(mid, tgt);
      const one = 80 * G.run.st.F;
      return { one, key: G.country.key, n, ids: true };
    }, n);
    await p.mouse.move(75 + 470 * 844 / 844, 230); await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon');
    await p.waitForTimeout(1500);
    const d = await p.evaluate(() => ({ mid: 99999 - G.aliens[0].hp, tgt: 99999 - G.aliens[1].hp, lock: G.hero.attackLock }));
    const shots0 = await p.evaluate(() => G.shots.length);
    await p.evaluate(() => { window.__sw = 0; const f = () => { if (G.hero.swing) __sw = 1; requestAnimationFrame(f); }; f(); });
    await p.keyboard.down('KeyJ'); await p.waitForTimeout(150); await p.keyboard.up('KeyJ'); await p.waitForTimeout(150);
    const again = await p.evaluate(() => __sw);
    rows.push(`${String(ci + 1).padStart(2, '0')}-${n} ${r.key.padEnd(11)} 길 피해 ${(d.mid / r.one).toFixed(2)}×  목표 ${(d.tgt / r.one).toFixed(2)}×  뒤 치기 ${again ? 'O' : 'X'} ${errs.length ? errs : ''}`);
    await p.close();
  }
  console.log(rows.join('\n')); await b.close(); })();
