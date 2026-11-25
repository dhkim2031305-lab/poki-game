// QA: 제어 스킬이 보스에게는 0.3초 멈춤만 거는지 (핀란드1·리투아니아2·칠레1·콜롬비아1) + 핀란드2 느리게(보스 80%) 
// node boss-control.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8080;
  const b = await chromium.launch(); const out = [];
  const cases = [[11, 1, '핀란드 1 봉인'], [18, 2, '리투아니아 2 묶기'], [27, 1, '칠레 1 띄우기'], [29, 1, '콜롬비아 1 멈춤'], [11, 2, '핀란드 2 느리게']];
  for (const [ci, n, name] of cases) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(150);
    const r = await p.evaluate(([n, slow]) => {
      G.run.spawnT = 99; G.aliens = []; G.items = []; G.eshots = []; const h = G.hero; h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; h.hp = 1e6; h.skillT = 0;
      const mk = (id, type, x, y, sp) => ({ id, type, x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: sp, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, ringT: 99, jumpT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      const boss = mk('Boss', 'boss', slow ? 330 : 262, 210, slow ? 60 : 0), g = mk('G', 'grunt', slow ? 330 : 262, slow ? 300 : 245, slow ? 60 : 0);
      G.aliens.push(boss, g); let t = performance.now(); const step = () => { t += 1000 / 60; window.__cb(t); };
      step(); const mx = { Boss: {}, G: {} }; const pos0 = { bx: boss.x, gx: g.x };
      window.dispatchEvent(new KeyboardEvent('keydown', { code: n === 2 ? 'Semicolon' : 'KeyL', key: n === 2 ? ';' : 'l' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: n === 2 ? 'Semicolon' : 'KeyL', key: n === 2 ? ';' : 'l' }));
      let moved = { Boss: 0, G: 0 }, inZone = { Boss: 0, G: 0 };
      for (let i = 0; i < 150; i++) { const bx = boss.x, by = boss.y, gx = g.x, gy = g.y; h.x = 200; h.y = 210; step();
        for (const a of [boss, g]) for (const k of ['freeze', 'seal', 'root', 'air']) mx[a.id][k] = Math.max(mx[a.id][k] || 0, a[k] || 0);
        if (slow && i > 20 && i < 140) { moved.Boss += Math.hypot(boss.x - bx, boss.y - by); moved.G += Math.hypot(g.x - gx, g.y - gy); } }
      return { mx, moved, zones: G.zones.length };
    }, [n, name.includes('느리게')]);
    out.push(`${name}: 보스 ${JSON.stringify(r.mx.Boss)} · 졸개 ${JSON.stringify(r.mx.G)}${name.includes('느리게') ? ` · 이동거리 보스 ${r.moved.Boss.toFixed(0)} 졸개 ${r.moved.G.toFixed(0)}` : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
