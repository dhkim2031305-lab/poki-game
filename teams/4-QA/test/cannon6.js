// QA: 한국2 천자총통 "세워 두고 0.3초마다 6발" (ef077c3, 기획 8164964) — 발사·착탄 시각, 발마다 피해 배수(80×F), 장수 이동·무적, 화포 사라짐
// node cannon6.js OUT [port]
// 외계인: 목표 가운데 1마리(C) + 둘레 R×0.45 자리 5곳(발사 각도와 같은 자리, P0~P4) + 조금 먼 1마리(F, R×0.8). 체력 무한, 정지.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const out = {};
  for (const mode of ['stand', 'move']) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    const TX = 460, TY = 210;
    await p.evaluate(([TX, TY]) => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = 260; h.y = 210; h.dir = { x: 1, y: 0 }; h.inv = 0;
      const R = window.__R = 75; // SKB.AREA_R 추정값은 아래에서 다시 읽음
      const mk = (id, x, y) => ({ id, type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      window.__mk = mk; window.__TX = TX; window.__TY = TY;
      window.__log = []; window.__f = 0;
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; window.__f++; window.__cb(window.__t);
        for (const a of G.aliens) { if (a.hp < a.__hp) __log.push({ f: __f, id: a.id, d: a.__hp - a.hp }); a.__hp = a.hp; a.kb = { x: 0, y: 0 }; }
        const hh = G.hero; __trace.push({ f: __f, x: Math.round(hh.x), y: Math.round(hh.y), cast: hh.cast ? hh.cast.k : null, inv: typeof castInvulnerable === 'function' ? null : null, ents: G.ents ? G.ents.filter(e => e.owner && e.owner.k === 'cannon').length : -1 }); } };
      window.__trace = []; window.__manual = true;
    }, [TX, TY]);
    await p.waitForTimeout(100); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
    // 공식 반지름 읽기: 겨냥 원 크기는 못 읽으니, 둘레 외계인 자리는 발사 각도(o.ang + i·72°) × R×0.45로 둠. R은 여러 값 시험
    const sp = await p.evaluate(([x, y]) => G.dbgField(x, y), [TX, TY]);
    await p.mouse.move(sp.x - 30, sp.y + 5); await p.mouse.move(sp.x, sp.y);
    const R = await p.evaluate(() => { try { return null; } catch { return null; } });
    await p.evaluate(([TX, TY]) => { const R = 140, ang = 0; G.aliens.push(__mk('C', TX, TY)); for (let i = 0; i < 5; i++) { const a = ang + i * Math.PI * 2 / 5; G.aliens.push(__mk('P' + i, TX + Math.cos(a) * R * .45, TY + Math.sin(a) * R * .45)); } G.aliens.push(__mk('F', TX, TY + R * .8));
      G.aliens.forEach(a => a.__hp = a.hp); }, [TX, TY]);
    await p.evaluate(() => { __f = 0; __log = []; __trace = []; });
    await p.keyboard.press('Semicolon');
    if (mode === 'move') { await p.evaluate(() => __step(8)); await p.keyboard.down('KeyA'); await p.evaluate(() => __step(40)); await p.keyboard.up('KeyA'); await p.evaluate(() => __step(14)); await p.keyboard.down('KeyS'); await p.evaluate(() => __step(40)); await p.keyboard.up('KeyS'); await p.evaluate(() => __step(78)); }   // 0.13초(컷인 중)·1.03초(컷인 뒤) 두 번 움직여 봄
    else await p.evaluate(() => __step(180));
    if (mode === 'stand') for (const [f, name] of []) {}
    const r = await p.evaluate(() => ({ F: G.run.st.F, log: __log, trace: __trace, cannon: (G.ents || []).filter(e => e.mounted !== undefined).map(e => [Math.round(e.x), Math.round(e.y), e.mounted]) }));
    const u = 80 * r.F, by = {};
    r.log.forEach(l => { (by[l.id] = by[l.id] || []).push(`${(l.f / 60).toFixed(2)}s ×${(l.d / u).toFixed(2)}`); });
    const tot = Object.fromEntries(Object.entries(by).map(([k]) => [k, +(r.log.filter(l => l.id === k).reduce((s, l) => s + l.d, 0) / u).toFixed(2)]));
    const times = [...new Set(r.log.map(l => (l.f / 60).toFixed(2)))];
    const castEnd = r.trace.find(t => !t.cast); const entEnd = r.trace.filter(t => t.ents > 0).slice(-1)[0];
    const moved = r.trace.filter(t => t.x !== r.trace[0].x || t.y !== r.trace[0].y)[0];
    out[mode] = { 착탄시각: times, 마리별: by, 합계배수: tot, 시전끝: castEnd && (castEnd.f / 60).toFixed(2), 화포마지막: entEnd && (entEnd.f / 60).toFixed(2), 처음움직임: moved && (moved.f / 60).toFixed(2), 화포위치: r.cannon, 위치0: [r.trace[0].x, r.trace[0].y], 위치끝: [r.trace.slice(-1)[0].x, r.trace.slice(-1)[0].y], errs };
    // 캡처: 0.2·0.7·1.3·2.0초
    await p.close();
  }
  fs.writeFileSync(`${OUT}/cannon6.json`, JSON.stringify(out, null, 1)); console.log(JSON.stringify(out, null, 1)); await b.close();
})();
