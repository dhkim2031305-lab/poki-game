// 스킬 이름이 칸을 넘치지 않는지: 언어 20개 × (나라 고르기 화면, 스킬 쓴 직후 외침) 캡처
// 사용: node skillname.js 폴더 [나라번호=14] [스킬=1]
const { chromium } = require('playwright');
(async () => { const [S = require('os').tmpdir(), ci = '14', n = '1'] = process.argv.slice(2); const b = await chromium.launch();
  const LANGS = ['en', 'ko', 'fr', 'de', 'nl', 'da', 'sv', 'fi', 'it', 'es', 'cs', 'he', 'lt', 'ja', 'pt', 'pl', 'hu', 'sk', 'el', 'tr'];
  for (const L of LANGS) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(L => { try { localStorage.setItem('aw.langPick', JSON.stringify(L)); } catch (e) {} }, L);
    await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, +ci); await p.waitForTimeout(300);
    await p.screenshot({ path: `${S}/sn-${L}-select.png` });
    await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; });
    await p.keyboard.press(n === '1' ? 'KeyL' : 'Semicolon'); await p.waitForTimeout(250);
    await p.screenshot({ path: `${S}/sn-${L}-play.png` });
    console.log(L, await p.evaluate(() => I18N.lang + ' · ' + I18N.t('skill.name.15')), errs.length ? errs : 'ok'); await p.close();
  }
  await b.close(); })();
