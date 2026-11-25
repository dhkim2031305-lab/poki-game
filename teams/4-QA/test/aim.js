// QA: GDD 0-17 스킬 자리 지정 — PC 커서 자리 · 폰 끌기/취소/톡 · 유형별 "자리에" · 특수 스킬 · 조준 표시 캡처
// node aim.js OUT [port]   (2D 844×390: 화면 x = 전장 x + 75.33)
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  const FX = (844 - 1280 * 390 / 720) / 2;
  const open = async (ci, touch) => { const p = await b.newPage(touch ? { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true } : { viewport: { width: 844, height: 390 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.errs = errs;
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.items = []; G.msgs = []; window.__mk = (x, y, type = 'grunt') => { const a = { type, x, y, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, ringT: 99, jumpT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }; G.aliens.push(a); return a; }; });
    return p; };
  const setup = (p, s) => p.evaluate(s);
  const cursor = async (p, x, y) => { await p.mouse.move(x + FX - 20, y + 7); await p.mouse.move(x + FX, y); };
  const u = p => p.evaluate(() => 80 * G.run.st.F);
  const dmg = p => p.evaluate(() => G.aliens.map(a => 9999 - a.hp));
  const R = (name, ok, detail) => out.push(`${ok ? '✅' : '❌'} ${name}: ${detail}`);
  // ---- PC ----
  { const p = await open(14); await setup(p, () => { G.hero.x = 200; G.hero.y = 300; }); await cursor(p, 560, 110); await p.keyboard.press('KeyL'); await p.waitForTimeout(100);
    const z = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); R('설치(한국1) 커서 자리', z && Math.abs(z[0] - 560) < 3 && Math.abs(z[1] - 110) < 3, `커서 (560,110) → 구역 ${z}`);
    await p.screenshot({ path: `${OUT}/aim-pc-flash-korea1.png` }); await p.close(); }
  { const p = await open(14); await setup(p, () => { G.hero.x = 200; G.hero.y = 300; }); await p.mouse.move(10, 5); await p.mouse.move(843, 389); await p.keyboard.press('KeyL'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => ({ z: G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0], f: DATA.FIELD.floor })); R('전장 밖 커서 → 가장자리', r.z && r.z[0] <= r.f.x1 && r.z[1] <= r.f.y1, `화면 오른쪽 아래 끝 → 구역 ${r.z} (바닥 x1=${Math.round(r.f.x1)}, y1=${Math.round(r.f.y1)})`); await p.close(); }
  { const p = await open(8); await setup(p, () => { G.hero.x = 200; G.hero.y = 300; __mk(560, 110); __mk(240, 300); }); await cursor(p, 560, 110); await p.keyboard.press('KeyL'); await p.waitForTimeout(600);
    const d = await dmg(p), U = await u(p), hx = await p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y)]); R('범위(독일1) 커서 중심·장수 제자리', Math.abs(d[0] / U - .9) < .01 && d[1] === 0 && hx[0] === 200, `목표 옆 외계인 ×${(d[0] / U).toFixed(2)}, 장수 옆 외계인 ×${(d[1] / U).toFixed(2)}, 장수 ${hx}`); await p.close(); }
  { const p = await open(0); await setup(p, () => { G.hero.x = 150; G.hero.y = 300; }); await cursor(p, 500, 120); await p.keyboard.press('KeyL'); await p.waitForTimeout(1200);
    const h = await p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y)]); R('돌진(룩셈부르크1) 커서까지', Math.hypot(h[0] - 500, h[1] - 120) < 6, `커서 (500,120) → 장수 끝 ${h}`); await p.close(); }
  { const p = await open(18); await setup(p, () => { G.hero.x = 150; G.hero.y = 210; __mk(300, 210); __mk(420, 210); }); await cursor(p, 300, 210); await p.keyboard.press('KeyL'); await p.waitForTimeout(1500);
    const h = await p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y)]), d = await dmg(p), U = await u(p); R('리투아니아1 목표 너머 2배', Math.abs(h[0] - 450) < 6, `시작 150 → 목표 300 → 끝 ${h[0]} (기대 450) · 목표 외계인 ×${(d[0] / U).toFixed(2)}, 너머 외계인 ×${(d[1] / U).toFixed(2)} (기대 ×0.7)`); await p.close(); }
  { const p = await open(18); await setup(p, () => { G.hero.x = 150; G.hero.y = 210; }); await cursor(p, 500, 210); await p.keyboard.press('KeyL'); await p.waitForTimeout(1500);
    const r = await p.evaluate(() => [Math.round(G.hero.x), Math.round(DATA.FIELD.floor.x1)]); R('리투아니아1 벽에서 멈춤', r[0] <= r[1], `시작 150 → 목표 500 → 끝 ${r[0]} (벽 ${r[1]})`); await p.close(); }
  { const p = await open(3); await setup(p, () => { G.hero.x = 300; G.hero.y = 320; }); await cursor(p, 300, 90); await p.keyboard.press('KeyL'); await p.waitForTimeout(250);
    const v = await p.evaluate(() => G.shots.filter(s => s.skill).map(s => +(Math.atan2(s.vy, s.vx) * 180 / Math.PI).toFixed(0))); R('연사(미국1) 커서 쪽으로', v.length && v.every(a => Math.abs(a + 90) < 8), `커서가 바로 위 → 탄 각도 ${v.join(',')}° (기대 −90°)`); await p.close(); }
  { const p = await open(26); await setup(p, () => { G.hero.x = 200; G.hero.y = 210; }); await cursor(p, 560, 110); await p.keyboard.press('KeyL'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const e = G.ents[G.ents.length - 1]; return e ? [Math.round(e.x), Math.round(e.y), Math.round(G.hero.x), Math.round(G.hero.y)] : null; }); R('튀르키예1 예외(장수 둘레)', r && r[0] === r[2] && r[1] === r[3], `칼날 고리 중심 ${r && r.slice(0, 2)} · 장수 ${r && r.slice(2)}`); await p.close(); }
  { const p = await open(1); await setup(p, () => { G.hero.x = 150; G.hero.y = 300; __mk(560, 110); __mk(560 + 100, 110 + 10); }); await cursor(p, 500, 110); await p.keyboard.press('KeyL'); await p.waitForTimeout(100);
    const r = await p.evaluate(() => G.aliens.map(a => [Math.round(a.kb.x), Math.round(a.kb.y)])); R('아일랜드1 목표 쪽으로 끌어당김', r[0][0] < 0, `목표 (500,110) 오른쪽 외계인의 밀림 ${JSON.stringify(r)} (x가 음수 = 목표 쪽)`); await p.close(); }
  { const p = await open(12); await setup(p, () => { G.hero.x = 120; G.hero.y = 210; __mk(400 + 150, 210); __mk(400 - 150, 210); }); await cursor(p, 400, 210); await p.keyboard.press('KeyL'); await p.waitForTimeout(300);
    const d = await dmg(p), U = await u(p); R('프랑스1 목표에서 장수→목표 방향 부채꼴', d[0] / U > .99 && d[1] === 0, `목표 너머 외계인 ×${(d[0] / U).toFixed(2)}, 목표와 장수 사이 외계인 ×${(d[1] / U).toFixed(2)} (기대 1.0 / 0)`); await p.close(); }
  { const p = await open(24); await setup(p, () => { G.hero.x = 150; G.hero.y = 210; __mk(370, 210); __mk(420, 210); }); await cursor(p, 190, 210); await p.keyboard.press('KeyL'); await p.waitForTimeout(600);
    const d = await dmg(p), U = await u(p); R('슬로바키아1 가까운 목표도 최소 240', d[0] / U > .89, `목표 40px 앞 → 220px 외계인 ×${(d[0] / U).toFixed(2)}, 270px 외계인 ×${(d[1] / U).toFixed(2)} (240까지만)`); await p.close(); }
  { const p = await open(24); await setup(p, () => { G.hero.x = 120; G.hero.y = 210; __mk(560, 210); }); await cursor(p, 600, 210); await p.keyboard.press('KeyL'); await p.waitForTimeout(800);
    const d = await dmg(p), U = await u(p); R('슬로바키아1 먼 목표까지 뻗음', d[0] / U > .89, `목표 480px → 440px 외계인 ×${(d[0] / U).toFixed(2)}`); await p.close(); }
  { const p = await open(28); await setup(p, () => { G.hero.x = 120; G.hero.y = 300; __mk(560, 100); }); await cursor(p, 560, 100); await p.keyboard.press('KeyL'); await p.waitForTimeout(1400);
    const d = await dmg(p), U = await u(p), h = await p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y)]); R('멕시코1 먼 자리로 내리꽂기', Math.hypot(h[0] - 560, h[1] - 100) < 8 && Math.abs(d[0] / U - 1) < .01, `거리 ${Math.round(Math.hypot(440, 200))}px → 장수 ${h}, 착지 외계인 ×${(d[0] / U).toFixed(2)}`); await p.close(); }
  { const p = await open(20); await setup(p, () => { G.hero.x = 120; G.hero.y = 210; __mk(150, 210); __mk(520, 120); __mk(560, 150); __mk(590, 110); __mk(600, 300); }); await cursor(p, 560, 120); await p.keyboard.press('Semicolon'); await p.waitForTimeout(900);
    const d = await dmg(p), U = await u(p); R('일본2 목표에서 가까운 3마리', d[0] === 0 && d[1] > 0 && d[2] > 0 && d[3] > 0 && d[4] === 0, `장수 옆 ×${(d[0] / U).toFixed(2)} · 목표 근처 3마리 ${d.slice(1, 4).map(x => (x / U).toFixed(2))} · 먼 것 ×${(d[4] / U).toFixed(2)}`); await p.close(); }
  { const p = await open(26); await setup(p, () => { G.hero.x = 120; G.hero.y = 300; }); await cursor(p, 500, 120); await p.keyboard.press('Semicolon'); await p.waitForTimeout(900);
    const h = await p.evaluate(() => [Math.round(G.hero.x), Math.round(G.hero.y)]); R('튀르키예2 곡선, 끝은 그 자리', Math.hypot(h[0] - 500, h[1] - 120) < 6, `장수 끝 ${h}`); await p.close(); }
  // ---- 폰 ----
  const SK = { x: 844 * .75, y: 390 * .56 };
  { const p = await open(14, true); await p.touchscreen.tap(100, 330); await p.waitForTimeout(200); await setup(p, () => { G.hero.x = 200; G.hero.y = 300; });
    const cdp = await p.context().newCDPSession(p); const t = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 5 }] });
    const left = () => p.evaluate(() => G.run.skillsLeft[1]);
    const n0 = await left(); await t('touchStart', SK.x, SK.y); for (let i = 1; i <= 8; i++) { await t('touchMove', SK.x + (480 + FX - SK.x) * i / 8, SK.y + (130 - SK.y) * i / 8); await p.waitForTimeout(30); }
    await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/aim-phone-drag-korea1.png` }); await t('touchEnd'); await p.waitForTimeout(150);
    const z = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); const n1 = await left();
    R('폰 끌어 놓기', z && Math.hypot(z[0] - 480, z[1] - 130) < 6 && n1 === n0 - 1, `끌어 놓은 자리 (480,130) → 구역 ${z}, 횟수 ${n0}→${n1}`);
    await p.evaluate(() => { G.zones = []; });
    await t('touchStart', SK.x, SK.y); for (let i = 1; i <= 6; i++) { await t('touchMove', SK.x - 30 * i, SK.y - 20 * i); await p.waitForTimeout(30); } for (let i = 5; i >= 0; i--) { await t('touchMove', SK.x - 30 * i * .1, SK.y - 20 * i * .1); await p.waitForTimeout(30); }
    await p.waitForTimeout(100); await p.screenshot({ path: `${OUT}/aim-phone-cancel.png` }); await t('touchEnd'); await p.waitForTimeout(150);
    const n2 = await left(), z2 = await p.evaluate(() => G.zones.length); R('폰 버튼 위로 되돌려 놓기 = 취소', n2 === n1 && z2 === 0, `횟수 ${n1}→${n2}, 구역 ${z2}개`);
    await setup(p, () => { __mk(420, 150); __mk(600, 300); }); await t('touchStart', SK.x, SK.y); await t('touchEnd'); await p.waitForTimeout(150);
    const z3 = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); R('폰 톡 = 가장 가까운 외계인', z3 && Math.hypot(z3[0] - 420, z3[1] - 150) < 6, `장수(200,300)에서 가까운 외계인 (420,150) → 구역 ${z3}`);
    await setup(p, () => { G.aliens = []; G.zones = []; G.hero.dir = { x: 1, y: 0 }; }); await p.waitForTimeout(100); await t('touchStart', SK.x, SK.y); await t('touchEnd'); await p.waitForTimeout(150);
    const z4 = await p.evaluate(() => [G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0], Math.round(G.hero.x), Math.round(G.hero.y)]); R('폰 톡 · 외계인 없음 = 앞 120', z4[0] && Math.abs(z4[0][0] - (z4[1] + 120)) < 6, `장수 x ${z4[1]} → 구역 ${z4[0]}`);
    out.push('폰 에러: ' + (p.errs.join(' | ') || '없음')); await p.close(); }
  // ---- 조준 표시 캡처 (폰 끌기, 유형별) ----
  for (const [ci, n, tag] of [[8, 1, '범위-독일1'], [0, 1, '돌진-룩셈부르크1'], [18, 1, '돌진너머-리투아니아1'], [3, 1, '연사-미국1'], [18, 2, '투창3연-리투아니아2'], [26, 1, '예외-튀르키예1'], [0, 2, '반원-룩셈부르크2'], [25, 1, '직사각형-그리스1'], [17, 1, '하늘-이스라엘1']]) {
    const p = await open(ci, true); await p.touchscreen.tap(100, 330); await p.waitForTimeout(200); await setup(p, () => { G.hero.x = 200; G.hero.y = 280; __mk(470, 140); });
    const cdp = await p.context().newCDPSession(p); const B = n === 2 ? { x: 844 * .89, y: 390 * .43 } : SK;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: B.x, y: B.y, id: 7 }] });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: B.x + (430 + FX - B.x) * i / 8, y: B.y + (150 - B.y) * i / 8, id: 7 }] }); await p.waitForTimeout(25); }
    await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/aim-${tag}.png` }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.close(); }
  console.log(out.join('\n')); await b.close();
})();
