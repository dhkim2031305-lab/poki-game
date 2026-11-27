// QA: 프랑스1 기병검 휩쓸기 — 목표 둘레 격자(앞뒤·좌우 −60~+60px)에 외계인을 세우고 본타(×1.0)·연결체만(×0.3)·안 맞음 지도
// node conegrid.js [port] [speed]
const { chromium } = require('playwright');
(async () => {
  const port = process.argv[2] || 8080, speed = +(process.argv[3] || 0); const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
  await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 12; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
  await p.mouse.move(400, 200); await p.mouse.move(420, 205); await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(150);
  const r = await p.evaluate(({ speed }) => {
    const c = document.querySelector('canvas'), FX = (844 - 1280 * 390 / 720) / 2; let t = performance.now(); const step = n => { for (let i = 0; i < n; i++) { t += 1000 / 60; window.__cb(t); } };
    const h = G.hero; h.x = 150; h.y = 210; h.hp = h.maxHp = 1e5; G.run.spawnT = 99; G.aliens = [];
    const TX = 400, TY = 210, offs = [-60, -30, 0, 30, 60], grid = [];
    for (const along of offs) for (const side of offs) { const a = { type: 'grunt', x: TX + along, y: TY + side * .9, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed, r: 15, flash: 0, shootT: 99, seed: along * 7 + side, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }; G.aliens.push(a); grid.push({ a, along, side }); }
    step(1); c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: TX + FX - 10, clientY: TY, movementX: 5, movementY: 1, bubbles: true }));
    c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: TX + FX, clientY: TY, movementX: 5, movementY: 1, bubbles: true })); step(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyL' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyL' }));
    step(90);
    const U = 80 * G.run.st.F; const sym = d => d / U > .9 ? '●' : d / U > .2 ? '○' : '·';
    const rows = offs.map(side => offs.map(along => { const g = grid.find(g => g.along === along && g.side === side); return sym(9999 - g.a.hp); }).join(' '));
    const main = grid.filter(g => (9999 - g.a.hp) / U > .9).length, link = grid.filter(g => { const v = (9999 - g.a.hp) / U; return v > .2 && v <= .9; }).length;
    return { rows, main, link, none: grid.length - main - link };
  }, { speed });
  console.log(`외계인 속도 ${speed} · 장수(150,210) → 목표(400,210) · 가로=앞뒤(−60 장수 쪽 … +60 너머), 세로=좌우 −60…+60\n● 본타(×1.0 이상) ○ 연결체만(×0.3) · 안 맞음\n` + r.rows.join('\n') + `\n본타 ${r.main} · 연결체만 ${r.link} · 안 맞음 ${r.none} / 25`);
  await b.close();
})();
