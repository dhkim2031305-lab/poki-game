// 라운드가 지날수록 메모리가 쌓이는지 (아이폰 흉내: ?nofilter&maxtex=4096) : node mem.js ci
const { chromium } = require('playwright');
(async () => { const [ci, q] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-precise-memory-info'] });
  const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/' + (q || '?nofilter&maxtex=4096')); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, +ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play');
  const snap = async tag => console.log(tag, JSON.stringify(await p.evaluate(() => { const i = R3D.info ? R3D.info() : {}; return { scene: G.scene, r: G.run.round, al: G.aliens.length, fx: G.fx.length, shots: G.shots.length, ents: (G.ents || []).length, marks: (G.marks || []).length, timers: (G.timers || []).length, zones: G.zones.length, tex: i.tex, calls: i.calls, heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : '-' }; })));
  for (let r = 1; r <= 5; r++) {
    await p.evaluate(() => { G.hero.hp = 1e6; G.hero.maxHp = 1e6; });   // 안 죽게
    await p.keyboard.down('KeyK'); await p.waitForTimeout(9000); await p.keyboard.up('KeyK');
    await p.keyboard.press('KeyL'); await p.waitForTimeout(800); await p.keyboard.press('Semicolon'); await p.waitForTimeout(2500);
    await snap('R' + r + ' 끝');
    await p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
    await p.waitForFunction(() => G.scene === 'play' && G.run.roundT < 1, null, { timeout: 15000 }).catch(() => {});
  }
  console.log('errors:', errs.join(' | ') || 'none'); await b.close(); })();
