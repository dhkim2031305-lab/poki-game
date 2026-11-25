// 회귀: 설치 스킬 6개가 실제로 피해를 주는지 (6f2b76a에서 tick이 주석에 묻혀 0이 됐던 버그 재발 막기)
// node zone6.js  → 나라마다 피해>0 이면 OK, 하나라도 0이면 FAIL(종료 코드 1)
const { chromium } = require('playwright');
const LIST = [[14, 1, '한국1'], [7, 2, '호주2'], [11, 2, '핀란드2'], [16, 1, '체코1'], [19, 1, '뉴질랜드1'], [27, 2, '칠레2']];
(async () => { const b = await chromium.launch(); const out = []; let bad = 0;
  for (const [ci, n, name] of LIST) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; G.items = []; G.hero.x = 200; G.hero.y = 200; G.aliens = [Object.assign({ type: 'grunt', x: 400, y: 210, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 1, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 })]; });
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.waitForTimeout(3600);
    const r = await p.evaluate(() => ({ dmg: 999 - G.aliens.reduce((s, a) => Math.min(s, a.hp), 999), tick: typeof (G.zones[0] || {}).tick }));
    const ok = r.dmg > 0 && !errs.length; if (!ok) bad++;
    out.push(`${ok ? 'OK  ' : 'FAIL'} ${name}: 피해 ${r.dmg.toFixed(1)}${errs.length ? ' ERR ' + errs.join('|') : ''}`); await p.close();
  }
  console.log(out.join('\n') + `\n${bad ? 'FAIL ' + bad + '개' : '설치 6개 모두 피해 있음'}`); await b.close(); process.exit(bad ? 1 : 0); })();
