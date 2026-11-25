// 마우스 조작 점검: 커서 쪽 조준 · 좌클릭 치기 · 우클릭 쏘기/던지기 + 던지는 무기 모양
const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2]; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title'); await p.waitForTimeout(300);
  await p.screenshot({ path: `${S}/shots/m-title.png` });
  const out = [];
  const toScreen = (fx, fy) => p.evaluate(([fx, fy]) => { const u = Math.min(innerWidth / 844, innerHeight / 390); const VW = innerWidth / u, VH = innerHeight / u, s = Math.min(VW / DATA.FIELD.W, VH / DATA.FIELD.H); return [((VW - DATA.FIELD.W * s) / 2 + fx * s) * u, ((VH - DATA.FIELD.H * s) / 2 + fy * s) * u]; }, [fx, fy]);
  for (const [ci, tag] of [[14, 'kor'], [0, 'lux'], [1, 'irl'], [2, 'sui'], [16, 'cze'], [3, 'usa'], [11, 'fin']]) {
    await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 400; G.hero.y = 220; G.msgs = []; G.hero.inv = 99;
      G.aliens.push({ type: 'grunt', x: 170, y: 160, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: 1, recoil: 0 }); });
    const [mx, my] = await toScreen(170, 140); await p.mouse.move(mx, my); await p.waitForTimeout(80);
    await p.mouse.down({ button: 'right' }); await p.waitForTimeout(260); await p.mouse.up({ button: 'right' });
    await p.screenshot({ path: `${S}/shots/m-${tag}-throw.png`, clip: { x: 150, y: 60, width: 420, height: 230 } });
    const st = await p.evaluate(() => ({ dir: [G.hero.dir.x.toFixed(2), G.hero.dir.y.toFixed(2)], shots: G.shots.map(s => s.kind + ' vx=' + Math.round(s.vx)).join(',') }));
    await p.waitForTimeout(400);
    const [lx, ly] = await toScreen(480, 220); await p.mouse.move(lx, ly); await p.waitForTimeout(60);
    await p.mouse.down(); await p.waitForTimeout(90);
    const fx = await p.evaluate(() => G.fx.filter(e => e.kind === 'melee').map(e => e.a.toFixed(2)).join(','));
    await p.mouse.up();
    out.push(`${tag}: 왼쪽 위 커서 → dir=${st.dir} 우클릭=[${st.shots}] | 오른쪽 커서 좌클릭 치기 각도=${fx}`);
    await p.evaluate(() => { G.scene = 'title'; });
  }
  console.log(out.join('\n') + '\nerrors: ' + (errs.join('|') || 'none')); await b.close();
})();
