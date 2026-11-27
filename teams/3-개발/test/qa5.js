// QA 설계 고침 5개 확인 (GDD 0-21): 스위스1 둘레 작은 원 ×0.5 · 스웨덴2 놓는 순간 안쪽 ×0.3 · 캐나다2 모으기 1.0초 · 이탈리아2 목표에서 전진 멈춤 · 프랑스1 꼭짓점 장수 쪽
const { chromium } = require('playwright');
const mk = (x, y) => ({ type: 'grunt', x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: 15, flash: 0, shootT: 99, seed: 0, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
async function run(b, ci, n, aliens, wait, probe) {
  const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
  await p.waitForFunction(() => G.scene === 'play' && G.run, null, { timeout: 15000 }); await p.waitForTimeout(300);
  await p.evaluate(([al, mks]) => { const mk = new Function('return ' + mks)(); G.run.spawnT = 99; G.aliens = al.map(([x, y]) => mk(x, y)); G.msgs = []; const h = G.hero; h.x = 260; h.y = 230; h.inv = 99;
    window.__t0 = G.t; window.__first = null; const f = () => { if (__first == null && G.aliens.some(a => a.hp < 99999)) __first = +(G.t - __t0).toFixed(2); requestAnimationFrame(f); }; f(); }, [aliens, mk.toString()]);
  await p.mouse.move(75 + 470, 230); await p.keyboard.press(n === 1 ? 'KeyL' : 'Semicolon'); await p.waitForTimeout(wait);
  const r = await p.evaluate(probe); await p.close(); return r + (errs.length ? ' ERR ' + errs : '');
}
(async () => { const b = await chromium.launch(); const one = 'Math.round(80*G.run.st.F)';
  const dmg = `() => { const o = 80 * G.run.st.F; return G.aliens.map(a => ((99999 - a.hp) / o).toFixed(2) + '×').join(' / ') + ' (첫 피해 ' + __first + '초)'; }`;
  console.log('스위스1 덫 (목표 470 · 옆 510):', await run(b, 2, 1, [[470, 230], [510, 230]], 1500, new Function('return ' + dmg)()));
  console.log('스웨덴2 원진 (안쪽 470 정지):  ', await run(b, 9, 2, [[470, 230]], 900, new Function('return ' + dmg)()));
  console.log('캐나다2 소용돌이 (470):        ', await run(b, 10, 2, [[470, 230]], 2500, new Function('return ' + dmg)()));
  console.log('이탈리아2 전진 (목표 470):     ', await run(b, 13, 2, [[470, 230]], 2500, () => 'hero x ' + Math.round(G.hero.x) + ' (목표 470)'));
  console.log('프랑스1 부채꼴 (목표 470·뒤 440):', await run(b, 12, 1, [[470, 230], [445, 230]], 1200, new Function('return ' + dmg)()));
  await b.close(); })();
