// QA: 30개국 × 스킬 1·2번 실제 실행 — 피해(80×F 배수)·제어 시간·보스 제어·장수 상태 기록
// node skills60.js OUT [port] [ci,ci,...]   (npm run dev 켜 둔 뒤)
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const list = only ? only.split(',').map(Number) : [...Array(30).keys()];
  const res = [];
  for (const ci of list) for (const n of [1, 2]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = 260; h.y = 210; h.dir = { x: 1, y: 0 }; h.inv = 0; h.skillT = 0;
      const mk = (id, type, x, y, ex) => Object.assign({ id, type, x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }, ex);
      G.aliens.push(mk('A', 'grunt', 330, 210), mk('B', 'grunt', 420, 214), mk('C', 'grunt', 520, 206), mk('D', 'grunt', 262, 150), mk('E', 'grunt', 190, 214), mk('Boss', 'boss', 360, 268));
      window.__trk = { dmg: {}, ctl: {}, heroSkillT: 0, heroMinX: h.x, heroMaxX: h.x, heroHp0: h.hp };
      G.aliens.forEach(a => { __trk.dmg[a.id] = 0; __trk.ctl[a.id] = { freeze: 0, seal: 0, root: 0, air: 0 }; a.__hp = a.hp; });
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t);
        for (const a of G.aliens) { if (a.hp < a.__hp) __trk.dmg[a.id] += a.__hp - a.hp; a.__hp = a.hp; for (const c of ['freeze', 'seal', 'root', 'air']) __trk.ctl[a.id][c] = Math.max(__trk.ctl[a.id][c], a[c] || 0); }
        __trk.heroSkillT = Math.max(__trk.heroSkillT, G.hero.skillT || 0); __trk.heroMinX = Math.min(__trk.heroMinX, G.hero.x); __trk.heroMaxX = Math.max(__trk.heroMaxX, G.hero.x); } };
      window.__manual = true;
    });
    await p.waitForTimeout(100);
    await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
    const left0 = await p.evaluate(() => G.run.skillsLeft.slice());
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    await p.evaluate(() => __step(14));
    await p.screenshot({ path: `${OUT}/sk-${String(ci + 1).padStart(2, '0')}-${n}.png`, clip: { x: 60, y: 40, width: 560, height: 320 } });
    await p.evaluate(() => __step(400));
    const r = await p.evaluate(() => ({ key: G.country.key, ko: G.country.ko, type: (n => n)(null), F: G.run.st.F, trk: __trk, left: G.run.skillsLeft.slice(), msgs: G.msgs.length }));
    r.n = n; r.left0 = left0; r.errs = errs;
    const u = 80 * r.F; r.mult = Object.fromEntries(Object.entries(r.trk.dmg).map(([k, v]) => [k, +(v / u).toFixed(3)]));
    res.push(r);
    console.log(`${ci + 1} ${r.ko} ${n}번 F=${r.F.toFixed(3)} 배수=${JSON.stringify(r.mult)} 제어=${JSON.stringify(Object.fromEntries(Object.entries(r.trk.ctl).map(([k, v]) => [k, Object.entries(v).filter(([, x]) => x > 0).map(([c, x]) => c + ':' + x.toFixed(2)).join(' ')]).filter(([, s]) => s)))} 무적최대=${r.trk.heroSkillT.toFixed(2)} 남은=${r.left0}→${r.left}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  require('fs').writeFileSync(`${OUT}/skills60.json`, JSON.stringify(res, null, 1));
  await b.close();
})();
