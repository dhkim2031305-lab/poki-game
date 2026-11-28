// QA: 천자총통 탱크(239d7eb) — 컷인 중 이동(M21)·탄 채 이동·마우스 조준·6발 착탄 자리·기본 포탄(140px r28)·쏘는 중 2번 막힘·탄 동안 무적
// node tank.js OUT [port]   (3D, 프레임 손으로)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const res = {};
  for (const mode of (process.env.MODES || 'aim,move').split(',')) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ shake: false, sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(600);
    await p.evaluate(mode => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = 200; h.y = 215; h.dir = { x: 1, y: 0 }; h.inv = 0;
      const mk = (id, x, y) => ({ id, type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      if (mode === 'aim') for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) G.aliens.push(mk(`g${i}_${j}`, 260 + i * 45, 110 + j * 52));   // 격자 45마리: 어디에 맞는지 지도
      window.__rec = { f: 0, dmg: {}, fx: [], hp: [], left: [], mount: [], hx: [], cut: [] }; const seen = new Set(); G.aliens.forEach(a => a.__hp = a.hp);
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; __rec.f++; window.__cb(window.__t); G.msgs = G.msgs.filter(m => !m.shout);
        for (const a of G.aliens) { if (a.hp < a.__hp) (__rec.dmg[a.id] = __rec.dmg[a.id] || []).push([__rec.f, +(a.__hp - a.hp).toFixed(1)]); a.__hp = a.hp; a.x = a.x0 ?? (a.x0 = a.x); a.y = a.y0 ?? (a.y0 = a.y); a.kb = { x: 0, y: 0 }; }
        for (const e of G.fx) if (!seen.has(e)) { seen.add(e); if (/blast|koreaHit|koreaBlast|impact/i.test(e.type)) __rec.fx.push([__rec.f, e.type, Math.round(e.x), Math.round(e.y)]); }
        const hh = G.hero; __rec.hp.push(+hh.hp.toFixed(1)); __rec.left.push(G.run.skillsLeft.join('/')); __rec.mount.push(hh.koreaBattery && hh.koreaBattery.mount() ? 1 : 0); __rec.hx.push([Math.round(hh.x), Math.round(hh.y)]); __rec.cut.push(G.cutin ? 1 : 0);
        if (window.__shoot && __rec.f % 6 === 0) G.eshots.push({ x: hh.x + 25, y: hh.y, vx: -170, vy: 0, dmg: 6, life: 1, col: '#B8D727' }); } };
      window.__manual = true;
    }, mode);
    await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const aimAt = async (x, y) => { const s = await p.evaluate(([x, y]) => G.dbgField(x, y), [x, y]); await p.mouse.move(s.x - 10, s.y + 3); await p.mouse.move(s.x, s.y); };
    await aimAt(560, 215); await p.evaluate(() => __step(2));
    await p.evaluate(() => { __rec.f = 0; for (const k in __rec) if (Array.isArray(__rec[k])) __rec[k] = []; __rec.dmg = {}; });
    await p.keyboard.press('Semicolon');
    if (mode === 'aim') {
      await p.keyboard.down('KeyD'); await p.evaluate(() => __step(30)); await p.keyboard.up('KeyD');   // 컷인 중 이동 (M21)
      await p.evaluate(() => __step(30));
      await aimAt(330, 90); await p.evaluate(() => __step(40));            // 위쪽으로 조준 돌림
      await p.keyboard.down('KeyJ'); await p.evaluate(() => __step(60)); await p.keyboard.up('KeyJ');   // 기본 포탄
      await p.keyboard.press('Semicolon'); await p.evaluate(() => __step(90));   // 쏘는 중 2번 다시 누름
    } else if (mode === 'block') {
      await p.keyboard.down('KeyD'); await p.evaluate(() => __step(55)); await p.keyboard.up('KeyD');   // 컷인(0.68초)을 넘겨 누르고 있음 (M21)
      await p.evaluate(() => __step(25)); await p.keyboard.press('Semicolon'); await p.evaluate(() => __step(80));   // 1.33초: 쏘는 중 2번
    } else {
      await p.evaluate(() => __step(50)); await p.evaluate(() => { window.__shoot = true; });
      await p.keyboard.down('KeyS'); await p.evaluate(() => __step(40)); await p.keyboard.up('KeyS');
      await p.evaluate(() => __step(150)); await p.evaluate(() => { window.__shoot = false; });
    }
    const r = await p.evaluate(() => ({ rec: __rec, F: G.run.st.F, melee: G.run.st.melee, aliens: G.aliens.map(a => [a.id, Math.round(a.x0 ?? a.x), Math.round(a.y0 ?? a.y)]) }));
    await p.screenshot({ path: `${OUT}/tank-${mode}-end.png` });
    res[mode] = { ...r, errs }; await p.close();
  }
  fs.writeFileSync(`${OUT}/tank.json`, JSON.stringify(res)); await b.close(); console.log('ok');
})();
