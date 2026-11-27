// 스킬 60개: 첫 피해 시각과 3초 동안 총 피해(× 기본 스킬 피해) — 연출만 바꾼 작업이 판정·시간표를 안 바꿨는지 전/후 비교
// 사용: BASE=http://localhost:8080 node dmgtime.js [나라:스킬,...]  (프레임을 16ms씩 직접 돌려서 결정적)
const { chromium } = require('playwright');
const LIST = (process.argv[2] || Array.from({ length: 30 }, (_, i) => [i + ':1', i + ':2']).flat().join(',')).split(',').map(s => s.split(':').map(Number));
(async () => {
  const b = await chromium.launch();
  for (const [ci, n] of LIST) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.goto((process.env.BASE || 'http://localhost:8080') + '/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 260; G.hero.y = 230; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(470, 215), mk(480, 255), mk(450, 240)); });
    await p.evaluate(() => { window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
    await p.waitForTimeout(200); await p.evaluate(() => { for (let i = 0; i < 4; i++) __step(16); });
    await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon');
    const r = await p.evaluate(() => { const tot = () => G.aliens.reduce((s, a) => s + (99999 - a.hp), 0); let first = null;
      for (let i = 0; i < 190; i++) { __step(16); if (first == null && tot() > 0) first = (i + 1) * .016; }
      return { first, tot: tot(), key: G.country.key }; });
    console.log(`${ci}:${n} ${r.key.padEnd(12)} first ${r.first == null ? '-' : r.first.toFixed(2)} total ${r.tot.toFixed(0)}`);
    await p.close();
  }
  await b.close();
})();
