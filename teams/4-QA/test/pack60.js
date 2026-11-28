// QA: 고정 무리 처치 측정 — 30개국 × 스킬 1·2를 같은 외계인 무리(졸개 12 + 보스 1, 목표 둘레 반지름 0~200px)에 한 번 쓰고 5초 동안 처치 수
// 체력 30·50 두 번. 소환·난수 없음 → 전후 비교가 흔들리지 않아요. node pack60.js OUT [port] [ci,...]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const res = [];
  const list = only ? only.split(',').map(Number) : [...Array(30).keys()];
  const TX = 420, TY = 215, HX = 200;
  const PACK = [[0, 0], [45, 0], [-45, 0], [0, 45], [0, -45], [90, 30], [90, -30], [-80, 50], [130, 0], [-120, -40], [160, 60], [200, -50]];
  for (const ci of list) { const row = { ci: ci + 1, r: {} }, errs = [];
    for (const n of [1, 2]) for (const HP of [30, 50]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 100)); });
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(600);
    row.ko = await p.evaluate(() => G.country.ko); let first = true;
      await p.evaluate(([PACK, TX, TY, HX, HP]) => {
        G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = []; G.cutin = null;
        const h = G.hero; h.x = HX; h.y = TY; h.dir = { x: 1, y: 0 }; h.cast = null; h.dash = null; h.barrage = null; h.hp = h.maxHp; if (h.koreaBattery) { h.koreaBattery.mounted = false; h.koreaBattery = null; }
        G.run.skillsLeft = G.run.skillsLeft.map(() => 9); G.run.spawned = 0; G.run.killsRound = 0;
        const mk = (id, x, y, type, hp) => ({ id, type, x, y, dx: 0, dy: 0, entering: false, hp, max: hp, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
        PACK.forEach(([dx, dy], i) => G.aliens.push(mk('g' + i, TX + dx, TY + dy * .9, 'grunt', HP)));
        G.aliens.push(mk('Boss', TX + 60, TY + 70, 'boss', 99999));
        G.aliens.forEach(a => { a.x0 = a.x; a.y0 = a.y; a.__hp = a.hp; }); window.__boss = 0;
        window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t); G.aliens = G.aliens.filter(a => a.x0 != null); for (const a of G.aliens) { if (a.type === "boss") { __boss += a.__hp - a.hp; a.__hp = a.hp; } a.x = a.x0; a.y = a.y0; } G.run.spawnT = 99; G.run.bossSpawned = true; } };
        window.__manual = true; }, [PACK, TX, TY, HX, HP]);
      if (first) { await p.waitForTimeout(120); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); }); first = false; }
      await p.evaluate(() => __step(2));
      const s = await p.evaluate(([x, y]) => G.dbgField(x, y), [TX, TY]); await p.mouse.move(s.x - 6, s.y + 2); await p.mouse.move(s.x, s.y); await p.evaluate(() => __step(2));
      await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.evaluate(() => __step(300));
      const r = await p.evaluate(() => ({ alive: G.aliens.filter(a => a.type !== 'boss' && !a.dead && a.hp > 0).length, F: G.run.st.F, boss: __boss }));
      row.r[`${n}-${HP}`] = { kill: 12 - r.alive, boss: +(r.boss / (80 * r.F)).toFixed(2) };
      await p.close();
    }
    row.errs = errs; res.push(row);
    console.log(`${row.ci} ${row.ko}: ` + Object.entries(row.r).map(([k, v]) => `${k} 처치${v.kill} 보스×${v.boss}`).join(' · ') + (errs.length ? ' 에러 ' + errs[0] : ''));
  }
  fs.writeFileSync(`${OUT}/pack60-${port}.json`, JSON.stringify(res, null, 1)); await b.close();
})();
