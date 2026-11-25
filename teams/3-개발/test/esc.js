// 설정 창은 ESC로만: P·창 벗어남·PC 클릭으로는 안 떠요 (node esc.js)
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'select'; G.sel = 3; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
  const st = () => p.evaluate(() => `paused=${!!G.paused} hold=${!!G.hold}`); const out = [];
  await p.keyboard.press('KeyP'); out.push('P → ' + await st());
  await p.evaluate(() => window.dispatchEvent(new Event('blur'))); out.push('창 벗어남 → ' + await st());
  const t0 = await p.evaluate(() => G.run.roundT); await p.waitForTimeout(400); out.push('멈춘 동안 시간 흐름 ' + ((await p.evaluate(() => G.run.roundT)) - t0).toFixed(2));
  await p.evaluate(() => window.dispatchEvent(new Event('focus'))); out.push('돌아옴 → ' + await st());
  await p.mouse.click(1280 * .93, 720 * .1); out.push('PC 오른쪽 위 클릭 → ' + await st());
  await p.evaluate(() => { G.touchUI = true; }); await p.waitForTimeout(100); let n = 0; for (let i = 0; i < 20; i++) { await p.mouse.click(1280 * .93, 720 * .1); if (await p.evaluate(() => G.paused)) n++; } out.push('터치 겸용(버튼 보임)에서 오른쪽 위 마우스 20번 연속 클릭 → 일시정지 ' + n + '번'); await p.evaluate(() => { G.touchUI = false; });
  await p.keyboard.press('Escape'); out.push('ESC → ' + await st()); await p.screenshot({ path: process.argv[2] + '/shots/esc-menu.png' });
  await p.keyboard.press('Escape'); out.push('ESC 다시 → ' + await st());
  console.log(out.join('\n') + '\nerrors: ' + (errs.join('|') || 'none')); await b.close(); })();
