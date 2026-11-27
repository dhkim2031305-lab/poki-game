// 스킬 쓸 때 일반 공격이 같이 나가는지: PC 두 번 클릭(간격 여러 개) · 폰 스킬 화살표 톡/꾹 · 큰 원 잡은 채 스킬
// 사용: node skillatk.js  (npm run dev 켜 두고) · 출력 = 스킬 전후 일반 치기·쏘기 횟수와 시각
const { chromium } = require('playwright');
const probe = () => { window.__log = []; let sw = null, seen = new Set(); const f = () => { const h = G.hero; if (h) { if (h.swing && h.swing !== sw) { __log.push(['치기', +G.t.toFixed(2)]); } sw = h.swing; for (const s of G.shots) if (!seen.has(s)) { seen.add(s); if (!s.skill) __log.push(['쏘기', +G.t.toFixed(2)]); } if (h.cast && !__log.castT) { __log.castT = +G.t.toFixed(2); __log.push(['스킬 시작', __log.castT]); } } requestAnimationFrame(f); }; f(); };
async function start(b, touch) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 }, hasTouch: touch, isMobile: touch });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 2; }); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(400);
  await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 260; G.hero.y = 230; });
  await p.evaluate(probe); return p;
}
(async () => { const b = await chromium.launch(); const out = [];
  for (const gap of [0, 40, 90]) {   // PC: 우클릭 두 번 = 1번 스킬
    const p = await start(b, false); await p.mouse.move(600, 200); await p.evaluate(() => { window.__dn = []; document.getElementById('game').addEventListener('pointerdown', e => __dn.push(e.timeStamp), true); });
    await p.mouse.down({ button: 'right' }); await p.mouse.up({ button: 'right' }); await p.waitForTimeout(gap);
    await p.mouse.down({ button: 'right' }); await p.mouse.up({ button: 'right' }); await p.waitForTimeout(1200);
    out.push([`PC 우클릭 두 번 ${await p.evaluate(() => Math.round(__dn[1] - __dn[0]))}ms`, await p.evaluate(() => __log)]); await p.close();
  }
  for (const [name, hold] of [['폰 ← 톡', 80], ['폰 ← 꾹(0.5초)', 500]]) {
    const p = await start(b, true); const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
    const cdp = await p.context().newCDPSession(p), pt = (x, y) => [{ x: x * U, y: y * U, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(B.skill.x, B.skill.y) }); await p.waitForTimeout(hold);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(1200);
    out.push([name, await p.evaluate(() => __log)]); await p.close();
  }
  { const p = await start(b, true); const B = await p.evaluate(() => G.btnPos()); const U = await p.evaluate(() => document.getElementById('game').getBoundingClientRect().width / 844);
    const cdp = await p.context().newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: B.stick.x * U, y: B.stick.y * U, id: 1 }] }); await p.waitForTimeout(300);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: B.stick.x * U, y: B.stick.y * U, id: 1 }, { x: B.skill.x * U, y: B.skill.y * U, id: 2 }] }); await p.waitForTimeout(80);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: B.stick.x * U, y: B.stick.y * U, id: 1 }] }); await p.waitForTimeout(1200);
    out.push(['폰 큰 원 잡은 채 ← 톡', await p.evaluate(() => __log)]); await p.close(); }
  for (const [n, l] of out) console.log(n.padEnd(22), l.map(([k, t]) => `${k}@${t}`).join(' · ') || '(없음)');
  await b.close(); })();
