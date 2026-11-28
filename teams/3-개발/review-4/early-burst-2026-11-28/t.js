const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const rows = [];
  for (let ci = 0; ci < 30; ci++) for (const n of [1, 2]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } });
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 200; G.hero.y = 230; G.hero.dir = { x: 1, y: 0 }; G.msgs = []; G.hero.inv = 99;
      const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(560, 230));
      window.__q = []; window.requestAnimationFrame = f => { __q.push(f); return 0; }; window.__t = performance.now() + 1000; window.__step = ms => { __t += ms; const fs = __q; __q = []; fs.forEach(f => f(__t)); }; });
    await p.waitForTimeout(150); await p.evaluate(() => { for (let i = 0; i < 4; i++) __step(16); });
    await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon');
    const r = await p.evaluate(() => {
      const out = { art: null, artXY: null, dmg: null, linkEnd: null, propT: null, key: G.country.key, type: null };
      let t = 0;
      for (let i = 0; i < 120; i++) { __step(16); t += .016;
        const a = G.aliens[0]; if (out.dmg == null && a && a.hp < 99999) out.dmg = +t.toFixed(2);
        for (const e of G.fx) {
          if (e.type === 'art' && out.art == null && (e.t - (e.delay || 0)) >= 0 && !(e.z && e.z.t < (e.z.artAt || 0))) { out.art = +t.toFixed(2); out.artXY = [Math.round(e.x), Math.round(e.y), e.mode]; }
          if (e.type === 'link') out.linkEnd = +(t + (e.life - e.t)).toFixed(2);
          if (e.type === 'prop' && out.propT == null) out.propT = +t.toFixed(2);
        }
      }
      return out; });
    rows.push([ci + 1, n, r.key, JSON.stringify(r)].join(' ')); await p.close();
  }
  console.log(rows.join('\n')); await b.close();
})();
