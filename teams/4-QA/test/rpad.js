// QA: GDD 0-18 폰 오른쪽 큰 원 + 화살표 4개 — 크기·화면 안·HUD 겹침, 손잡이 쏘기, 화살표 중 쏘기 멈춤, 스킬 꾹 조준·톡·취소, 치기 톡/누름/끌기, 무적, 예전 조작 없음
// node rpad.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  const R = (ok, name, d) => out.push(`${ok ? '✅' : '❌'} ${name}: ${d}`);
  for (const [W, H] of [[568, 320], [667, 375], [844, 390]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(1600);
    const cdp = await ctx.newCDPSession(p);
    const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y, id]) => ({ x, y, id })) });
    const U = await p.evaluate(() => innerHeight / 390 > innerWidth / 844 ? innerWidth / 844 : innerHeight / 390);
    const B = await p.evaluate(() => G.btnPos()); const S = k => [B[k].x * U, B[k].y * U];
    const reset = () => p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.shots = []; G.zones = []; G.msgs = []; G.hero.x = 200; G.hero.y = 220; G.hero.hp = 1e5; G.hero.maxHp = 1e5; });
    await reset();
    // 1. 크기·화면 안·HUD
    const px = k => (B[k].r * 2 * U).toFixed(0);
    const inside = ['melee', 'skill', 'skill2', 'invuln'].map(k => { const x0 = (B[k].x - B[k].r) * U, x1 = (B[k].x + B[k].r) * U, y0 = (B[k].y - B[k].r) * U, y1 = (B[k].y + B[k].r) * U; return `${k} ${x0.toFixed(0)}~${x1.toFixed(0)},${y0.toFixed(0)}~${y1.toFixed(0)}${x0 < 0 || y0 < 0 || x1 > W || y1 > H ? ' ✂잘림' : ''}${y1 > H - 4 || x1 > W - 4 ? ' (가장자리 ' + Math.min(W - x1, H - y1).toFixed(0) + 'px)' : ''}`; });
    const can2 = (B.skill2.x + B.skill2.r + 14) * U; const hudBottom = 78 * U, top1 = (B.skill.y - B.skill.r) * U;
    R(B.skill.r * 2 * U >= 44, `${W}×${H} 크기`, `화살표 한 변 ${px('skill')}px, 큰 원 지름 ${(B.stick.r * 2 * U).toFixed(0)}px`);
    R(!inside.some(s => s.includes('잘림')), `${W}×${H} 화면 안`, inside.join(' · '));
    R(top1 > hudBottom, `${W}×${H} HUD 겹침`, `↑ 스킬1 위 끝 ${top1.toFixed(0)}px > 위 HUD 아래 끝 ${hudBottom.toFixed(0)}px`);
    out.push(`   ℹ ${W}×${H} → 스킬2 취소 원 오른쪽 끝 ${can2.toFixed(0)}px / 화면 ${W}px (${can2 > W ? (can2 - W).toFixed(0) + 'px 잘림' : '안 잘림'}) · 오른쪽 아래 모서리에서 큰 원 중심까지 ${Math.hypot(W - B.stick.x * U, H - B.stick.y * U).toFixed(0)}px, ↑ 스킬1까지 ${Math.hypot(W - S('skill')[0], H - S('skill')[1]).toFixed(0)}px, ← 치기까지 ${Math.hypot(W - S('melee')[0], H - S('melee')[1]).toFixed(0)}px`);
    await p.screenshot({ path: `${OUT}/rpad-${W}x${H}.png` });
    if (W !== 667) { await ctx.close(); continue; }
    // 2. 손잡이 쏘기, 화살표 누르는 동안 멈춤
    const [sx, sy] = S('stick'), [mx, my] = S('melee');
    const shots = () => p.evaluate(() => (window.__sc = window.__sc || 0, G.shots.filter(s => !s.skill && !s.counted).map(s => { s.counted = 1; window.__sc++; }), window.__sc));
    await p.evaluate(() => { window.__sc = 0; setInterval(() => G.shots.filter(s => !s.skill && !s.counted).forEach(s => { s.counted = 1; window.__sc++; }), 30); });
    await T('touchStart', [[sx, sy, 1]]); await T('touchMove', [[sx - 45 * U, sy, 1]]); await p.waitForTimeout(1000); const n1 = await shots();
    const dir = await p.evaluate(() => G.hero.dir.x.toFixed(2));
    await T('touchStart', [[sx - 45 * U, sy, 1], [mx, my, 2]]); await p.waitForTimeout(150); const n2a = await shots(); await p.waitForTimeout(700); const n2 = await shots();
    await T('touchEnd', [[sx - 45 * U, sy, 1]]); await p.waitForTimeout(1000); const n3 = await shots();
    await T('touchEnd', []); await p.waitForTimeout(200);
    R(n1 >= 2 && n2 - n2a === 0 && n3 - n2 >= 2, '손잡이 쏘기 · 화살표 누르는 동안 멈춤 · 놓으면 다시', `1초 밀기 ${n1}발 (몸 방향 x ${dir}) → ← 누르는 0.7초 ${n2 - n2a}발 → 놓은 뒤 1초 ${n3 - n2}발`);
    // 3. 무적 톡
    await reset(); const [ix, iy] = S('invuln'); const inv0 = await p.evaluate(() => G.run.invuln); await T('touchStart', [[ix, iy, 3]]); await T('touchEnd', []);
    const invT = await p.evaluate(() => new Promise(r => { const t0 = performance.now(); const iv = setInterval(() => { if (!(G.hero.skillT > 0)) { clearInterval(iv); r((performance.now() - t0) / 1000); } }, 20); }));
    R(Math.abs(invT - 1.5) < .1, '↓ 무적 톡', `횟수 ${inv0}→${await p.evaluate(() => G.run.invuln)}, 지속 ${invT.toFixed(2)}초`);
    // 4. 스킬 톡 = 가까운 외계인
    const mk = (x, y) => p.evaluate(([x, y]) => G.aliens.push({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 9999, max: 9999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 }), [x, y]);
    await reset(); await mk(420, 150); await mk(600, 320); const [kx, ky] = S('skill'); let n0 = await p.evaluate(() => G.run.skillsLeft[1]);
    await T('touchStart', [[kx, ky, 4]]); await p.waitForTimeout(60); await T('touchEnd', []); await p.waitForTimeout(150);
    let z = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); R(z && Math.hypot(z[0] - 420, z[1] - 150) < 6, '↑ 스킬1 톡 = 가까운 외계인', `구역 ${z}, 횟수 ${n0}→${await p.evaluate(() => G.run.skillsLeft[1])}`);
    // 5. 꾹 누르고 안 움직이고 놓기 = 가까운 외계인
    await reset(); await mk(380, 300); n0 = await p.evaluate(() => G.run.skillsLeft[1]);
    await T('touchStart', [[kx, ky, 5]]); await p.waitForTimeout(350); const aimOn = await p.evaluate(() => { const a = G.dbgAim(); return a && a.drag; }); await T('touchEnd', []); await p.waitForTimeout(150);
    z = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); R(aimOn && z && Math.hypot(z[0] - 380, z[1] - 300) < 6, '꾹(0.35초) 눌렀다 그냥 놓기', `0.2초 뒤 조준 모드=${aimOn}, 구역 ${z} (가까운 외계인 380,300)`);
    // 6. 꾹 → 손가락 이동 ×3 → 놓은 자리
    await reset(); n0 = await p.evaluate(() => G.run.skillsLeft[1]); const hs = await p.evaluate(() => G.dbgField(G.hero.x, G.hero.y)); const fb = await p.evaluate(() => G.dbgField(0, 0));
    const ddx = 30, ddy = -20;   // 가상 좌표로 손가락 이동
    await T('touchStart', [[kx, ky, 6]]); await p.waitForTimeout(260); for (let i = 1; i <= 5; i++) { await T('touchMove', [[kx + ddx * U * i / 5, ky + ddy * U * i / 5, 6]]); await p.waitForTimeout(30); }
    await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/rpad-aim-hold.png` }); await T('touchEnd', []); await p.waitForTimeout(150);
    const exp = [(hs.x + ddx * 3 - fb.x) / (hs.x - fb.x) * 200, 0]; const sc = await p.evaluate(() => G.dbgField(1, 0).x - G.dbgField(0, 0).x);
    const ex = 200 + ddx * 3 / sc, ey = 220 + ddy * 3 / sc;
    z = await p.evaluate(() => G.zones.map(z => [Math.round(z.x), Math.round(z.y)])[0]); R(z && Math.hypot(z[0] - ex, z[1] - ey) < 8, '꾹 → 손가락 이동 ×3 → 놓은 자리', `손가락 (${ddx},${ddy}) → 기대 (${ex.toFixed(0)},${ey.toFixed(0)}) · 구역 ${z} · 횟수 ${n0}→${await p.evaluate(() => G.run.skillsLeft[1])}`);
    // 7. 나갔다 화살표로 돌아오면 취소 (스킬2, 오른쪽 끝)
    await reset(); const [k2x, k2y] = S('skill2'); n0 = await p.evaluate(() => G.run.skillsLeft[2]);
    await T('touchStart', [[k2x, k2y, 7]]); await p.waitForTimeout(260); for (let i = 1; i <= 5; i++) { await T('touchMove', [[k2x - 70 * U * i / 5, k2y - 40 * U * i / 5, 7]]); await p.waitForTimeout(30); }
    for (let i = 4; i >= 0; i--) { await T('touchMove', [[k2x - 70 * U * i / 5, k2y - 40 * U * i / 5, 7]]); await p.waitForTimeout(30); }
    await p.waitForTimeout(150); const cancel = await p.evaluate(() => { const a = G.dbgAim(); return a && a.cancel; }); await p.screenshot({ path: `${OUT}/rpad-cancel-skill2.png` }); await T('touchEnd', []); await p.waitForTimeout(200);
    R(cancel && (await p.evaluate(() => G.run.skillsLeft[2])) === n0 && (await p.evaluate(() => G.zones.length + G.ents.length)) === 0 && !(await p.evaluate(() => G.hero.dash || G.hero.barrage)), '→ 스킬2 나갔다 돌아오면 취소', `취소 상태=${cancel}, 횟수 ${n0}→${await p.evaluate(() => G.run.skillsLeft[2])}`);
    // 8. ← 치기 톡 / 누르고 있기 / 끌기
    await reset(); await p.evaluate(() => { window.__sw = 0; let was = null; setInterval(() => { if (G.hero.swing && G.hero.swing !== was) { window.__sw++; } was = G.hero.swing; }, 15); });
    await T('touchStart', [[mx, my, 8]]); await p.waitForTimeout(60); await T('touchEnd', []); await p.waitForTimeout(400); const sw1 = await p.evaluate(() => __sw);
    await T('touchStart', [[mx, my, 8]]); await p.waitForTimeout(1300); await T('touchEnd', []); await p.waitForTimeout(100); const sw2 = await p.evaluate(() => __sw) - sw1;
    await mk(120, 220); await p.evaluate(() => { G.hero.dir = { x: -1, y: 0 }; });
    await T('touchStart', [[mx, my, 8]]); for (let i = 1; i <= 4; i++) { await T('touchMove', [[mx, my - 10 * i * U, 8]]); await p.waitForTimeout(20); } await p.waitForTimeout(300); const d8 = await p.evaluate(() => [G.hero.dir.x.toFixed(2), G.hero.dir.y.toFixed(2)]); await T('touchEnd', []);
    R(sw1 === 1 && sw2 >= 3 && +d8[1] < -.9, '← 치기 톡·누르고 있기·끌기', `톡 ${sw1}번 · 1.3초 누름 ${sw2}번 · 위로 끌기 → 몸 방향 (${d8})`);
    // 9. 예전 조작 없음: 손잡이 두 번 톡·화살표 두 번·치기+손잡이 같이, 예전 스킬 버튼 자리
    await reset(); const L0 = await p.evaluate(() => [G.run.skillsLeft[1], G.run.skillsLeft[2], G.run.invuln].join(','));
    for (let i = 0; i < 2; i++) { await T('touchStart', [[sx, sy, 9]]); await T('touchEnd', []); await p.waitForTimeout(100); }
    for (let i = 0; i < 2; i++) { await T('touchStart', [[mx, my, 9]]); await T('touchEnd', []); await p.waitForTimeout(100); }
    await T('touchStart', [[mx, my, 9], [sx, sy, 10]]); await p.waitForTimeout(60); await T('touchEnd', []);
    await T('touchStart', [[667 * .75, 375 * .56, 11]]); await T('touchEnd', []); await T('touchStart', [[667 * .89, 375 * .43, 11]]); await T('touchEnd', []); await p.waitForTimeout(300);
    const L1 = await p.evaluate(() => [G.run.skillsLeft[1], G.run.skillsLeft[2], G.run.invuln].join(','));
    R(L0 === L1, '예전 두 번 누르기·같이 누르기·따로 버튼 없음', `스킬1,스킬2,무적 ${L0} → ${L1}`);
    out.push(`   에러: ${errs.join(' | ') || '없음'}`);
    await ctx.close();
  }
  console.log(out.join('\n')); await b.close();
})();
