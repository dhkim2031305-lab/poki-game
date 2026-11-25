const { chromium, devices } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=user-gesture-required'] });
  const dev = devices['iPhone 13'];
  const ctx = await b.newContext({ ...dev, viewport: { width: 390, height: 664 } });   // 세로로 시작
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8099/game.html'); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 20000 });
  await p.touchscreen.tap(195, 300); await p.waitForTimeout(300);
  const port = await p.evaluate(() => ({ scene: G.scene, touch: G.touchUI, portrait: innerHeight > innerWidth, audio: (() => { try { return 'unlock 함수 있음' } catch { return '' } })() }));
  await p.screenshot({ path: S + '/shots/ph-portrait.png' });
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(400);
  const hit = id => p.evaluate(id => { const h = UI.hits.find(h => h.id === id); if (!h) return null; const U = Math.min(innerWidth / 844, innerHeight / 390); return [(h.x + h.w / 2) * U, (h.y + h.h / 2) * U]; }, id);
  let xy = await hit('start'); if (xy) await p.touchscreen.tap(...xy); await p.waitForTimeout(400);
  const s1 = await p.evaluate(() => G.scene);
  await p.evaluate(() => { G.sel = 14; }); await p.waitForTimeout(100); xy = await hit('confirm'); if (xy) await p.touchscreen.tap(...xy);
  await p.waitForFunction(() => G.scene === 'play', null, { timeout: 15000 }); await p.waitForTimeout(500);
  await p.evaluate(() => { G.run.spawnT = 99; G.msgs = []; });
  const B = await p.evaluate(() => { const U = document.getElementById('game').getBoundingClientRect().width / UI.VW, P = G.btnPos(), o = { U }; for (const k of ['melee', 'skill', 'skill2', 'invuln']) o[k] = [P[k].x, P[k].y]; return o; });   // 폰 오른쪽 큰 원 + 화살표 4개 (GDD 0-18) 자리
  const tapB = k => p.touchscreen.tap(B[k][0] * B.U, B[k][1] * B.U);
  const before = await p.evaluate(() => ({ x: G.hero.x }));
  // 조이스틱: 왼쪽 아래 끌기 (CDP 터치 이벤트)
  const cdp = await ctx.newCDPSession(p);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await tp('touchStart', 120, 280); for (let i = 1; i <= 6; i++) { await tp('touchMove', 120 + i * 10, 280); await p.waitForTimeout(40); } await p.waitForTimeout(300); await tp('touchEnd');
  const after = await p.evaluate(() => ({ x: G.hero.x }));
  await p.evaluate(() => { window.__sw = 0; const o = G.hero; setInterval(() => { if (o.swing) window.__sw++; }, 10); }); await tapB('melee'); await p.waitForTimeout(400); const sw = await p.evaluate(() => window.__sw);
  await tapB('skill'); await p.waitForTimeout(100); await tapB('skill2'); await p.waitForTimeout(100); await tapB('invuln'); await p.waitForTimeout(80);
  const st = await p.evaluate(() => ({ left: G.run.skillsLeft.slice(1), inv: G.run.invuln, audio: !!window.AUDIO }));
  await p.screenshot({ path: S + '/shots/ph-play.png' });
  console.log('세로:', JSON.stringify(port), '| 가로 시작 →', s1, '| 조이스틱 x', before.x.toFixed(0), '→', after.x.toFixed(0), '| 치기', sw, '| 스킬1·2·무적 후', JSON.stringify(st), '| errors:', errs.join(' | ') || 'none');
  await b.close(); })();
