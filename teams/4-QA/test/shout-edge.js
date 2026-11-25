// QA: 외침 말풍선이 장수가 화면 끝(오른쪽·왼쪽·위)에 있을 때 잘리는지 캡처 + 말풍선 띠 픽셀 범위 측정
// node shout-edge.js OUT [port] [render]
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, render = '2d'] = process.argv.slice(2);
  const b = await chromium.launch(); const out = [];
  for (const [w, h] of [[844, 390], [667, 375]]) for (const [ci, n, tag] of [[25, 2, '그리스2-긴문장'], [17, 2, '이스라엘2-오른쪽부터']]) for (const pos of ['right', 'left', 'top']) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://localhost:${port}/web/?render=${render}`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(pos => { G.run.spawnT = 99; G.aliens = []; const f = FIELD_ = window.DATA.FIELD.floor, hh = G.hero; hh.x = pos === 'right' ? f.x1 - 12 : pos === 'left' ? f.x0 + 12 : 300; hh.y = pos === 'top' ? f.y0 + 22 : 220; hh.dir = { x: pos === 'right' ? 1 : -1, y: 0 }; if (pos === 'top') hh.dir = { x: 0, y: -1 }; }, pos);
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.waitForTimeout(350);
    const file = `${OUT}/shout-${w}x${h}-${tag}-${pos}.png`; await p.screenshot({ path: file });
    const msg = await p.evaluate(() => { const m = G.msgs.find(m => m.shout); return m ? m.text : null; });
    out.push(`${w}×${h} ${tag} ${pos}: 말 "${msg}" → ${file.split('/').pop()}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
