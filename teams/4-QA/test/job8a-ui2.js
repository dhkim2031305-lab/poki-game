const { chromium } = require('playwright'); const DIST='/home/user/poki-game/dist';
(async()=>{ const b=await chromium.launch();
 const st=p=>p.evaluate(()=>{const rt=document.getElementById('rt');return rt.hidden?'숨김':'보임'});
 {const p=await (await b.newContext({viewport:{width:844,height:390}})).newPage(); await p.goto('file://'+DIST+'/single-preview.html'); await p.waitForFunction(()=>window.G&&G.scene==='title');
  for(let i=0;i<5;i++){await p.mouse.click(15,15);await p.waitForTimeout(450);} console.log('5번 0.5초 간격(2초+):',await st(p));
  await p.waitForTimeout(2000); for(let i=0;i<5;i++){await p.mouse.click(60,15);await p.waitForTimeout(100);} console.log('40px 밖에서 5번:',await st(p));
  await p.waitForTimeout(2000); for(let i=0;i<5;i++){await p.mouse.click(15,15);await p.waitForTimeout(100);} console.log('5번 빠르게:',await st(p), 'scene',await p.evaluate(()=>G.scene));}
 for (const FAILS of [3,6]) { const ctx=await b.newContext({viewport:{width:844,height:390},hasTouch:true}); const p=await ctx.newPage();
  await p.addInitScript(F=>{window.__rej=[];window.__resume=0;window.__log=[];addEventListener('unhandledrejection',e=>__rej.push(String(e.reason&&e.reason.message)));const AC=window.AudioContext,st=new WeakMap();
   Object.defineProperty(AC.prototype,'state',{configurable:true,get(){return st.get(this)||'suspended'}});
   AC.prototype.resume=function(){__resume++; if(__resume<=F) return Promise.reject(new DOMException('Failed to start the audio device','InvalidStateError')); st.set(this,'running'); return Promise.resolve();};},FAILS);
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(()=>window.G&&G.scene==='title');
  const r=[]; for(let i=0;i<4;i++){await p.touchscreen.tap(420,250); await p.waitForTimeout(400); r.push(await p.evaluate(()=>[__resume, AUDIO.musicKey&&AUDIO.musicKey(), G.scene]));}
  console.log(`resume 처음 ${FAILS}번 실패: 톡마다 [누적 resume, 음악, 장면]`, JSON.stringify(r), '처리 안 된 Promise', await p.evaluate(()=>__rej.length)); await ctx.close(); }
 await b.close();})();
