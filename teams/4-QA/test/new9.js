// QA: 방어 대체 스킬 중 피해 측정만으로 안 보이는 것 — 덴마크1 표식(다음 한 번 2배), 그리스1 약화(+30%, 3초), 스웨덴2 테두리 넘을 때만(최대 3번)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const out = [];
  const open = async ci => { const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.items = []; G.msgs = []; window.__manual = true; }); await p.waitForTimeout(150);
    await p.evaluate(() => { let t = performance.now(); window.__step = k => { for (let i = 0; i < k; i++) { t += 1000 / 60; window.__cb(t); } }; window.__key = c => { window.dispatchEvent(new KeyboardEvent('keydown', { code: c })); __step(1); window.dispatchEvent(new KeyboardEvent('keyup', { code: c })); };
      window.__mk = (id, x, y) => ({ id, type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }); __step(1); });
    return p; };
  // 치기 한 번 피해 (J) — 표식/약화 있을 때와 없을 때
  const melee = `(() => { const a = G.aliens[0], h = G.hero; h.meleeCd = 0; a.x = h.x + 30; a.y = h.y; a.kb = { x: 0, y: 0 }; const hp = a.hp; __key('KeyJ'); __step(25); return hp - a.hp; })()`;
  { const p = await open(5);
    const r = await p.evaluate(m => { const h = G.hero; h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; G.aliens.push(__mk('A', 230, 210)); const base = eval(m);
      __step(40); h.x = 200; h.y = 210; G.aliens[0].x = 300; G.aliens[0].y = 210; G.aliens[0].kb = { x: 0, y: 0 }; __key('KeyL'); __step(30); const mark = G.aliens[0].mark;
      h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; const marked = eval(m); const after = eval(m); return { base, mark, marked, after }; }, melee);
    out.push(`덴마크1 표식: 치기 ${r.base.toFixed(1)} → 표식(${r.mark.toFixed(2)}초 남음) 뒤 치기 ${r.marked.toFixed(1)} (×${(r.marked / r.base).toFixed(2)}) → 그다음 ${r.after.toFixed(1)}`); await p.close(); }
  { const p = await open(25);
    const r = await p.evaluate(m => { const h = G.hero; h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; G.aliens.push(__mk('A', 230, 210)); const base = eval(m);
      __step(30); h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; G.aliens[0].x = 260; G.aliens[0].y = 210; __key('KeyL'); __step(10); const weak = G.aliens[0].weak;
      const w1 = eval(m); __step(200); const w2 = eval(m); return { base, weak, w1, w2 }; }, melee);
    out.push(`그리스1 약화: 치기 ${r.base.toFixed(2)} → 약화(${r.weak.toFixed(2)}초) 중 ${r.w1.toFixed(2)} (×${(r.w1 / r.base).toFixed(2)}) → 3초 뒤 ${r.w2.toFixed(2)} (×${(r.w2 / r.base).toFixed(2)})`); await p.close(); }
  { const p = await open(9);
    const r = await p.evaluate(() => { const h = G.hero; h.x = 200; h.y = 210; h.dir = { x: 1, y: 0 }; const a = __mk('A', 560, 210), c = __mk('C', 330, 210); G.aliens.push(a, c); __key('Semicolon'); __step(3);
      const z = G.zones[0] || G.ents[G.ents.length - 1] || {}; const zx = z.x, zy = z.y; const log = [];
      const u = 80 * G.run.st.F; let hp = a.hp; const path = [];   // 바깥 → 안 → 바깥 → 안 → 바깥 (4번 넘음)
      for (const tx of [zx - 20, zx + 140, zx - 20, zx + 140, zx - 20]) for (let i = 0; i < 12; i++) { a.x += (tx - a.x) / (12 - i); a.y = zy; a.kb = { x: 0, y: 0 }; __step(1); if (a.hp < hp) { log.push(`x${Math.round(a.x)}:${((hp - a.hp) / u).toFixed(2)}`); hp = a.hp; } }
      return { zx: Math.round(zx), zy: Math.round(zy), log: log.join(' '), total: ((9999 - a.hp) / u).toFixed(2), inside: ((9999 - c.hp) / u).toFixed(2) }; });
    out.push(`스웨덴2 장검 원진: 원 가운데 x${r.zx} · 넘나든 외계인 맞음 [${r.log}] 합계 ×${r.total} (최대 3번 ×0.3=0.9) · 안에 가만히 있는 외계인 ×${r.inside} (기대 0)`); await p.close(); }
  console.log(out.join('\n')); await b.close(); })();
