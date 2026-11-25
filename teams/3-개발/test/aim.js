// GDD 0-17 스킬 자리 지정: PC 커서 · 폰 끌기 · 취소 · 유형별 자리 (node aim.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const out = [];
  const start = async (p, ci) => { await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
    await p.evaluate(() => { G.run.spawnT = 99; G.items = []; G.msgs = []; G.hero.x = 200; G.hero.y = 200; G.hero.dir = { x: 1, y: 0 }; G.aliens = [];
      const mk = (x, y) => Object.assign({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(330, 300), mk(600, 160)); }); };
  // 전장 바닥 점 → 화면 좌표
  const scr = (p, x, y) => p.evaluate(([x, y]) => { const r = document.getElementById('game').getBoundingClientRect(), s = r.width / UI.VW, fb = window.__fb ? __fb() : null;
    const P = G.dbgField(x, y); return [r.left + P.x * s, r.top + P.y * s]; }, [x, y]);
  // PC
  const pc = await b.newPage({ viewport: { width: 844, height: 390 } }); const e1 = []; pc.on('pageerror', e => e1.push(e.message));
  for (const [ci, n, x, y, tag] of [[4, 1, 520, 250, 'PC 네덜란드1 연사'], [3, 2, 520, 250, '미국2 설치'], [18, 1, 520, 250, '리투아니아1 돌진(2배)'], [28, 1, 520, 250, '멕시코1 점프'], [5, 2, 520, 250, '덴마크2 범위'], [26, 1, 520, 250, '튀르키예1 예외'], [27, 1, 520, 250, '칠레1 범위']]) {
    await start(pc, ci); const [sx, sy] = await scr(pc, x, y); await pc.mouse.move(sx, sy); await pc.mouse.move(sx + 1, sy); await pc.waitForTimeout(100);
    const g = await pc.evaluate(() => [Math.round(G.dbgMouse().gx), Math.round(G.dbgMouse().gy)]);
    await pc.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await pc.waitForTimeout(80);
    if (tag.includes('덴마크') || tag.includes('예외')) await pc.screenshot({ path: `${S}/shots/aim-pc-${ci}.png` });
    await pc.waitForTimeout(900);
    const r = await pc.evaluate(() => ({ hx: Math.round(G.hero.x), hy: Math.round(G.hero.y), z: G.zones.map(z => Math.round(z.x) + ',' + Math.round(z.y)).join(' '), hp: G.aliens.map(a => Math.round(999 - a.hp)).join(',') }));
    out.push(`${tag}: 커서 바닥 ${g} → 장수 ${r.hx},${r.hy} 구역 [${r.z}] 피해 [${r.hp}]`);
  }
  // 폰 끌기 · 취소
  const ph = await (await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true })).newPage(); const e2 = []; ph.on('pageerror', e => e2.push(e.message));
  const drag = (pts, upAt) => ph.evaluate(([pts]) => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos().skill;
      const ev = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId: 31, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
      ev('pointerdown', r.left + B.x * s, r.top + B.y * s); for (const [x, y] of pts) ev('pointermove', x, y); }, [pts]);
  const up = (x, y) => ph.evaluate(([x, y]) => { const cv = document.getElementById('game'); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 31, pointerType: 'touch', clientX: x, clientY: y, bubbles: true })); }, [x, y]);
  for (const [ci, tag] of (process.env.ONLY ? [[18, '리투아니아1 돌진'], [25, '그리스1 범위(직사각형)']] : [[3, '미국1 연사'], [14, '한국1 설치'], [18, '리투아니아1 돌진'], [25, '그리스1 범위(직사각형)']])) {
    await start(ph, ci); const [tx, ty] = await scr(ph, 420, 130);
    await drag([[tx - 100, ty - 40], [tx, ty]]); await ph.waitForTimeout(150); const pre = await ph.evaluate(() => JSON.stringify({ hold: !!G.hold, aim: !!G.dbgAim() })); await ph.screenshot({ path: `${S}/shots/aim-ph-${ci}.png` }); out.push('  찍기 전 ' + pre + ' 찍은 뒤 ' + await ph.evaluate(() => JSON.stringify({ hold: !!G.hold, aim: !!G.dbgAim() })));
    await up(tx, ty); await ph.waitForTimeout(900);
    const r = await ph.evaluate(() => ({ left: G.run.skillsLeft.slice(1).join(','), hx: Math.round(G.hero.x), hy: Math.round(G.hero.y), z: G.zones.map(z => Math.round(z.x) + ',' + Math.round(z.y)).join(' ') }));
    out.push(`폰 ${tag}: 끌어 놓기(바닥 420,130) → 남은 ${r.left} 장수 ${r.hx},${r.hy} 구역 [${r.z}]`);
  }
  await start(ph, 14); const [tx, ty] = await scr(ph, 420, 130); const bp = await ph.evaluate(() => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos().skill; return [r.left + B.x * s, r.top + B.y * s]; });
  await drag([[tx, ty], [bp[0] + 6, bp[1] + 4]]); await ph.waitForTimeout(150); await ph.screenshot({ path: `${S}/shots/aim-ph-cancel.png` });
  await up(bp[0] + 6, bp[1] + 4); await ph.waitForTimeout(400); out.push('폰 취소(버튼 위로 돌아와 놓기) → 남은 ' + await ph.evaluate(() => G.run.skillsLeft.slice(1).join(',') + ' 구역 ' + G.zones.length));
  await drag([]); await up(bp[0], bp[1]); await ph.waitForTimeout(400); out.push('폰 톡(끌지 않음) → 남은 ' + await ph.evaluate(() => G.run.skillsLeft.slice(1).join(',') + ' 구역 ' + G.zones.map(z => Math.round(z.x) + ',' + Math.round(z.y)).join(' ') + ' (가까운 외계인 330,300)'));
  console.log(out.join('\n') + '\nerrors: ' + ([...e1, ...e2].join('|') || 'none')); await b.close(); })();
