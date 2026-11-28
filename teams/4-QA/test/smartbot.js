// QA: 똑똑한 자동 봇 — 거리 유지(카이팅)·원거리 계속 쏘기·가까우면 치기·점프/사격 탄 피하기·위험할 때 무적·스킬은 몰린 자리·아이템 먹기
// 실제 입력(키보드 WASD/J/K/L/;/Space + 마우스 커서)만 써요. 게임 시간은 1/60초씩 그대로, 프레임을 직접 넘겨 빨리 돌려요(판정 수치 안 바뀜).
// node smartbot.js OUT [port] [나라번호들 0~29] [판수] [smart|mid|dumb]
// 환경 변수: GOD=1 이면 체력이 60% 아래로 내려갈 때 다시 채우고, 20초 동안 처치가 없으면 장수를 남은 외계인 옆으로 옮겨요(봇이 가장자리 사격 외계인을 못 잡는 경우)(끝까지 가 보기 — 멈춤·오류·프레임 시간 확인용, 채운 횟수 기록) · RENDER=… 이면 ?render= 붙임(9d95e89부터 3D만이라 보통 비움) · 프레임마다 update+draw 실제 시간(ms)을 재요
// mid = 보통 사람 흉내: 판단 0.2초마다, 탄은 0.35초 안에 온 것만 60% 확률로 봄, 점프는 웅크림 절반 지나서야 봄, 무적은 체력 35% 아래에서만, 조준 ±12° 흔들림
const { chromium } = require('playwright');
(async () => {
  const [OUT, port = 8080, list = '0', runs = '5', mode = 'smart'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const fs = require('fs'); const all = [];
  for (const ci of list.split(',').map(Number)) for (let run = 0; run < +runs; run++) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); }; });
    await p.goto(`http://localhost:${port}/web/${process.env.RENDER ? '?render=' + process.env.RENDER : ''}`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 60000 });
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(200);
    await p.mouse.move(400, 200); await p.mouse.move(420, 210);   // 마우스 켜기 (PC 조준)
    await p.evaluate(() => { window.__manual = true; }); await p.waitForTimeout(120);
    const res = await p.evaluate(async ({ mode, seed, GOD }) => {
      // 재현 가능한 난수 (봇 망설임용) — 게임 난수는 건드리지 않아요
      let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
      const c = document.getElementById('game'), F = DATA.FIELD.floor;   // 3D: 커서는 G.dbgField(바닥→화면)
      const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
      const held = new Set(); const hold = (code, on) => { if (on && !held.has(code)) { held.add(code); key(code, true); } else if (!on && held.has(code)) { held.delete(code); key(code, false); } };
      const tap = code => { key(code, true); key(code, false); };
      let mxPrev = 0; const cursor = (x, y) => { const q = G.dbgField(x, y), sx = q.x, sy = q.y; c.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: sx, clientY: sy, movementX: (sx - mxPrev) || 1, movementY: 1, bubbles: true })); mxPrev = sx; };
      const log = { rounds: [], cause: null, maxRound: 1, clear: false, kills: 0, t: 0, skills: [0, 0], inv: 0 };
      let t = performance.now(), lastHp = G.hero.hp, lastRound = 1, lastCause = null, frames = 0;
      const used = {}; let skillGap = 0;
      const ft = []; let refills = 0; const step = () => { t += 1000 / 60; const a = performance.now(); window.__cb(t); ft.push(performance.now() - a); frames++; if (GOD && G.scene === 'play' && !G.hero.dead && G.hero.hp < G.hero.maxHp * .6) { G.hero.hp = G.hero.maxHp; refills++; }
        if (GOD && G.scene === 'play') { if (G.run.kills !== lastKills) { lastKills = G.run.kills; stallF = 0; } else if (++stallF > 60 * 20) { const a = G.aliens.find(x => !x.dead && !x.entering); if (a) { G.hero.x = a.x - 40; G.hero.y = Math.min(Math.max(a.y, DATA.FIELD.floor.y0 + 22), DATA.FIELD.floor.y1); assists++; } stallF = 0; } } };
      let lastKills = -1, stallF = 0, assists = 0;
      let decT = 0, mv = [0, 0], aimErr = 0, aimT = 0;
      function bot() {
        const h = G.hero, r = G.run; if (G.scene !== 'play' || h.dead) { ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyK', 'KeyJ'].forEach(k => hold(k, false)); return; }
        const al = G.aliens.filter(a => !a.dead && !a.entering);
        let vx = 0, vy = 0, danger = 0;
        // 1) 사격 탄 피하기: 0.5초 안에 가까이 오면 탄 진행 방향의 옆으로
        for (const e of G.eshots) { const rx = h.x - e.x, ry = h.y - (e.y), sp = Math.hypot(e.vx, e.vy) || 1, tt = (rx * e.vx + ry * e.vy) / (sp * sp); if (tt < 0 || tt > (mode === 'mid' ? .35 : .55)) continue; if (mode === 'mid' && ((e.__seen ??= rnd() < .6) === false)) continue;
          const px = e.x + e.vx * tt - h.x, py = e.y + e.vy * tt - h.y, miss = Math.hypot(px, py); if (miss < 30) { const sgn = (-e.vy * rx + e.vx * ry) >= 0 ? 1 : -1; vx += -e.vy / sp * sgn * 2.2; vy += e.vx / sp * sgn * 2.2; if (tt < .14 && miss < 18) danger += 1; } }
        // 2) 점프 착지 원 피하기
        for (const a of G.aliens) if (a.jump && a.jump.ph !== 'land' && !(mode === 'mid' && a.jump.ph === 'crouch' && a.jump.t < a.jumpCfg.crouch * .5)) { const C = a.jumpCfg, dx = h.x - a.jump.tx, dy = h.y - a.jump.ty, d = Math.hypot(dx, dy) || 1; if (d < C.r + 26) { vx += dx / d * 3; vy += dy / d * 3; const left = a.jump.ph === 'crouch' ? C.crouch - a.jump.t + C.air : C.air - a.jump.t; if (left < .16 && d < C.r + 8) danger += 2; } }
        // 3) 외계인과 거리 유지
        let near = null, nd = 1e9;
        for (const a of al) { const dx = h.x - a.x, dy = h.y - a.y, d = Math.hypot(dx, dy) || 1; if (d < nd) { nd = d; near = a; }
          const keep = a.type === 'boss' ? 150 : a.type === 'shooter' ? 70 : 95; if (d < keep) { const w = (keep - d) / keep * (a.type === 'boss' ? 3 : 2); vx += dx / d * w; vy += dy / d * w; }
          if (d < a.r + h.r + 4 && !(a.seal > 0) && !(a.freeze > 0) && !(a.fear > 0)) danger += a.type === 'boss' ? 2 : 1; }
        // 4) 멀면 다가가기 (사거리 안 유지), 아이템이 안전하면 먹기
        if (near && nd > 230) { vx -= (h.x - near.x) / nd * .7; vy -= (h.y - near.y) / nd * .7; }
        const it = G.items[0]; if (it && !al.some(a => Math.hypot(a.x - it.x, a.y - it.y) < 70)) { const dx = it.x - h.x, dy = it.y - h.y, d = Math.hypot(dx, dy) || 1; vx += dx / d * 1.2; vy += dy / d * 1.2; }
        // 5) 벽·구석 피하기 (몰리지 않게)
        const cx = (F.x0 + F.x1) / 2, cy = (F.y0 + F.y1) / 2; const wx = h.x < F.x0 + 70 ? 1 : h.x > F.x1 - 70 ? -1 : 0, wy = h.y < F.y0 + 60 ? 1 : h.y > F.y1 - 50 ? -1 : 0; vx += wx * 1.4; vy += wy * 1.4;
        if (Math.hypot(vx, vy) < .2 && Math.hypot(h.x - cx, h.y - cy) > 150) { vx += (cx - h.x) / 300; vy += (cy - h.y) / 300; }
        if (mode === 'dumb') { vx = 0; vy = 0; if (near) { vx = near.x - h.x; vy = near.y - h.y; if (nd < 90) { vx = -vx; vy = -vy; } } danger = 0; }
        if (mode === 'mid') { decT -= 1 / 60; if (decT <= 0) { decT = .2; mv = [vx, vy]; } vx = mv[0]; vy = mv[1]; }
        const L = Math.hypot(vx, vy); hold('KeyD', L > .2 && vx / L > .38); hold('KeyA', L > .2 && vx / L < -.38); hold('KeyS', L > .2 && vy / L > .38); hold('KeyW', L > .2 && vy / L < -.38);
        // 조준: 가까운 외계인(보스가 있으면 보스 우선은 하지 않음 — 가까운 위협부터), 약간 앞을 겨눔
        if (near) { const lead = mode === 'mid' ? 0 : Math.min(.25, nd / 430); aimT -= 1 / 60; if (aimT <= 0) { aimT = .3; aimErr = mode === 'mid' ? (rnd() - .5) * 2 * 12 * Math.PI / 180 : 0; }
          let ax = near.x + (near.fx || 0) * near.speed * lead - h.x, ay = near.y + (near.fy || 0) * near.speed * lead - h.y; const ca = Math.cos(aimErr), sa = Math.sin(aimErr); cursor(h.x + ax * ca - ay * sa, h.y + ax * sa + ay * ca); }
        hold('KeyK', !!near); hold('KeyJ', !!near && nd < (mode === 'mid' ? 50 : 62) && mode !== 'dumb');
        // 무적: 피할 수 없을 때
        if (mode !== 'dumb' && danger >= 1 && (mode !== 'mid' || h.hp < h.maxHp * .35) && r.invuln > 0 && !(h.skillT > 0) && !(h.inv > 0)) { tap('Space'); log.inv++; }
        // 스킬: 라운드마다 1번 정도, 외계인이 몰린 자리(또는 보스)
        skillGap -= 1 / 60; const k = 'r' + r.round; used[k] = used[k] || [0, 0];
        if (mode !== 'dumb' && skillGap <= 0 && al.length) {
          let best = null, bn = 0; for (const a of al) { const n = al.filter(o => Math.hypot(o.x - a.x, o.y - a.y) < 120).length + (a.type === 'boss' ? 2 : 0); if (n > bn) { bn = n; best = a; } }
          for (const n of [1, 2]) { if (used[k][n - 1] || r.skillsLeft[n] <= 0) continue; if (n === 1 && r.round === 6 && r.skillsLeft[1] > 0) {} else if (n === 2 && r.round === 1) continue;
            if (bn >= 3 || (best && best.type === 'boss')) { cursor(best.x, best.y); tap(n === 1 ? 'KeyL' : 'Semicolon'); used[k][n - 1] = 1; log.skills[n - 1]++; skillGap = 1.5; break; } }
        }
      }
      function cause() {   // 체력이 줄어든 원인
        const h = G.hero;
        for (const a of G.aliens) if (a.jump && a.jump.ph === 'land' && a.jump.t < .05 && Math.hypot(h.x - a.jump.tx, h.y - a.jump.ty) < a.jumpCfg.r + 12) return a.type === 'boss' ? '보스 점프' : '졸개 점프';
        for (const e of G.eshots) if (Math.hypot(e.x - h.x, e.y - h.y) < 40) return e.col === '#CA57E5' ? '보스 고리탄' : '사격 외계인 탄';
        let best = null, bd = 1e9; for (const a of G.aliens) { const d = Math.hypot(a.x - h.x, a.y - h.y); if (d < bd) { bd = d; best = a; } }
        return best ? (best.type === 'boss' ? '보스 몸' : best.type === 'shooter' ? '사격 외계인 몸' : '근접 외계인 몸') : '?';
      }
      const hits = {}; let roundHits = {};
      while (frames < 60 * 60 * (GOD ? 25 : 8)) {   // 게임 시간 최대 8분 (GOD는 25분)
        for (let i = 0; i < 4; i++) {
          if (G.scene === 'play') bot();
          const hp0 = G.hero.hp; step();
          if (G.scene === 'play' || G.hero.dead) { if (G.hero.hp < hp0 - .01) { const cz = cause(); hits[cz] = (hits[cz] || 0) + (hp0 - G.hero.hp); roundHits[cz] = (roundHits[cz] || 0) + 1; lastCause = cz; } }
          if (G.run.round > lastRound) { lastRound = G.run.round; }
          if (G.scene === 'roundPanel' && !G.__logged) { G.__logged = G.run.round; log.rounds.push({ r: G.run.round - (G.panel && G.panel.round === G.run.round ? 0 : 1), hp: +(G.hero.hp / G.hero.maxHp * 100).toFixed(0), t: +(G.run.roundT || 0).toFixed(1), hits: roundHits }); roundHits = {}; }
          if (G.scene === 'play' && G.__logged) G.__logged = 0;
          if (G.scene === 'result' || G.scene === 'ending') break;
        }
        if (G.scene === 'result' || G.scene === 'ending') break;
        await new Promise(r => setTimeout(r, 0));
      }
      log.maxRound = G.run.round; log.clear = G.scene === 'ending' || (G.result && G.result.kind === 'clear'); log.cause = log.clear ? null : lastCause; log.kills = G.run.kills; log.t = +(frames / 60).toFixed(0); log.hits = hits;
      { const q = ft.slice().sort((x, y) => x - y), pc = k => +q[Math.min(q.length - 1, Math.floor(q.length * k))].toFixed(1); log.frame = { n: q.length, p50: pc(.5), p95: pc(.95), p99: pc(.99), max: +q[q.length - 1].toFixed(1), over17: ft.filter(x => x > 16.7).length, over33: ft.filter(x => x > 33.3).length }; log.refills = refills; log.assists = assists; }
      log.endHp = +(G.hero.hp / G.hero.maxHp * 100).toFixed(0); log.result = G.result && G.result.kind || G.scene;
      return log;
    }, { mode, seed: ci * 10 + run + 1, GOD: process.env.GOD === '1' });
    const name = await p.evaluate(() => G.country.ko);
    res.ci = ci; res.name = name; res.run = run; res.mode = mode; res.errs = errs;
    console.log(`${ci + 1} ${name} #${run + 1} [${mode}] → ${res.clear ? '클리어' : res.maxRound + '라운드 쓰러짐(' + res.cause + ')'} · 라운드 끝 체력 ${res.rounds.map(x => x.hp + '%').join(' ')} · 게임 ${res.t}초 · 처치 ${res.kills} · 스킬 ${res.skills} · 무적 ${res.inv}${errs.length ? ' ERR ' + errs[0] : ''}` + (res.frame ? ` · 프레임 ms p50 ${res.frame.p50} p95 ${res.frame.p95} 최대 ${res.frame.max} (16.7 넘음 ${res.frame.over17}, 33 넘음 ${res.frame.over33})` : '') + (res.refills ? ` · 체력 채움 ${res.refills}` : '') + (res.assists ? ` · 20초 막힘 도움 ${res.assists}` : '') + (errs.length ? ` · 에러 ${errs.length}: ${errs.slice(0, 3).join(' | ')}` : ' · 에러 0'));
    all.push(res); await p.close();
  }
  fs.writeFileSync(`${OUT}/bot-${mode}-${list.replace(/,/g, '_')}.json`, JSON.stringify(all, null, 1));
  await b.close();
})();
