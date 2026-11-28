// QA: 3D 전용(9d95e89~) — ① WebGL이 꺼진 크롬에서 안내 화면 ② 저사양 흉내(844×390, CPU 느리게)에서 실제 rAF 프레임 간격과 자동 저사양(R3D.low)
// node webgl-lowend.js OUT [port]
// 주의: 이 서버는 GPU가 없어 3D를 CPU(swiftshader)로 그려요. 실제 폰보다 훨씬 느린 숫자라 "자동 대응이 켜지는지·멈춤·에러"만 판정하고 fps 숫자는 참고만 해요.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080] = process.argv.slice(2); const out = [];
  // ① WebGL 꺼짐
  for (const flags of [['--disable-webgl', '--disable-3d-apis'], ['--disable-gpu', '--disable-software-rasterizer', '--disable-webgl']]) {
    const b = await chromium.launch({ args: flags });
    for (const site of ['web', 'poki', 'crazygames', 'gamedistribution']) for (const [w, h] of [[844, 390], [390, 844], [1280, 720]]) {
      const p = await b.newPage({ viewport: { width: w, height: h } }); const errs = [];
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/gamedistribution\.com/.test(m.location().url || '')) errs.push('console: ' + m.text()); });
      await p.goto(`http://localhost:${port}/${site}/`); await p.waitForTimeout(2500);
      const st = await p.evaluate(() => { const vis = [...document.body.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
        const txt = document.body.innerText.trim().replace(/\s+/g, ' ').slice(0, 160); const btn = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean);
        const over = vis.filter(e => { const r = e.getBoundingClientRect(); return (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1) && e.textContent.trim(); }).length;
        return { gl: !!document.createElement('canvas').getContext('webgl'), scene: window.G ? G.scene : null, txt, btn, over, scroll: document.documentElement.scrollHeight > innerHeight + 1 }; });
      const file = `${OUT}/nowebgl-${flags.length}-${site}-${w}x${h}.png`; if (site === 'web' || w === 844) await p.screenshot({ path: file });
      out.push(`WebGL 끔(${flags.join(' ')}) ${site} ${w}×${h}: webgl=${st.gl} 장면=${st.scene} 글자="${st.txt}" 버튼=${JSON.stringify(st.btn)} 화면 밖 글자 ${st.over} 스크롤 ${st.scroll} 에러 ${errs.length ? errs.join(' | ') : 0}`);
      await p.close();
    }
    await b.close();
  }
  // ② 저사양 흉내: 실제 rAF로 12초 플레이(외계인 자연 소환 + 2초마다 스킬), CPU 느리게 1·4배
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const rate of [1, 4]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await p.addInitScript(() => { const real = window.requestAnimationFrame.bind(window); window.__dt = []; let last = 0; window.requestAnimationFrame = cb => real(t => { if (last) window.__dt.push(t - last); last = t; cb(t); }); });
    await p.goto(`http://localhost:${port}/web/`); await p.waitForFunction(() => window.G && G.scene === 'title', null, { timeout: 120000 });
    await p.evaluate(() => { G.scene = 'select'; G.sel = 14; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play', null, { timeout: 120000 });
    await p.evaluate(() => { window.__dt = []; });
    const marks = [];
    for (let s = 0; s < 12; s++) { await p.waitForTimeout(1000); if (s % 3 === 1) await p.keyboard.press(s % 2 ? 'KeyL' : 'Semicolon'); marks.push(await p.evaluate(() => [window.R3D && R3D.low, G.aliens.length, G.scene])); }
    const r = await p.evaluate(() => { const d = window.__dt.slice(), q = d.slice().sort((a, b) => a - b), pc = k => +q[Math.min(q.length - 1, Math.floor(q.length * k))].toFixed(1);
      return { n: d.length, fps: +(1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1), p50: pc(.5), p95: pc(.95), max: +q[q.length - 1].toFixed(1), over33: d.filter(x => x > 33.4).length, low: window.R3D && R3D.low, info: window.R3D && R3D.info && R3D.info() }; });
    await p.screenshot({ path: `${OUT}/lowend-cpu${rate}x.png` });
    out.push(`저사양 CPU ${rate}배 느리게 844×390: 평균 ${r.fps}fps · 간격 p50 ${r.p50} p95 ${r.p95} 최대 ${r.max}ms · 33ms 넘음 ${r.over33}/${r.n} · 자동 저사양 ${r.low} (초마다 ${marks.map(m => m[0] ? 'L' : '-').join('')}) · 그리기 호출 ${r.info && r.info.calls} · 에러 ${errs.length ? errs.join(' | ') : 0}`);
    await p.close();
  }
  await b.close();
  console.log(out.join('\n')); fs.writeFileSync(`${OUT}/webgl-lowend.txt`, out.join('\n'));
})();
