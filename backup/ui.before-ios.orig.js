// 화면 그리기 — teams/2-디자인/ui.md · style-guide.md (시안 preview/index.html 그리기 함수를 가져왔어요)
// 좌표는 "기준 화면 844×390"에 맞춘 가상 픽셀이에요. 화면이 넓으면 VW가 844보다 커져요.
(() => {
  const COL = {
    bg: '#0F1116', side: '#0A0B0F', fg: '#F2E3C6', muted: '#B1A599', panel: 'rgba(24,22,26,.94)', frame: '#8C6B32',
    gold: '#D9AE4F', glow: '#FFD166', shot: '#FFE08A', pink: '#FF4FD8', red: '#FF5A5F', amber: '#F4B860',
    btn2: '#2C2A30', hp: '#3DDC97', empty: '#24365A', icon: '#1A1410', adBg: '#2A2218', purple: '#B14DFF', green: '#8EBB2E',
  };
  const FONT = 'system-ui,-apple-system,"Segoe UI",Roboto,"Noto Sans",sans-serif';

  const UI = { COL, hits: [], x: null, VW: 844, VH: 390 };

  // ---- 기본 도형 ----
  UI.txt = (s, px, py, size, color, align = 'center', weight = 700, maxW) => {
    const x = UI.x; x.font = `${weight} ${size}px ${FONT}`; x.fillStyle = color; x.textAlign = align; x.textBaseline = 'middle';
    if (maxW) { const w = x.measureText(s).width; if (w > maxW) { x.font = `${weight} ${Math.max(9, size * maxW / w)}px ${FONT}`; } }
    x.fillText(s, px, py);
  };
  // 여러 줄 글자 (폭을 넘으면 줄바꿈)
  UI.para = (s, px, py, size, color, maxW, lineH = size * 1.35, weight = 600) => {
    const x = UI.x; x.font = `${weight} ${size}px ${FONT}`;
    const words = s.split(' '), lines = []; let cur = '';
    const cjk = /[぀-ヿ一-鿿]/.test(s) && words.length < 3;
    if (cjk) { for (const ch of s) { if (x.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; } else cur += ch; } }
    else for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    const y0 = py - (lines.length - 1) * lineH / 2;
    lines.forEach((l, i) => UI.txt(l, px, y0 + i * lineH, size, color, 'center', weight));
    return lines.length;
  };
  UI.rr = (px, py, w, h, r, fill, stroke, lw = 2) => {
    const x = UI.x; x.beginPath(); x.roundRect(px, py, w, h, r);
    if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); }
  };
  UI.circ = (px, py, r, fill, stroke, lw = 2) => {
    const x = UI.x; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2);
    if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); }
  };
  UI.panel = (px, py, w, h) => UI.rr(px, py, w, h, 14, COL.panel, COL.frame, 2);
  // 누를 수 있는 곳 등록 (매 프레임 새로)
  UI.hit = (id, px, py, w, h) => UI.hits.push({ id, x: px, y: py, w, h });
  UI.hitAt = (px, py) => { for (let i = UI.hits.length - 1; i >= 0; i--) { const h = UI.hits[i]; if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) return h.id; } return null; };

  // ---- 아이콘 (글자 없이 뜻이 통하게) ----
  const I = UI.I = {
    play(cx, cy, s, c) { const x = UI.x; x.beginPath(); x.moveTo(cx - s * .3, cy - s * .42); x.lineTo(cx + s * .45, cy); x.lineTo(cx - s * .3, cy + s * .42); x.closePath(); x.fillStyle = c; x.fill(); },
    back(cx, cy, s, c) { const x = UI.x; x.beginPath(); x.moveTo(cx + s * .3, cy - s * .38); x.lineTo(cx - s * .35, cy); x.lineTo(cx + s * .3, cy + s * .38); x.closePath(); x.fillStyle = c; x.fill(); },
    heart(cx, cy, s, c) { const x = UI.x; x.save(); x.translate(cx, cy); x.scale(s / 20, s / 20); x.beginPath(); x.moveTo(0, 7); x.bezierCurveTo(-12, -1, -8, -11, 0, -5); x.bezierCurveTo(8, -11, 12, -1, 0, 7); x.fillStyle = c; x.fill(); x.restore(); },
    sword(cx, cy, s, c) { const x = UI.x; x.save(); x.translate(cx, cy); x.rotate(-Math.PI / 4); x.fillStyle = c; x.fillRect(-s * .05, -s * .5, s * .1, s * .7); x.fillRect(-s * .22, s * .18, s * .44, s * .08); x.fillRect(-s * .05, s * .2, s * .1, s * .28); x.restore(); },
    arrow(cx, cy, s, c) { const x = UI.x; x.save(); x.translate(cx, cy); x.rotate(-Math.PI / 4); x.strokeStyle = c; x.fillStyle = c; x.lineWidth = s * .08; x.lineCap = 'round'; x.beginPath(); x.moveTo(-s * .45, 0); x.lineTo(s * .3, 0); x.stroke(); x.beginPath(); x.moveTo(s * .48, 0); x.lineTo(s * .22, -s * .14); x.lineTo(s * .22, s * .14); x.fill(); x.beginPath(); x.moveTo(-s * .45, 0); x.lineTo(-s * .55, -s * .12); x.moveTo(-s * .45, 0); x.lineTo(-s * .55, s * .12); x.stroke(); x.restore(); },
    shield(cx, cy, s, c) { const x = UI.x; x.beginPath(); x.moveTo(cx, cy - s * .45); x.lineTo(cx + s * .38, cy - s * .3); x.quadraticCurveTo(cx + s * .36, cy + s * .25, cx, cy + s * .48); x.quadraticCurveTo(cx - s * .36, cy + s * .25, cx - s * .38, cy - s * .3); x.closePath(); x.fillStyle = c; x.fill(); },
    speed(cx, cy, s, c) { const x = UI.x; x.strokeStyle = c; x.lineWidth = s * .13; x.lineCap = 'round'; for (const d of [-.22, .12]) { x.beginPath(); x.moveTo(cx + d * s - s * .12, cy - s * .3); x.lineTo(cx + d * s + s * .14, cy); x.lineTo(cx + d * s - s * .12, cy + s * .3); x.stroke(); } },
    bolt(cx, cy, s, c) { const x = UI.x; x.beginPath(); x.moveTo(cx + s * .12, cy - s * .5); x.lineTo(cx - s * .28, cy + s * .06); x.lineTo(cx - s * .02, cy + s * .06); x.lineTo(cx - s * .14, cy + s * .5); x.lineTo(cx + s * .28, cy - s * .08); x.lineTo(cx + s * .02, cy - s * .08); x.closePath(); x.fillStyle = c; x.fill(); },
    pause(cx, cy, s, c) { const x = UI.x; x.fillStyle = c; x.fillRect(cx - s * .28, cy - s * .32, s * .18, s * .64); x.fillRect(cx + s * .1, cy - s * .32, s * .18, s * .64); },
    speaker(cx, cy, s, c, off) { const x = UI.x; x.fillStyle = c; x.beginPath(); x.moveTo(cx - s * .4, cy - s * .14); x.lineTo(cx - s * .18, cy - s * .14); x.lineTo(cx + s * .06, cy - s * .36); x.lineTo(cx + s * .06, cy + s * .36); x.lineTo(cx - s * .18, cy + s * .14); x.lineTo(cx - s * .4, cy + s * .14); x.fill(); x.strokeStyle = c; x.lineWidth = s * .08; x.lineCap = 'round';
      if (off) { x.beginPath(); x.moveTo(cx + s * .18, cy - s * .16); x.lineTo(cx + s * .44, cy + s * .16); x.moveTo(cx + s * .44, cy - s * .16); x.lineTo(cx + s * .18, cy + s * .16); x.stroke(); }
      else { x.beginPath(); x.arc(cx + s * .08, cy, s * .22, -.9, .9); x.stroke(); x.beginPath(); x.arc(cx + s * .08, cy, s * .38, -.9, .9); x.stroke(); } },
    wave(cx, cy, s, c) { const x = UI.x; x.strokeStyle = c; x.lineWidth = s * .09; x.lineCap = 'round'; for (const d of [-.18, .18]) { x.beginPath(); for (let i = 0; i <= 12; i++) { const px = cx - s * .4 + i * s * .8 / 12, py = cy + d * s + Math.sin(i * 1.05) * s * .1; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } },
    star(cx, cy, s, c) { const x = UI.x; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .2 : s * .48; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); x.fillStyle = c; x.fill(); },
    retry(cx, cy, s, c) { const x = UI.x; x.strokeStyle = c; x.lineWidth = s * .11; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, s * .3, -Math.PI * .15, Math.PI * 1.45); x.stroke(); const a = -Math.PI * .15, ex = cx + Math.cos(a) * s * .3, ey = cy + Math.sin(a) * s * .3; x.fillStyle = c; x.beginPath(); x.moveTo(ex + s * .16, ey - s * .02); x.lineTo(ex - s * .1, ey - s * .14); x.lineTo(ex - s * .02, ey + s * .14); x.fill(); },
    flag(cx, cy, s, c) { const x = UI.x; x.fillStyle = c; x.fillRect(cx - s * .32, cy - s * .45, s * .07, s * .9); x.beginPath(); x.moveTo(cx - s * .25, cy - s * .42); x.quadraticCurveTo(cx, cy - s * .52, cx + s * .36, cy - s * .36); x.lineTo(cx + s * .36, cy - s * .02); x.quadraticCurveTo(cx, cy - s * .18, cx - s * .25, cy - s * .06); x.fill(); },
    flags2(cx, cy, s, c) { I.flag(cx - s * .16, cy - s * .06, s * .75, c); I.flag(cx + s * .2, cy + s * .1, s * .75, c); },
    trophy(cx, cy, s, c) { const x = UI.x; x.fillStyle = c; x.beginPath(); x.moveTo(cx - s * .3, cy - s * .4); x.lineTo(cx + s * .3, cy - s * .4); x.quadraticCurveTo(cx + s * .3, cy + s * .08, cx, cy + s * .1); x.quadraticCurveTo(cx - s * .3, cy + s * .08, cx - s * .3, cy - s * .4); x.fill(); x.fillRect(cx - s * .05, cy + s * .08, s * .1, s * .2); x.fillRect(cx - s * .22, cy + s * .28, s * .44, s * .1); x.strokeStyle = c; x.lineWidth = s * .07; x.beginPath(); x.arc(cx - s * .3, cy - s * .22, s * .13, Math.PI * .5, Math.PI * 1.5); x.stroke(); x.beginPath(); x.arc(cx + s * .3, cy - s * .22, s * .13, -Math.PI * .5, Math.PI * .5); x.stroke(); },
    video(cx, cy, s, c) { UI.rr(cx - s * .42, cy - s * .26, s * .6, s * .52, s * .08, c); const x = UI.x; x.beginPath(); x.moveTo(cx + s * .2, cy - s * .04); x.lineTo(cx + s * .44, cy - s * .2); x.lineTo(cx + s * .44, cy + s * .2); x.lineTo(cx + s * .2, cy + s * .04); x.fillStyle = c; x.fill(); },
    check(cx, cy, s, c) { const x = UI.x; x.strokeStyle = c; x.lineWidth = s * .14; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx - s * .32, cy); x.lineTo(cx - s * .08, cy + s * .24); x.lineTo(cx + s * .34, cy - s * .26); x.stroke(); },
    globe(cx, cy, s, c) { const x = UI.x; x.strokeStyle = c; x.lineWidth = s * .08; UI.circ(cx, cy, s * .4, null, c, s * .08); x.beginPath(); x.ellipse(cx, cy, s * .16, s * .4, 0, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.moveTo(cx - s * .4, cy); x.lineTo(cx + s * .4, cy); x.stroke(); },
    alien(cx, cy, s, c) { const x = UI.x; x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, s * .36, s * .3, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#0F1116'; x.beginPath(); x.ellipse(cx - s * .14, cy - s * .02, s * .09, s * .12, -.4, 0, Math.PI * 2); x.ellipse(cx + s * .14, cy - s * .02, s * .09, s * .12, .4, 0, Math.PI * 2); x.fill(); x.strokeStyle = c; x.lineWidth = s * .06; x.beginPath(); x.moveTo(cx - s * .12, cy - s * .26); x.lineTo(cx - s * .22, cy - s * .48); x.moveTo(cx + s * .12, cy - s * .26); x.lineTo(cx + s * .22, cy - s * .48); x.stroke(); },
    coin(cx, cy, s, sym, cracked) { UI.circ(cx, cy, s / 2, COL.gold); UI.circ(cx, cy, s / 2 - s * .08, null, '#A07A26', s * .05); UI.txt(sym, cx, cy + 1, s * (sym.length > 1 ? .3 : .5), '#5E420E', 'center', 800);
      if (cracked) { const x = UI.x; x.strokeStyle = '#2A1A08'; x.lineWidth = s * .05; x.beginPath(); x.moveTo(cx - s * .1, cy - s * .5); x.lineTo(cx + s * .04, cy - s * .15); x.lineTo(cx - s * .08, cy + s * .08); x.lineTo(cx + s * .1, cy + s * .5); x.stroke(); } },
    phone(cx, cy, s, c, t) { const x = UI.x; const a = Math.min(1, Math.max(0, Math.sin(t * 1.6) * 1.2 + .2)) * Math.PI / 2; x.save(); x.translate(cx, cy); x.rotate(-a); UI.rr(-s * .22, -s * .4, s * .44, s * .8, s * .07, null, c, s * .05); UI.circ(0, s * .3, s * .03, c); x.restore(); },
  };

  // 버튼
  UI.btnMain = (id, cx, cy, r, icon) => { UI.circ(cx, cy, r, COL.gold); UI.circ(cx, cy, r - 3, null, 'rgba(255,255,255,.35)', 1.5); I[icon](cx, cy, r * 1.05, COL.icon); UI.hit(id, cx - r, cy - r, r * 2, r * 2); };
  UI.btnSub = (id, cx, cy, s, icon, arg) => { UI.rr(cx - s / 2, cy - s / 2, s, s, 12, COL.btn2, '#4A4450', 1.5); I[icon](cx, cy, s * .62, COL.fg, arg); UI.hit(id, cx - s / 2, cy - s / 2, s, s); };
  // 글자 붙은 긴 버튼 (다시하기·이어하기 같은 크기)
  UI.btnWide = (id, cx, cy, w, h, icon, label, kind) => {
    const ad = kind === 'ad';
    UI.rr(cx - w / 2, cy - h / 2, w, h, 14, ad ? COL.adBg : kind === 'main' ? COL.gold : COL.btn2, ad ? COL.gold : kind === 'main' ? null : '#4A4450', ad ? 2.5 : 1.5);
    const ic = kind === 'main' ? COL.icon : ad ? COL.gold : COL.fg;
    I[icon](cx - w / 2 + 26, cy, 28, ic);
    // 글자가 길면 두 줄로 (아이콘과 겹치지 않게)
    const col = kind === 'main' ? COL.icon : COL.fg, avail = w - 64;
    UI.x.font = `700 14px ${FONT}`;
    if (UI.x.measureText(label).width <= avail) UI.txt(label, cx + 14, cy, 14, col, 'center', 700);
    else UI.para(label, cx + 14, cy, 12, col, avail, 14, 700);
    if (ad) { UI.rr(cx + w / 2 - 30, cy - h / 2 - 8, 30, 16, 5, COL.gold); UI.txt('AD', cx + w / 2 - 15, cy - h / 2, 10, COL.icon, 'center', 800); }
    UI.hit(id, cx - w / 2, cy - h / 2, w, h);
  };
  UI.toggle = (id, px, py, on) => { UI.rr(px, py, 46, 24, 12, on ? COL.gold : '#3A3640'); UI.circ(px + (on ? 34 : 12), py + 12, 9, on ? COL.icon : COL.muted); UI.hit(id, px - 120, py - 8, 176, 40); };
  UI.bar = (px, py, w, h, v, col = COL.glow, prev) => {
    UI.rr(px, py, w, h, h / 2, COL.empty);
    if (prev != null && prev > v) UI.rr(px, py, Math.max(h, w * Math.min(1, prev)), h, h / 2, COL.amber);
    if (v > 0) UI.rr(px, py, Math.max(h, w * Math.min(1, v)), h, h / 2, col);
  };

  // ---- 그림 ----
  UI.img = {};                  // 이름 → Image
  UI.draw = (name, px, py, w, h) => { const im = UI.img[name]; if (im && im.complete && im.naturalWidth) UI.x.drawImage(im, px, py, w, h); };
  // 장수 전신 (발이 footY)
  UI.hero = (key, cx, footY, h, mo = {}) => {
    const im = UI.img['hero/' + key]; if (!im || !im.naturalWidth) return;
    const x = UI.x, w = im.naturalWidth * h / im.naturalHeight;
    x.save(); x.translate(cx, footY); if (mo.rot) x.rotate(mo.rot); x.scale(mo.flip ? -1 : 1, mo.sy || 1);
    if (mo.alpha != null) x.globalAlpha = mo.alpha; x.drawImage(im, -w / 2, -h, w, h); x.restore();
  };
  // 동작 시트: 7칸 가로 한 줄, 발은 칸 아래 2px, 서 있는 키 = 칸 높이 × 124/160 (style-guide.md)
  // 칸 크기는 그림에서 읽어요 (지금 116×93, 키 약 72px) · 0 서기 · 1~4 걷기 · 5 공격 준비 · 6 공격
  UI.frame = (key, f, cx, footY, h, mo = {}) => {
    const im = UI.img['sheet/' + key]; if (!im || !im.naturalWidth) return;
    const x = UI.x, cw = im.naturalWidth / 7, ch = im.naturalHeight, k = h / (ch * 124 / 160);   // 디자인팀 권장식
    x.save(); x.translate(cx + (mo.ox || 0), footY + (mo.oy || 0)); if (mo.rot) x.rotate(mo.rot);
    x.scale((mo.flip ? -1 : 1) * (mo.sx || 1), mo.sy || 1); if (mo.alpha != null) x.globalAlpha = mo.alpha;
    if (mo.white) x.filter = 'brightness(2.2)';
    x.drawImage(im, f * cw, 0, cw, ch, -cw * k / 2, -(ch - 2) * k, cw * k, ch * k); x.restore();
  };
  // 8방향 몸 (7차): 5칸 = 아래·오른쪽아래·오른쪽·오른쪽위·위, 왼쪽은 좌우 뒤집기. 서 있는 키 = 칸 높이 × 0.875, 발 = 칸 아래 칸 높이 × 0.03125 (칸 크기는 그림에서 읽어요)
  // folder = 'dir'(5칸, 서기) 또는 'walk'(10칸, 방향마다 걷기 A·B)
  UI.dirBody = (key, cell, cx, footY, h, mo = {}, folder = 'dir') => {
    const im = UI.img[folder + '/' + key]; if (!im || !im.naturalWidth) return false;
    const x = UI.x, cw = im.naturalWidth / (folder === 'walk' ? 10 : 5), ch = im.naturalHeight, k = h / (ch * 112 / 128);
    x.save(); x.translate(cx + (mo.ox || 0), footY + (mo.oy || 0)); if (mo.shadow) { x.transform(1, 0, -0.55, -0.3, 0, 0); x.filter = 'brightness(0)'; x.globalAlpha = mo.shadow; } if (mo.rot) x.rotate(mo.rot);
    x.scale((mo.flip ? -1 : 1) * (mo.sx || 1), mo.sy || 1); if (mo.alpha != null && !mo.shadow) x.globalAlpha = mo.alpha;
    if (mo.white && !mo.shadow) x.filter = 'brightness(2.2)';
    x.drawImage(im, cell * cw, 0, cw, ch, -cw * k / 2, -(ch - ch * 0.03125) * k, cw * k, ch * k); x.restore();   // 발 = 칸 아래 칸 높이×0.03125 (128칸 4px · 192칸 6px)
    return true;
  };
  UI.sprite = (name, cx, footY, h, mo = {}) => {
    const im = UI.img[name]; if (!im || !im.naturalWidth) return;
    const x = UI.x, w = im.naturalWidth * h / im.naturalHeight;
    x.save(); x.translate(cx + (mo.ox || 0), footY + (mo.oy || 0)); if (mo.shadow) { x.transform(1, 0, -0.55, -0.3, 0, 0); x.filter = 'brightness(0)'; x.globalAlpha = mo.shadow; } if (mo.rot) x.rotate(mo.rot);
    x.scale((mo.flip ? -1 : 1) * (mo.sx || 1), mo.sy || 1); if (mo.alpha != null && !mo.shadow) x.globalAlpha = mo.alpha;
    if (mo.shadow) {}
    else if (mo.white) x.filter = 'brightness(2.4)';
    else if (mo.edge) x.filter = `drop-shadow(0 0 1.5px ${mo.edge}) drop-shadow(0 0 0.5px ${mo.edge})`;   // 피격 뒤 몸 색 외곽선
    x.drawImage(im, -w / 2, -h, w, h); x.restore();
  };
  // 칸 시트 한 칸 (외계인 8방향 11차: 15칸 = 방향 5 × 서기·A·B) · h = 칸 높이, 발 = 칸 아래에서 칸 높이 × 0.03125
  UI.cellSprite = (name, n, cell, cx, footY, h, mo = {}) => {
    const im = UI.img[name]; if (!im || !im.naturalWidth) return false;
    const x = UI.x, cw = im.naturalWidth / n, ch = im.naturalHeight, w = h * cw / ch;
    x.save(); x.translate(cx + (mo.ox || 0), footY + (mo.oy || 0)); if (mo.shadow) { x.transform(1, 0, -0.55, -0.3, 0, 0); x.filter = 'brightness(0)'; x.globalAlpha = mo.shadow; } if (mo.rot) x.rotate(mo.rot);
    x.scale((mo.flip ? -1 : 1) * (mo.sx || 1), mo.sy || 1); if (mo.alpha != null && !mo.shadow) x.globalAlpha = mo.alpha;
    if (mo.shadow) {}
    else if (mo.white) x.filter = 'brightness(2.4)';
    else if (mo.edge) x.filter = `drop-shadow(0 0 1.5px ${mo.edge}) drop-shadow(0 0 0.5px ${mo.edge})`;
    x.drawImage(im, cell * cw, 0, cw, ch, -w / 2, -h * (1 - 0.03125), w, h); x.restore();
    return true;
  };
  UI.flag = (iso, px, py, w, h) => { UI.draw('flag/' + iso, px, py, w, h); UI.x.strokeStyle = 'rgba(0,0,0,.5)'; UI.x.lineWidth = 1; UI.x.strokeRect(px, py, w, h); };
  UI.money = (c, m) => c.sym + (Math.max(0, m)).toFixed(1);
  UI.stars = t => { const x = UI.x; for (let i = 0; i < 70; i++) { const sx = (i * 137.5 + t * (6 + i % 5 * 3)) % UI.VW, sy = (i * 71.3) % UI.VH; x.globalAlpha = .25 + (i % 4) * .15; UI.circ(sx, sy, i % 7 ? 1 : 1.6, '#fff'); } x.globalAlpha = 1; };

  window.UI = UI;
})();
