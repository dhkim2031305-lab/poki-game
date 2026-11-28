// 천자총통 탱크: 쏘는 중 상하좌우 이동 + 기본 공격(J) — 프레임을 16ms씩 직접 돌려 결정적으로 기록 + 캡처
// 사용: node ride2.js 출력폴더
const { chromium } = require('playwright');
(async () => { const OUT = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(500);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 300; h.y = 220; h.inv = 99;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens.push(mk(600, 215), mk(610, 250), mk(340, 260));
    window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
  await p.waitForTimeout(150); await p.evaluate(() => { for (let i = 0; i < 4; i++) __step(16); });
  await p.mouse.move(690, 230); await p.keyboard.press('Semicolon');
  await p.evaluate(() => { for (let i = 0; i < 50; i++) __step(16); });   // 컷인 0.7초 + 세우기
  const keys = ['KeyW', 'KeyD', 'KeyS', 'KeyA']; const log = []; let sw = 0, last = null;
  for (let i = 0; i < 24; i++) {
    if (i % 6 === 0) { if (i) await p.keyboard.up(keys[i / 6 - 1]); await p.keyboard.down(keys[i / 6]); }
    if (i % 3 === 0) { await p.keyboard.down('KeyJ'); await p.evaluate(() => __step(16)); await p.keyboard.up('KeyJ'); }
    const r = await p.evaluate(() => { for (let k = 0; k < 4; k++) __step(16); const h = G.hero, c = h.koreaBattery, m = c && c.mount(), q = c && c.pose();
      return { s: m ? [Math.round(h.x), Math.round(h.y), Math.round(q.x), Math.round(q.y), q.rot, q.side, Math.round(m.riderX - q.x), Math.round(m.riderY - q.y)].join(',') : 'off', sw: h.swing ? 1 : 0, shots: G.shots.length }; });
    log.push(r.s + (r.sw ? ' 치기' : '')); await p.screenshot({ path: `${OUT}/r-${String(i).padStart(2, '0')}.png` });
  }
  await p.keyboard.up('KeyA'); console.log(log.join(' | ')); await b.close(); })();
