// QA: 3D에서 30개국 × 스킬 1·2 — 에러·콘솔·404 0인지, 피해가 들어가는지(80×F 배수), 2번 컷인 길이, 쓰는 동안 그림 파일 404
// node all60-3d.js OUT [port] [ci,ci,...]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const res = [];
  const list = only ? only.split(',').map(Number) : [...Array(30).keys()];
  for (const ci of list) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [], bad = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text().slice(0, 140)); });
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace(`http://localhost:${port}`, '')); });
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(800);
    const row = { ci: ci + 1, ko: await p.evaluate(() => G.country.ko), s: [] };
    for (const n of [1, 2]) {
      await p.evaluate(() => {
        G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
        const h = G.hero; h.x = 240; h.y = 215; h.dir = { x: 1, y: 0 }; h.cast = null; h.dash = null; h.barrage = null;
        const mk = (id, x, y, type = 'grunt') => ({ id, type, x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
        G.aliens.push(mk('A', 330, 215), mk('B', 400, 200), mk('C', 440, 235), mk('D', 480, 210), mk('E', 380, 255), mk('Boss', 520, 230, 'boss'));
        G.aliens.forEach(a => a.__hp = a.hp); window.__d = 0; window.__cut = 0; window.__f = 0;
        window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; __f++; window.__cb(window.__t); if (G.cutin) __cut++;
          for (const a of G.aliens) { if (a.hp < a.__hp) { __d += a.__hp - a.hp; if (!window.__first) window.__first = __f; } a.__hp = a.hp; a.x = a.x0 ?? (a.x0 = a.x); a.y = a.y0 ?? (a.y0 = a.y); a.kb = { x: 0, y: 0 }; } } };
        window.__first = 0; if (!window.__manual) { window.__manual = true; }
      });
      if (n === 1) { await p.waitForTimeout(120); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); }); }
      const s = await p.evaluate(() => G.dbgField(410, 220)); await p.mouse.move(s.x - 8, s.y + 3); await p.mouse.move(s.x, s.y); await p.evaluate(() => __step(2));
      const left0 = await p.evaluate(() => G.run.skillsLeft.join('/'));
      await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.evaluate(() => __step(300));   // 5초
      const r = await p.evaluate(() => ({ d: __d, first: __first, cut: __cut, F: G.run.st.F, left: G.run.skillsLeft.join('/') }));
      if (n === 2) await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}-2.png` });
      row.s.push({ n, mult: +(r.d / (80 * r.F)).toFixed(2), first: +(r.first / 60).toFixed(2), cut: +(r.cut / 60).toFixed(2), used: left0 !== r.left });
      await p.evaluate(() => { const h = G.hero; h.cast = null; h.dash = null; h.barrage = null; if (h.koreaBattery) h.koreaBattery.mounted = false; G.cutin = null; });
      await p.evaluate(() => __step(30));
    }
    row.errs = errs; row.bad = [...new Set(bad)];
    res.push(row);
    console.log(`${row.ci} ${row.ko}: ` + row.s.map(x => `${x.n}번 ${x.used ? '' : '안 써짐 '}피해 ×${x.mult} 첫 ${x.first}s 컷인 ${x.cut}s`).join(' · ') + ` · 에러 ${errs.length ? errs.join(' | ') : 0} · 404 ${row.bad.length ? row.bad.join(',') : 0}`);
    await p.close();
  }
  fs.writeFileSync(`${OUT}/all60-3d.json`, JSON.stringify(res, null, 1)); await b.close();
})();
