// 외침 목소리 자리 (사용자 "만들어" 2026-11-26): 파일 없음 → 조용히 넘어감 · 파일 있음 → 재생 + 배경음 덕킹 (node voice.js)
// 파일 있음 검사는 잠깐 src/assets/sound/shout/에 시험 mp3를 만들었다 지워요
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const out = [];
  const run = async () => {
    const p = await (await b.newContext({ viewport: { width: 844, height: 390 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8080/web/?render=2d'); await p.waitForFunction(() => window.G && G.scene === 'title');
    await p.mouse.click(400, 200); await p.evaluate(() => { G.scene = 'select'; G.sel = 0; }); await p.keyboard.press('Enter'); await p.waitForFunction(() => G.scene === 'play'); await p.waitForTimeout(600);
    const info = await p.evaluate(() => ({ c: G.country.key, r: G.country.rank }));
    const r = await p.evaluate(async () => { const v = `assets/sound/shout/${String(G.country.rank).padStart(2, '0')}-${G.country.key}-1.mp3`; const ok = await AUDIO.voice(v); return { ok, msgs: G.msgs.length }; });
    await p.keyboard.press('KeyL'); await p.waitForTimeout(300);   // 실제 스킬 쓰기 (외침 글자는 그대로 나와야)
    const shout = await p.evaluate(() => G.msgs.some(m => m.shout));
    await p.close(); return { ...info, ...r, shout, errs };
  };
  let r = await run(); out.push(`파일 없음: ${r.c}(${r.r}) voice → ${r.ok} · 외침 글자 ${r.shout ? 'O' : 'X'} · errors ${r.errs.length ? r.errs.join('|') : 'none'}`);
  const dir = path.join(__dirname, '../../../src/assets/sound/shout'), f = path.join(dir, `${String(r.r).padStart(2, '0')}-${r.c}-1.mp3`), made = !fs.existsSync(f);
  if (made) { fs.mkdirSync(dir, { recursive: true }); execSync(`ffmpeg -loglevel error -f lavfi -i sine=frequency=440:duration=0.5 -b:a 32k "${f}"`); }
  try { r = await run(); out.push(`파일 있음: voice → ${r.ok} · 외침 글자 ${r.shout ? 'O' : 'X'} · errors ${r.errs.length ? r.errs.join('|') : 'none'}`); }
  finally { if (made) { fs.unlinkSync(f); try { fs.rmdirSync(dir); fs.rmdirSync(path.dirname(dir)); } catch {} } }
  console.log(out.join('\n')); await b.close(); })();
