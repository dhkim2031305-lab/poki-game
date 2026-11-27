// QA: 작업8a(24841e1) — 디버그 숨김 토글 · iOS 소리 시작 실패 흉내 · 폰 외침 말풍선이 오른쪽 버튼을 피하는지
// node job8a-ui.js OUT [port]   (npm run dev + dist/single-preview.html·single.html 빌드해 둔 뒤)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  const b = await chromium.launch(); const DIST = path.resolve(__dirname, '../../../dist');
  const title = p => p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 30000 });
  const dstate = p => p.evaluate(() => { const rt = document.getElementById('rt'), el = [...document.querySelectorAll('div,pre')].find(d => /maxTex/.test(d.textContent || ''));
    return { rt: rt ? (rt.hidden ? '숨김' : '보임') : '없음', diag: el ? (el.hidden || getComputedStyle(el).display === 'none' ? '숨김' : '보임') : '없음', ls: (() => { try { return localStorage.getItem('aw.debug'); } catch { return 'x'; } })() }; });
  // ---- 1) 디버그 숨김
  { const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await ctx.newPage();
    const url = 'file://' + DIST + '/single-preview.html';
    await p.goto(url); await title(p); await p.waitForTimeout(500); out.push(`미리보기 기본: ${JSON.stringify(await dstate(p))}`);
    await p.screenshot({ path: `${OUT}/debug-기본.png` });
    for (let i = 0; i < 5; i++) { await p.mouse.click(15, 15); await p.waitForTimeout(150); }
    await p.waitForTimeout(300); out.push(`왼쪽 위 5번 톡: ${JSON.stringify(await dstate(p))}`); await p.screenshot({ path: `${OUT}/debug-5톡-켬.png` });
    await p.reload(); await title(p); await p.waitForTimeout(500); out.push(`새로 고침 뒤(기억): ${JSON.stringify(await dstate(p))}`);
    for (let i = 0; i < 5; i++) { await p.mouse.click(15, 15); await p.waitForTimeout(150); }
    await p.waitForTimeout(300); out.push(`다시 5번 톡: ${JSON.stringify(await dstate(p))}`);
    for (let i = 0; i < 4; i++) { await p.mouse.click(15, 15); await p.waitForTimeout(150); } await p.waitForTimeout(300); out.push(`4번만 톡: ${JSON.stringify(await dstate(p))}`);
    for (let i = 0; i < 5; i++) { await p.mouse.click(15, 15); await p.waitForTimeout(450); } await p.waitForTimeout(300); out.push(`5번을 2초 넘게 천천히: ${JSON.stringify(await dstate(p))}`);
    await p.goto(url + '?debug=1'); await title(p); await p.waitForTimeout(500); out.push(`미리보기 ?debug=1: ${JSON.stringify(await dstate(p))}`); await p.screenshot({ path: `${OUT}/debug-url켬.png` });
    await ctx.close(); }
  for (const [tag, url] of [['한 파일(single.html)', 'file://' + DIST + '/single.html?debug=1'], ['개발 서버 /web/', `http://localhost:${port}/web/?debug=1`], ['poki', `http://localhost:${port}/poki/?debug=1`]]) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 } }); const p = await ctx.newPage(); await p.goto(url); await title(p); await p.waitForTimeout(500);
    out.push(`${tag} ?debug=1: ${JSON.stringify(await dstate(p))}`); await ctx.close(); }
  // ---- 2) iOS 소리 시작 실패 흉내: resume()이 처음 FAILS번 "Failed to start the audio device"로 실패
  for (const [tag, url] of [['미리보기', 'file://' + DIST + '/single-preview.html?debug=1'], ['웹', `http://localhost:${port}/web/`]]) {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => {
      window.__rej = []; window.__resume = 0; window.addEventListener('unhandledrejection', e => window.__rej.push(String(e.reason && e.reason.message || e.reason)));
      const AC = window.AudioContext, st = new WeakMap();
      Object.defineProperty(AC.prototype, 'state', { configurable: true, get() { return st.get(this) || 'suspended'; } });
      AC.prototype.resume = function () { window.__resume++; if (window.__resume <= 2) return Promise.reject(new DOMException('Failed to start the audio device', 'InvalidStateError')); st.set(this, 'running'); this.dispatchEvent && this.dispatchEvent(new Event('statechange')); return Promise.resolve(); };
    });
    await p.goto(url); await title(p);
    const tap = async () => { await p.touchscreen.tap(420, 250); await p.waitForTimeout(300); };
    const snap = () => p.evaluate(() => ({ resume: window.__resume, rej: window.__rej.slice(), scene: G.scene, diagText: [...document.querySelectorAll('div,pre')].filter(d => /promise/i.test(d.textContent || '')).length }));
    const s0 = await snap(); await tap(); const s1 = await snap(); await tap(); const s2 = await snap(); await tap(); const s3 = await snap();
    const mk = await p.evaluate(() => window.AUDIO && AUDIO.musicKey && AUDIO.musicKey());
    out.push(`소리 실패 흉내 [${tag}] 시작 resume ${s0.resume}번 · 1번 톡 뒤 ${s1.resume}번 · 2번 톡 ${s2.resume}번 · 3번 톡 ${s3.resume}번 | 처리 안 된 Promise ${JSON.stringify(s3.rej)} | 화면 진단에 promise 글자 ${s3.diagText} | 장면 ${s3.scene} | 음악 ${mk} | 에러 ${errs.length}`);
    await p.screenshot({ path: `${OUT}/소리실패-${tag}.png` }); await ctx.close();
  }
  // ---- 3) 폰 외침 말풍선 × 오른쪽 버튼 무리
  for (const [w, h] of [[844, 390], [667, 375], [568, 320], [932, 430]]) for (const [ci, n, tag] of [[25, 2, '그리스2'], [17, 2, '이스라엘2'], [14, 1, '한국1']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true }); const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}/web/?render=2d`); await title(p);
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(300);
    await p.touchscreen.tap(Math.round(w * .3), Math.round(h * .6)); await p.waitForTimeout(200);
    await p.evaluate(() => { window.__box = []; const rr = UI.rr; UI.rr = function (x, y, ww, hh, r, c) { if (c === 'rgba(10,11,15,.62)' && ww >= 100) window.__box.push([x, y, ww, hh]); return rr.apply(this, arguments); }; });
    const F = await p.evaluate(() => window.DATA.FIELD.floor);
    let over = 0, cnt = 0, worst = null, hudHit = 0, shots = 0;
    for (const fxq of [.55, .7, .85, .97]) for (const fyq of [.05, .4, .7, .95]) {
      await p.evaluate(([fxq, fyq, F]) => { G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.eshots = []; G.run.skillsLeft = G.run.skillsLeft.map(() => 9); const hh = G.hero; hh.x = F.x0 + (F.x1 - F.x0) * fxq; hh.y = F.y0 + (F.y1 - F.y0) * fyq; hh.dir = { x: 1, y: 0 }; hh.cast = null; hh.dash = null; hh.barrage = null; }, [fxq, fyq, F]);
      await p.waitForTimeout(80);
      await p.evaluate(() => { window.__box = []; }); await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL'); await p.waitForTimeout(350);
      const r = await p.evaluate(() => { const bx = window.__box.slice(-1)[0], B = Object.values(G.btnPos()); if (!bx) return null; const [x, y, ww, hh] = bx;
        const hit = B.filter(c => { const nx = Math.max(x, Math.min(c.x, x + ww)), ny = Math.max(y, Math.min(c.y, y + hh)); return Math.hypot(nx - c.x, ny - c.y) < c.r; }).length;
        const VH = UI.VH || 0; return { bx: bx.map(v => Math.round(v)), hit, hero: [Math.round(G.hero.x), Math.round(G.hero.y)] }; });
      if (!r) continue; cnt++; if (r.hit) { over++; worst = worst || r; }
      if ((fxq === .97 && fyq === .95) || (r.hit && shots < 2)) { shots++; await p.screenshot({ path: `${OUT}/말풍선-${w}x${h}-${tag}-${fxq}-${fyq}.png` }); }
    }
    out.push(`말풍선 ${w}×${h} ${tag}: ${cnt}자리 중 버튼(원)과 겹침 ${over}${worst ? ' 예 ' + JSON.stringify(worst) : ''}`);
    await ctx.close();
  }
  console.log(out.join('\n')); require('fs').writeFileSync(`${OUT}/job8a-ui.txt`, out.join('\n')); await b.close();
})();
