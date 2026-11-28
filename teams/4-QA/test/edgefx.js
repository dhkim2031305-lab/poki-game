// QA: 작업30(8b88aac) 효과가 경기장 밖으로 넘치는지 — 장수를 위쪽 벽 가까이 두고 위쪽으로 스킬, 0.25·0.5·0.9초 캡처
// node edgefx.js OUT [port] [ci:n,...]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, list = '1:1,6:2,15:2,21:1,29:2,14:1'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const log = [];
  for (const it of list.split(',')) { const [ci, n] = it.split(':').map(Number);
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || /WebGL|GL_|shader/i.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 120)); });
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ sound: false })); } catch {} const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(700);
    const boss = ci === 14;
    await p.evaluate(boss => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = [];
      const F = DATA.FIELD.floor, h = G.hero; h.x = boss ? 220 : 330; h.y = boss ? 215 : F.y0 + 30; h.dir = { x: 0, y: -1 };
      const mk = (x, y, type = 'grunt') => ({ type, x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      if (boss) G.aliens.push(mk(330, 215, 'boss'), mk(290, 200)); else G.aliens.push(mk(330, F.y0 + 12), mk(380, F.y0 + 20), mk(280, F.y0 + 20));
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__cb(window.__t); G.msgs = G.msgs.filter(m => !m.shout); } }; window.__manual = true; }, boss);
    await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const tgt = await p.evaluate(boss => boss ? G.dbgField(420, 215) : G.dbgField(330, DATA.FIELD.floor.y0 + 5), boss); await p.mouse.move(tgt.x - 5, tgt.y + 3); await p.mouse.move(tgt.x, tgt.y); await p.evaluate(() => __step(2));
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    const ko = await p.evaluate(() => G.country.ko); let done = 0;
    const times = n === 2 ? [[56, '0.93'], [72, '1.2'], [96, '1.6']] : [[15, '0.25'], [30, '0.5'], [54, '0.9']];
    for (const [f, t] of times) { await p.evaluate(k => __step(k), f - done); done = f; await p.screenshot({ path: `${OUT}/${String(ci + 1).padStart(2, '0')}-${n}-${t}-${port}.png`, clip: boss ? { x: 150, y: 80, width: 420, height: 230 } : { x: 120, y: 0, width: 520, height: 230 } }); }
    log.push(`${ci + 1} ${ko} ${n}번 @${port}: 에러 ${errs.length ? errs.join(' | ') : 0}`); await p.close(); }
  console.log(log.join('\n')); await b.close();
})();
