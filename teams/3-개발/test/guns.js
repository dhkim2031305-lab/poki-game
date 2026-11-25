const { chromium } = require('playwright');
(async () => { const S = process.argv[2]; const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 520, height: 200 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8080/web/'); await p.waitForFunction(() => window.G && G.scene === 'title');
  await p.evaluate(() => { G.scene = 'loading_test'; });
  await p.waitForTimeout(100);
  await p.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1040; c.height = 400; c.style.cssText = 'position:fixed;left:0;top:0;width:520px;height:200px;z-index:9'; document.body.appendChild(c); const x = c.getContext('2d'); window.__keep = UI.x; x.setTransform(2, 0, 0, 2, 0, 0); UI.x = x;
    x.fillStyle = '#35343D'; x.fillRect(0, 0, 520, 200);
    ['usa', 'finland'].forEach((k, r) => {
      x.fillStyle = '#F2E3C6'; x.font = '12px sans-serif'; x.fillText(k, 6, 50 + r * 90);
      [0, Math.PI / 4, Math.PI / 2, Math.PI * .75, Math.PI, -Math.PI / 2].forEach((a, i) => {
        const cx = 90 + i * 72, cy = 50 + r * 90; UI.circ(cx, cy, 2.5, '#FF4FD8');   // 분홍 점 = 회전 중심(손)
        FX.drawGun(k, cx, cy, a, Math.cos(a) < 0);
      });
    });
    UI.x = window.__keep;
  });
  await p.screenshot({ path: `${S}/shots/guns.png` }); await b.close(); })();
