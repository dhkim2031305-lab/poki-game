// QA: 1라운드에서 스킬 1·2만 번갈아 5번씩 써 보기 (30개국) — 쓸 때마다 피해(80×F 배수)·맞힌 수·1라운드 처치 환산·첫 피해까지 시간·제어
// 측정을 위해: 장수는 맞지 않게(체력 유지)·가운데에 세움, 외계인 체력은 9999(웨이브가 안 끝나게), 일반 공격 안 씀. 조준은 외계인이 가장 몰린 자리(커서).
// node skillprobe.js OUT [port] [나라번호들] [hp: inf | 30 | 50] [스킬: 1 | 2 | 12]
// hp=30·50 (실제 체력): 외계인이 진짜로 죽고 보스도 나와요. 라운드가 끝나지 않게 소환만 계속 이어 줘요. 50은 5라운드 외계인 체력(힘 배율 F는 1라운드 그대로)
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, list = [...Array(30).keys()].join(','), HPM = 'inf', SK = '12'] = process.argv.slice(2);
  const b = await chromium.launch(); const fs = require('fs'); const all = [];
  for (const ci of list.split(',').map(Number)) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/?render=2d`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(200);
    await p.mouse.move(400, 200); await p.mouse.move(420, 210);
    await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(120);
    const res = await p.evaluate(async ({ HPM, SK }) => {
      const c = document.querySelector('canvas'), FX = (844 - 1280 * 390 / 720) / 2, F = DATA.FIELD.floor, CX = (F.x0 + F.x1) / 2, CY = (F.y0 + F.y1) / 2 + 10;
      const key = code => { window.dispatchEvent(new KeyboardEvent('keydown', { code })); window.dispatchEvent(new KeyboardEvent('keyup', { code })); };
      let mx = 0; const cursor = (x, y) => { const sx = x + FX; c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: sx, clientY: y, movementX: (sx - mx) || 1, movementY: 1, bubbles: true })); mx = sx; };
      let t = performance.now(); const step = () => { t += 1000 / 60; window.__cb(t); };
      const h = G.hero, U = 80 * G.run.st.F, uses = [];
      const prep = () => { h.hp = h.maxHp; const r = G.run;
        for (const a of G.aliens) if (!a.__big) { a.__big = 1; if (HPM === 'inf') a.hp = a.max = 9999; else if (HPM === '50' && a.type !== 'boss') a.hp = a.max = 50; }
        if (HPM !== 'inf') { if (r.spawned >= r.wave.n) r.spawned = 0; if (r.killsRound >= r.wave.n - 1) r.killsRound = Math.ceil(r.wave.n / 2); } };
      const busy = () => h.dash || h.barrage || G.zones.length || G.ents.length || G.timers.length || G.marks.length || G.shots.some(s => s.skill);
      let frames = 0; const tick = async n => { for (let i = 0; i < n; i++) { prep(); step(); frames++; if (frames % 8 === 0) await new Promise(r => setTimeout(r, 0)); } };
      // 외계인이 들어올 때까지 기다림
      await tick(60 * 4);
      for (let u = 0; u < 10; u++) {
        const n = SK === '12' ? u % 2 + 1 : +SK; if (SK !== '12' && u >= 5) break; if (G.run.skillsLeft[n] <= 0) continue;
        // 장수 가운데로, 외계인 3마리 이상 모일 때까지 (최대 4초)
        for (let w = 0; w < 240; w++) { h.x = CX; h.y = CY; await tick(1); if (G.aliens.filter(a => !a.dead && !a.entering).length >= 4 && !busy()) break; }
        const al = G.aliens.filter(a => !a.dead && !a.entering); let best = null, bn = 0;
        for (const a of al) { const k = al.filter(o => Math.hypot(o.x - a.x, o.y - a.y) < 110).length; if (k > bn) { bn = k; best = a; } }
        const tg = best ? { x: al.filter(o => Math.hypot(o.x - best.x, o.y - best.y) < 110).reduce((s, o) => s + o.x, 0) / bn, y: al.filter(o => Math.hypot(o.x - best.x, o.y - best.y) < 110).reduce((s, o) => s + o.y, 0) / bn } : { x: CX + 120, y: CY };
        cursor(tg.x, tg.y);
        const hp0 = new Map(G.aliens.map(a => [a, a.hp])), kill0 = G.run.kills, ctl = new Set(), x0 = h.x, y0 = h.y; let first = null, inv = 0, maxMove = 0, f0 = frames;
        key(n === 1 ? 'KeyL' : 'Semicolon');
        for (let w = 0; w < 60 * 5; w++) { await tick(1); inv = Math.max(inv, h.skillT || 0); maxMove = Math.max(maxMove, Math.hypot(h.x - x0, h.y - y0));
          for (const a of G.aliens) { if (!hp0.has(a)) hp0.set(a, a.hp); if (first == null && a.hp < hp0.get(a)) first = (frames - f0) / 60; for (const k of ['freeze', 'seal', 'root', 'air', 'fear', 'weak', 'mark']) if (a[k] > 0) ctl.add(k); }
          if (w > 20 && !busy()) break; }
        const per = [...hp0].map(([a, v]) => v - a.hp).filter(d => d > .01);
        const useful = [...hp0].reduce((s, [a, v]) => s + Math.max(0, Math.min(v, v - a.hp)), 0), boss = [...hp0].find(([a]) => a.type === 'boss');
        const bossPct = boss ? +((boss[1] - Math.max(0, boss[0].hp)) / boss[0].max * 100).toFixed(1) : null;
        uses.push({ n, aliensInRange: bn, kills: G.run.kills - kill0, useful: +(useful / U).toFixed(2), bossPct, dmg: +(per.reduce((s, d) => s + d, 0) / U).toFixed(2), hit: per.length, maxOne: +(Math.max(0, ...per) / U).toFixed(2), kills30: +per.reduce((s, d) => s + Math.min(d, 30) / 30, 0).toFixed(2), first: first == null ? null : +first.toFixed(2), dur: +((frames - f0) / 60).toFixed(2), move: Math.round(maxMove), inv: +inv.toFixed(2), ctl: [...ctl].join(',') });
      }
      const sum = n => { const xs = uses.filter(u => u.n === n); const av = k => +(xs.reduce((s, u) => s + (u[k] || 0), 0) / (xs.length || 1)).toFixed(2); const bp = xs.filter(u => u.bossPct != null); return { uses: xs.length, kills: av('kills'), useful: av('useful'), bossPct: bp.length ? +(bp.reduce((s, u) => s + u.bossPct, 0) / bp.length).toFixed(1) : null, bossUses: bp.length, dmg: av('dmg'), hit: av('hit'), kills30: av('kills30'), maxOne: av('maxOne'), first: av('first'), dur: av('dur'), move: av('move'), inv: av('inv'), ctl: [...new Set(xs.flatMap(u => u.ctl ? u.ctl.split(',') : []))].join(',') }; };
      return { key: G.country.key, ko: G.country.ko, rank: G.country.rank, F: +G.run.st.F.toFixed(3), base: +U.toFixed(1), s1: { type: G.country.skill.type, k: G.country.skill.mod.k, ...sum(1) }, s2: { type: G.country.skill2.type, k: G.country.skill2.mod.k, ...sum(2) }, uses };
    }, { HPM, SK });
    res.errs = errs; res.hpm = HPM; all.push(res);
    const f = s => `${s.type}/${s.k} 처치${s.kills} 유효피해×${s.useful} 보스${s.bossPct}%(${s.bossUses}번) 피해×${s.dmg} 맞힘${s.hit} 처치환산${s.kills30} 첫타${s.first}s 이동${s.move} 무적${s.inv} ${s.ctl}`;
    console.log(`${res.rank} ${res.ko} F=${res.F} | 1번 ${f(res.s1)} | 2번 ${f(res.s2)}${errs.length ? ' ERR ' + errs[0] : ''}`);
    await p.close();
  }
  fs.writeFileSync(`${OUT}/skillprobe-${HPM}-${SK}-${list.split(',')[0]}.json`, JSON.stringify(all, null, 1)); await b.close();
})();
