// 공격 효과 14종 — teams/2-디자인/style-guide.md "공격 효과" (시안 preview/index.html 함수를 옮겼어요)
// 모양만 나라마다 달라요. 공격력·사거리·탄 속도는 모든 나라가 같아요 (balance.md).
(() => {
  const UI = window.UI;
  const GLOW = '#FFD166';
  const ease = p => 1 - Math.pow(1 - p, 3);
  function star(x, px, py, n, outer, inner, col) {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? inner : outer; x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); }
    x.closePath(); x.fillStyle = col; x.fill();
  }
  function arc(x, cx, cy, dir, p, R, spread, w, col) {
    if (p < 0 || p > 1) return;
    const a0 = dir - spread / 2, a1 = a0 + spread * ease(Math.min(1, p * 1.6)), fade = p < .6 ? 1 : 1 - (p - .6) / .4;
    x.save(); x.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      x.strokeStyle = i < 2 ? col : '#FFFFFF'; x.globalAlpha = fade * (i < 2 ? .35 : .9 - i * .12); x.lineWidth = w * (1 - i * .18);
      x.beginPath(); x.arc(cx, cy, R - i * w * .18, Math.max(a0, a1 - spread * .75), a1); x.stroke();
    }
    x.restore();
  }
  function thrust(x, cx, cy, dir, p, len, col, n = 1) {
    for (let k = 0; k < n; k++) {
      const q = p * n - k; if (q < 0 || q > 1) continue;
      const L = len * ease(Math.min(1, q * 1.8)), fade = q < .5 ? 1 : 1 - (q - .5) * 2, off = (k - (n - 1) / 2) * 6;
      const ex = cx + Math.cos(dir) * L - Math.sin(dir) * off, ey = cy + Math.sin(dir) * L + Math.cos(dir) * off;
      x.save(); x.globalAlpha = fade; x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round';
      x.beginPath(); x.moveTo(cx + Math.cos(dir) * 10 - Math.sin(dir) * off, cy + Math.sin(dir) * 10 + Math.cos(dir) * off); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = '#fff'; x.lineWidth = 2; x.stroke(); star(x, ex, ey, 4, 9, 2.5, '#FFFFFF'); x.restore();
    }
  }
  function smash(x, cx, cy, dir, p, col) {
    arc(x, cx, cy - 6, dir - Math.PI / 2.4, p * 1.3, 34, 1.9, 9, col);
    const q = (p - .3) / .7; if (q < 0 || q > 1) return;
    const gx = cx + Math.cos(dir) * 30, gy = cy + Math.sin(dir) * 14 + 12;
    x.save(); x.globalAlpha = 1 - q; x.strokeStyle = col; x.lineWidth = 4 * (1 - q) + 1;
    x.beginPath(); x.ellipse(gx, gy, 10 + q * 34, 4 + q * 12, 0, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 7; i++) { const a = -Math.PI * (i / 6), d = q * 26; UI.circ(gx + Math.cos(a) * d, gy + Math.sin(a) * d * .7 - q * 8, 2.2, '#B1A599'); }
    x.restore();
  }
  function spin(x, cx, cy, p, R, col) {
    if (p < 0 || p > 1) return;
    const fade = p < .6 ? 1 : 1 - (p - .6) / .4;
    x.save(); x.globalAlpha = fade;
    for (let i = 0; i < 3; i++) { x.strokeStyle = i ? '#fff' : col; x.lineWidth = 7 - i * 2; x.beginPath(); x.ellipse(cx, cy + 6, R, R * .45, 0, p * Math.PI * 4 - 1.8, p * Math.PI * 4); x.stroke(); }
    x.restore();
  }

  // 치기 6종: [길이(초), 그리기]
  const MELEE = {
    slash: [0.25, (x, cx, cy, d, p) => arc(x, cx, cy, d, p, 38, 2.2, 10, GLOW)],
    bigslash: [0.3, (x, cx, cy, d, p) => arc(x, cx, cy, d, p, 52, 3.0, 15, '#FFB45C')],
    smash: [0.35, (x, cx, cy, d, p) => smash(x, cx, cy, d, p, GLOW)],
    thrust: [0.2, (x, cx, cy, d, p) => thrust(x, cx, cy, d, p, 78, GLOW)],
    rapid: [0.3, (x, cx, cy, d, p) => thrust(x, cx, cy, d, p, 56, '#F2E3C6', 3)],
    spin: [0.3, (x, cx, cy, d, p) => spin(x, cx, cy, p, 40, GLOW)],
  };

  // 쏘기 8종: 날아가는 것 그리기 (dir = 날아가는 방향, t = 시간)
  const SHOT = {
    arrow(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-34, 0); x.lineTo(-12, 0); x.stroke(); x.strokeStyle = '#8A5A2B'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-12, 0); x.lineTo(10, 0); x.stroke(); x.fillStyle = '#D9D2C5'; x.beginPath(); x.moveTo(14, 0); x.lineTo(8, -3.5); x.lineTo(8, 3.5); x.fill(); x.fillStyle = '#F2E3C6'; x.fillRect(-13, -3, 5, 2); x.fillRect(-13, 1, 5, 2); x.restore(); },
    crossbow(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-26, 0); x.lineTo(-6, 0); x.stroke(); x.fillStyle = '#5A3429'; x.fillRect(-6, -2, 14, 4); x.fillStyle = '#C9C9C9'; x.beginPath(); x.moveTo(13, 0); x.lineTo(7, -4); x.lineTo(7, 4); x.fill(); x.restore(); },
    bullet(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); const g = x.createLinearGradient(-40, 0, 4, 0); g.addColorStop(0, 'rgba(255,209,102,0)'); g.addColorStop(1, 'rgba(255,240,190,.95)'); x.strokeStyle = g; x.lineWidth = 3; x.beginPath(); x.moveTo(-40, 0); x.lineTo(2, 0); x.stroke(); UI.circ(3, 0, 2.8, '#FFF3C4'); x.restore(); },
    beam(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.lineCap = 'round'; x.strokeStyle = '#5BC8FF'; x.lineWidth = 8; x.shadowColor = '#5BC8FF'; x.shadowBlur = 14; x.beginPath(); x.moveTo(-46, 0); x.lineTo(6, 0); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 3; x.shadowBlur = 0; x.stroke(); x.restore(); },
    axe(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 22); x.fillStyle = '#6B4A2E'; x.fillRect(-1.5, -11, 3, 22); x.fillStyle = '#C9CDD3'; x.beginPath(); x.moveTo(1, -11); x.quadraticCurveTo(13, -6, 9, 4); x.lineTo(1, -3); x.fill(); x.restore(); },
    spear(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = '#6B4A2E'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-30, 0); x.lineTo(8, 0); x.stroke(); x.fillStyle = '#D9D2C5'; x.beginPath(); x.moveTo(18, 0); x.lineTo(7, -4); x.lineTo(7, 4); x.fill(); x.restore(); },
    boomerang(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 26); x.strokeStyle = '#C9A24A'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(0, 6, 11, -2.6, -.5); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.stroke(); x.restore(); },
    sling(x, px, py) { UI.circ(px, py, 4.5, '#8E8A84', '#3A3632', 1.5); },
    // ↓ 던지는 무기 (사용자 결정: 활·총·투석기가 없는 나라는 든 무기가 날아가요). 7차 무기 그림이 오면 그 그림으로 바뀌어요
    blade(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 20); trail(x); x.fillStyle = '#D9DDE3'; x.beginPath(); x.moveTo(-4, -2); x.lineTo(20, -1.5); x.lineTo(24, 0); x.lineTo(20, 1.5); x.lineTo(-4, 2); x.fill(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = .8; x.beginPath(); x.moveTo(-3, 0); x.lineTo(21, 0); x.stroke(); x.fillStyle = '#C9A24A'; x.fillRect(-6, -6, 3, 12); x.fillStyle = '#5A3429'; x.fillRect(-14, -1.8, 8, 3.6); x.restore(); },
    mace(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 18); trail(x); x.fillStyle = '#6B4A2E'; x.fillRect(-14, -1.8, 20, 3.6); x.fillStyle = '#8E949C'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(10 + Math.cos(a) * 5, Math.sin(a) * 5); x.lineTo(10 + Math.cos(a) * 9, Math.sin(a) * 9); x.lineTo(10 + Math.cos(a + .4) * 5, Math.sin(a + .4) * 5); x.fill(); } UI.circ(10, 0, 5.5, '#B4BAC2', '#3A3632', 1); x.restore(); },
    polearm(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-60, 0); x.lineTo(-36, 0); x.stroke(); x.strokeStyle = '#6B4A2E'; x.lineWidth = 3; x.beginPath(); x.moveTo(-36, 0); x.lineTo(10, 0); x.stroke(); x.fillStyle = '#D9DDE3'; x.beginPath(); x.moveTo(24, 0); x.lineTo(9, -4.5); x.lineTo(9, 4.5); x.fill(); x.restore(); },
  };
  SHOT.axe = ((orig) => (x, px, py, dir, t) => { x.save(); x.translate(px, py); trail(x); x.restore(); orig(x, px, py, dir, t); })(SHOT.axe);
  // 회전하며 날아가는 무기 뒤 옅은 원 궤적
  function trail(x) { x.save(); x.strokeStyle = 'rgba(255,224,138,.35)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 1.3); x.stroke(); x.restore(); }
  const SPIN = { blade: 20, axe: 22, mace: 18, boomerang: 26 };

  function muzzle(x, px, py, dir, q) {
    if (q < 0 || q > .35) return;
    const f = 1 - q / .35;
    x.save(); x.globalAlpha = f; star(x, px, py, 6, 13 * f + 4, 4, '#FFB45C'); star(x, px, py, 6, 7 * f + 2, 2, '#FFF3C4'); x.restore();
    x.save(); x.globalAlpha = .5 * f; for (let i = 0; i < 3; i++) UI.circ(px - Math.cos(dir) * (4 + i * 5) + (i - 1) * 3, py - 6 - i * 4 - q * 20, 5 + i * 2 + q * 10, 'rgba(177,165,153,.6)'); x.restore();
  }
  // 맞음: 흰 별 + 외계인 색 파편 6개
  function hit(x, px, py, q, col) {
    if (q < 0 || q > 1) return;
    x.save(); x.globalAlpha = 1 - q; star(x, px, py, 4, 12 + q * 10, 3, '#fff');
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; UI.circ(px + Math.cos(a) * q * 22, py + Math.sin(a) * q * 22, 2.4, col); }
    x.restore();
  }

  window.FX = {
    MELEE, SHOT, muzzle, hit,
    meleeTime: kind => (MELEE[kind] || MELEE.slash)[0],
    drawMelee(kind, cx, cy, dir, p) { (MELEE[kind] || MELEE.slash)[1](UI.x, cx, cy, dir, p); },
    THROWN: k => k === 'blade' || k === 'axe' || k === 'mace' || k === 'polearm',
    drawShot(kind, px, py, dir, t, key) {
      // 7차 무기 그림(weapon/<나라>.webp: 무기만, +x 방향, 손잡이 끝 = 왼쪽 가운데)이 있으면 그 그림을 날려요
      const im = key && FX.THROWN(kind) && UI.img['weapon/' + key];
      if (im && im.naturalWidth) {
        const x = UI.x, w = 40, h = w * im.naturalHeight / im.naturalWidth;
        x.save(); x.translate(px, py); x.rotate(kind === 'polearm' ? dir : t * SPIN[kind]); x.drawImage(im, -w / 2, -h / 2, w, h); x.restore();
        return;
      }
      (SHOT[kind] || SHOT.arrow)(UI.x, px, py, dir, t);
    },
  };
})();
