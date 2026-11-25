// 미국·핀란드 총 모션 확인: 연사 중 각도 유지(까딱거림 없음) · 쉬기 10° · 전환 0.15초 · 치기 = 찌르기 (node gun.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const out = [];
  for (const ci of [3, 11]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.dir = { x: 1, y: 0 }; window.__k = []; const f = () => { if (G.hero) __k.push([+G.t.toFixed(2), G.hero.gunK == null ? '-' : +G.hero.gunK.toFixed(2)]); requestAnimationFrame(f); }; f(); });
    await p.waitForTimeout(300); await p.screenshot({ path: `${S}/shots/gun-${ci}-rest.png`, clip: { x: 250, y: 120, width: 340, height: 180 } });
    await p.keyboard.down('KeyK'); await p.waitForTimeout(1200); await p.screenshot({ path: `${S}/shots/gun-${ci}-fire.png`, clip: { x: 250, y: 120, width: 340, height: 180 } }); await p.keyboard.up('KeyK');
    await p.waitForTimeout(700);
    await p.keyboard.press('KeyJ'); await p.waitForTimeout(60); await p.screenshot({ path: `${S}/shots/gun-${ci}-thrust.png`, clip: { x: 250, y: 120, width: 340, height: 180 } });
    const r = await p.evaluate(() => { const k = __k, seg = []; for (const [t, v] of k) { const last = seg[seg.length - 1]; if (!last || last[1] !== v) seg.push([t, v]); } return { key: G.country.key, melee: G.country.melee, seg: seg.map(([t, v]) => t + ':' + v).join(' ') }; });
    out.push(`${r.key} 치기=${r.melee} | 시간:gunK(0=수평 조준, 1=쉬기 10°) ${r.seg}${errs.length ? ' ERR ' + errs.join('|') : ''}`); await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
