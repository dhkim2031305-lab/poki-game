const { chromium } = require('playwright');
(async () => {
  const S = process.argv[2];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 844, height: 390 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/title-bg/.test(m.location().url)) errs.push(m.text()); });
  await p.goto('http://localhost:8080/web/');
  await p.waitForFunction(() => window.G && G.scene === 'title');
  // 치기 6종 대표: 한국 slash, 독일 bigslash, 아일랜드 smash, 스위스 thrust, 네덜란드 rapid, 호주 spin
  // 쏘기 8종 대표: 한국 arrow, 핀란드 bullet, 미국 beam, 룩셈부르크 crossbow, 덴마크 axe, 그리스 spear, 호주 boomerang, 이스라엘 sling
  const list = [[14, 'kor'], [8, 'ger'], [1, 'irl'], [2, 'sui'], [4, 'ned'], [7, 'aus'], [11, 'fin'], [3, 'usa'], [0, 'lux'], [5, 'den'], [25, 'gre'], [17, 'isr']];
  const out = [];
  for (const [ci, tag] of list) {
    await p.evaluate(i => { G.scene = 'select'; G.sel = i; }, ci); await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    await p.evaluate(() => { G.run.spawnT = 99; G.aliens = []; G.hero.x = 260; G.hero.y = 220; G.hero.dir = { x: 1, y: 0 }; G.msgs = [];
      const mk = (x) => ({ type: 'grunt', x, y: 220, dx: 0, dy: 0, entering: false, hp: 999, max: 999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk(310), mk(480)); G.hero.inv = 99; });
    await p.keyboard.down('KeyJ'); await p.waitForTimeout(90); await p.keyboard.up('KeyJ');
    await p.screenshot({ path: `${S}/shots/fx-${tag}-melee.png`, clip: { x: 150, y: 120, width: 420, height: 160 } });
    await p.waitForTimeout(450);
    await p.evaluate(() => { G.aliens = G.aliens.slice(1); G.hero.rangedCd = 0; });
    await p.keyboard.down('KeyK'); await p.waitForTimeout(60); await p.keyboard.up('KeyK'); await p.waitForTimeout(170);
    await p.screenshot({ path: `${S}/shots/fx-${tag}-ranged.png`, clip: { x: 150, y: 120, width: 420, height: 160 } });
    out.push(tag + ':' + await p.evaluate(() => G.country.melee + '/' + G.country.ranged));
    await p.evaluate(() => { G.scene = 'title'; });
  }
  // 설정 언어 20개
  await p.evaluate(() => { G.scene = 'select'; G.sel = 20; }); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.keyboard.press('Escape'); await p.evaluate(() => { G.langOpen = true; }); await p.waitForTimeout(200);
  await p.screenshot({ path: `${S}/shots/settings-20.png` });
  out.push('lang after japan=' + await p.evaluate(() => I18N.lang + ' / ' + I18N.t('ui.04', { n: 3 }) + ' / ' + I18N.countryName(G.country)));
  console.log(out.join('  ') + '\nerrors: ' + (errs.join(' | ') || 'none'));
  await b.close();
})();
