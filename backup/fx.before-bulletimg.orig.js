// 공격 효과 14종 — teams/2-디자인/style-guide.md "공격 효과" (시안 preview/index.html 함수를 옮겼어요)
// 모양만 나라마다 달라요. 공격력·사거리·탄 속도는 모든 나라가 같아요 (balance.md).
(() => {
  const UI = window.UI;
  const GLOW = '#C9CED6';   // 우리 공격 효과: 흰 + 강철 은색 #C9CED6 / 옅은 금 #E8D9A8 한 계열 (style-guide "이펙트 색 규칙")
  const PALE = 'rgba(232,217,168,';
  const ease = p => 1 - Math.pow(1 - p, 3);
  function star(x, px, py, n, outer, inner, col) {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? inner : outer; x.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r); }
    x.closePath(); x.fillStyle = col; x.fill();
  }
  // 베기 호: 칼날 모양 초승달. 앞(칼끝)이 두껍고 뒤로 갈수록 가늘어지는 잔상 + 빛 더하기
  // p: 0~0.45 빠른 스윙(이징), 0.45~1 마무리(잔상이 칼끝 쪽으로 줄며 사라짐)
  function crescent(x, cx, cy, from, to, R, w, alpha, fill) {
    const n = 18, span = to - from; if (Math.abs(span) < .01) return;
    x.beginPath();
    for (let i = 0; i <= n; i++) { const a = from + span * i / n; x.lineTo(cx + Math.cos(a) * (R + w * .5), cy + Math.sin(a) * (R + w * .5) * .82); }
    for (let i = n; i >= 0; i--) { const a = from + span * i / n, th = w * Math.pow(i / n, .8); x.lineTo(cx + Math.cos(a) * (R + w * .5 - th), cy + Math.sin(a) * (R + w * .5 - th) * .82); }
    x.closePath(); x.globalAlpha = alpha; x.fillStyle = fill; x.fill();
  }
  function arc(x, cx, cy, dir, p, R, spread, w, col) {
    if (p < 0 || p > 1) return;
    const sw = Math.min(1, p / .45), head = dir - spread / 2 + spread * ease(sw);
    const tail = p < .45 ? Math.max(dir - spread / 2, head - spread * .85) : head - spread * .85 * (1 - (p - .45) / .55);
    const fade = p < .45 ? 1 : 1 - (p - .45) / .55;
    x.save(); x.globalCompositeOperation = 'lighter';
    const RR = R + 8;
    crescent(x, cx, cy, tail, head, RR + 2, w * 1.6, .18 * fade, col);         // 바깥 빛
    crescent(x, cx, cy, tail, head, RR, w * 1.1, .85 * fade, col);             // 칼날 빛
    crescent(x, cx, cy, tail + (head - tail) * .3, head, RR - w * .1, w * .5, fade, '#FFFFFF'); // 흰 심
    x.restore();
    if (p < .5) { const hx = cx + Math.cos(head) * (R + 8), hy = cy + Math.sin(head) * (R + 8) * .82; x.save(); x.globalCompositeOperation = 'lighter'; star(x, hx, hy, 4, 6 * fade + 2, 2, '#FFFFFF'); x.restore(); }
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
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';   // 다른 효과처럼 은은하게 (빛 더하기, 얇게)
    for (let i = 0; i < 3; i++) { x.globalAlpha = fade * [.25, .45, .7][i]; x.strokeStyle = i === 2 ? '#fff' : col; x.lineWidth = [6, 3.5, 1.5][i]; x.beginPath(); x.ellipse(cx, cy + 6, R, R * .45, 0, p * Math.PI * 4 - 1.6, p * Math.PI * 4); x.stroke(); }
    x.restore();
  }

  // 치기 6종: [길이(초), 그리기]
  const MELEE = {
    slash: [0.25, (x, cx, cy, d, p) => arc(x, cx, cy, d, p, 38, 2.2, 10, GLOW)],
    bigslash: [0.3, (x, cx, cy, d, p) => arc(x, cx, cy, d, p, 52, 3.0, 15, GLOW)],
    smash: [0.35, (x, cx, cy, d, p) => smash(x, cx, cy, d, p, GLOW)],
    thrust: [0.2, (x, cx, cy, d, p) => thrust(x, cx, cy, d, p, 78, GLOW)],
    rapid: [0.3, (x, cx, cy, d, p) => thrust(x, cx, cy, d, p, 56, GLOW, 3)],
    spin: [0.3, (x, cx, cy, d, p) => spin(x, cx, cy, p, 40, GLOW)],
  };

  // 쏘기 8종: 날아가는 것 그리기 (dir = 날아가는 방향, t = 시간)
  const SHOT = {
    // 스위스 2 꿰뚫는 찌르기: 길고 가는 직선 빛
    lance(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      const g = x.createLinearGradient(-56, 0, 10, 0); g.addColorStop(0, PALE + '0)'); g.addColorStop(1, 'rgba(255,255,255,.95)'); x.strokeStyle = g; x.lineWidth = 3; x.beginPath(); x.moveTo(-56, 0); x.lineTo(10, 0); x.stroke();
      x.strokeStyle = GLOW; x.lineWidth = 1; x.beginPath(); x.moveTo(-40, -3); x.lineTo(4, -1); x.moveTo(-40, 3); x.lineTo(4, 1); x.stroke(); x.restore(); },
    // 네덜란드 1 마지막 찌르기: 굵은 빛 + 별빛
    star(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      x.strokeStyle = PALE + '.8)'; x.lineWidth = 7; x.beginPath(); x.moveTo(-34, 0); x.lineTo(8, 0); x.stroke(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 3; x.stroke();
      star(x, 10, 0, 4, 11, 3, '#FFFFFF'); x.restore(); },
    // 충격파 (체코 도리깨, 사용자 확정): 땅을 따라 나가는 은빛 물결 — 바닥 높이에 납작하게 (FX.flat = 바닥 원 납작 비율)
    quake(x, px, py, dir, t) {
      const fl = Math.max(.55, FX.flat || .35), k = Math.min(1, t / .62);   // 둥근 물결이 ">"로 보이지 않게: 크게·넓게·덜 납작하게 (QA M6)
      x.save(); x.translate(px, py); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const r = 26 + i * 11 + k * 14, a = .95 - i * .22;
        x.globalAlpha = a * (1 - k * .45); x.strokeStyle = i === 1 ? PALE + '.9)' : i ? GLOW : '#FFFFFF'; x.lineWidth = 5 - i * 1.3;
        x.beginPath(); x.ellipse(-i * 10 * Math.cos(dir) - 14 * Math.cos(dir), (-i * 10 - 14) * Math.sin(dir) * fl, r, r * fl, 0, dir - 1.45, dir + 1.45); x.stroke();
      }
      x.globalAlpha = .7 * (1 - k); x.fillStyle = '#B1A599';   // 튀는 흙
      for (let i = 0; i < 7; i++) { const a = dir + (i - 3) * .3, r = 24 + ((t * 70 + i * 5) % 12); x.fillRect(Math.cos(a) * r - 1, Math.sin(a) * r * fl - 3 - ((t * 40 + i * 3) % 5), 2.2, 2.2); }
      x.restore();
    },
    // 검기 (검 나라 쏘기, 사용자 확정): 초승달 은빛 — 흰 가운데 + 은 #C9CED6 / 옅은 금 테두리, 날아가며 조금 커져요
    wave(x, px, py, dir, t) {
      const k = 1 + Math.min(.35, t * 1.2), R = 15 * k;
      x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter';
      const moon = (r, w, col, a) => { x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.arc(-r * .55, 0, r, -1.25, 1.25); x.arc(-r * .55 - w, 0, r * .92, 1.18, -1.18, true); x.closePath(); x.fill(); };
      moon(R * 1.18, R * .5, PALE + '.55)', .55);      // 바깥 옅은 금 빛
      moon(R, R * .38, GLOW, .85);                      // 은빛 날
      moon(R * .9, R * .2, '#FFFFFF', .95);             // 흰 가운데
      x.globalAlpha = .35; x.strokeStyle = GLOW; x.lineWidth = 1.5; for (const o of [-6, 6]) { x.beginPath(); x.moveTo(-R * 1.6, o * k * .7); x.lineTo(-R * .7, o * k * .55); x.stroke(); }   // 뒤 바람 줄
      x.restore();
    },
    // 스킬 연사(검·창 나라): 짧은 빛줄기 — 흰 머리 + 옅은 금 꼬리 (style-guide "스킬 5유형")
    streak(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      const g = x.createLinearGradient(-30, 0, 6, 0); g.addColorStop(0, PALE + '0)'); g.addColorStop(.6, PALE + '.7)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
      x.strokeStyle = g; x.lineWidth = 4; x.beginPath(); x.moveTo(-30, 0); x.lineTo(6, 0); x.stroke(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-8, 0); x.lineTo(6, 0); x.stroke(); x.restore(); },
    arrow(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-34, 0); x.lineTo(-12, 0); x.stroke(); x.strokeStyle = '#8A5A2B'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-12, 0); x.lineTo(10, 0); x.stroke(); x.fillStyle = '#D9D2C5'; x.beginPath(); x.moveTo(14, 0); x.lineTo(8, -3.5); x.lineTo(8, 3.5); x.fill(); x.fillStyle = '#F2E3C6'; x.fillRect(-13, -3, 5, 2); x.fillRect(-13, 1, 5, 2); x.restore(); },
    crossbow(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-26, 0); x.lineTo(-6, 0); x.stroke(); x.fillStyle = '#5A3429'; x.fillRect(-6, -2, 14, 4); x.fillStyle = '#C9C9C9'; x.beginPath(); x.moveTo(13, 0); x.lineTo(7, -4); x.lineTo(7, 4); x.fill(); x.restore(); },
    // 총알 (style-guide "미국 공격 고치기 + 총알 모양"): 핀란드 = 금빛 탄두 4×3 + 옅은 금 예광 18px
    bullet(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.lineCap = 'round';
      const g = x.createLinearGradient(-18, 0, 0, 0); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(1, 'rgba(255,230,160,.85)'); x.strokeStyle = g; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-18, 0); x.lineTo(0, 0); x.stroke();
      x.fillStyle = '#FFE6A0'; x.beginPath(); x.ellipse(0, 0, 2, 1.5, 0, 0, Math.PI * 2); x.fill(); x.restore(); },
    // 미국 에너지탄 = 흰 탄두 6×4 + 하늘색 빛무리 지름 9 + 하늘색 꼬리 24px (뒤로 갈수록 가늘고 투명)
    beam(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter';
      x.fillStyle = 'rgba(95,180,238,.55)'; x.beginPath(); x.moveTo(0, -2.6); x.lineTo(-24, -.3); x.lineTo(-24, .3); x.lineTo(0, 2.6); x.closePath();
      const g = x.createLinearGradient(-24, 0, 0, 0); g.addColorStop(0, 'rgba(95,180,238,0)'); g.addColorStop(1, 'rgba(95,180,238,.8)'); x.fillStyle = g; x.fill();
      const h = x.createRadialGradient(0, 0, 0, 0, 0, 4.5); h.addColorStop(0, 'rgba(95,180,238,.9)'); h.addColorStop(1, 'rgba(95,180,238,0)'); x.fillStyle = h; x.beginPath(); x.arc(0, 0, 4.5, 0, Math.PI * 2); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#FFFFFF'; x.beginPath(); x.ellipse(0, 0, 3, 2, 0, 0, Math.PI * 2); x.fill(); x.restore(); },
    axe(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 22); x.fillStyle = '#6B4A2E'; x.fillRect(-1.5, -11, 3, 22); x.fillStyle = '#C9CDD3'; x.beginPath(); x.moveTo(1, -11); x.quadraticCurveTo(13, -6, 9, 4); x.lineTo(1, -3); x.fill(); x.restore(); },
    spear(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = '#6B4A2E'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-30, 0); x.lineTo(8, 0); x.stroke(); x.fillStyle = '#D9D2C5'; x.beginPath(); x.moveTo(18, 0); x.lineTo(7, -4); x.lineTo(7, 4); x.fill(); x.restore(); },
    boomerang(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 26); x.strokeStyle = '#C9A24A'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.arc(0, 6, 11, -2.6, -.5); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.stroke(); x.restore(); },
    // (안 씀) 장난감 물총 — 사용자가 취소 ("물총 무시하고 코드로 그려"). 다시 쓸 수 있게 남겨 둬요
    water(x, px, py, dir, t) {
      x.save(); x.translate(px, py); x.rotate(dir);
      const g = x.createLinearGradient(-34, 0, 4, 0); g.addColorStop(0, 'rgba(120,200,255,0)'); g.addColorStop(1, 'rgba(150,215,255,.85)');
      x.strokeStyle = g; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-34, 0); x.lineTo(0, 0); x.stroke();
      for (let i = 1; i <= 3; i++) UI.circ(-8 - i * 9, Math.sin(t * 30 + i * 2) * 3, 2.2 - i * .4, 'rgba(200,235,255,.8)');
      x.beginPath(); x.ellipse(2, 0, 6.5, 4.5, 0, 0, Math.PI * 2); x.fillStyle = '#5BC0FF'; x.fill(); x.strokeStyle = '#2C7FC4'; x.lineWidth = 1; x.stroke();
      UI.circ(3.5, -1.6, 1.8, '#FFFFFF'); x.restore();
    },
    sling(x, px, py) { UI.circ(px, py, 4.5, '#8E8A84', '#3A3632', 1.5); },
    // ↓ 던지는 무기 (사용자 결정: 활·총·투석기가 없는 나라는 든 무기가 날아가요). 7차 무기 그림이 오면 그 그림으로 바뀌어요
    blade(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 20); trail(x); x.fillStyle = '#D9DDE3'; x.beginPath(); x.moveTo(-4, -2); x.lineTo(20, -1.5); x.lineTo(24, 0); x.lineTo(20, 1.5); x.lineTo(-4, 2); x.fill(); x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = .8; x.beginPath(); x.moveTo(-3, 0); x.lineTo(21, 0); x.stroke(); x.fillStyle = '#C9A24A'; x.fillRect(-6, -6, 3, 12); x.fillStyle = '#5A3429'; x.fillRect(-14, -1.8, 8, 3.6); x.restore(); },
    mace(x, px, py, dir, t) { x.save(); x.translate(px, py); x.rotate(t * 18); trail(x); x.fillStyle = '#6B4A2E'; x.fillRect(-14, -1.8, 20, 3.6); x.fillStyle = '#8E949C'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.moveTo(10 + Math.cos(a) * 5, Math.sin(a) * 5); x.lineTo(10 + Math.cos(a) * 9, Math.sin(a) * 9); x.lineTo(10 + Math.cos(a + .4) * 5, Math.sin(a + .4) * 5); x.fill(); } UI.circ(10, 0, 5.5, '#B4BAC2', '#3A3632', 1); x.restore(); },
    polearm(x, px, py, dir) { x.save(); x.translate(px, py); x.rotate(dir); x.strokeStyle = 'rgba(255,255,255,.3)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-60, 0); x.lineTo(-36, 0); x.stroke(); x.strokeStyle = '#6B4A2E'; x.lineWidth = 3; x.beginPath(); x.moveTo(-36, 0); x.lineTo(10, 0); x.stroke(); x.fillStyle = '#D9DDE3'; x.beginPath(); x.moveTo(24, 0); x.lineTo(9, -4.5); x.lineTo(9, 4.5); x.fill(); x.restore(); },
  };
  SHOT.axe = ((orig) => (x, px, py, dir, t) => { x.save(); x.translate(px, py); trail(x); x.restore(); orig(x, px, py, dir, t); })(SHOT.axe);
  // 회전하며 날아가는 무기 뒤 옅은 원 궤적
  function trail(x) { x.save(); x.strokeStyle = PALE + '.25)'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 1.3); x.stroke(); x.restore(); }
  const SPIN = { blade: 20, axe: 22, mace: 18, boomerang: 26 };

  // 물보라: 맞거나 사라질 때 파랑·흰 물방울이 튀어요
  function splash(x, px, py, q) {
    if (q < 0 || q > 1) return;
    x.save(); x.globalAlpha = 1 - q;
    x.strokeStyle = 'rgba(150,215,255,.9)'; x.lineWidth = 2; x.beginPath(); x.ellipse(px, py + 4, 6 + q * 16, 2 + q * 6, 0, 0, Math.PI * 2); x.stroke();
    for (let i = 0; i < 8; i++) { const a = -Math.PI * (i / 7) - .1, d = 6 + q * 20; UI.circ(px + Math.cos(a) * d, py + Math.sin(a) * d * .8 + q * q * 14, 2.4 - q, i % 2 ? '#FFFFFF' : '#5BC0FF'); }
    x.restore();
  }
  function muzzle(x, px, py, dir, q, key) {
    if (key === 'usa') {   // 하늘색 별 4갈래 14px + 흰 점, 0.035초
      if (q < 0 || q > .035) return; x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter'; star(x, 0, 0, 4, 7, 1.8, '#5FB4EE'); UI.circ(0, 0, 2, '#FFFFFF'); x.restore(); return;
    }
    if (key === 'finland') {   // 옅은 금 3갈래 불꽃 10px 0.04초 + 회색 연기 한 줌 0.4초
      if (q < 0 || q > .4) return;
      if (q < .04) { x.save(); x.translate(px, py); x.rotate(dir); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,230,160,.95)';
        for (const a of [-.45, 0, .45]) { x.beginPath(); x.moveTo(0, -1.4); x.lineTo(Math.cos(a) * (a ? 7 : 10), Math.sin(a) * (a ? 7 : 10)); x.lineTo(0, 1.4); x.fill(); } x.restore(); }
      const f = 1 - q / .4; x.save(); x.globalAlpha = .45 * f; UI.circ(px + Math.cos(dir) * 4 * q / .4, py - 3 - q * 14, 3 + q * 12, 'rgba(160,160,160,.7)'); x.restore(); return;
    }
    if (q < 0 || q > .35) return;
    const f = 1 - q / .35;
    x.save(); x.globalAlpha = f; star(x, px, py, 6, 7 * f + 2, 2.5, GLOW); star(x, px, py, 6, 4 * f + 1, 1.5, '#FFFFFF'); x.restore();
    x.save(); x.globalAlpha = .5 * f; for (let i = 0; i < 3; i++) UI.circ(px - Math.cos(dir) * (4 + i * 5) + (i - 1) * 3, py - 6 - i * 4 - q * 20, 5 + i * 2 + q * 10, 'rgba(177,165,153,.6)'); x.restore();
  }
  // 맞음: 흰 별 + 외계인 색 파편 6개
  // 타격 섬광: 둥근 빛 + 큰 흰 별 + 공격 방향으로 튀는 줄 3개 + 외계인 색 파편
  // 총알 맞음: 미국 = 하늘색 튀김 원(3→8px, 0.12초) + 빨강 점 3개 · 핀란드 = 금빛 튀김 + 불꽃 점 3개
  function gunHit(x, px, py, q, key, dir = 0) {
    if (q < 0 || q > 1) return; const f = 1 - q, usa = key === 'usa';
    x.save(); x.globalAlpha = f; x.strokeStyle = usa ? '#5FB4EE' : '#FFE6A0'; x.lineWidth = 2; x.beginPath(); x.arc(px, py, 3 + 5 * q, 0, Math.PI * 2); x.stroke();
    for (let i = -1; i <= 1; i++) { const a = dir + Math.PI + i * .7, d = 4 + q * 10; UI.circ(px + Math.cos(a) * d, py + Math.sin(a) * d + q * q * 4, 1.3, usa ? '#F2452E' : '#FFB347'); }
    x.restore();
  }
  function hit(x, px, py, q, col, dir = 0, big) {
    if (q < 0 || q > 1) return;
    const s = big ? 1.5 : 1, f = 1 - q;
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(px, py, 0, px, py, 9 * s); g.addColorStop(0, PALE + (.4 * f) + ')'); g.addColorStop(1, PALE + '0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, 9 * s, 0, Math.PI * 2); x.fill();
    x.globalAlpha = f; star(x, px, py, 4, (6 + q * 4) * s, 1.5, '#FFFFFF');
    x.strokeStyle = GLOW; x.lineWidth = 1.5 * f + .5; x.lineCap = 'round';
    for (let i = -1; i <= 1; i++) { const a = dir + i * .5, r0 = 6 + q * 8, r1 = r0 + 5 * f * s; x.beginPath(); x.moveTo(px + Math.cos(a) * r0, py + Math.sin(a) * r0); x.lineTo(px + Math.cos(a) * r1, py + Math.sin(a) * r1); x.stroke(); }
    x.restore();
    x.save(); x.globalAlpha = f;
    for (let i = 0; i < 4; i++) { const a = dir + (i - 1.5) * .55, d = q * 18 * s; UI.circ(px + Math.cos(a) * d, py + Math.sin(a) * d + q * q * 8, 1.6 * f + .4, col); }   // 외계인 색 하나만, 4개
    x.restore();
  }

  // 손에 드는 총 2종 (사용자 결정: 그림 대신 코드로). 7차 weapon 규칙과 같게
  // 원점 = 손잡이 끝(왼쪽 가운데), +x 방향, 길이 약 44px. 8방향 작업 때 손 위치에 붙여 각도대로 돌려요
  const GUN = {
    // 미국: 미래형 에너지 소총 (남색 몸통 · 빨강 줄 · 흰 별 · 하늘색 에너지 칸)
    usa(x) {
      x.save(); x.lineJoin = 'round';
      x.fillStyle = '#1F2E5C'; x.beginPath(); x.moveTo(0, -3); x.lineTo(12, -5); x.lineTo(30, -5); x.lineTo(36, -3); x.lineTo(36, 3); x.lineTo(14, 4); x.lineTo(10, 9); x.lineTo(5, 9); x.lineTo(6, 4); x.lineTo(0, 3); x.closePath(); x.fill();
      x.strokeStyle = '#0E1530'; x.lineWidth = 1; x.stroke();
      x.fillStyle = '#C8283A'; x.fillRect(12, -1.2, 22, 2.4);
      x.fillStyle = '#E8EEF8'; x.fillRect(36, -2, 8, 4); x.fillStyle = '#7FD8FF'; x.fillRect(40, -1.2, 5, 2.4);
      x.fillStyle = '#5BC8FF'; x.fillRect(16, -4.2, 10, 2);
      star(x, 9, -1, 5, 2.6, 1.1, '#FFFFFF');
      x.restore();
    },
    // 핀란드: 나무 개머리판 + 금속 총열 소총
    finland(x) {
      x.save(); x.lineJoin = 'round';
      x.fillStyle = '#8A5A2B'; x.beginPath(); x.moveTo(0, -3.5); x.lineTo(14, -2.5); x.lineTo(28, -2.5); x.lineTo(28, 2.5); x.lineTo(14, 2.5); x.lineTo(8, 5.5); x.lineTo(0, 4); x.closePath(); x.fill();
      x.strokeStyle = '#4A2E14'; x.lineWidth = 1; x.stroke();
      x.fillStyle = '#5A3A1C'; x.fillRect(2, -1, 8, 2);
      x.fillStyle = '#3A3E44'; x.fillRect(14, -4, 10, 2.5); x.fillRect(24, -1.6, 22, 3.2);
      x.fillStyle = '#8E949C'; x.fillRect(24, -1.6, 22, 1); x.fillRect(44, -3, 2, 1.5);
      x.fillStyle = '#2A2C30'; x.fillRect(17, 2, 2, 4);
      x.restore();
    },
  };

  // 8차 이펙트 그림 (src/assets/fx/*.webp: 칸 80×80, 왼쪽부터 발생→최대→소멸, +x 방향) — 빛 더하기로 그려요
  const SHEET_N = { slash: 6, thrust: 6, smash: 6, hit: 6, death: 8 };
  // 사격 외계인용 초록 시트는 한 번만 변환해 둬요 (매 프레임 hue-rotate 비용을 없애요)
  const greenCache = {};
  function greenOf(name, im) {
    if (greenCache[name]) return greenCache[name];
    return (greenCache[name] = UI.hueRotate(im, -150));   // filter가 없는 iOS에선 픽셀로 바꿔요
  }
  function sheet(name, p, cx, cy, ang, size, alpha = 1, green) {
    let im = UI.img['fx/' + name]; if (!im || !im.naturalWidth || p < 0 || p >= 1) return false;
    if (green) im = greenOf(name, im);
    const n = SHEET_N[name], cw = im.naturalWidth / n, f = Math.min(n - 1, Math.floor(p * n)), x = UI.x;
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = alpha; x.translate(cx, cy); x.rotate(ang);
    x.drawImage(im, f * cw, 0, cw, im.naturalHeight, -size / 2, -size / 2, size, size); x.restore();
    return true;
  }
  // 치기 종류 → 그림 (디자인팀 d2c56fb): 베기 = slash, 큰 베기 = slash 1.3배, 찌르기 = thrust, 빠른 찌르기 = thrust 3번 연속, 내려찍기 = smash
  // 회전 베기(호주)는 그림 없이 코드로 그려요
  const MELEE_SHEET = { slash: ['slash', 76, 30], bigslash: ['slash', 99, 36], thrust: ['thrust', 84, 40], rapid: ['thrust', 70, 34, 3], smash: ['smash', 80, 30] };

  // 스킬 이펙트 시트 (10차 skill/fx-<유형>.webp): 칸 n개 가로, +x 방향, 가산 합성 · frame 번째 칸을 그려요
  function cell(name, n, frame, cx, cy, ang, size, alpha = 1, flip = false) {
    const im = UI.img[name]; if (!im || !im.naturalWidth) return false;
    const cw = im.naturalWidth / n, f = Math.max(0, Math.min(n - 1, frame | 0)), x = UI.x, h = size * im.naturalHeight / cw;
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = alpha; x.translate(cx, cy); x.rotate(ang); if (flip) x.scale(-1, 1);
    x.drawImage(im, f * cw, 0, cw, im.naturalHeight, -size / 2, -h / 2, size, h); x.restore();
    return true;
  }
  // 나라별 검기 그림 (Nano Banana 생성 · 사용자 "검기날리는 캐릭터마다 검기도 각기 다르게"): fx/wave.webp 15칸, +x 방향, 검정 바탕 → 더하기 합성
  const WAVE_IDX = { luxembourg: 0, netherlands: 1, austria: 2, germany: 3, sweden: 4, france: 5, italy: 6, spain: 7, japan: 8, portugal: 9, hungary: 10, turkiye: 11, chile: 12, mexico: 13, colombia: 14 };
  const WAVE_SIZE = { germany: 1.3, italy: .85, netherlands: .95, japan: 1.05 };   // 칼 크기 느낌 (츠바이핸더 크게, 글라디우스 작게)
  function waveSheet(key, px, py, dir, t) {
    const im = UI.img['fx/wave'], i = WAVE_IDX[key]; if (!im || !im.naturalWidth || i == null) return false;
    const x = UI.x, cw = im.naturalWidth / 15, ch = im.naturalHeight, k = (1 + Math.min(.3, t * 1.1)) * (WAVE_SIZE[key] || 1), w = 62 * k, h = w * ch / cw;
    x.save(); x.globalCompositeOperation = 'lighter'; x.translate(px, py); x.rotate(dir); if (Math.cos(dir) < 0) x.scale(1, -1);
    x.drawImage(im, i * cw, 0, cw, ch, -w * .62, -h / 2, w, h); x.restore();   // 초승달 앞쪽이 탄 자리에 오게 조금 뒤로
    return true;
  }
  window.FX = {
    sheet,
    cell,
    // 그림이 있으면 그림, 없으면 코드 효과
    drawMeleeAny(kind, cx, cy, dir, p) {
      const m = MELEE_SHEET[kind];
      if (m) {
        const n = m[3] || 1, k = Math.min(n - 1, Math.floor(p * n)), q = p * n - k;   // 빠른 찌르기: 3번 연속, 위·가운데·아래로 살짝 비켜서
        const off = n > 1 ? (k - 1) * 7 : 0, ox = -Math.sin(dir) * off, oy = Math.cos(dir) * off;
        if (sheet(m[0], q, cx + Math.cos(dir) * m[2] + ox, cy + Math.sin(dir) * m[2] * .82 + oy, dir, m[1], .7)) return;
      }   // 밝기 70% (겹쳐도 하얗게 안 뭉개지게)
      (MELEE[kind] || MELEE.slash)[1](UI.x, cx, cy, dir, p);
    },
    drawHitAny(px, py, q, col, dir, big, green, alpha = 1, size) { if (!sheet('hit', q, px, py, dir || 0, size || (big ? 24 : 20), .75 * alpha, green)) hit(UI.x, px, py, q, col, dir, big); },
    GUN,
    drawGun(key, px, py, ang, flipY, sc = 1) { const g = GUN[key]; if (!g) return false; const x = UI.x; x.save(); x.translate(px, py); x.rotate(ang); x.scale(sc, flipY ? -sc : sc); g(x); x.restore(); return true; },
    MELEE, SHOT, muzzle, hit, gunHit, splash,
    // 궤적 수명 (리뷰 6): 베기 0.12 · 큰 베기 0.15 · 찌르기 0.08 · 내려찍기 0.13 · 회전 0.21
    meleeTime: k => ({ slash: .12, bigslash: .15, thrust: .08, rapid: .16, smash: .13, spin: .21 }[k] || .12),
    drawMelee(kind, cx, cy, dir, p) { (MELEE[kind] || MELEE.slash)[1](UI.x, cx, cy, dir, p); },
    THROWN: k => k === 'blade' || k === 'axe' || k === 'mace' || k === 'polearm',   // wave(검기)는 던지지 않아요
    drawShot(kind, px, py, dir, t, key) {
      // 7차 무기 그림(weapon/<나라>.webp: 무기만, +x 방향, 손잡이 끝 = 왼쪽 가운데)이 있으면 그 그림을 날려요
      const im = key && FX.THROWN(kind) && UI.img['weapon/' + key];
      if (im && im.naturalWidth) {
        const x = UI.x, w = 52, h = w * im.naturalHeight / im.naturalWidth;   // 손에 든 크기와 비슷하게
        x.save(); x.translate(px, py); x.rotate(kind === 'polearm' ? dir : t * SPIN[kind]); x.drawImage(im, -w / 2, -h / 2, w, h); x.restore();
        return;
      }
      if (kind === 'wave' && waveSheet(key, px, py, dir, t)) return;
      (SHOT[kind] || SHOT.arrow)(UI.x, px, py, dir, t);
    },
  };
})();
