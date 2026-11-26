// 16방향 몸: 한국 시험 시트(디자인 round15 korea-dir9.webp)를 브라우저에서만 바꿔 끼우고 16개 각도 캡처
// 걷기는 아직 10칸(8방향) → 가까운 방향 칸으로 나오는지도 봐요. 다른 나라(5칸)는 8방향 그대로인지 확인
// 사용: node dir16.js out   (npm run dev 켜 두고, out/shots 폴더 필요)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const sheet = fs.readFileSync(path.join(__dirname, '../../2-디자인/gpt-art/round15/korea-dir16/korea-dir9.webp')).toString('base64');
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  let shot = 0; for (const [ci, tag, swap] of [[14, 'kor', true], [2, 'sui', false]]) {
    await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(200);
    if (swap) await p.evaluate(d => new Promise(r => { const im = new Image(); im.onload = () => { UI.img['dir/korea'] = im; r(); }; im.src = 'data:image/webp;base64,' + d; }), sheet);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.hero.x = 346; G.hero.y = 230; G.hero.inv = 0; });
    for (const i of [...Array(16).keys(), 0, 1]) {
      await p.evaluate(i => { const a = i * Math.PI / 8; G.hero.dir = { x: Math.cos(a), y: Math.sin(a) }; G.hero.inv = 0; }, i);
      await p.waitForTimeout(60);
      await p.screenshot({ path: `${S}/shots/d16-${tag}-${String(i).padStart(2, '0')}${shot++ >= 16 ? 'b' : ''}.png`, clip: { x: 75 + 346 - 70, y: 230 - 100, width: 140, height: 140 } });
    }
    await p.evaluate(() => { G.scene = 'title'; }); shot = 0;
  }
  console.log('errors:', errs.join('|') || 'none'); await b.close(); })();
