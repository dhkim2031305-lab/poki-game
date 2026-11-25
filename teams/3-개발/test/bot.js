// 자동 플레이 봇: 가까운 외계인 쪽으로 가서 치고(J), 멀면 쏘고(K), HP 낮으면 스킬(L)
const { chromium } = require('playwright');
(async () => {
  const [S, site, ci, tag] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://localhost:8080/${site}/`);
  await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 15000 });
  await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  await p.evaluate(i => { G.sel = i; }, +ci); await p.keyboard.press('Enter');
  const down = new Set(); const set = async (k, on) => { if (on && !down.has(k)) { down.add(k); await p.keyboard.down(k); } if (!on && down.has(k)) { down.delete(k); await p.keyboard.up(k); } };
  const log = []; let lastRound = 0, t0 = Date.now(), shot = 0;
  while (Date.now() - t0 < 300000) {
    const s = await p.evaluate(() => {
      if (G.scene !== 'play') return { scene: G.scene, round: G.run && G.run.round, money: G.run && G.run.money, res: G.result && G.result.kind };
      const h = G.hero; let best = null, bd = 1e9;
      for (const a of G.aliens) { const d = Math.hypot(a.x - h.x, a.y - h.y); if (d < bd) { bd = d; best = a; } }
      const it = G.items[0];
      return { scene: 'play', round: G.run.round, money: G.run.money, hp: h.hp, max: h.maxHp, hx: h.x, hy: h.y, ax: best && best.x, ay: best && best.y, d: bd, ix: it && it.x, iy: it && it.y, left: G.run.wave.n + 1 - G.run.killsRound, skills: G.run.skills };
    });
    if (s.round !== lastRound) { log.push(`R${s.round} money=${(+s.money).toFixed(2)} t=${((Date.now() - t0) / 1000).toFixed(0)}s`); lastRound = s.round; }
    if (s.scene === 'play') {
      let mx = 0, my = 0;
      if (s.ax != null) {
        const dx = s.ax - s.hx, dy = s.ay - s.hy, d = s.d || 1;
        if (d < 75) { mx = -dx / d; my = -dy / d; }            // 가까우면 물러나요
        else if (d > 170) { mx = dx / d; my = dy / d; }        // 멀면 다가가요
        else { mx = -dy / d; my = dx / d; }                     // 사이면 옆으로 돌아요
        const cx = 346, cy = 195; mx += (cx - s.hx) / 400; my += (cy - s.hy) / 300; // 벽에 몰리지 않게 가운데로
      }
      if (s.ix != null && (s.d > 110 || s.ax == null)) { const dx = s.ix - s.hx, dy = s.iy - s.hy; mx = dx; my = dy; }
      await set('KeyD', mx > .3); await set('KeyA', mx < -.3); await set('KeyS', my > .3); await set('KeyW', my < -.3);
      await set('KeyJ', s.d < 70); await set('KeyK', s.d >= 70 && s.ax != null);
      if (s.hp < s.max * .3 && s.skills > 0) await p.keyboard.press('KeyL');
    } else if (s.scene === 'result' || s.scene === 'ending') {
      for (const k of [...down]) await set(k, false);
      if (s.scene === 'result') {
        log.push(`RESULT ${s.res} round=${s.round} money=${(+s.money).toFixed(2)} t=${((Date.now() - t0) / 1000).toFixed(0)}s`);
        await p.waitForTimeout(800);
        await p.screenshot({ path: `${S}/shots/bot-${tag}-result.png` });
        break;
      }
    } else if (s.scene === 'roundPanel' && shot++ === 0) { await p.waitForTimeout(1500); await p.screenshot({ path: `${S}/shots/bot-${tag}-panel.png` }); }
    if (s.scene === 'play' && s.round === 3 && shot === 1) { shot++; await p.screenshot({ path: `${S}/shots/bot-${tag}-r3.png` }); }
    await p.waitForTimeout(50);
  }
  console.log(tag + '\n  ' + log.join('\n  ') + '\n  errors: ' + (errs.join(' | ') || 'none'));
  await b.close();
})();
