// QA: 조작·횟수 검사 — PC 더블클릭/좌우 동시, 키 L·;·Space, 스킬 각 5번·무적 라운드 2번, 폰 버튼 크기·두 번 누르기
// node controls.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, mode = ""] = process.argv.slice(2); const Q = mode ? "?render=" + mode : "";
  const b = await chromium.launch(); const out = [];
  const start = async (p, ci) => { await p.goto(`http://localhost:${port}/web/${Q}`); await p.waitForFunction(() => window.G && G.scene === "title");
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(500);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 300; G.hero.y = 200; }); };
  const L = p => p.evaluate(() => `스킬1=${G.run.skillsLeft[1]} 스킬2=${G.run.skillsLeft[2]} 무적=${G.run.invuln} 라운드=${G.run.round}`);
  const idle = p => p.evaluate(() => new Promise(r => { const t = setInterval(() => { const h = G.hero; if (!h.dash && !h.barrage && !h.guard && !(h.skillT > 0)) { clearInterval(t); r(); } }, 50); }));
  const clearRound = p => p.evaluate(() => { const r = G.run; r.bossSpawned = true; r.spawned = r.wave.n; G.aliens = []; r.killsRound = r.wave.n + 1; });
  // ---- PC 마우스 ----
  { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await start(p, 1);   // 아일랜드: 1번 범위(바로 끝남)
    await p.mouse.move(800, 360);
    out.push('PC 처음: ' + await L(p));
    await p.mouse.click(800, 360, { button: 'right' }); await p.waitForTimeout(120); await p.mouse.click(800, 360, { button: 'right' }); await p.waitForTimeout(300); await idle(p);
    out.push('우클릭 두 번(0.12초) → ' + await L(p) + ' (기대: 스킬1 4)');
    await p.waitForTimeout(400);
    await p.mouse.click(800, 360, { button: 'left' }); await p.waitForTimeout(120); await p.mouse.click(800, 360, { button: 'left' }); await p.waitForTimeout(300); await idle(p);
    out.push('좌클릭 두 번(0.12초) → ' + await L(p) + ' (기대: 스킬2 4)');
    await p.waitForTimeout(400);
    await p.mouse.click(800, 360, { button: 'left' }); await p.waitForTimeout(400); await p.mouse.click(800, 360, { button: 'left' }); await p.waitForTimeout(300);
    out.push('좌클릭 0.4초 간격 두 번 → ' + await L(p) + ' (기대: 변화 없음)');
    await p.mouse.down({ button: 'left' }); await p.waitForTimeout(30); await p.mouse.down({ button: 'right' }); await p.waitForTimeout(80); await p.mouse.up({ button: 'left' }); await p.mouse.up({ button: 'right' });
    await p.waitForTimeout(700); out.push('좌·우 동시(0.03초) → ' + await L(p) + ' (기대: 무적 1)');
    // 키보드: 1번 스킬 L 7번 연타 (범위라 바로 끝남)
    for (let i = 0; i < 7; i++) { await p.keyboard.press('KeyL'); await p.waitForTimeout(120); }
    out.push('L 7번 → ' + await L(p) + ' (기대: 스킬1 0, 5번에서 멈춤)');
    for (let i = 0; i < 6; i++) { await p.keyboard.press('Semicolon'); await p.waitForTimeout(150); await idle(p); await p.waitForTimeout(100); }
    out.push('; 6번 → ' + await L(p) + ' (기대: 스킬2 0)');
    for (let i = 0; i < 3; i++) { await p.keyboard.press('Space'); await p.waitForTimeout(650); }
    out.push('Space 3번 → ' + await L(p) + ' (기대: 무적 0)');
    await clearRound(p); await p.waitForTimeout(4500);
    out.push('라운드 넘긴 뒤 → ' + await L(p) + ' (기대: 라운드 2, 스킬 0·0 그대로, 무적 2로 다시)');
    out.push('PC 에러: ' + (errs.join(' | ') || '없음'));
    await p.close(); }
  // ---- 폰 ----
  for (const [w, h] of [[667, 375], [568, 320], [844, 390]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await start(p, 1);
    const info = await p.evaluate(() => { const c = document.querySelector('canvas'), bb = c.getBoundingClientRect(); return { cw: bb.width, ch: bb.height, sx: scrollX, sy: scrollY, docW: document.documentElement.scrollWidth, docH: document.documentElement.scrollHeight,
      meta: (document.querySelector('meta[name=viewport]') || {}).content, ta: getComputedStyle(c).touchAction }; });
    // 버튼 위치: 화면 그림에서 읽을 수 없으니 game.js btnPos와 같은 비율로 계산 (VW = 390 × 가로/세로)
    const U = h / 390, VW = w / U, VH = 390;
    const B = { melee: { x: VW * .87, y: VH * .72, r: 48 }, ranged: { x: VW * .73, y: VH * .84, r: 34 }, skill: { x: VW * .75, y: VH * .56, r: 28 }, skill2: { x: VW * .89, y: VH * .43, r: 26 }, invuln: { x: VW * .61, y: VH * .7, r: 26 } };
    const px = k => [B[k].x * U, B[k].y * U];
    const sizes = Object.entries(B).map(([k, v]) => `${k} 지름 ${(v.r * 2 * U).toFixed(0)}px(누르는 곳 ${(v.r * 2.5 * U).toFixed(0)}px)`).join(', ');
    await p.screenshot({ path: `${OUT}/phone-${w}x${h}.png` });
    const s0 = await L(p);
    await p.touchscreen.tap(...px('melee')); await p.waitForTimeout(110); await p.touchscreen.tap(...px('melee')); await p.waitForTimeout(400); await idle(p);
    const s1 = await L(p);
    await p.touchscreen.tap(...px('ranged')); await p.waitForTimeout(110); await p.touchscreen.tap(...px('ranged')); await p.waitForTimeout(400); await idle(p);
    const s2 = await L(p);
    await p.touchscreen.tap(...px('skill')); await p.waitForTimeout(300); await idle(p); const s3 = await L(p);
    await p.touchscreen.tap(...px('skill2')); await p.waitForTimeout(300); await idle(p); const s4 = await L(p);
    await p.touchscreen.tap(...px('invuln')); await p.waitForTimeout(300); const s5 = await L(p);
    out.push(`폰 ${w}×${h}: 캔버스 ${info.cw}×${info.ch}, 문서 ${info.docW}×${info.docH}, 스크롤 ${info.sx},${info.sy}, viewport="${info.meta}", touch-action=${info.ta}\n  버튼: ${sizes}\n  처음 ${s0}\n  치기 두 번 → ${s1} (GDD: 스킬1 −1)\n  쏘기 두 번 → ${s2} (GDD: 스킬2 −1)\n  스킬 버튼 → ${s3}\n  스킬2 버튼 → ${s4}\n  무적 버튼 → ${s5}\n  에러: ${errs.join(' | ') || '없음'}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
