// QA: 장수에게 걸리는 스킬 효과 — 이탈리아1 걷는 속도 절반, 캐나다2 제자리, 뉴질랜드1 속도 1.5배, 체코1 받는 피해 절반, 프랑스2 벽 충돌 추가 피해
// node hero-effects.js [port]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8080; const b = await chromium.launch(); const out = [];
  const open = async ci => { const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.items = []; G.msgs = []; window.__manual = true; }); await p.waitForTimeout(150);
    await p.evaluate(() => { let t = performance.now(); window.__step = k => { for (let i = 0; i < k; i++) { t += 1000 / 60; window.__cb(t); } }; window.__key = (c, d) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: c })); __step(1); });
    return p; };
  // 걷는 거리 (D 키 0.5초) — 스킬 전/중
  const walk = p => p.evaluate(() => { const h = G.hero; const x0 = h.x; __key('KeyD', true); __step(30); __key('KeyD', false); __step(2); return h.x - x0; });
  for (const [ci, n, name] of [[13, 1, '이탈리아 1 거북 대형'], [10, 2, '캐나다 2 단풍 방패'], [19, 1, '뉴질랜드 1 결계']]) {
    const p = await open(ci);
    const base = await p.evaluate(() => { G.hero.x = 150; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; }).then(() => walk(p));
    await p.evaluate(n => { G.hero.x = 150; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; __key(n === 2 ? 'Semicolon' : 'KeyL', true); __step(1); __key(n === 2 ? 'Semicolon' : 'KeyL', false); __step(n === 1 && G.country.key === 'newzealand' ? 2 : 2); if (G.country.key === 'newzealand') { G.hero.x = G.zones[0].x - 40; G.hero.y = G.zones[0].y; } }, n);
    const dur = await walk(p);
    out.push(`${name}: 평소 0.5초 ${base.toFixed(0)}px → 스킬 중 ${dur.toFixed(0)}px (배율 ${(dur / base).toFixed(2)})`); await p.close();
  }
  { const p = await open(16);   // 체코 1: 구역 안 받는 피해 절반
    const r = await p.evaluate(() => { const h = G.hero; h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; h.hp = 1000; h.maxHp = 1000;
      const hit = () => { const before = h.hp; G.eshots.push({ x: h.x + 30, y: h.y, vx: -170, vy: 0, dmg: 6, life: 2, age: 0 }); h.inv = 0; h.hurtT = 0; for (let i = 0; i < 30; i++) __step(1); return before - h.hp; };
      const out1 = hit(); __key('KeyL', true); __step(1); __key('KeyL', false); __step(2); const z = G.zones[0]; h.x = z.x; h.y = z.y; h.inv = 0; const in1 = hit(); return { out1, in1 }; });
    out.push(`체코 1 방패 진지: 구역 밖 탄 피해 ${r.out1} → 구역 안 ${r.in1} (기대 절반)`); await p.close(); }
  { const p = await open(12);   // 프랑스 2: 벽에 밀어붙이면 추가 피해
    const r = await p.evaluate(() => { const h = G.hero, f = DATA.FIELD.floor; h.x = f.x1 - 230; h.y = 210; h.dir = { x: 1, y: 0 };
      const a = { id: 'A', type: 'grunt', x: h.x + 40, y: 210, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 1, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 };
      G.aliens.push(a); __key('Semicolon', true); __step(1); __key('Semicolon', false); __step(60); return { dmg: (9999 - a.hp) / (80 * G.run.st.F), ax: Math.round(a.x), wall: Math.round(f.x1) }; });
    out.push(`프랑스 2 흉갑기병 돌격: 벽 가까이에서 피해 배수 ${r.dmg.toFixed(2)} (기대 0.6 + 벽 0.4 = 1.0), 외계인 x=${r.ax}, 벽 x=${r.wall}`); await p.close(); }
  console.log(out.join('\n')); await b.close();
})();
