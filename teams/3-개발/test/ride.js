// 천자총통 타고 움직이기: 한국 2 쓰고 0.3초 뒤부터 아래로 1.5초 이동 — 장수·화포 위치를 0.1초마다 기록 + 캡처
// 사용: node ride.js 출력폴더
const { chromium } = require('playwright');
(async () => { const OUT = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 20000 }); await p.waitForTimeout(500);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; const h = G.hero; h.x = 230; h.y = 150; h.inv = 99;
    const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
    G.aliens.push(mk(560, 215), mk(570, 250)); });
  await p.mouse.move(640, 230); await p.keyboard.press('Semicolon'); await p.waitForTimeout(1000);   // 컷인 0.7초
  const log = []; await p.keyboard.down('KeyS');
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(50); if (i === 8) await p.keyboard.up('KeyS'); if (i === 14) await p.keyboard.down('KeyD'); if (i === 20) await p.keyboard.up('KeyD');
    log.push(await p.evaluate(() => { const c = G.fx.find(e => e.mount); const m = c && c.mount && c.mount(); return [Math.round(G.hero.x), Math.round(G.hero.y), m ? 'ride' : (c ? 'cannon-only' : '-')]; }));
    await p.screenshot({ path: `${OUT}/ride-${String(i).padStart(2, '0')}.png` }); }
  await p.keyboard.up('KeyS'); console.log(log.map(l => l.join(',')).join(' | ')); await b.close(); })();
