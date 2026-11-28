// QA: 작업15 시험 계획 — 한국 거북선·천자총통 × 근거리·원거리 × 헛치기·1마리·여러 마리·보스 (16장면), 3D 844×390
// 흔들림 끔(settings.shake=false), 외침은 프레임마다 지움. 프레임을 손으로 넘겨 0.05초마다 기록.
// 판정 자료: 외계인마다 피해 시각(실제) ↔ 접촉 신호(G.fx 'koreaHit' 자리, a.koreaBurn) 대조 → 맞은 적에만 신호가 나오는지, 빗나간 적엔 없는지
// node scenes16.js OUT [port] [only: 예 "1-near-boss"]
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, only] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const all = [];
  const HX = 200, HY = 215;
  const scenes = [];
  for (const n of [1, 2]) for (const dist of ['near', 'far']) for (const lay of ['miss', 'one', 'multi', 'boss']) scenes.push({ n, dist, lay, id: `${n}-${dist}-${lay}` });
  for (const sc of scenes) {
    if (only && !only.split(',').includes(sc.id)) continue;
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { try { localStorage.setItem('aw.settings', JSON.stringify({ shake: false, flash: true, sound: false })); } catch {}
      const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 60000 }); await p.waitForTimeout(600);
    const d = sc.dist === 'near' ? 120 : 330, tx = HX + d, ty = HY;
    // 배치: 거북선은 길(장수→목표) 위/밖, 천자총통은 목표 둘레 안/밖
    const L = [];
    if (sc.n === 1) {
      if (sc.lay === 'miss') L.push(['M1', 'grunt', HX + d * .7, HY + 120]);
      if (sc.lay === 'one') L.push(['H1', 'grunt', HX + d * .7, HY]);
      if (sc.lay === 'multi') L.push(['H1', 'grunt', HX + d * .4, HY - 8], ['H2', 'grunt', HX + d * .7, HY + 8], ['H3', 'grunt', HX + d * .95, HY], ['M1', 'grunt', HX + d * .6, HY + 120], ['M2', 'grunt', HX + d * .6, HY - 120]);
      if (sc.lay === 'boss') L.push(['B', 'boss', HX + d * .75, HY], ['H1', 'grunt', HX + d * .4, HY - 10], ['M1', 'grunt', HX + d * .5, HY + 125]);
    } else {
      if (sc.lay === 'miss') L.push(['M1', 'grunt', sc.dist === 'near' ? tx + 230 : tx - 230, ty]);
      if (sc.lay === 'one') L.push(['H1', 'grunt', tx, ty]);
      if (sc.lay === 'multi') L.push(['H1', 'grunt', tx, ty], ['H2', 'grunt', tx + 45, ty - 25], ['H3', 'grunt', tx - 40, ty + 30], ['M1', 'grunt', tx + 170, ty + 120], ['M2', 'grunt', tx - 10, ty - 160]);
      if (sc.lay === 'boss') L.push(['B', 'boss', tx, ty], ['H1', 'grunt', tx + 50, ty + 20], ['M1', 'grunt', tx - 200, ty + 110]);
    }
    await p.evaluate(([L, HX, HY]) => {
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = HX; h.y = HY; h.dir = { x: 1, y: 0 }; h.inv = 0;
      const F = DATA.FIELD.floor; const cl = (v, a, b) => Math.max(a, Math.min(b, v));
      for (const [id, type, x, y] of L) G.aliens.push({ id, type, x: cl(x, F.x0 + 20, F.x1 - 20), y: cl(y, F.y0 + 25, F.y1 - 5), dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.forEach(a => a.__hp = a.hp);
      window.__rec = { dmg: {}, contact: [], burn: {}, cut: [], slow: [], f: 0 }; const seen = new Set();
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; __rec.f++; window.__cb(window.__t); G.msgs = G.msgs.filter(m => !m.shout);
        for (const a of G.aliens) { if (a.hp < a.__hp) (__rec.dmg[a.id] = __rec.dmg[a.id] || []).push(+(__rec.f / 60).toFixed(2)); a.__hp = a.hp; if (a.koreaBurn != null && !__rec.burn[a.id]) __rec.burn[a.id] = +(__rec.f / 60).toFixed(2); }
        for (const e of G.fx) if (e.type === 'koreaHit' && !seen.has(e)) { seen.add(e); __rec.contact.push({ t: +(__rec.f / 60).toFixed(2), x: Math.round(e.x), y: Math.round(e.y) }); }
        if (G.cutin) __rec.cut.push(__rec.f); if (G.koreaSlow > 0) __rec.slow.push(__rec.f); } };
      window.__manual = true;
    }, [L, HX, HY]);
    await p.waitForTimeout(150); await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); __step(2); });
    const s = await p.evaluate(([x, y]) => G.dbgField(x, y), [tx, ty]);
    await p.mouse.move(s.x - 20, s.y + 5); await p.mouse.move(s.x, s.y); await p.evaluate(() => __step(2));
    await p.evaluate(() => { __rec.f = 0; });
    await p.keyboard.press(sc.n === 2 ? 'Semicolon' : 'KeyL');
    // 0.05초(3프레임)마다 최대 2.6초 캡처는 장면 판정용으로 0.1초마다 저장
    const shots = []; for (let k = 0; k < (sc.n === 2 ? 80 : 52); k++) { await p.evaluate(() => __step(3)); if (k % 2 === 1) { const f = `${OUT}/${sc.id}-${String((k + 1) * 5).padStart(3, '0')}.png`; await p.screenshot({ path: f }); shots.push(f); } }
    const r = await p.evaluate(() => ({ rec: __rec, aliens: G.aliens.map(a => ({ id: a.id, x: Math.round(a.x), y: Math.round(a.y), r: a.r, type: a.type })), F: G.run.st.F }));
    // 대조: 접촉 신호가 어느 외계인 가장자리(반지름+12px 안)에 있었나
    const near = c => r.aliens.filter(a => Math.hypot(a.x - c.x, a.y - c.y) <= a.r + 40).map(a => a.id);
    const contactBy = {}; r.rec.contact.forEach(c => near(c).forEach(id => contactBy[id] = (contactBy[id] || 0) + 1));
    const hit = Object.keys(r.rec.dmg), missIds = r.aliens.map(a => a.id).filter(id => !hit.includes(id));
    const row = { ...sc, hit, miss: missIds, dmgT: Object.fromEntries(Object.entries(r.rec.dmg).map(([k, v]) => [k, v.slice(0, 6)])), contacts: r.rec.contact.length, contactBy, burn: r.rec.burn,
      signalOnMiss: missIds.filter(id => contactBy[id] || r.rec.burn[id]), hitNoSignal: hit.filter(id => !contactBy[id] && !r.rec.burn[id]),
      cutin: r.rec.cut.length ? [+(r.rec.cut[0] / 60).toFixed(2), r.rec.cut.length] : null, slow: r.rec.slow.length ? [+(r.rec.slow[0] / 60).toFixed(2), r.rec.slow.length] : null, errs };
    all.push(row);
    console.log(`${sc.id}: 맞음 ${hit.join(',') || '-'} · 안 맞음 ${missIds.join(',') || '-'} · 접촉 신호 ${row.contacts}개 ${JSON.stringify(contactBy)} · 불탐 ${JSON.stringify(r.rec.burn)} · 빗나간 적에 신호 ${row.signalOnMiss.join(',') || '없음'} · 맞았는데 신호 없음 ${row.hitNoSignal.join(',') || '없음'} · 첫 피해 ${JSON.stringify(Object.fromEntries(Object.entries(row.dmgT).map(([k, v]) => [k, v[0]])))} · 컷인 ${JSON.stringify(row.cutin)} 느려짐 ${JSON.stringify(row.slow)}${errs.length ? ' · 에러 ' + errs.join(' | ') : ''}`);
    await p.close();
  }
  fs.writeFileSync(`${OUT}/scenes16.json`, JSON.stringify(all, null, 1)); await b.close();
})();
