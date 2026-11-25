// GDD 0-18 폰 오른쪽 큰 원 + 화살표 4개 (← 치기 · ↑ 스킬1 · → 스킬2 · ↓ 무적): 손잡이 쏘기 · 치기(톡·누르기·끌기) · 스킬 꾹 누르기·끌기·취소 · 무적 1.5초 · 화살표 누르는 동안 쏘기 멈춤 · 3가지 화면 캡처 (node stick.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  const open = async (w, h) => { const p = await (await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.errs = errs;
    await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => { G.run.spawnT = 99; G.items = []; G.msgs = []; G.hero.x = 200; G.hero.y = 200; G.aliens = [Object.assign({ type: 'grunt', x: 420, y: 140, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 1, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 })]; });
    return p; };
  // 가상 좌표 → 화면 좌표로 터치 보내기
  const T = (p, type, id, k, dx = 0, dy = 0) => p.evaluate(([type, id, k, dx, dy]) => { const cv = document.getElementById('game'), r = cv.getBoundingClientRect(), s = r.width / UI.VW, B = G.btnPos()[k];
    cv.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: r.left + (B.x + dx) * s, clientY: r.top + (B.y + dy) * s, bubbles: true })); }, [type, id, k, dx, dy]);
  for (const [w, h] of [[568, 320], [667, 375], [844, 390]]) { const p = await open(w, h); await p.screenshot({ path: `${S}/shots/stick-${w}.png` }); out.push(`${w}×${h} 캡처 · 화살표 실제 ${await p.evaluate(() => { const s = document.getElementById('game').getBoundingClientRect().width / UI.VW; return (66 * s).toFixed(1); })}px`); await p.close(); }
  const p = await open(844, 390);
  const shots = () => p.evaluate(() => G.shots.length + '/' + G.shots.map(s => Math.round(Math.atan2(s.vy, s.vx) * 180 / Math.PI)).slice(0, 2).join(','));
  // 손잡이 위로 밀기
  await T(p, 'pointerdown', 1, 'stick'); await T(p, 'pointermove', 1, 'stick', 0, -40); await p.waitForTimeout(700); out.push('손잡이 위로 밀기 0.7초 → 탄 개수/각도 ' + await shots());
  await p.screenshot({ path: `${S}/shots/stick-fire.png` });
  // 손잡이 민 채로 ← 치기 누름 (멀티터치) → 쏘기 멈춤
  await p.evaluate(() => { G.shots = []; }); await T(p, 'pointerdown', 2, 'melee'); await p.waitForTimeout(600); const s1 = await p.evaluate(() => G.shots.length); const sw = await p.evaluate(() => !!G.hero.swing || G.hero.meleeCd > 0);
  await T(p, 'pointerup', 2, 'melee'); await p.waitForTimeout(500); const s2 = await p.evaluate(() => G.shots.length);
  out.push(`← 누르는 동안 쏘기 ${s1}발 · 치기 ${sw ? '나감' : '안 나감'} → 놓은 뒤 0.5초 쏘기 ${s2}발 (손잡이 아직 밀림)`);
  await T(p, 'pointerup', 1, 'stick'); await p.waitForTimeout(300); await p.evaluate(() => { G.shots = []; }); await p.waitForTimeout(400); out.push('손잡이 놓은 뒤 쏘기 ' + await p.evaluate(() => G.shots.length) + '발');
  // ← 끌기: 아래로 끌면 아래 방향 치기
  await T(p, 'pointerdown', 3, 'melee'); await T(p, 'pointermove', 3, 'melee', 0, 40); await p.waitForTimeout(250); out.push('← 아래로 끌기 → 장수 방향 ' + await p.evaluate(() => `${G.hero.dir.x.toFixed(2)},${G.hero.dir.y.toFixed(2)}`)); await T(p, 'pointerup', 3, 'melee', 0, 40);
  // → 무적
  await p.waitForTimeout(300); await T(p, 'pointerdown', 4, 'invuln'); await T(p, 'pointerup', 4, 'invuln'); await p.waitForTimeout(50); out.push('↓ 무적 톡 → skillT ' + await p.evaluate(() => G.hero.skillT.toFixed(2) + ' 남은 ' + G.run.invuln));
  // ↑ 스킬1 끌기 → 조준 캡처 → 놓기
  await p.waitForTimeout(1600); await T(p, 'pointerdown', 5, 'skill'); await T(p, 'pointermove', 5, 'skill', -300, -40); await T(p, 'pointermove', 5, 'skill', -420, -60); await p.waitForTimeout(120); await p.screenshot({ path: `${S}/shots/stick-aim.png` });
  await T(p, 'pointerup', 5, 'skill', -420, -60); await p.waitForTimeout(200); out.push('↑ 끌어 놓기 → 남은 ' + await p.evaluate(() => G.run.skillsLeft.slice(1).join(',')));
  // ↓ 스킬2 끌었다 되돌아와 취소
  await p.waitForTimeout(1500); await T(p, 'pointerdown', 6, 'skill2'); await T(p, 'pointermove', 6, 'skill2', -300, 0); await T(p, 'pointermove', 6, 'skill2', 4, 4); await p.waitForTimeout(100); await p.screenshot({ path: `${S}/shots/stick-cancel.png` });
  await T(p, 'pointerup', 6, 'skill2', 4, 4); await p.waitForTimeout(200); out.push('→ 스킬2 끌었다 되돌아와 놓기(취소) → 남은 ' + await p.evaluate(() => G.run.skillsLeft.slice(1).join(',')));
  // ↓ 톡 → 가까운 외계인
  await T(p, 'pointerdown', 7, 'skill2'); await T(p, 'pointerup', 7, 'skill2'); await p.waitForTimeout(200); out.push('→ 스킬2 톡 → 남은 ' + await p.evaluate(() => G.run.skillsLeft.slice(1).join(',')));
  // ↑ 꾹 누르기(0.3초, 안 움직임) → 조준 모드 켜짐 → 그대로 놓으면 가까운 외계인
  await p.waitForTimeout(1500); await T(p, 'pointerdown', 8, 'skill'); await p.waitForTimeout(300); const on = await p.evaluate(() => !!(G.dbgAim() && G.dbgAim().drag));
  await T(p, 'pointerup', 8, 'skill'); await p.waitForTimeout(200); out.push(`↑ 꾹 0.3초 → 조준 모드 ${on ? '켜짐' : '안 켜짐'} → 그대로 놓기 → 남은 ` + await p.evaluate(() => G.run.skillsLeft.slice(1).join(',')));
  // ↑ 꾹 누른 뒤 왼쪽 위로 40px만 움직이기 → 조준점은 장수에서 ×3 만큼
  await p.waitForTimeout(1500); await T(p, 'pointerdown', 9, 'skill'); await p.waitForTimeout(250); await T(p, 'pointermove', 9, 'skill', -40, 0); await p.waitForTimeout(50);
  const ap = await p.evaluate(() => { const a = G.dbgAim(); return a && a.t ? `장수 ${Math.round(G.hero.x)},${Math.round(G.hero.y)} → 조준 ${Math.round(a.t.x)},${Math.round(a.t.y)}` : '없음'; });
  await p.screenshot({ path: `${S}/shots/stick-hold.png` }); await T(p, 'pointerup', 9, 'skill', -40, 0); out.push('↑ 꾹 + 왼쪽 40px → ' + ap);
  console.log(out.join('\n') + '\nerrors: ' + (p.errs.join('|') || 'none')); await b.close(); })();
