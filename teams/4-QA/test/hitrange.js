// QA: 스킬 판정 범위 실제 측정 (작업29 ×1.5) — 목표에서 오른쪽(x)·아래(y)·위로 외계인을 20px 간격으로 줄 세우고, 4초 동안 맞은 가장 먼 거리
// node hitrange.js OUT [port] [ci:n,...]   기본: 독일1·미국2·호주2·칠레2·캐나다2·핀란드2·한국2·덴마크2
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, list = '8:1,3:2,7:2,27:2,10:2,11:2,14:2,5:2'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const res = [];
  const TX = 400, TY = 215, HX = 170;
  for (const it of list.split(',')) { const [ci, n] = it.split(':').map(Number);
    for (const axis of ['x', 'y']) {
      const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
      await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
      await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
      await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(600);
      await p.evaluate(([axis, TX, TY, HX]) => {
        G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
        const h = G.hero; h.x = HX; h.y = TY; h.dir = { x: 1, y: 0 };
        const F = DATA.FIELD.floor, mk = (id, x, y) => ({ id, type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
        for (let d = 0; d <= 320; d += 20) { const x = axis === 'x' ? TX + d : TX, y = axis === 'x' ? TY : TY + d; if (x < F.x1 - 10 && y < F.y1) G.aliens.push(mk('+' + d, x, y)); }
        if (axis === 'y') for (let d = 20; d <= 200; d += 20) { const y = TY - d; if (y > F.y0 + 10) G.aliens.push(mk('-' + d, TX, y)); }
        G.aliens.forEach(a => { a.__hp = a.hp; a.x0 = a.x; a.y0 = a.y; }); window.__hit = {};
        window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t); for (const a of G.aliens) { if (a.hp < a.__hp) __hit[a.id] = 1; a.__hp = a.hp; a.x = a.x0; a.y = a.y0; a.kb = { x: 0, y: 0 }; } } };
        window.__manual = true; }, [axis, TX, TY, HX]);
      await p.waitForTimeout(120); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
      const s = await p.evaluate(([x, y]) => G.dbgField(x, y), [TX, TY]); await p.mouse.move(s.x - 6, s.y + 2); await p.mouse.move(s.x, s.y); await p.evaluate(() => __step(2));
      await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
      let shot = false; for (let k = 0; k < 24; k++) { await p.evaluate(() => __step(10)); if (!shot && axis === 'x' && k === 6) { await p.screenshot({ path: `${OUT}/${ci + 1}-${n}-${port}.png` }); shot = true; } }
      const r = await p.evaluate(() => ({ hit: Object.keys(__hit), ko: G.country.ko, k: (G.country['skill' + (window.__n === 2 ? '2' : '')] || {}).type }));
      const pos = r.hit.filter(id => id[0] === '+').map(id => +id.slice(1)), neg = r.hit.filter(id => id[0] === '-').map(id => +id.slice(1));
      res.push({ ci: ci + 1, n, ko: r.ko, axis, maxPlus: pos.length ? Math.max(...pos) : null, minPlus: pos.length ? Math.min(...pos) : null, maxMinus: neg.length ? Math.max(...neg) : null, hits: r.hit.length, errs });
      console.log(`${ci + 1} ${r.ko} ${n}번 ${axis}축: 맞은 가장 먼 거리 +${pos.length ? Math.max(...pos) : '-'}${axis === 'y' ? ' / 위 -' + (neg.length ? Math.max(...neg) : '-') : ''} (맞은 ${r.hit.length}마리)${errs.length ? ' 에러 ' + errs[0] : ''}`);
      await p.close();
    }
  }
  fs.writeFileSync(`${OUT}/hitrange-${port}.json`, JSON.stringify(res, null, 1)); await b.close();
})();
