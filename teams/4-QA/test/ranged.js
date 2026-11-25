// QA: 30개국 원거리(K / 우클릭) — 탄 종류, 부메랑 돌아옴, 캡처
// node ranged.js OUT [port]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch(); const out = [];
  const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  for (let ci = 0; ci < 30; ci++) {
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 200; G.hero.y = 210; G.hero.dir = { x: 1, y: 0 };
      window.__tr = []; const iv = setInterval(() => { const s = G.shots[0]; if (s) __tr.push([Math.round(s.x), s.kind]); }, 40); setTimeout(() => clearInterval(iv), 2000); });
    await p.keyboard.down('KeyK'); await p.waitForTimeout(60); await p.keyboard.up('KeyK'); await p.waitForTimeout(220);
    await p.screenshot({ path: `${OUT}/ranged-${String(ci + 1).padStart(2, '0')}.png`, clip: { x: 120, y: 120, width: 520, height: 180 } });
    await p.waitForTimeout(1900);
    const r = await p.evaluate(() => { const xs = __tr.map(t => t[0]); const mx = Math.max(...xs); return { key: G.country.key, ko: G.country.ko, ranged: G.country.ranged, kind: __tr[0] && __tr[0][1], maxX: mx, endX: xs[xs.length - 1], back: xs.length > 2 && xs[xs.length - 1] < mx - 60, fx: G.fx.map(f => f.kind).join(',') }; });
    out.push(`${ci + 1} ${r.ko}: 설정=${r.ranged} 탄=${r.kind} 가장 멀리 x=${r.maxX} 마지막 x=${r.endX}${r.back ? ' ← 돌아옴' : ''}`);
  }
  console.log(out.join('\n') + '\n에러: ' + (errs.join(' | ') || '없음')); await b.close();
})();
