// 외침 말풍선이 화면 밖으로 나가는지: 장수를 오른쪽 끝에 두고 화면 전체 캡처 (node shout.js S)
const { chromium } = require('playwright');
(async () => { const [S] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] }); const out = [];
  for (const [w, h, ci, n, side] of [[667, 375, 15, 2, 1], [667, 375, 17, 2, 1], [667, 375, 18, 1, 0], [1280, 720, 15, 2, 1], [1280, 720, 19, 2, 1], [667, 375, 3, 1, 1]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(side => { const f = { x0: 70, x1: 890, y0: 90 }; G.run.spawnT = 99; G.aliens = []; G.hero.x = side ? f.x1 - 14 : f.x0 + 14; G.hero.y = f.y0 + 30; G.hero.dir = { x: side ? -1 : 1, y: 0 }; }, side);
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.waitForTimeout(350);
    const name = `${S}/shots/shout-${w}-${ci}-${n}.png`; await p.screenshot({ path: name });
    const r = await p.evaluate(() => { const m = G.msgs.find(m => m.shout); return { key: G.country.key, text: m && m.text, VW: window.VW, cw: document.getElementById('game').getBoundingClientRect().width }; });
    out.push(`${w}x${h} ${r.key} ${n}번 "${r.text}" VW=${r.VW} canvas=${r.cw}${errs.length ? ' ERR ' + errs.join('|') : ''}`); await p.close();
  }
  console.log(out.join('\n')); await b.close(); })();
