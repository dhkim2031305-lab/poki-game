// 방어 대체 9개 중 따로 보는 효과: 덴마크 표식(다음 한 번 2배) · 그리스 약화(+30%) · 스웨덴 테두리 넘기(최대 3번) · 룩셈부르크 공포(도망)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const out = [];
  const base = () => { G.run.spawnT = 99; G.items = []; G.msgs = []; G.hero.x = 260; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 }; G.aliens = [];
    window.mk = (x, y, ex) => Object.assign({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }, ex); };
  const go = async (ci, setup, act) => { const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate('(' + base.toString() + ')()'); await p.evaluate(setup); const r = await act(p); await p.close(); return r + (errs.length ? ' ERR ' + errs.join('|') : ''); };
  out.push(await go(5, () => { G.aliens.push(mk(330, 210)); }, async p => {
    await p.keyboard.press('KeyL'); await p.waitForTimeout(500); const a = await p.evaluate(() => ({ hp: 999 - G.aliens[0].hp, mark: +G.aliens[0].mark.toFixed(2), F: G.run.st.F }));
    await p.evaluate(() => { G.hero.x = G.aliens[0].x - 40; G.hero.y = G.aliens[0].y; G.hero.dir = { x: 1, y: 0 }; }); await p.keyboard.press('KeyJ'); await p.waitForTimeout(400);
    const b2 = await p.evaluate(() => ({ hp: 999 - G.aliens[0].hp, mark: G.aliens[0].mark }));
    return `덴마크1 돌진 ${a.hp.toFixed(1)}(=80F×0.6 ${(80 * a.F * .6).toFixed(1)}) 표식 ${a.mark}s → 치기 한 번 피해 ${(b2.hp - a.hp).toFixed(1)} (보통 치기 15F=${(15 * a.F).toFixed(1)}의 2배?) 표식 남음 ${b2.mark}`; }));
  out.push(await go(25, () => { G.aliens.push(mk(330, 210)); }, async p => {
    await p.keyboard.press('KeyL'); await p.waitForTimeout(400); const a = await p.evaluate(() => ({ hp: 999 - G.aliens[0].hp, weak: +G.aliens[0].weak.toFixed(2), F: G.run.st.F }));
    await p.evaluate(() => { G.hero.x = G.aliens[0].x - 40; G.hero.y = G.aliens[0].y; }); await p.keyboard.press('KeyJ'); await p.waitForTimeout(400);
    const b2 = await p.evaluate(() => 999 - G.aliens[0].hp);
    return `그리스1 창끝 ${a.hp.toFixed(1)}(=×0.7 ${(80 * a.F * .7).toFixed(1)}) 약화 ${a.weak}s → 치기 ${(b2 - a.hp).toFixed(1)} (보통 ${(15 * a.F).toFixed(1)} × 1.3 = ${(15 * a.F * 1.3).toFixed(1)})`; }));
  out.push(await go(9, () => { G.aliens.push(mk(560, 210)); }, async p => {
    await p.keyboard.press('Semicolon'); await p.waitForTimeout(200);
    const z = await p.evaluate(() => ({ x: G.zones[0].x, y: G.zones[0].y }));
    for (const x of [z.x + 140, z.x, z.x + 140, z.x, z.x + 140, z.x]) { await p.evaluate(x => { G.aliens[0].x = x; G.aliens[0].y = G.zones[0].y; }, x); await p.waitForTimeout(150); }
    const r = await p.evaluate(() => ({ hp: 999 - G.aliens[0].hp, F: G.run.st.F }));
    return `스웨덴2 테두리 6번 넘김 → 피해 ${r.hp.toFixed(1)} (×0.3 = ${(80 * r.F * .3).toFixed(1)} × 최대 3번 = ${(80 * r.F * .9).toFixed(1)})`; }));
  out.push(await go(0, () => { G.aliens.push(mk(330, 210, { speed: 60 }), mk(330, 210, { type: 'boss', r: 40, hp: 9999, max: 9999 })); }, async p => {
    const x0 = await p.evaluate(() => G.aliens[0].x); await p.keyboard.press('Semicolon'); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ x: G.aliens[0].x, fear: G.aliens[0].fear, bossFear: G.aliens[1].fear || 0, bossFreeze: G.aliens[1].freeze }));
    return `룩셈부르크2 공포: 졸개 x ${x0} → ${r.x.toFixed(0)} (멀어짐) 남은 공포 ${r.fear.toFixed(2)} · 보스 공포 ${r.bossFear} 멈춤 ${r.bossFreeze}`; }));
  console.log(out.join('\n')); await b.close(); })();
