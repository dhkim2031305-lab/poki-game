// QA: 개발 작업8a(24841e1) 재확인 — 60개 스킬 쓰는 순간 번쩍(G.skillFlash) + 장판 둘레 밝기(빛번짐) 예전/지금 비교
// node job8a.js OUT [port] [old]   old=1 이면 game.js를 backup/game.orig.codex8a.js로 바꿔서 잼 (예전 코드)
// 화면 밝기: 외계인 없이 스킬을 쓰고 0.5·1.0·1.5초에 전장 캔버스의 목표 둘레(반지름 90px) 평균 밝기 − 쓰기 전 밝기
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const [OUT, port = 8080, old = '0'] = process.argv.slice(2);
  const b = await chromium.launch(); const res = [];
  const OLD = fs.readFileSync(path.join(__dirname, '../../../backup/game.orig.codex8a.js'), 'utf8');
  for (let ci = 0; ci < 30; ci++) for (const n of [1, 2]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    if (old === '1') await p.route('**/game.js', r => r.fulfill({ body: OLD, contentType: 'application/javascript' }));
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = 260; h.y = 210; h.dir = { x: 1, y: 0 }; h.inv = 0;
      let sf = 0; window.__sfMax = 0; window.__sfFrames = 0;
      Object.defineProperty(G, 'skillFlash', { configurable: true, get: () => sf, set: v => { sf = v; if (v > window.__sfMax) window.__sfMax = v; } });
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t); if (sf > 0) window.__sfFrames++; } };
      window.__lum = (cx, cy, R) => { const c = document.querySelector('canvas'), x = c.getContext('2d'), s = c.width / 844; // 화면 px → 캔버스 px
        const d = x.getImageData(Math.round((cx - R) * s), Math.round((cy - R) * s), Math.round(2 * R * s), Math.round(2 * R * s)).data; let t = 0, m = 0;
        for (let i = 0; i < d.length; i += 4) { const L = .2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]; t += L; if (L > 200) m++; } return [t / (d.length / 4), m / (d.length / 4)]; };
      window.__manual = true;
    });
    await p.waitForTimeout(100);
    await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const fx = (844 - 1280 * 390 / 720) / 2;
    const aim = await p.evaluate(n => { const sk = n === 2 ? G.country.skill2 : G.country.skill, k = (sk.mod || {}).k, h = G.hero;
      const by = { crack: 240, spinMove: 150, lob: 150, javelin3: 270 }; if (by[k]) return [h.x + by[k], h.y, sk.type, k];
      if (sk.type === 'area') return [h.x, h.y, sk.type, k]; if (sk.type === 'zone') return [h.x + 120, h.y, sk.type, k]; if (sk.type === 'dash') return [h.x + 260, h.y, sk.type, k]; return [h.x + 340, h.y, sk.type, k]; }, n);
    await p.mouse.move(aim[0] + fx - 30, aim[1] + 5); await p.mouse.move(aim[0] + fx, aim[1]);
    await p.evaluate(() => __step(2)); const cx = aim[0] + fx, cy = aim[1];
    const base = await p.evaluate(([x, y]) => __lum(x, y, 90), [cx, cy]);
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    const lum = []; for (const f of [30, 30, 30]) { await p.evaluate(f => __step(f), f); lum.push(await p.evaluate(([x, y]) => __lum(x, y, 90), [cx, cy])); }
    if (aim[2] === 'zone' || aim[2] === 'area') { await p.evaluate(() => { window.__step(0); }); }
    const r = await p.evaluate(() => ({ ko: G.country.ko, sfMax: window.__sfMax, sfFrames: window.__sfFrames }));
    Object.assign(r, { ci: ci + 1, n, type: aim[2], k: aim[3], base: +base[0].toFixed(1), d: lum.map(l => +(l[0] - base[0]).toFixed(1)), hot: lum.map(l => +(l[1] * 100).toFixed(2)), errs });
    if (ci % 5 === 0 || aim[2] === 'zone') { await p.evaluate(() => {}); }
    res.push(r); console.log(`${r.ci} ${r.ko} ${n} ${r.type}/${r.k || ''} 번쩍=${r.sfMax}(${r.sfFrames}f) 밝기차=${r.d.join('/')} 흰점%=${r.hot.join('/')}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  fs.writeFileSync(`${OUT}/job8a-${old === '1' ? 'old' : 'new'}.json`, JSON.stringify(res, null, 1)); await b.close();
})();
