// 3D 전용(9d95e89~): 커서는 G.dbgField(바닥→화면)로 둠
// QA: 스킬 시전 중 무적 — 60개 스킬마다 외계인을 장수 몸에 붙여 두고(접촉 피해) 사격 탄도 계속 쏴서,
// 시전 중(h.cast·h.dash·h.barrage) 피격 0인지, 끝난 직후 다시 맞는지(첫 피격까지 시간) 확인
// node castinv.js [port] [나라번호들]
const { chromium } = require('playwright');
(async () => {
  const [port = 8080, list = [...Array(30).keys()].join(',')] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const out = [];
  for (const ci of list.split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.mouse.move(400, 200); await p.mouse.move(420, 205); await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(150);
    const r = await p.evaluate(async () => {
      const c = document.getElementById('game'), FX = 0; let t = performance.now(), mx = 0;
      const step = () => { t += 1000 / 60; window.__cb(t); };
      const cur = (x, y) => { const q = G.dbgField(x, y), sx = q.x; c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: sx, clientY: q.y, movementX: (sx - mx) || 1, movementY: 1, bubbles: true })); mx = sx; };
      const h = G.hero, res = [];
      for (const n of [1, 2]) {
        G.run.spawnT = 99; G.aliens = []; G.eshots = []; G.zones = []; G.ents = []; G.shots = []; h.cast = null; h.dash = null; h.barrage = null; h.inv = 0; h.skillT = 0;
        h.x = 200; h.y = 210; h.hp = h.maxHp = 1e6; G.run.skillsLeft[n] = 5;
        const glue = { type: 'grunt', x: h.x, y: h.y, dx: 0, dy: 0, entering: false, hp: 1e7, max: 1e7, speed: 0, r: 15, flash: 0, shootT: 99, seed: 1, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 };
        G.aliens.push(glue, { ...glue, x: 420, y: 210, kb: { x: 0, y: 0 } });   // 목표용 하나
        for (let i = 0; i < 50; i++) step();   // 붙은 채로 맞는지 먼저 (기준)
        const hp0 = h.hp; let preHit = hp0 < 1e6;
        h.inv = 0; h.hp = 1e6; cur(420, 210); step();
        window.dispatchEvent(new KeyboardEvent('keydown', { code: n === 2 ? 'Semicolon' : 'KeyL' })); window.dispatchEvent(new KeyboardEvent('keyup', { code: n === 2 ? 'Semicolon' : 'KeyL' }));
        let f = 0, castF = 0, startF = null, endF = null, hitsIn = 0, hitsBefore = 0, firstAfter = null, last = h.hp, hitLog = [];
        for (; f < 60 * 4; f++) {
          glue.x = h.x; glue.y = h.y; glue.kb = { x: 0, y: 0 }; glue.freeze = glue.seal = glue.fear = glue.air = 0;
          if (f % 6 === 0) G.eshots.push({ x: h.x + 25, y: h.y, vx: -170, vy: 0, dmg: 6, life: 1, col: '#B8D727' });
          step(); const inv = !!(h.cast || h.dash || h.barrage);
          if (inv) { if (startF == null) startF = f; castF = f + 1; } else if (startF != null && endF == null) endF = f;
          if (h.hp < last) { hitLog.push(f + (inv ? '시전' : '')); if (startF == null) hitsBefore++; else if (endF == null) hitsIn++; else if (firstAfter == null) firstAfter = (f - endF) / 60; }
          last = h.hp; if (endF != null && firstAfter != null) break;
        }
        res.push({ hitsBefore, startT: startF == null ? null : +(startF / 60).toFixed(2), hitLog: hitLog.slice(0, 4).join(','), n, k: (n === 2 ? G.country.skill2 : G.country.skill).mod.k, preHit, castT: +((castF - (startF || 0)) / 60).toFixed(2), hitsIn, firstAfter: firstAfter == null ? null : +firstAfter.toFixed(2), skillT: +(h.skillT || 0).toFixed(2) });
      }
      return { ko: G.country.ko, rank: G.country.rank, res };
    });
    for (const x of r.res) out.push(`${r.rank} ${r.ko} ${x.n}번 ${x.k}: 시작 ${x.startT}초 뒤 · 시작 전 피격 ${x.hitsBefore} · 시전 ${x.castT}초 · 시전 중 피격 ${x.hitsIn} ${x.hitsIn ? '❌' : '✅'} · 끝난 뒤 첫 피격 ${x.firstAfter == null ? '없음(4초)' : x.firstAfter + '초'}${!x.preHit ? ' (기준: 붙여도 안 맞음?)' : ''}${errs.length ? ' ERR ' + errs[0] : ''}`);
    await p.close();
  }
  console.log(out.join('\n')); await b.close();
})();
