// QA: 개발 작업10·11(ef077c3) — 60개 스킬에서 코드로 그린 것이 남았는지 + 소품 그림 이동 기록
// node job11.js OUT [port] [ci,ci,...] [render]
// 방법: 캔버스 fill/stroke/fillRect/strokeRect 호출을 부른 game.js 줄별로 셈. 스킬 쓰기 전 2초(기본 공격·외계인 맞음 포함)와
//       쓴 뒤 2.5초를 비교해, 쓴 뒤에만 나오는 줄 = 스킬 때문에 그린 코드 도형 후보. drawImage는 그림 종류(skill/u·prop·seq·기타)별로 셈.
//       소품(skill/prop) drawImage는 프레임마다 화면 위치·크기·회전을 기록.
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const [OUT, port = 8080, only, render = '2d'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const list = only ? only.split(',').map(Number) : [...Array(30).keys()]; const res = [];
  for (const ci of list) for (const n of [1, 2]) {
    const p = await b.newPage({ viewport: { width: 844, height: 390 } }); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => {
      const real = window.requestAnimationFrame.bind(window); window.__manual = false; window.requestAnimationFrame = cb => { if (window.__manual) { window.__cb = cb; return 1; } return real(cb); };
      window.__rec = null; const P = CanvasRenderingContext2D.prototype;
      const where = () => { const st = new Error().stack.split('\n'); for (const l of st) { const m = l.match(/at (?:(\S+) )?\(?.*\/(game|fx|render3d)\.js:(\d+):\d+/); if (m) return `${m[2]}:${m[3]} ${m[1] || ''}`; } return '?'; };
      for (const f of ['fill', 'stroke', 'fillRect', 'strokeRect']) { const o = P[f]; P[f] = function () { const r = window.__rec; if (r && this.canvas === window.__cv) { const k = f + ' ' + where(); r.path[k] = (r.path[k] || 0) + 1; } return o.apply(this, arguments); }; }
      const di = P.drawImage; P.drawImage = function (im) { const r = window.__rec; if (r && this.canvas === window.__cv) { const s = im && (im.src || im.__key || '') || '', cat = /skill\/prop\//.test(s) ? 'prop' : /skill\/seq\//.test(s) ? 'seq' : /skill\/u\//.test(s) ? 'u' : /pose\//.test(s) ? 'pose' : 'other';
          r.img[cat] = (r.img[cat] || 0) + 1;
          if (cat === 'prop' || cat === 'u' || cat === 'seq') { const t = this.getTransform(), a = arguments, w = a.length >= 5 ? a[a.length - 2] : im.width, h = a.length >= 5 ? a[a.length - 1] : im.height, x0 = a.length >= 5 ? a[a.length - 4] : a[1], y0 = a.length >= 5 ? a[a.length - 3] : a[2];
            const cx = t.a * (x0 + w / 2) + t.c * (y0 + h) + t.e, cy = t.b * (x0 + w / 2) + t.d * (y0 + h) + t.f; // 그림 아래 가운데(화면 px × DPR)
            r.draws.push({ f: r.frame, cat, file: s.split('/').pop().split('?')[0], x: Math.round(cx), y: Math.round(cy), w: Math.round(Math.hypot(t.a, t.b) * Math.abs(w)), rot: +Math.atan2(t.b, t.a).toFixed(2), al: +this.globalAlpha.toFixed(2) }); } }
        return di.apply(this, arguments); };
    });
    await p.goto(`http://localhost:${port}/web/?render=${render}`); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.evaluate(ci => { G.scene = 'select'; G.sel = ci; }, ci); await p.keyboard.press('Enter');
    await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(400);
    await p.evaluate(() => {
      window.__cv = document.querySelector('canvas');
      G.run.spawnT = 99; G.aliens = []; G.msgs = []; G.items = []; G.eshots = [];
      const h = G.hero; h.x = 260; h.y = 210; h.dir = { x: 1, y: 0 }; h.inv = 0;
      const mk = (id, type, x, y) => ({ id, type, x, y, dx: 0, dy: 0, entering: false, hp: 99999, max: 99999, speed: 0, r: type === 'boss' ? 30 : 15, flash: 0, shootT: 99, seed: x, vx: -1, kb: { x: 0, y: 0 }, recoil: 0 });
      G.aliens.push(mk('A', 'grunt', 330, 210), mk('B', 'grunt', 420, 214), mk('C', 'grunt', 520, 206), mk('D', 'grunt', 262, 150), mk('E', 'grunt', 190, 214), mk('Boss', 'boss', 360, 268));
      window.__step = k => { for (let i = 0; i < k; i++) { window.__t += 1000 / 60; if (window.__rec) window.__rec.frame++; window.__cb(window.__t); if (window.__rec) window.__rec.hero.push([Math.round(G.hero.x), Math.round(G.hero.y)]); } };
      window.__manual = true;
    });
    await p.waitForTimeout(100);
    await p.evaluate(() => { window.__t = performance.now(); window.__cb(window.__t); });
    const fx = (844 - 1280 * 390 / 720) / 2;
    const aim = await p.evaluate(n => { const sk = n === 2 ? G.country.skill2 : G.country.skill, k = (sk.mod || {}).k, h = G.hero;
      const by = { crack: 240, spinMove: 150, lob: 150, javelin3: 270 }; if (by[k]) return [h.x + by[k], h.y, sk.type, k];
      if (sk.type === 'area') return [h.x + 160, h.y, sk.type, k]; if (sk.type === 'zone') return [h.x + 160, h.y, sk.type, k]; if (sk.type === 'dash') return [h.x + 260, h.y, sk.type, k]; return [h.x + 340, h.y, sk.type, k]; }, n);
    await p.mouse.move(aim[0] + fx - 30, aim[1] + 5); await p.mouse.move(aim[0] + fx, aim[1]);
    // 기준: 쓰기 전 2초 (같은 외계인, 기본 공격 자동)
    await p.evaluate(() => { window.__rec = { frame: 0, path: {}, img: {}, draws: [], hero: [] }; __step(120); window.__base = window.__rec; window.__rec = null; });
    await p.evaluate(() => { const h = G.hero; h.x = 260; h.y = 210; h.dir = { x: 1, y: 0 }; G.shots = []; });
    await p.evaluate(() => { window.__rec = { frame: 0, path: {}, img: {}, draws: [], hero: [] }; });
    await p.keyboard.press(n === 2 ? 'Semicolon' : 'KeyL');
    const shots = [];
    for (const f of [6, 12, 24, 48]) { await p.evaluate(f => __step(f), f - (shots.length ? [6, 12, 24, 48][shots.length - 1] : 0)); }
    await p.evaluate(() => __step(150 - 48));
    const r = await p.evaluate(() => ({ ko: G.country.ko, key: G.country.key, base: window.__base, rec: window.__rec }));
    const baseKeys = new Set(Object.keys(r.base.path));
    const extra = Object.fromEntries(Object.entries(r.rec.path).filter(([k]) => !baseKeys.has(k)));
    const props = r.rec.draws.filter(d => d.cat === 'prop'), us = r.rec.draws.filter(d => d.cat === 'u'), seqs = r.rec.draws.filter(d => d.cat === 'seq');
    const perF = {}; props.forEach(d => perF[d.f] = (perF[d.f] || 0) + 1);
    const pf = Object.keys(perF).map(Number);
    const first = props.filter(d => d.f === Math.min(...pf)), lastF = Math.max(...pf);
    const row = { ci: ci + 1, n, ko: r.ko, key: r.key, type: aim[2], k: aim[3], extra, img: r.rec.img, baseImg: r.base.img,
      prop: props.length ? { files: [...new Set(props.map(d => d.file))], f0: Math.min(...pf), f1: lastF, maxCopies: Math.max(...Object.values(perF)), w: Math.max(...props.map(d => d.w)),
        start: [first[0].x, first[0].y], end: (props.filter(d => d.f === lastF)[0] || {}), rotSpan: +(Math.max(...props.map(d => d.rot)) - Math.min(...props.map(d => d.rot))).toFixed(2),
        minY: Math.min(...props.map(d => d.y)), path: props.filter((d, i, a) => a.findIndex(e => e.f === d.f) === i).filter((d, i) => i % 3 === 0).map(d => [d.f, d.x, d.y, d.rot]).slice(0, 30) } : null,
      u: us.length ? { files: [...new Set(us.map(d => d.file))], f0: Math.min(...us.map(d => d.f)), f1: Math.max(...us.map(d => d.f)) } : null,
      seq: seqs.length ? { files: [...new Set(seqs.map(d => d.file))], n: seqs.length } : null, hero: [r.rec.hero[0], r.rec.hero[20], r.rec.hero[60], r.rec.hero[149]], errs };
    res.push(row);
    console.log(`${row.ci} ${row.ko} ${n} ${row.type}/${row.k} | 코드도형(쓴 뒤만) ${Object.keys(extra).length ? JSON.stringify(extra) : '0'} | 소품 ${row.prop ? `${row.prop.files} f${row.prop.f0}-${row.prop.f1} 최대${row.prop.maxCopies}개 폭${row.prop.w} 회전폭${row.prop.rotSpan} ${JSON.stringify(row.prop.start)}→${JSON.stringify([row.prop.end.x, row.prop.end.y])}` : '없음'} | 대표 ${row.u ? `f${row.u.f0}-${row.u.f1}` : '없음'}${row.seq ? ' seq ' + row.seq.files : ''}${errs.length ? ' ERR ' + errs.join('|') : ''}`);
    await p.close();
  }
  fs.writeFileSync(`${OUT}/job11-${render}${only ? '-' + only.replace(/,/g, '_') : ''}.json`, JSON.stringify(res, null, 1)); await b.close();
})();
