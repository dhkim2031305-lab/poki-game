// QA: 천자총통 탱크를 폰 터치로(239d7eb) — 2번 버튼 톡 → 컷인 → 왼쪽 엄지로 이동 + 오른쪽 큰 원으로 조준(두 손가락 동시) → 쏘는 중 2번 톡 막힘
// CDP Input.dispatchTouchEvent로 손가락 2개를 동시에 움직여요. 3D 844×390(아이폰 가로)·667×375. node touchtank.js OUT [port]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [W, H] of [[844, 390], [667, 375]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(p);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id, radiusX: 8, radiusY: 8, force: 1 })) });
    await touch('touchStart', [[W * .3, H * .5, 9]]); await touch('touchEnd', []); await p.waitForTimeout(100);   // 폰 UI 켜기
    await p.evaluate(() => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.eshots = [];
      const h = G.hero; h.x = 220; h.y = 230; h.dir = { x: 1, y: 0 };
      const mk = (id, x, y) => ({ id, type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk('R', 430, 230), mk('U', 330, 90));
      window.__rec = { f: 0, log: [], dmg: {} }; G.aliens.forEach(a => a.__hp = a.hp);
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; __rec.f++; window.__cb(window.__t);
        for (const a of G.aliens) { if (a.hp < a.__hp) (__rec.dmg[a.id] = __rec.dmg[a.id] || []).push(+(__rec.f / 60).toFixed(2)); a.__hp = a.hp; a.x = a.x0 ?? (a.x0 = a.x); a.y = a.y0 ?? (a.y0 = a.y); a.kb = { x: 0, y: 0 }; } } };
      window.__snap = tag => { const h = G.hero, c = h.koreaBattery; __rec.log.push({ tag, t: +(__rec.f / 60).toFixed(2), hero: [Math.round(h.x), Math.round(h.y)], aim: c ? [+c.aimDir.x.toFixed(2), +c.aimDir.y.toFixed(2)] : null, mount: !!(c && c.mount()), firing: !!(c && c.firing && c.firing()), left: G.run.skillsLeft.join('/'), cutin: !!G.cutin }); };
      window.__manual = true;
    });
    await p.waitForTimeout(120); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const B = await p.evaluate(() => G.btnPos());   // 가상 좌표 = CSS px (U=W/844 등) → 비율로 바꿈
    const U = await p.evaluate(() => innerWidth / UI.VW);
    const s2 = [B.skill2.x * U, B.skill2.y * U], st = [B.stick.x * U, B.stick.y * U];
    await p.evaluate(() => __snap('시작'));
    await touch('touchStart', [[s2[0], s2[1], 1]]); await p.evaluate(() => __step(3)); await touch('touchEnd', []);   // 2번 톡
    await p.evaluate(() => __step(3)); await p.evaluate(() => __snap('톡 직후'));
    await p.evaluate(() => __step(48)); await p.evaluate(() => __snap('컷인 뒤'));
    // 두 손가락: 왼쪽 엄지(아래로 끌기 = 이동) + 오른쪽 큰 원(왼쪽 위로 끌기 = 조준)
    const L0 = [W * .18, H * .55];
    await touch('touchStart', [[L0[0], L0[1], 2], [st[0], st[1], 3]]);
    for (let i = 1; i <= 6; i++) { await touch('touchMove', [[L0[0], L0[1] + i * 7, 2], [st[0] - i * 7, st[1] - i * 7, 3]]); await p.evaluate(() => __step(2)); }
    await p.evaluate(() => __step(30)); await p.evaluate(() => __snap('두 손가락 0.5초'));
    await p.screenshot({ path: `${OUT}/touch-${W}x${H}-조준중.png` });
    await touch('touchStart', [[L0[0], L0[1] + 42, 2], [st[0] - 42, st[1] - 42, 3], [s2[0], s2[1], 4]]); await p.evaluate(() => __step(3));   // 쏘는 중 2번 톡
    await touch('touchEnd', [[L0[0], L0[1] + 42, 2], [st[0] - 42, st[1] - 42, 3]]); await p.evaluate(() => __step(3)); await p.evaluate(() => __snap('쏘는 중 2번 톡'));
    await p.evaluate(() => __step(60)); await touch('touchEnd', []); await p.evaluate(() => __step(90)); await p.evaluate(() => __snap('끝'));
    const r = await p.evaluate(() => __rec);
    out.push(`${W}×${H}: ` + r.log.map(l => `[${l.tag} ${l.t}s 장수${JSON.stringify(l.hero)} 조준${JSON.stringify(l.aim)} 탐${l.mount ? 'O' : 'X'} 쏘는중${l.firing ? 'O' : 'X'} 남은${l.left}${l.cutin ? ' 컷인' : ''}]`).join(' ') + ` · 피해 ${JSON.stringify(r.dmg)} · 에러 ${errs.length ? errs.join(' | ') : 0}`);
    await ctx.close();
  }
  console.log(out.join('\n')); fs.writeFileSync(`${OUT}/touchtank.txt`, out.join('\n')); await b.close();
})();
