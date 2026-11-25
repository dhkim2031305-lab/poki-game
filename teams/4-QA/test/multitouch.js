// QA: GDD 0-18 두 손가락 — 손잡이를 민 채 ← 치기를 누르면 쏘기 멈춤, 화살표만 떼면 다시 쏨 (캔버스에 터치 PointerEvent 직접 보냄)
// node multitouch.js [port]
const { chromium } = require('playwright');
(async () => { const port = process.argv[2] || 8080; const b = await chromium.launch(); const out = [];
  for (const k of ['melee', 'skill', 'invuln']) {
  const p = await b.newPage({ viewport: { width: 667, height: 375 }, hasTouch: true, isMobile: true });
  await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(1600);
  const r = await p.evaluate(async k => {
    G.run.spawnT = 99; G.aliens = []; G.hero.hp = 1e5; G.touchUI = true; let sc = 0; const iv = setInterval(() => G.shots.filter(s => !s.skill && !s.counted).forEach(s => { s.counted = 1; sc++; }), 20);
    const c = document.querySelector('canvas'), bb = c.getBoundingClientRect(), U = Math.min(innerWidth / 844, innerHeight / 390), B = G.btnPos();
    const ev = (t, id, x, y) => c.dispatchEvent(new PointerEvent(t, { pointerType: 'touch', pointerId: id, isPrimary: id === 1, clientX: bb.left + x * U, clientY: bb.top + y * U, bubbles: true, cancelable: true, buttons: t === 'pointerup' ? 0 : 1 }));
    const wait = ms => new Promise(r => setTimeout(r, ms));
    ev('pointerdown', 1, B.stick.x, B.stick.y); ev('pointermove', 1, B.stick.x - 45, B.stick.y); await wait(900); const a = sc;
    ev('pointerdown', 2, B[k].x, B[k].y); await wait(150); const b0 = sc; await wait(700); const b1 = sc;
    ev('pointerup', 2, B[k].x, B[k].y); await wait(900); const c1 = sc;
    ev('pointerup', 1, B.stick.x - 45, B.stick.y); await wait(500); const d1 = sc; clearInterval(iv);
    return { a, hold: b1 - b0, after: c1 - b1, released: d1 - c1, left: G.run.skillsLeft.slice(1), inv: G.run.invuln };
  }, k);
  out.push(`${r.hold === 0 && r.after >= 2 ? '✅' : '❌'} 손잡이 민 채 ${k} 누름: 밀기 0.9초 ${r.a}발 → ${k} 누르는 0.7초 ${r.hold}발 → ${k}만 뗀 뒤 0.9초 ${r.after}발 → 손잡이도 뗀 뒤 ${r.released}발 (스킬 ${r.left}, 무적 ${r.inv})`);
  await p.close(); }
  console.log(out.join('\n')); await b.close(); })();
