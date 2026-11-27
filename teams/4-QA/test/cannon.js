// QA: 한국2 천자총통 — 움직이는 외계인에게 포탄 3발(옆 2 + 가운데 1)이 얼마나 맞는지 + 장수 주변 확대 캡처
// node cannon.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [mode, speed] of [['2d', 0], ['2d', 80], ['2d', 120], ['3d', 80]]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: mode === '3d' ? 2 : 1 });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/${mode === '2d' ? '?render=2d' : ''}`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 30000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(600);
    await p.mouse.move(400, 200); await p.mouse.move(420, 205);
    await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(200);
    const r = await p.evaluate(async ({ speed, mode }) => {
      const c = document.querySelector('canvas'), FX = (844 - 1280 * 390 / 720) / 2; let mx = 0;
      const cursorField = (x, y) => { const s = G.dbgField(x, y), U = Math.min(innerWidth / 844, innerHeight / 390); const sx = s.x * U, sy = s.y * U; c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: sx, clientY: sy, movementX: (sx - mx) || 1, movementY: 1, bubbles: true })); mx = sx; };
      let t = performance.now(); const step = n => { for (let i = 0; i < n; i++) { t += 1000 / 60; window.__cb(t); } };
      const res = []; const h = G.hero;
      for (let u = 0; u < (mode === '3d' ? 1 : 10); u++) {
        G.run.spawnT = 99; G.aliens = []; G.zones = []; G.ents = []; G.shots = []; G.run.skillsLeft[2] = 5; h.cast = null; h.hp = h.maxHp = 1e5; h.x = 180; h.y = 220;
        const mk = (x, y) => G.aliens.push({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed, r: 15, flash: 0, shootT: 99, seed: x + u, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
        const cx = 440 + (u % 3) * 20, cy = 200 + (u % 4) * 15; for (const [dx, dy] of [[0, 0], [30, 25], [-25, 30], [35, -25], [-30, -28]]) mk(cx + dx, cy + dy);
        step(1); cursorField(cx, cy); step(1);
        const hp0 = G.aliens.map(a => a.hp); const hits = []; let prev = hp0.slice();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Semicolon' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Semicolon' }));
        for (let f = 1; f <= 72; f++) { step(1); const now = G.aliens.map(a => a.hp); const d = now.map((v, i) => prev[i] - v).filter(x => x > .01); if (d.length) hits.push(`${(f / 60).toFixed(2)}s:${d.length}마리`); prev = now; }
        const tot = G.aliens.map((a, i) => hp0[i] - a.hp); res.push({ hits: hits.join(' '), hitAliens: tot.filter(x => x > .01).length, dmg: +(tot.reduce((s, x) => s + x, 0) / (80 * G.run.st.F)).toFixed(2), moved: Math.round(Math.hypot(G.aliens[0].x - cx, G.aliens[0].y - cy)) });
      }
      return res;
    }, { speed, mode });
    if (mode === '3d') {
      // 확대 캡처: 장수 둘레 0~0.25초
      await p.evaluate(() => { G.run.spawnT = 99; G.run.skillsLeft[2] = 5; G.hero.cast = null; G.ents = []; G.shots = []; });
      const hs = await p.evaluate(() => { const s = G.dbgField(G.hero.x, G.hero.y), U = Math.min(innerWidth / 844, innerHeight / 390); return { x: s.x * U, y: s.y * U }; });
      await p.keyboard.press('Semicolon');
      for (let i = 0; i <= 8; i++) { if (i) await p.evaluate(() => { let t = performance.now(); for (let k = 0; k < 2; k++) { t += 1000 / 60; window.__cb(t); } }); await p.screenshot({ path: `${OUT}/zoom-${(i * 2 / 60).toFixed(3)}.png`, clip: { x: Math.max(0, hs.x - 110), y: Math.max(0, hs.y - 110), width: 220, height: 160 } }); }
    }
    out.push(`[${mode} 외계인 속도 ${speed}] ` + r.map((x, i) => `#${i + 1} 맞은 외계인 ${x.hitAliens}/5 피해×${x.dmg} (${x.hits}) 이동${x.moved}px`).join(' | '));
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
