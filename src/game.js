// 강한 놈만 살아남는 세상 — 게임 본체 (1차)
// 기준: teams/1-기획/GDD.md · balance.md · monetization.md · texts.md / teams/2-디자인/ui.md · style-guide.md · sound.md
// 광고·SDK는 window.Platform 만 불러요.
(() => {
  const { COUNTRIES, CURRENCY_MUL, CURRENCY_SYM, BAL, TEMP, FIELD, SKILL_COL } = window.DATA;
  const UI = window.UI, I18N = window.I18N, AUDIO = window.AUDIO, COL = UI.COL;
  const t_ = (k, v) => I18N.t(k, v);
  const cv = document.getElementById('game');
  let ctx = cv.getContext('2d');
  UI.x = ctx;
  // 다른 캔버스에 그리기 (3D 판에 쓸 장수 그림 등) — 기존 그리기 함수를 그대로 써요
  function paintTo(c2, fn) { const o = ctx; ctx = c2; UI.x = c2; try { fn(); } finally { ctx = o; UI.x = o; } }

  // ---------- 저장 (막혀 있어도 안 터지게) ----------
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem('aw.' + k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aw.' + k, JSON.stringify(v)); } catch {} },
  };
  const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const settings = Object.assign({ sound: true, shake: !reduceMotion, flash: !reduceMotion }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  // 렌더러: 2.5D(Three.js, B안)가 기본 · 되돌리기 = 주소 ?render=2d 또는 설정 render: '2d' (WebGL이 없어도 2D)
  let use3d = (() => { try { if (new URLSearchParams(location.search).get('render') === '2d') return false; } catch {} return settings.render !== '2d' && !!window.R3D && window.R3D.init(cv); })();
  AUDIO.enabled = settings.sound;
  const best = store.get('best', {});     // 나라 key → { rounds, kills }
  let lastCountry = store.get('lastCountry', null);
  I18N.set(store.get('lang', null) || I18N.deviceLang());

  // ---------- 화면 크기 ----------
  let W = 0, H = 0, DPR = 1, U = 1, VW = 844, VH = 390;
  const fieldBox = { x: 0, y: 0, s: 1 };
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    U = Math.min(W / 844, H / 390); VW = W / U; VH = H / U; UI.VW = VW; UI.VH = VH;
    fieldBox.s = Math.min(VW / FIELD.W, VH / FIELD.H);
    fieldBox.x = (VW - FIELD.W * fieldBox.s) / 2; fieldBox.y = (VH - FIELD.H * fieldBox.s) / 2;
    if (use3d) R3D.resize(W, H, DPR);
  }
  window.addEventListener('resize', resize); resize();
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } })();
  const portrait = () => (G.touchUI || coarse) && H > W;   // 세로 폰이면 회전 안내 + 모든 진행 멈춤

  // ---------- 상태 ----------
  // scene: loading · title · select · play · roundPanel · ending · result · ad
  const G = window.G = {
    t: 0, scene: 'loading', paused: false, sel: 0, selScroll: 0, country: null, run: null, hero: null,
    aliens: [], shots: [], eshots: [], items: [], fx: [], zones: [], marks: [], timers: [], ents: [], parts: [], msgs: [], shake: 0, hurtFlash: 0,
    touchUI: (() => { try { return matchMedia('(pointer: coarse)').matches; } catch { return false; } })(), load: 0, titleHeroes: [], result: null, panel: null, ending: null,   // touchUI: 터치 기기면 첫 터치 전부터 터치 버튼, PC 안내 숨김 (QA F3)
  };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  // 같은 맵 규칙: 라운드마다 같은 순서가 나오게 고정 시드
  const seeded = s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // 돈 → 능력치 (balance.md)
  const stats = (m, c) => {
    const M = Math.max(0, m), top = c && c.rank === 1 ? BAL.TOP1 : null, F = (0.625 + 0.375 * M / 100) * (top ? top.F : 1), S = (0.7 + 0.3 * M / 100) * (top ? top.S : 1);   // F 공식 0.4+0.6·M → 0.625+0.375·M (사용자 확정 2026-11-25, balance.md)
    return { hp: Math.round(BAL.BASE.hp * F), melee: BAL.BASE.melee * F, ranged: BAL.BASE.ranged * F, speed: BAL.BASE.speed * S, F, S };
  };

  // ---------- 에셋 ----------
  // 첫 로딩은 가볍게 (사용자 결정): 시작·나라 고르기·전투 공통 그림만 먼저, 고른 나라의 8방향 몸·무기는 나라를 고른 뒤
  function loadList(list, onProgress) {
    let done = 0;
    return new Promise(res => {
      if (!list.length) return res();
      list.forEach(n => {
        if (UI.img[n] && UI.img[n].complete) { if (++done === list.length) res(); return; }
        const im = new Image();
        const fin = () => { done++; onProgress && onProgress(done / list.length); if (done === list.length) res(); };
        im.onload = fin; im.onerror = fin;
        im.src = 'assets/' + n + (n.startsWith('flag/') ? '.svg' : '.webp');
        UI.img[n] = im;
      });
    });
  }
  function countryAssets(c) {
    const l = ['dir/' + c.key, 'walk/' + c.key];
    if (!FX.GUN[c.key]) l.push('weapon/' + c.key);
    if (c.ranged === 'arrow') l.push('weapon/korea-ranged');
    if (c.ranged === 'sling') l.push('weapon/israel-ranged');
    for (const t of new Set([c.skill.type, c.skill2.type, 'area'])) l.push('skill/fx-' + t);   // 그 나라 스킬 두 개의 이펙트만
    l.push('skill/u/' + c.key + '-1', 'skill/u/' + c.key + '-2');   // 스킬 대표 그림 (13차, 디자인 5091312)
    l.push('alien/grunt-jump', 'alien/boss-jump', 'alien/fx-land');   // 점프 그림 (12차) — 점프하는 졸개·보스만
    return l;
  }
  function loadAssets() {
    const list = [];
    COUNTRIES.forEach(c => { list.push('hero/' + c.key, 'flag/' + c.iso); });
    list.push('alien/grunt-dir', 'alien/shooter-dir', 'alien/boss-dir', 'room', 'title-bg', 'fx/slash', 'fx/thrust', 'fx/smash', 'fx/hit', 'fx/death', 'fx/wave',
      '3d/floor', '3d/wall', '3d/wall-top', '3d/door-arch', '3d/pillar', 'skill/icon-dash', 'skill/icon-area', 'skill/icon-barrage', 'skill/icon-zone'); // title-bg는 없어도 돼요(없으면 코드 돈더미)
    Object.keys(CURRENCY_MUL).forEach(c => list.push('item/' + c));
    return loadList(list, k => { G.load = k; });
  }

  // 예약한 소리 (화면을 떠나면 취소)
  let laters = [];
  const later = (fn, ms) => laters.push(setTimeout(fn, ms));
  const cancelLater = () => { laters.forEach(clearTimeout); laters = []; AUDIO.cancelPending(); };

  // ---------- 판 · 라운드 ----------
  function newRun(ci) {
    G.country = COUNTRIES[ci];
    G.run = { round: 1, money: G.country.money, skillsLeft: [0, BAL.SKILL_PER_RUN, BAL.SKILL_PER_RUN], kills: 0, reviveUsed: false, rewardedSeen: false, bankrupts: 0, maxRound: 0 };
    startRound(true);
  }
  function startRound(first) {
    const r = G.run, c = G.country, wave = BAL.WAVES[r.round - 1], st = stats(r.money, c);
    r.wave = wave; r.st = st; r.roundT = 0; r.spawned = 0; r.grunts = 0; r.jumpers = 0; r.spawnT = 0.8; r.killsRound = 0; r.bossSpawned = false;
    r.itemIdx = 0; r.invuln = BAL.INVULN_PER_ROUND; r.clearT = -1; r.rng = seeded(r.round * 7919 + 13);
    G.hero = {
      x: FIELD.W / 2, y: FIELD.H / 2 + 30, r: 14, hp: st.hp, maxHp: st.hp, dir: { x: 1, y: 0 }, moving: false, walkT: 0,
      inv: 0, skillT: 0, dash: null, barrage: null, meleeCd: 0, rangedCd: 0, atkT: 0, buff: null, dead: false, deadT: 0, hitT: 0,
    };
    G.aliens = []; G.shots = []; G.eshots = []; G.items = []; G.fx = []; G.parts = []; G.zones = []; G.marks = []; G.timers = []; G.ents = [];
    G.msgs = G.msgs.filter(m => m.keep);
    G.msgs.push({ text: t_('ui.03', { n: r.round }), t: 1.4, big: true });
    if (first && r.round === 1 && !G.touchUI) G.msgs.push({ text: t_('x.keys'), t: 3, hint: true });
    G.scene = 'play'; G.paused = false;
    Platform.gameplayStart();
  }
  const remaining = () => G.run.wave.n + 1 - G.run.killsRound;

  function spawnAlien(type) {
    const r = G.run, w = r.wave, d = FIELD.doors[Math.floor(r.rng() * 4)], j = (r.rng() - .5) * 40;
    const a = {
      type, x: d.x + (d.dx ? 0 : j), y: d.y + (d.dy ? 0 : j), dx: d.dx, dy: d.dy, entering: true,
      hp: type === 'boss' ? w.boss : w.hp, max: type === 'boss' ? w.boss : w.hp,
      speed: w.speed * (type === 'boss' ? TEMP.BOSS_SPEED_MUL : type === 'shooter' ? 0.9 : 1),
      r: type === 'boss' ? 38 : 15, flash: 0, shootT: type === 'boss' ? 2 : 1 + r.rng(), seed: r.rng() * 10, vx: 0, kb: { x: 0, y: 0 }, recoil: 0,
    };
    // 점프 (GDD 0-11): 3라운드부터 졸개 일부(라운드별 수, 졸개 2마리 중 1마리), 4라운드부터 보스 — 모든 나라가 같은 순서
    const J = TEMP.JUMP, BJ = TEMP.BOSS_JUMP;
    if (type === 'grunt') { if (r.grunts++ % 2 === 0 && r.jumpers < J.n[r.round - 1]) { r.jumpers++; a.jumpCfg = J; a.jumpT = J.gap[r.round - 1]; } }
    else if (type === 'boss' && r.round >= BJ.from) { a.jumpCfg = BJ; a.jumpT = BJ.gap * .5; }
    G.aliens.push(a);
  }

  function updateSpawns(dt) {
    const r = G.run, w = r.wave;
    r.spawnT -= dt;
    const alive = G.aliens.filter(a => a.type !== 'boss').length;
    if (r.spawned < w.n && r.spawnT <= 0 && alive < TEMP.MAX_ALIVE) {
      const shooter = r.round >= 2 && r.spawned % TEMP.SHOOTER_EVERY === TEMP.SHOOTER_EVERY - 1;
      spawnAlien(shooter ? 'shooter' : 'grunt'); r.spawned++; r.spawnT = TEMP.SPAWN_GAP[r.round - 1];
    }
    // 보스: 그 라운드 외계인이 절반 남았을 때
    if (!r.bossSpawned && r.killsRound >= Math.ceil(w.n / 2)) { r.bossSpawned = true; spawnAlien('boss'); }
    // 화폐: 모든 나라 같은 시간·자리·종류
    if (r.itemIdx < BAL.ITEMS_PER_ROUND && r.roundT >= TEMP.ITEM_TIMES[r.itemIdx]) {
      const sp = TEMP.ITEM_SPOTS[((r.round - 1) * 2 + r.itemIdx) % TEMP.ITEM_SPOTS.length], f = FIELD.floor;
      const cur = TEMP.ITEM_CURS[r.round - 1][r.itemIdx];
      G.items.push({ cur, x: f.x0 + (f.x1 - f.x0) * sp[0], y: f.y0 + (f.y1 - f.y0) * sp[1], life: BAL.ITEM_LIFE });
      r.itemIdx++;
    }
  }

  // ---------- 입력 ----------
  const keys = new Set();
  const input = { mx: 0, my: 0, melee: false, ranged: false, mMelee: false, mRanged: false };
  const mouse = { on: false, x: 0, y: 0, gx: 0, gy: 0 };   // x·y = 조준(가슴 높이) · gx·gy = 커서가 가리키는 바닥 점 (스킬 자리, GDD 0-17)
  let aim = null;   // 폰 스킬 버튼 끌기 { n, id, b, drag, cancel, t: 바닥 점 } (GDD 0-17)   // 전장 좌표의 마우스 커서 (마우스로 조준할 때)
  const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const held = { melee: new Set(), ranged: new Set() };
  const buf = { melee: 0, ranged: 0 };   // 누른 것을 0.1초 기억 (히트스톱 중 짧은 탭)   // 버튼을 누르고 있는 손가락들
  // 폰 오른쪽 (GDD 0-18, 디자인 e2f8c4d): 큰 원 중심 (VW−130, VH−130) 반지름 56 · 화살표 66×66은 원 테두리에서 4 띄워 바깥으로 (중심까지 56 + 4 + 33)
  const STICK_R = 56, ARROW = 66;
  // 안전 영역 (아이폰 가로의 둥근 모서리·홈 막대, QA M15): env(safe-area-inset-*)를 읽고, 0이면 최소 12px [제안]. 테스트: ?safe=왼,위,오른,아래 (CSS px)
  const SAFE_MIN = 12;
  const safeProbe = (() => { try { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)'; document.body.appendChild(d); return d; } catch { return null; } })();
  const safeTest = (/[?&]safe=([\d.,]+)/.exec(location.search) || [])[1];
  let safeC = null, safeAt = -1;
  function safeArea() {   // 가상 좌표(VW·VH) 단위로 돌려줘요 (0.5초마다 다시 읽어요)
    const now = performance.now(); if (safeC && now - safeAt < 500 && safeC.U === U) return safeC;
    let l = 0, t = 0, rr = 0, b = 0;
    if (safeTest) [l, t, rr, b] = safeTest.split(',').map(Number);
    else if (safeProbe) { const cs = getComputedStyle(safeProbe); l = parseFloat(cs.paddingLeft) || 0; t = parseFloat(cs.paddingTop) || 0; rr = parseFloat(cs.paddingRight) || 0; b = parseFloat(cs.paddingBottom) || 0; }
    const m = v => Math.max(v || 0, SAFE_MIN) / U;
    safeAt = now; return (safeC = { l: m(l), t: m(t), r: m(rr), b: m(b), U });
  }
  G.safeArea = safeArea;   // 테스트용
  const btnPos = () => {
    // 오른쪽 무리: 스킬2 취소 원(화살표 중심 + 33 + 14)과 아래 무적 화살표가 안전 영역 안에 들어오게 (QA M14·M15)
    const S = safeArea(), d = STICK_R + 4 + ARROW / 2, r = ARROW / 2, cx = VW - S.r - (d + r + 14), cy = VH - S.b - (d + r);
    return {
      stick: { x: cx, y: cy, r: STICK_R },
      melee: { x: cx - d, y: cy, r, a: Math.PI },
      skill: { x: cx, y: cy - d, r, a: -Math.PI / 2 },
      skill2: { x: cx + d, y: cy, r, a: 0 },
      invuln: { x: cx, y: cy + d, r, a: Math.PI / 2 },
      // 배치 (사용자 2026-11-25 "무적은 아래로"): ← 치기 · ↑ 스킬1 · → 스킬2 · ↓ 무적
    };
  };
  const rstick = { id: null, x: 0, y: 0 };
  // 폰 톡 이동 (GDD 0-19, 사용자 "휴대폰 화면 클릭하면 클릭한 위치로 이동"): 짧게(0.25초 안) 거의 안 움직이고(12px 안) 떼면 그 바닥 지점까지 걸어가요
  const TAP_T = .25, TAP_D = 12;
  let tapP = null, moveTo = null;   // 오른쪽 손잡이 (−1..1)
  const mArrow = { id: null, x0: 0, y0: 0, dir: null };   // ← 치기 화살표: 누르고 있으면 계속, 끌면 끈 방향
  const arrowHeld = () => aim != null || mArrow.id != null;   // 화살표를 누르는 동안 쏘기 멈춤
  G.btnPos = btnPos;   // 테스트용 (버튼 자리)
  const toV = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / U, y: (e.clientY - b.top) / U }; };
  let drag = null;

  function toGround(p) {
    const fb = fieldBox; let x = (p.x - fb.x) / fb.s, y = (p.y - fb.y) / fb.s;
    if (use3d) { const q = R3D.unproj(x, y); if (q) { x = q.x; y = q.y; } }
    return { x, y };
  }
  // 테스트용: 바닥 점 → 화면(가상) 좌표 · 마우스 상태
  // 스킬 조준 (사용자 "스킬은 버튼 꾹 누르면 원하는 방향으로"): 장수 화면 자리 + 손가락이 움직인 만큼 × 3 → 바닥 점. 엄지를 조금만 움직여도 전장 대부분에 닿아요 [제안 3배]
  const AIM_GAIN = 3, AIM_HOLD = .2;
  const aimPoint = a => { const h = G.hero, hs = G.dbgField(h.x, h.y); return toGround({ x: hs.x + a.dp.x * AIM_GAIN, y: hs.y + a.dp.y * AIM_GAIN }); };
  G.dbgField = (x, y) => { const fb = fieldBox; if (use3d && R3D.built) { const q = R3D.proj(x, y); return { x: fb.x + q.x * fb.s, y: fb.y + q.y * fb.s }; } return { x: fb.x + x * fb.s, y: fb.y + y * fb.s }; };
  G.dbgMouse = () => mouse; G.dbgAim = () => aim; G.dbgMoveTo = () => moveTo;
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); AUDIO.unlock();
    if (e.pointerType !== 'mouse') { G.touchUI = true; mouse.on = false; }
    const p = toV(e);
    if (G.scene === 'ad' || portrait()) return;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    let id = UI.hitAt(p.x, p.y);
    if (id === 'pause' && e.pointerType === 'mouse') id = null;   // 마우스 클릭은 언제나 공격 (GDD 0-14) — 터치 겸용 PC에서도
    if (id) { if (id.startsWith('card:')) { drag = { id: e.pointerId, y0: p.y, s0: G.selScroll, moved: false, card: id }; return; } AUDIO.play('button'); return action(id); }
    if (G.scene === 'select' && p.x < VW * .6 && p.y > VH * .18) { drag = { id: e.pointerId, y0: p.y, s0: G.selScroll, moved: false }; return; }
    if (G.scene !== 'play' || G.paused) return;
    if (e.pointerType === 'mouse') { mouseButtons(e); return; }   // 좌클릭 = 치기, 우클릭 = 쏘기
    const B = btnPos();
    // 처음 닿은 자리로만 정해요 (GDD 0-18): 화살표 → 그 동작 · 큰 원 안 → 쏘기 손잡이 · 왼쪽 절반 → 이동
    for (const k of ['melee', 'skill', 'skill2', 'invuln']) {
      const b = B[k];
      if (Math.abs(p.x - b.x) < b.r + 4 && Math.abs(p.y - b.y) < b.r + 4) {
        if (k === 'skill' || k === 'skill2') { const n = k === 'skill' ? 1 : 2; if (sLeft(n) > 0 && !aim) aim = { n, id: e.pointerId, b, drag: false, cancel: false, left: false, t: null, t0: e.timeStamp / 1000, p0: { x: p.x, y: p.y }, dp: { x: 0, y: 0 } }; }   // 끌어서 자리 고르기 (GDD 0-17)
        else if (k === 'invuln') useInvuln();
        else if (mArrow.id == null) { mArrow.id = e.pointerId; mArrow.x0 = p.x; mArrow.y0 = p.y; mArrow.dir = null; held.melee.add(e.pointerId); input.melee = true; buf.melee = 0.1; }
        return;
      }
    }
    if (rstick.id == null && Math.hypot(p.x - B.stick.x, p.y - B.stick.y) < B.stick.r + 4) { rstick.id = e.pointerId; rstick.x = rstick.y = 0; return; }
    if (!tapP) tapP = { id: e.pointerId, x: p.x, y: p.y, t: e.timeStamp / 1000, moved: false };   // 톡 이동 후보
    if (p.x < VW / 2 && joy.id == null) { joy.id = e.pointerId; joy.ox = p.x; joy.oy = p.y; joy.x = 0; joy.y = 0; }
  });
  // 마우스 버튼은 한 포인터에 여러 버튼이라 buttons 비트로 읽어요 (1 = 왼쪽, 2 = 오른쪽)
  // 마우스 조작 (사용자 결정 2026-11-25): 좌클릭 치기 · 우클릭 쏘기 · 우클릭 2번 = 1번 스킬 · 좌클릭 2번 = 2번 스킬 · 좌·우 동시 = 무적
  // [제안] 동시 = 두 버튼 0.08초 안, 두 번 = 같은 버튼 0.25초 안. 첫 클릭은 0.07초만 기다렸다가 나가요(동시 누름이면 치기·쏘기 없이 무적만)
  // 동시 0.08 → 0.12초 (QA M8). 시각은 프레임이 아니라 입력 이벤트 시각(e.timeStamp)으로 재요 — 3D가 느려도 두 번 누르기가 먹게 (QA M9)
  const MC = { b: 0, mute: 0, pend: null, last: { 1: -9, 2: -9 }, down: { 1: -9, 2: -9 } }, M_SIM = .12, M_DBL = .25, M_WAIT = .07;
  function pressBtn(bit, now) {
    const other = bit === 1 ? 2 : 1, prevDown = MC.down[other]; MC.down[bit] = now;
    if (now - prevDown <= M_SIM) { MC.pend = null; MC.mute |= 3; MC.last[1] = MC.last[2] = MC.down[1] = MC.down[2] = -9; useInvuln(); return; }
    if (now - MC.last[bit] <= M_DBL) { MC.last[bit] = -9; MC.mute |= bit; if (MC.pend && MC.pend.bit === bit) MC.pend = null; useSkill(bit === 2 ? 1 : 2, cursorTarget()); return; }
    MC.last[bit] = now; MC.pend = { bit, t: now };
  }
  const cursorTarget = () => (mouse.on && !G.touchUI ? { x: mouse.gx, y: mouse.gy, pc: true } : null);   // PC: 커서 자리가 곧 조준 (GDD 0-17)
  function mouseHeld() {
    const ok = bit => !!(MC.b & bit) && !(MC.mute & bit) && !(MC.pend && MC.pend.bit === bit);
    input.mMelee = ok(1); input.mRanged = ok(2);
  }
  function mousePending() {   // 기다리던 첫 클릭을 내보내요 (update에서)
    if (!MC.pend || performance.now() / 1000 - MC.pend.t < M_WAIT) return;   // e.timeStamp와 performance.now()는 같은 시계예요
    buf[MC.pend.bit === 1 ? 'melee' : 'ranged'] = 0.1; MC.pend = null; mouseHeld();
  }
  function mouseButtons(e) {
    // 브라우저가 커서를 안 움직였는데도 보내는 이동 신호(예: 페이지를 띄울 때 0,0)는 조준으로 치지 않아요
    if (e.type === 'pointermove' && !mouse.on && !e.movementX && !e.movementY && !e.buttons) return;
    const on = G.scene === 'play' && !G.paused;
    const b = on ? e.buttons & 3 : 0, prev = MC.b, now = (e.timeStamp || performance.now()) / 1000; MC.b = b;
    MC.mute &= b;                                     // 손을 떼면 막아 둔 버튼이 풀려요
    for (const bit of [1, 2]) if (b & bit & ~prev) pressBtn(bit, now);
    mouseHeld();
    const p = toV(e), fb = fieldBox;
    mouse.x = (p.x - fb.x) / fb.s; mouse.y = (p.y - fb.y) / fb.s; mouse.on = true;
    mouse.gx = mouse.x; mouse.gy = mouse.y;
    if (use3d) { const q = R3D.unproj(mouse.x, mouse.y); if (q) { mouse.x = q.x; mouse.y = q.y - 24; mouse.gx = q.x; mouse.gy = q.y; } }   // 3D: 커서가 가리키는 바닥 점 (조준은 가슴 높이 기준이라 −24)
  }
  cv.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') mouseButtons(e);
    const p = toV(e);
    if (drag && drag.id === e.pointerId) {
      if (Math.abs(p.y - drag.y0) > 6) drag.moved = true;
      if (drag.moved) G.selScroll = clamp(drag.s0 - (p.y - drag.y0), 0, selMaxScroll());
      return;
    }
    if (tapP && tapP.id === e.pointerId && Math.hypot(p.x - tapP.x, p.y - tapP.y) > TAP_D) tapP.moved = true;
    if (rstick.id === e.pointerId) {   // 오른쪽 손잡이: 밀면 그 방향으로 쏘기
      const B = btnPos(); let dx = (p.x - B.stick.x) / 40, dy = (p.y - B.stick.y) / 40; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
      rstick.x = dx; rstick.y = dy; return;
    }
    if (mArrow.id === e.pointerId) { const dx = p.x - mArrow.x0, dy = p.y - mArrow.y0, l = Math.hypot(dx, dy); mArrow.dir = l > 14 ? { x: dx / l, y: dy / l } : null; return; }   // ← 치기를 끌면 끈 방향
    if (aim && aim.id === e.pointerId) {   // 스킬 버튼 끌기: 버튼 둘레(취소 원) 밖으로 나가면 조준, 다시 들어오면 취소 상태
      const inC = Math.hypot(p.x - aim.b.x, p.y - aim.b.y) < aim.b.r + 14;
      if (!inC) { aim.left = true; aim.drag = true; }
      aim.dp = { x: p.x - aim.p0.x, y: p.y - aim.p0.y };
      const was = aim.cancel; aim.cancel = aim.left && inC;   // 한 번 나갔다가 버튼 위로 돌아오면 취소
      if (aim.cancel && !was) { try { navigator.vibrate && navigator.vibrate(10); } catch {} }
      aim.t = aimPoint(aim); return;
    }
    if (joy.id === e.pointerId) {
      let dx = p.x - joy.ox, dy = p.y - joy.oy; const d = Math.hypot(dx, dy), R = 52;
      if (d > R) { joy.ox = p.x - dx / d * R; joy.oy = p.y - dy / d * R; dx = dx / d * R; dy = dy / d * R; } // 손잡이를 따라 기준점도 끌려와요
      joy.x = dx / R; joy.y = dy / R;
    }
  });
  const release = (e, tap) => {
    AUDIO.unlock();   // iOS 사파리는 손을 뗄 때(터치 끝)에야 소리를 켜 주기도 해요
    if (e.pointerType === 'mouse') { MC.b = e.buttons & 3; MC.mute &= MC.b; mouseHeld(); }
    if (drag && drag.id === e.pointerId) { if (tap && !drag.moved && drag.card) { AUDIO.play('button'); action(drag.card); } drag = null; }
    if (joy.id === e.pointerId) { joy.id = null; joy.x = joy.y = 0; }
    if (rstick.id === e.pointerId) { rstick.id = null; rstick.x = rstick.y = 0; }
    if (tapP && tapP.id === e.pointerId) {   // 톡이면 그 바닥 지점으로 (다시 톡하면 바뀌어요)
      const tp = tapP; tapP = null;
      if (tap && !tp.moved && e.timeStamp / 1000 - tp.t < TAP_T && G.scene === 'play' && !G.paused && G.hero) { const f = FIELD.floor, q = toGround(toV(e)); moveTo = { x: clamp(q.x, f.x0 + 12, f.x1 - 12), y: clamp(q.y, f.y0 + 22, f.y1), t0: G.t, stuck: 0 }; }   // 외계인 위를 톡해도 그냥 그 자리로 (GDD 0-19, 자동 공격 없음)
    }
    if (mArrow.id === e.pointerId) { mArrow.id = null; mArrow.dir = null; }
    if (aim && aim.id === e.pointerId) { const a = aim; aim = null; if (tap && G.scene === 'play' && !G.paused) { if (!a.drag) useSkill(a.n); else if (!a.cancel) useSkill(a.n, Math.hypot(a.dp.x, a.dp.y) > 10 ? a.t : undefined); } }   // 톡 = 가까운 외계인 · 끌어서 놓기 = 그 자리 · 취소 원에서 놓기 = 안 씀(횟수 그대로)
    for (const k of ['melee', 'ranged']) { held[k].delete(e.pointerId); input[k] = held[k].size > 0; }
  };
  cv.addEventListener('pointerup', e => release(e, true));
  cv.addEventListener('pointercancel', e => release(e, false));      // 취소는 탭으로 치지 않아요
  cv.addEventListener('lostpointercapture', e => release(e, false));
  // 모든 입력 풀기 (광고 앞뒤, 창을 벗어날 때, 화면을 돌릴 때)
  function clearInput() {
    keys.clear(); drag = null; aim = null; tapP = null; moveTo = null; joy.id = null; joy.x = joy.y = 0; rstick.id = null; rstick.x = rstick.y = 0; mArrow.id = null; mArrow.dir = null;
    held.melee.clear(); held.ranged.clear(); input.melee = input.ranged = input.mMelee = input.mRanged = false; input.mx = input.my = 0;
  }
  window.addEventListener('orientationchange', clearInput);
  cv.addEventListener('wheel', e => { if (G.scene === 'select') { G.selScroll = clamp(G.selScroll + e.deltaY * .5, 0, selMaxScroll()); e.preventDefault(); } }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Escape', 'Enter'];
  window.addEventListener('keydown', e => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();   // 페이지 스크롤 막기
    if (G.scene === 'ad' || portrait()) return;
    AUDIO.unlock();
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape') {   // 설정 창은 ESC로만 (사용자 "세팅창 esc 누르기전까지 나오지 않게해", 2026-11-25) — P는 스킬 키 L·; 옆이라 뺐어요
      if (G.scene === 'play') { if (G.hold) { G.hold = false; return; } return setPause(!G.paused); }   // 조용히 멈춘 상태면 ESC로 설정 창을 열어요
      if (G.scene === 'select') return action('back');
    }
    const ok = e.code === 'Enter' || e.code === 'Space';
    // 한 번 누른 키가 다음 화면까지 이어서 눌리지 않게 화면마다 하나만 처리해요
    if (G.scene === 'play') {   // [제안] L = 1번 스킬 · ; = 2번 스킬 · Space = 무적 (ESC·P = 일시정지)
      if (!G.paused) { if (e.code === 'KeyL') useSkill(1, cursorTarget()); if (e.code === 'Semicolon') useSkill(2, cursorTarget()); if (e.code === 'Space') useInvuln(); }
      if (e.code === 'KeyJ') buf.melee = 0.1; if (e.code === 'KeyK') buf.ranged = 0.1;
    }
    else if (G.scene === 'title') { if (ok) action('start'); }
    else if (G.scene === 'select') {
      const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5, KeyA: -1, KeyD: 1, KeyW: -5, KeyS: 5 }[e.code];
      if (mv) { G.sel = clamp(G.sel + mv, 0, COUNTRIES.length - 1); scrollToSel(); }
      if (ok) action('confirm');
    } else if (G.scene === 'result' && G.result.t > 0.6) { if (ok) action('restart'); if (e.code === 'Escape') action('quit'); }
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  // 창·탭을 벗어나면 설정 창 없이 조용히 멈추고(G.hold), 돌아오면 그대로 이어가요
  const hold = () => { clearInput(); if (G.scene === 'play' && !G.paused) { setPause(true); G.hold = true; } };
  const unhold = () => { if (G.hold && !document.hidden) { G.hold = false; setPause(false); } };
  window.addEventListener('blur', hold); window.addEventListener('focus', unhold);
  document.addEventListener('visibilitychange', () => { if (document.hidden) hold(); else unhold(); });

  function readMove() {
    let x = 0, y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x--; if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y--; if (keys.has('KeyS') || keys.has('ArrowDown')) y++;
    if (joy.id != null) { x = joy.x; y = joy.y; }
    const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    input.mx = Math.abs(x) < .12 ? 0 : x; input.my = Math.abs(y) < .12 ? 0 : y;
    if (input.mx || input.my) moveTo = null;   // 조이스틱·키를 쓰면 톡 이동 취소
    else if (moveTo && G.hero) { const dx = moveTo.x - G.hero.x, dy = moveTo.y - G.hero.y, d = Math.hypot(dx, dy); if (d < 6) moveTo = null; else { input.mx = dx / d; input.my = dy / d; } }   // 도착하면 멈춰요
  }

  function setPause(p) {
    if (G.scene !== 'play') return;
    G.paused = p; G.langOpen = false; if (!p) G.hold = false;
    if (p) { Platform.gameplayStop(); clearInput(); }
    else Platform.gameplayStart();
  }

  // ---------- 버튼 동작 ----------
  function action(id) {
    if (id === 'sound') { settings.sound = !settings.sound; AUDIO.enabled = settings.sound; return saveSettings(); }
    if (id === 'shake') { settings.shake = !settings.shake; return saveSettings(); }
    if (id === 'flash') { settings.flash = !settings.flash; return saveSettings(); }
    if (id === 'lang') { G.langOpen = !G.langOpen; return; }
    if (id.startsWith('lang:')) { I18N.set(id.slice(5)); store.set('lang', I18N.lang); G.langOpen = false; return; }
    switch (G.scene) {
      case 'title':
        if (id === 'start') { G.scene = 'select'; G.sel = lastCountry != null ? lastCountry : 0; scrollToSel(); }
        break;
      case 'select':
        if (id === 'back') G.scene = 'title';
        if (id.startsWith('card:')) { const i = +id.slice(5); if (i === G.sel && G.touchUI) action('confirm'); else G.sel = i; }
        if (id === 'confirm') {
          lastCountry = G.sel; store.set('lastCountry', G.sel);
          I18N.set(COUNTRIES[G.sel].lang);   // 기본은 고른 나라 언어 (번역이 없으면 영어)
          store.set('lang', I18N.lang);
          // 고른 나라의 몸·무기 그림을 불러온 뒤 시작 (이미 있으면 바로)
          const ci = G.sel; G.scene = 'loading'; G.load = 0;
          loadList(countryAssets(COUNTRIES[ci]), k => { G.load = k; }).then(() => { if (G.scene === 'loading') newRun(ci); });
        }
        break;
      case 'play':
        if (id === 'pause') setPause(!G.paused);
        if (id === 'resume') setPause(false);
        if (id === 'exit') { setPause(false); Platform.gameplayStop(); cancelLater(); G.scene = 'select'; }
        break;
      case 'result':
        if (id === 'restart') restart();
        if (id === 'quit') { cancelLater(); G.scene = 'title'; G.titleHeroes = []; }   // 종료: 광고 없이 시작 화면으로
        if (id === 'revive') rewardedRevive();
        if (id === 'bankruptGo') rewardedBankrupt();
        break;
    }
  }

  // ---------- 광고 (monetization.md) ----------
  // 광고 공통: 들어가기 전 입력 풀고 소리 끄기 → 실패·예외·응답 없음도 처리 → 끝나면 꼭 소리·입력 복구
  let adToken = 0;
  const AD_TIMEOUT = 90000;   // 광고가 끝 신호를 안 보내면 90초 뒤 포기하고 게임으로 돌아와요
  async function runAd(call) {
    const my = ++adToken;
    G.scene = 'ad'; clearInput(); AUDIO.setAdMute(true);
    let res = false;
    try {
      res = await Promise.race([
        Promise.resolve().then(() => call(() => AUDIO.setAdMute(true))),
        new Promise(r => setTimeout(() => r('timeout'), AD_TIMEOUT)),
      ]);
    } catch (err) { console.warn('[ad] 실패 → 광고 없이 진행', err); res = false; }
    finally { if (my === adToken) { AUDIO.setAdMute(false); clearInput(); } }
    return my === adToken && res === true;   // 늦게 온 응답은 무시해요
  }
  // 다시하기: 실패·파산 화면은 광고 없이 바로 새 판 (광고는 "광고보기" 버튼으로만)
  //          클리어 화면은 판 사이 광고 (보상형을 본 판이면 한 번 건너뜀)
  async function restart() {
    cancelLater();
    const ci = G.country.rank - 1;
    if (G.result.kind === 'clear' && !G.run.rewardedSeen) await runAd(cb => Platform.commercialBreak(cb));
    newRun(ci);
  }
  async function rewarded() {
    cancelLater();
    const ok = await runAd(cb => Platform.rewardedBreak(cb));
    if (!ok) { G.result.adFailed = true; G.scene = 'result'; }   // 못 봤으면 보상 없음 + 그 버튼은 숨겨요
    return ok;
  }
  async function rewardedRevive() {
    if (!await rewarded()) return;   // 끝까지 안 봤거나 못 불러오면 보상 없음
    const r = G.run, h = G.hero;
    r.reviveUsed = true; r.rewardedSeen = true;
    h.dead = false; h.deadT = 0; h.hp = h.maxHp; h.inv = BAL.REVIVE_INVULN;
    G.eshots = []; G.aliens.forEach(a => { const d = Math.hypot(a.x - h.x, a.y - h.y) || 1; if (d < 90) { a.x += (a.x - h.x) / d * 40; a.y += (a.y - h.y) / d * 40; } });
    G.scene = 'play'; G.paused = false; AUDIO.play('revive');
    Platform.gameplayStart();
  }
  async function rewardedBankrupt() {
    if (!await rewarded()) return;
    const r = G.run;
    r.rewardedSeen = true; r.money = BAL.BANKRUPT_GIFT; r.round++;
    G.msgs.push({ text: t_('continue.ad'), t: 3, keep: true });
    AUDIO.play('revive');
    startRound();
  }

  // ---------- 전투 ----------
  function aimAt(maxAngle) {
    const h = G.hero; let bestA = null, bd = Infinity;
    for (const a of G.aliens) {
      if (a.entering && !inFloor(a)) continue;
      const dx = a.x - h.x, dy = a.y - h.y, d = Math.hypot(dx, dy);
      const ang = Math.acos(clamp((dx * h.dir.x + dy * h.dir.y) / (d || 1), -1, 1));
      if (ang <= maxAngle && d < bd) { bd = d; bestA = a; }
    }
    return bestA;
  }
  const atkMul = () => (G.hero.buff ? G.hero.buff.mul : 1);
  const atkSpd = () => (G.hero.boostT > 0 ? BAL.INVULN_ATK_SPEED : 1);   // 무적 중 공격 속도 2.5배
  function melee() {
    const h = G.hero, st = G.run.st;
    const near = mouse.on || (mArrow.id != null && mArrow.dir) ? null : aimAt(Math.PI);  // 폰·키보드: 가까운 적 쪽으로 몸을 돌려 쳐요 (마우스는 커서 쪽)
    if (mArrow.id != null && mArrow.dir) h.dir = { x: mArrow.dir.x, y: mArrow.dir.y };   // 폰 ← 화살표를 끌면 끈 방향 (GDD 0-18)
    if (near && Math.hypot(near.x - h.x, near.y - h.y) < TEMP.MELEE_RANGE + 40) { const d = Math.hypot(near.x - h.x, near.y - h.y) || 1; h.dir = { x: (near.x - h.x) / d, y: (near.y - h.y) / d }; }
    h.meleeCd = BAL.MELEE_CD / atkSpd(); h.atkT = 0;
    if (h.boostT > 0 && !reduceMotion) for (const [dl, al] of [[.04, .4], [.08, .2]]) after(dl, () => { if (G.hero && G.hero.swing) G.fx.push({ kind: 'skill', type: 'boostSlash', x: G.hero.x, y: G.hero.y, a: G.hero.swing.ang, al, t: 0, life: .12 }); });   // 빨라진 게 보이게: 흰 잔상 2개
    // 휘두르기 3단계: 예비동작 0.07 → 스윙 0.09 → 마무리 0.12 (피해는 스윙이 시작될 때)
    h.swing = { t: 0, ang: Math.atan2(h.dir.y, h.dir.x), hit: false };
    AUDIO.play('swing');
  }
  const SWING = { wind: 0.07, strike: 0.09, follow: 0.12 };
  // 무기별 타격 (GPT 타격 리뷰 review-2, 사용자 "11개 다해"):
  //   hitK = 스윙 중 무기 끝이 표적에 닿는 지점(0~1) → 피해·궤적 정점·코어·피격음을 이 한 프레임에 모아요
  //   stop = 히트스톱(초), snd = 피격음, kick = 큰 명중 카메라 킥
  const WP = {
    slash: { hitK: .2, stop: .034, snd: 'impSlash' }, bigslash: { hitK: .22, stop: .046, snd: 'impSlash', kick: true },
    thrust: { hitK: .4, stop: .026, snd: 'impThrust' }, rapid: { hitK: .4, stop: .026, snd: 'impThrust' },
    smash: { hitK: .45, stop: .05, snd: 'impSmash', dust: true }, spin: { hitK: .25, stop: .03, snd: 'impSlash' },
  };
  const wp = () => WP[G.country.melee] || WP.slash;
  function meleeStrike() {
    const h = G.hero, st = G.run.st, sw = h.swing, P = wp();
    const dmg = st.melee * atkMul(), ang0 = sw.ang;
    const mk = G.country.melee, life = FX.meleeTime(mk);
    // 궤적은 가장 강한 칸(6칸 중 3번째)이 명중 프레임에 보이게 그 칸부터 재생해요
    G.fx.push({ kind: 'melee', m: mk, x: h.x + Math.cos(ang0) * 6, y: h.y - 26 + Math.sin(ang0) * 4, h0: 26 - Math.sin(ang0) * 4, a: ang0, t: mk === 'spin' || mk === 'rapid' ? 0 : life * 2 / 6, life });
    const hits = [];
    for (const a of G.aliens) {
      const dx = a.x - h.x, dy = a.y - h.y, d = Math.hypot(dx, dy);
      if (a.dead || d > TEMP.MELEE_RANGE + a.r) continue;
      let da = Math.abs(Math.atan2(dy, dx) - ang0); if (da > Math.PI) da = Math.PI * 2 - da;
      if (d < a.r + 10 || da <= TEMP.MELEE_ARC / 2) hits.push({ a, d, nx: dx / (d || 1), ny: dy / (d || 1) });
    }
    if (!hits.length) return;   // 헛스윙: 히트스톱 없음
    hits.sort((p, q) => p.d - q.d);
    // 연속타 (리뷰 11): 0.62초 안에 이어 맞힌 3번째마다 파편 1.2배 + 금속 꼬리
    h.combo = (G.t - (h.lastHitT || -9) <= 0.62) ? (h.combo || 0) + 1 : 1; h.lastHitT = G.t;
    const finisher = h.combo >= 3 && h.combo % 3 === 0;
    let killBoss = false;
    hits.forEach((o, i) => {
      const main = i === 0;   // 대표 표적 하나만 강한 코어, 나머지는 반쯤
      const wasAlive = !o.a.dead;
      damage(o.a, dmg, o.nx, o.ny, true, { main, finisher });
      if (o.a.type === 'boss' && wasAlive && o.a.dead) killBoss = true;
    });
    const t0 = hits[0];
    // 히트스톱: 한 번만, 무기별 차등 · 보스 결정타는 길게 + 잠깐 느리게
    G.hitstop = killBoss ? .065 : P.stop;
    if (killBoss) G.slow = .12;
    // 카메라 킥 (리뷰 9): 큰 베기·보스급만, 공격축으로 2px 밀었다 돌아와요 (흔들림 끄기 존중은 그릴 때)
    if (P.kick || killBoss || t0.a.type === 'boss') G.kick = { x: t0.nx, y: t0.ny, t: 0 };
    // 내려찍기 (리뷰 8): 바닥에 납작한 고리 + 회갈색 먼지
    if (P.dust) {
      const gx = h.x + Math.cos(ang0) * 34, gy = h.y + Math.sin(ang0) * 18;
      G.fx.push({ kind: 'groundRing', x: gx, y: gy, t: 0, life: .12 });
      for (let i = 0; i < 4 && G.parts.length < 150; i++) { const an = Math.PI + (i / 3) * Math.PI; G.parts.push({ x: gx, y: gy, vx: Math.cos(an) * 40, vy: Math.sin(an) * 14 - 10, life: .14, t: 0, color: '#B1A599', s: 2 }); }
    }
    AUDIO.play(P.snd);
    if (finisher) later(() => AUDIO.play('tink'), 30);
  }
  function ranged() {
    const h = G.hero, st = G.run.st;
    const sOn = rstick.id != null && Math.hypot(rstick.x, rstick.y) > .3;   // 폰 손잡이: 민 방향 그대로
    const tgt = mouse.on || sOn ? null : aimAt(Math.PI * 75 / 180);
    let dx = h.dir.x, dy = h.dir.y;
    if (sOn) { const l = Math.hypot(rstick.x, rstick.y); dx = rstick.x / l; dy = rstick.y / l; if (Math.abs(dx) > .2) h.dir = { x: dx, y: dy }; }
    if (tgt) { const d = Math.hypot(tgt.x - h.x, tgt.y - h.y) || 1; dx = (tgt.x - h.x) / d; dy = (tgt.y - h.y) / d; if (Math.abs(dx) > .2) h.dir = { x: dx, y: dy }; }
    h.rangedCd = BAL.RANGED_CD / atkSpd(); h.atkT = 0.18; h.rangedT = 0.35; h.aimShot = Math.atan2(dy, dx); h.shotT = G.t;
    const rk = G.country.ranged;
    const quake = rk === 'quake', sp = quake ? TEMP.SHOT_SPEED * .75 : TEMP.SHOT_SPEED;
    G.shots.push({ boost: h.boostT > 0, kind: rk, x: h.x + dx * (quake ? 24 : 16), y: h.y + dy * (quake ? 24 : 16), vx: dx * sp, vy: dy * sp, dmg: st.ranged * atkMul(), life: quake ? .62 : 1.6, age: 0, hits: rk === 'boomerang' || quake ? new Set() : null });
    if (quake) {   // 체코 (사용자 확정): 도리깨를 내리쳐 땅을 따라 은빛 충격파 — 칼은 손에, 내려찍기 궤적·바닥음
      G.fx.push({ kind: 'melee', m: 'smash', x: h.x + dx * 6, y: h.y - 26 + dy * 4, h0: 26 - dy * 4, a: Math.atan2(dy, dx), t: 0, life: FX.meleeTime('smash') });
      AUDIO.play('impSmash'); if (settings.shake) G.shake = Math.max(G.shake, 1.5);
    }
    if (rk === 'water') G.fx.push({ kind: 'splash', x: h.x + dx * 18, y: h.y - 24 + dy * 8, t: 0, life: 0.2 });
    if (rk === 'wave') { AUDIO.play('swing'); G.fx.push({ kind: 'melee', m: G.country.melee === 'bigslash' ? 'bigslash' : 'slash', x: h.x + dx * 6, y: h.y - 26 + dy * 4, h0: 26 - dy * 4, a: Math.atan2(dy, dx), t: 0, life: FX.meleeTime('slash') * .8 }); }   // 검기: 칼을 휘두르는 궤적 + 검기
    if (rk === 'bullet') G.fx.push({ kind: 'muzzle', x: h.x + dx * 18, y: h.y - 24 + dy * 8, a: Math.atan2(dy, dx), t: 0, life: 0.35 });
    AUDIO.play('attack');
  }
  // ---- 나라별 고유 스킬 (skills.md 확정): 유형 5개 · 라운드마다 2회 · 쓰는 동안 0.5초 무적 · 피해 40 × F ----
  const SKB = BAL.SKILL;
  const BARRAGE_SHOT = { wave: 'wave', beam: 'beam', boomerang: 'boomerang', axe: 'axe', sling: 'sling', bullet: 'bullet', arrow: 'arrow' };   // 쏘는 무기 나라는 그 탄, 칼·창 나라는 빛줄기
  const skillOf = (c, n) => (n === 2 ? c.skill2 : c.skill);
  // 남은 횟수: 1번·2번 각각 5번 (BAL.SKILL_SHARED면 합쳐서 5번 — 1번 칸 하나를 같이 써요)
  const sLeft = n => G.run.skillsLeft[BAL.SKILL_SHARED ? 1 : n];
  // 무적 (좌·우 동시 / Space / 무적 버튼): 0.5초, 라운드마다 2번 — 고유 스킬과 따로 (사용자 결정 2026-11-25)
  function useInvuln() {
    const r = G.run, h = G.hero;
    if (!r || r.invuln <= 0 || h.dead || h.skillT > 0) return;
    r.invuln--; h.skillT = BAL.SKILL_TIME; h.boostT = BAL.SKILL_TIME;   // 무적 3초 + 그동안 공격 속도 2.5배
    G.fx.push({ kind: 'ring', x: h.x, y: h.y - 20, t: 0, life: 0.3 });
    if (settings.shake) G.shake = Math.max(G.shake, 2);
    AUDIO.play('revive');
  }
  // n = 1: 나라별 고유 스킬 (우클릭 2번 / L / 스킬 버튼) · n = 2: 두 번째 스킬 (좌클릭 2번 / ; ) — 기획팀 설계 중이라 자리만
  // 횟수: 1번·2번 합쳐 한 판에 5번 (라운드마다 안 채워져요)
  // ---- 스킬 엔진: 뼈대 5유형 함수 + 나라별 특징 sk.mod (skills-unique.md 60개, 기준 피해 80 × F) ----
  // o = { sk, n(1·2번), dmg(= 80×F), ang, dx, dy, mod }
  // 원 안 외계인 맞히기 → 맞힌 수 (o.test로 거르고, o.each로 맞은 외계인마다 넉백 등)
  function hitCircle(x, y, r, dmg, o = {}) {
    let n = 0;
    for (const a of G.aliens) {
      if (a.dead || a.entering || (o.skip && o.skip.has(a))) continue;
      const ex = a.x - x, ey = a.y - y, d = Math.hypot(ex, ey) || 1;
      if (d < r + a.r * .5 && (!o.test || o.test(a, ex, ey, d))) {
        n++; if (o.skip) o.skip.add(a);
        if (dmg > 0) damage(a, dmg, o.dx != null ? o.dx : ex / d, o.dy != null ? o.dy : ey / d, o.heavy !== false, { finisher: true, main: o.main });
        if (o.each) o.each(a, ex / d, ey / d, d);
      }
    }
    return n;
  }
  const distSeg = (px, py, x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, L = vx * vx + vy * vy || 1, q = clamp(((px - x0) * vx + (py - y0) * vy) / L, 0, 1); return Math.hypot(px - x0 - vx * q, py - y0 - vy * q); };
  function hitSeg(x0, y0, x1, y1, w, dmg, skip) {
    let n = 0; const L = Math.hypot(x1 - x0, y1 - y0) || 1;
    for (const a of G.aliens) { if (a.dead || a.entering || (skip && skip.has(a))) continue; if (distSeg(a.x, a.y, x0, y0, x1, y1) < w + a.r * .5) { n++; if (skip) skip.add(a); damage(a, dmg, (x1 - x0) / L, (y1 - y0) / L, true, { finisher: true }); } }
    return n;
  }
  const after = (t, fn) => G.timers.push({ t, fn });
  const BAL_WEAK = .3;
  // 제어(멈춤·봉인·묶기·띄우기): 보스에게는 0.3초 멈춤만 (skills-unique 규칙)
  function control(a, kind, t) { if (a.type === 'boss') a.freeze = Math.max(a.freeze || 0, .3); else a[kind] = Math.max(a[kind] || 0, t); }
  // 스킬이 남기는 물체 (박힌 도끼·씨앗·도는 칼날 등): update(dt) → false면 사라져요, draw(at)
  const ent = o => G.ents.push(o);
  // 장수 효과: 이동 속도 배율 · 받는 피해 배율
  function heroSpd() {
    const h = G.hero; let k = 1;
    for (const z of G.zones) if (z.k === 'speedZone' && Math.hypot(h.x - z.x, h.y - z.y) < SKB.ZONE_D / 2) k *= 1.5;   // 뉴질랜드 1
    return k;
  }
  const heroDmgMul = () => { const h = G.hero; for (const z of G.zones) if (z.k === 'half' && Math.abs(h.x - z.x) < SKB.ZONE_D / 2 && Math.abs(h.y - z.y) < SKB.ZONE_D / 2 * .7) return .5; return 1; };   // 체코 1   // 게임 시간 기준 예약 (일시정지·히트스톱에 맞춰요)
  const sfx = (type, x, y, life, extra) => G.fx.push(Object.assign({ kind: 'skill', type, x, y, t: 0, life }, extra));
  // 박힌 도끼 (캐나다 1): 2초 동안 닿는 외계인 0.5초마다
  function axeEnt(x, y, dmg) { let t = 0, tick = .5; ent({ x, y, update(dt) { t += dt; this.t = t; if ((tick -= dt) <= 0) { tick += .5; hitCircle(x, y, 20, dmg, { heavy: false, main: false }); } return t < 2; }, t: 0,
    draw(at) { at(x, y, () => { ctx.save(); ctx.globalAlpha = 1 - Math.max(0, this.t - 1.6) / .4; ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 8, y - 8 * GK()); ctx.lineTo(x + 8, y + 8 * GK()); ctx.moveTo(x + 8, y - 8 * GK()); ctx.lineTo(x - 8, y + 8 * GK()); ctx.stroke(); FX.drawShot('axe', x, y - 12, 0, 0); ctx.restore(); }); } }); }
  // 씨앗 (뉴질랜드 2): 1초 뒤 작게 터져요
  function seedEnt(x, y, dmg) { let t = 0, done = false; ent({ x, y, t: 0, update(dt) { t += dt; this.t = t; if (t >= 1 && !done) { done = true; hitCircle(x, y, 40, dmg); sfx('ringOut', x, y, .3, { r: 40 }); AUDIO.play('hit'); } return t < 1.05; },
    draw(at) { at(x, y, () => { ctx.save(); ctx.fillStyle = SKG; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x, y - 3, 3 + (t => (t > .8 ? (t - .8) * 10 : 0))(this.t), 0, 7); ctx.fill(); ctx.restore(); }); } }); }
  // 은빛 분신 (콜롬비아 2): 1초 뒤 같은 길을 다시 달려요
  function echoEnt(path, look, dmg) { const sk = new Set(), N = path.length; let t = 0, gT = 0;
    ent({ x: path[0][0], y: path[0][1], update(dt) { t += dt; const [x, y] = path[Math.min(N - 1, Math.floor(t / SKB.DASH_TIME * (N - 1)))]; this.x = x; this.y = y;
      hitCircle(x, y, 32, dmg, { skip: sk }); if ((gT -= dt) <= 0) { gT = .045; G.fx.push({ kind: 'ghost', x, y, cell: look.cell, flip: look.flip, folder: look.folder, t: 0, life: .45, clone: true }); } return t < SKB.DASH_TIME; }, draw() {} }); }
  // 튕기는 도끼 (슬로바키아 2): 맞으면 가까운 다음 외계인으로 (최대 3번)
  function ricochet(a, s) {
    if (s.bounces <= 0) return;
    const nx = G.aliens.filter(b => !b.dead && !b.entering && !s.chain.has(b) && Math.hypot(b.x - a.x, b.y - a.y) < 240).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0];
    if (!nx) return;
    const ex = nx.x - a.x, ey = nx.y - a.y, d = Math.hypot(ex, ey) || 1, sp = TEMP.SHOT_SPEED;
    G.shots.push(Object.assign({}, s, { x: a.x, y: a.y, vx: ex / d * sp, vy: ey / d * sp, life: .9, age: 0, bounces: s.bounces - 1 }));
    sfx('chainLink', a.x, a.y, .35, { x1: nx.x, y1: nx.y });
  }
  const SKILL_FN = {
    dash(o) {
      const m = o.mod, h = G.hero, f = FIELD.floor;
      if (m.k === 'blink') {   // 네덜란드 2: 그 자리로 순간이동하며 사이 줄을 베어요
        const x1 = o.tx, y1 = o.ty;
        hitSeg(h.x, h.y, x1, y1, 22, o.dmg * m.mul); sfx('blink', h.x, h.y, .5, { x1, y1 }); h.x = x1; h.y = y1; h.skillT = Math.max(h.skillT, .2); AUDIO.play('swing');
        return;
      }
      if (m.k === 'dashInv') h.skillT = Math.max(h.skillT, m.inv);   // 룩셈부르크 1: 돌진 무적 1초
      // 그 자리까지 달려요 (GDD 0-17, 거리 제한 없음). 빠르기는 예전 그대로 (260을 0.35초에)
      let ex = o.tx, ey = o.ty, L = Math.hypot(ex - h.x, ey - h.y);
      if (L < 30) { ex = h.x + o.dx * 30; ey = h.y + o.dy * 30; L = 30; }
      if (m.k === 'long') { ex = clamp(h.x + (ex - h.x) * 2, f.x0 + 12, f.x1 - 12); ey = clamp(h.y + (ey - h.y) * 2, f.y0 + 22, f.y1); L = Math.hypot(ex - h.x, ey - h.y); }   // 리투아니아 1: 목표 너머로 같은 거리만큼 더 (벽에서 멈춤)
      let dur = Math.max(.12, L / (SKB.DASH_DIST / SKB.DASH_TIME));
      if (m.k === 'seal') dur *= .65;                   // 핀란드 1: 가장 빠른 돌진
      if (m.k === 'leap') dur = .4 + L / 1600;          // 멕시코 1: 높이 뛰어 그 자리로
      h.dash = { t: 0, dx: o.dx, dy: o.dy, a0: o.ang, base: o.dmg, dmg: o.dmg * (m.mul || 1), hit: new Set(), gT: 0, pT: 0, mod: m, k: m.k, x0: h.x, y0: h.y, sx: h.x, sy: h.y, ex, ey, L, tx: o.tx, ty: o.ty, path: [[h.x, h.y]], dur, carry: [], seeds: 0, inv: 0, look: heroLookNow() };
    },
    area(o) {
      const m = o.mod, HERO = G.hero, R = SKB.AREA_R, f = FIELD.floor;
      // 그 자리를 중심으로 터져요 (GDD 0-17). 장수에서 뻗는 모양(사자의 포효·팔랑크스·균열)과 장수 둘레(튀르키예 1 예외)·움직이는 회전베기는 장수 자리에서
      const h = ['orbit', 'spinMove', 'fear', 'phalanx', 'crack'].includes(m.k) ? HERO : { x: o.tx, y: o.ty };
      const near3 = m.k === 'chain3' ? G.aliens.filter(a => !a.dead && !a.entering && Math.hypot(a.x - h.x, a.y - h.y) < 340).sort((p, q) => Math.hypot(p.x - h.x, p.y - h.y) - Math.hypot(q.x - h.x, q.y - h.y)).slice(0, 3) : [];
      if (m.k === 'pull') { hitCircle(h.x, h.y, R, o.dmg * m.mul, { each: (a, nx, ny) => { a.kb = { x: -nx * 320, y: -ny * 320 }; a.stun = .25; } }); sfx('pull', h.x, h.y, .6); }   // 아일랜드 1: 끌어당기기
      else if (m.k === 'grow') {   // 덴마크 2: 맞힌 수만큼 원이 커져 한 번 더
        const r1 = R * .75, n = hitCircle(h.x, h.y, r1, o.dmg * m.mul1), r2 = r1 * (1 + .15 * n);
        sfx('grow', h.x, h.y, .75, { r1, r2 }); after(.25, () => hitCircle(h.x, h.y, r2, o.dmg * m.mul2));
      }
      else if (m.k === 'twoRings') {   // 오스트리아 2: 안쪽 원 → 0.3초 뒤 바깥 원
        const r1 = R * .55, hx = h.x, hy = h.y; hitCircle(hx, hy, r1, o.dmg * m.mul); sfx('twoRings', hx, hy, .8, { r1, r2: R });
        after(.3, () => hitCircle(hx, hy, R, o.dmg * m.mul, { test: (a, ex, ey, d) => d >= r1 - 8 }));
      }
      else if (m.k === 'cone') { hitCircle(h.x, h.y, R * 2, o.dmg * m.mul, { test: (a, ex, ey) => Math.abs(Math.atan2(Math.sin(Math.atan2(ey, ex) - o.ang), Math.cos(Math.atan2(ey, ex) - o.ang))) < Math.PI / 3 }); sfx('cone', h.x, h.y, .45, { a: o.ang }); }   // 프랑스 1: 앞 120° 부채꼴, 두 배 멀리
      else if (m.k === 'spinMove') {   // 스페인 2: 빙글 돌며 보는 방향으로 움직여요
        const sk = new Set(), dm = o.dmg * m.mul, x0 = h.x, y0 = h.y, T = Math.max(.65, Math.hypot(o.tx - x0, o.ty - y0) / 230); let t = 0, x = h.x, y = h.y;   // 돌면서 그 자리까지
        ent({ k: 'spin', update(dt) { t += dt; const q = Math.min(1, t / T); x = x0 + (o.tx - x0) * q; y = y0 + (o.ty - y0) * q;
          hitCircle(x, y, 54, dm, { skip: sk }); this.x = x; this.y = y; this.t = t; return t < T; }, x, y, t: 0,
          draw(at) { at(this.x, this.y, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - this.t / T * .5; ctx.strokeStyle = SKW; ctx.lineWidth = 3; gEll(this.x, this.y - 14, 34, this.t * 20, this.t * 20 + 4.2); ctx.stroke(); ctx.strokeStyle = SKS; ctx.lineWidth = 1.5; gEll(this.x, this.y, 54); ctx.stroke(); ctx.restore(); }); } });
      }
      else if (m.k === 'widen') {   // 체코 2: 사슬이 늘어나며 세 바퀴, 갈수록 넓게
        [50, 95, 140].forEach((r, i) => after(i * .25 + .001, () => { hitCircle(h.x, h.y, r, o.dmg * m.mul); sfx('ringOut', h.x, h.y, .35, { r }); }));
      }
      else if (m.k === 'chain3' && near3.length) {   // 일본 2: 가까운 3마리에게 차례로 순간이동하며 베기
        const pts = [[HERO.x, HERO.y]]; HERO.skillT = Math.max(HERO.skillT, .45);
        near3.forEach((a, i) => after(i * .12 + .001, () => { if (a.dead) return; const H = G.hero, ex = a.x - H.x, ey = a.y - H.y, d = Math.hypot(ex, ey) || 1;
          H.x = clamp(a.x - ex / d * 22, f.x0 + 12, f.x1 - 12); H.y = clamp(a.y - ey / d * 18, f.y0 + 22, f.y1); damage(a, o.dmg * m.mul, ex / d, ey / d, true, { finisher: true }); pts.push([a.x, a.y]); AUDIO.play('impSlash'); }));
        sfx('chain', HERO.x, HERO.y, .75, { pts });
      }
      else if (m.k === 'gust') { hitCircle(h.x, h.y, R, o.dmg * m.mul, { dx: o.dx, dy: o.dy, each: a => { a.kb = { x: o.dx * 620, y: o.dy * 520 }; a.stun = .3; } }); sfx('gust', h.x, h.y, .6, { a: o.ang }); }   // 포르투갈 1: 보는 방향으로 날려요
      else if (m.k === 'pole') {   // 폴란드 2: 아주 긴 창 한 자루가 한 바퀴 (멀리, 가늘게)
        const sk = new Set(), L = R * 1.6, dm = o.dmg * m.mul; let t = 0, prev = o.ang;
        ent({ x: h.x, y: h.y, a: o.ang, t: 0, update(dt) { t += dt; const H = G.hero, cur = o.ang + Math.PI * 2 * Math.min(1, t / .45); this.x = H.x; this.y = H.y; this.a = cur; this.t = t;
          hitCircle(H.x, H.y, L, dm, { skip: sk, test: (a, ex, ey) => { const q = ((Math.atan2(ey, ex) - prev) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); return q <= cur - prev + .2; } }); prev = cur; return t < .5; },
          draw(at) { const e = this; at(e.x, e.y, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; const ex = e.x + Math.cos(e.a) * L, ey = e.y - 20 + Math.sin(e.a) * L * GK();
            ctx.globalAlpha = .35; ctx.strokeStyle = SKS; ctx.lineWidth = 1; gEll(e.x, e.y, L, e.a - 1.2, e.a); ctx.stroke(); ctx.globalAlpha = .95; ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(e.x, e.y - 20); ctx.lineTo(ex, ey); ctx.stroke();
            ctx.fillStyle = SKG; ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, 7); ctx.fill(); ctx.restore(); }); } });
      }
      else if (m.k === 'crack') {   // 슬로바키아 1: 앞으로 뻗는 지그재그 균열 (체코 충격파 = 둥근 물결과 다르게)
        const pts = [[h.x, h.y]], sk = new Set();
        const CL = Math.max(240, Math.hypot(o.tx - h.x, o.ty - h.y)) / 8;   // 장수 → 그 자리까지 (짧으면 240)
        for (let i = 1; i <= 8; i++) { const s = i * CL, w = i === 8 ? 0 : (i % 2 ? 14 : -14); pts.push([clamp(h.x + o.dx * s - o.dy * w, f.x0, f.x1), clamp(h.y + o.dy * s * .85 + o.dx * w, f.y0 + 6, f.y1)]); }
        pts.forEach((p, i) => i && after(i * .035, () => hitSeg(pts[i - 1][0], pts[i - 1][1], p[0], p[1], 20, o.dmg * m.mul, sk)));
        sfx('crackLine', h.x, h.y, .8, { pts }); AUDIO.play('impSmash');
      }
      else if (m.k === 'orbit') {   // 튀르키예 1: 굽은 칼날 3개가 2초 동안 둘레를 돌아요
        let t = 0, tick = .25; const dm = o.dmg / m.div;   // 0.25·0.75·1.25·1.75초 = 2초에 4번 (QA M4)
        ent({ x: h.x, y: h.y, t: 0, update(dt) { t += dt; this.t = t; const H = G.hero; this.x = H.x; this.y = H.y; if ((tick -= dt) <= 0) { tick += .5; hitCircle(H.x, H.y, 85, dm, { heavy: false, main: false }); } return t < 2; },
          draw(at) { const e = this; at(e.x, e.y, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.globalAlpha = Math.min(1, (2 - e.t) / .3);
            for (let i = 0; i < 3; i++) { const q = e.t * 7 + i * Math.PI * 2 / 3, x = e.x + Math.cos(q) * 62, y = e.y - 18 + Math.sin(q) * 62 * GK();
              ctx.strokeStyle = SKW; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 13, q + .6, q + 2.6); ctx.stroke(); ctx.strokeStyle = SKG; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, 9, q + .9, q + 2.3); ctx.stroke(); }
            ctx.restore(); }); } });
      }
      else if (m.k === 'lift') { hitCircle(h.x, h.y, R, o.dmg * m.mul, { heavy: false, each: a => { control(a, 'air', 1); if (a.type !== 'boss') { a.airH = 1; a.kb = { x: 0, y: 0 }; } } }); sfx('liftUp', h.x, h.y, .6); }   // 칠레 1: 띄우기 1초 (보스 0.3초 멈춤)
      else if (m.k === 'roar') { hitCircle(h.x, h.y, R * 1.1, o.dmg * m.mul, { heavy: false, each: a => control(a, 'freeze', 1.2) }); sfx('roar', h.x, h.y, .7, { r: R * 1.1 }); }   // 콜롬비아 1: 1.2초 멈춤 (보스 0.3초)
      else if (m.k === 'fear') {   // 룩셈부르크 2: 앞쪽 넓은 반원 → 1초 공포 (보스 0.3초 멈춤)
        hitCircle(h.x, h.y, R * 1.2, o.dmg * m.mul, { heavy: false, test: (a, ex, ey) => ex * o.dx + ey * o.dy > 0, each: a => control(a, 'fear', m.t) }); sfx('mane', h.x, h.y, .7, { a: o.ang });
      }
      else if (m.k === 'phalanx') {   // 그리스 1: 앞쪽 직사각형을 창 5개가 동시에 → 약화 3초 (보스도)
        const L = 180, W = 46; hitCircle(h.x, h.y, L + 20, o.dmg * m.mul, { dx: o.dx, dy: o.dy, test: (a, ex, ey) => { const u = ex * o.dx + ey * o.dy, v = Math.abs(-ex * o.dy + ey * o.dx); return u > 0 && u < L + a.r * .5 && v < W + a.r * .5; }, each: a => { a.weak = m.t; } });
        sfx('phalanx', h.x, h.y, .5, { a: o.ang, L, W });
      }
      else if (m.k === 'wings') {   // 멕시코 2: 왼쪽 먼저, 0.2초 뒤 오른쪽
        const wing = side => { const H = h; hitCircle(H.x, H.y, R * 1.1, o.dmg * m.mul, { test: (a, ex, ey) => { const u = Math.atan2(ey, ex) - o.ang, q = Math.atan2(Math.sin(u), Math.cos(u)); return side < 0 ? q <= .15 && q > -Math.PI * .8 : q >= -.15 && q < Math.PI * .8; } }); sfx('wing', H.x, H.y, .35, { a: o.ang, side }); AUDIO.play('impSlash'); };
        wing(-1); after(.2, () => wing(1));
      }
      else if (m.k === 'blast') { hitCircle(h.x, h.y, R, o.dmg * m.mul, { each: (a, nx, ny) => { a.kb = { x: nx * 640, y: ny * 640 }; a.stun = .3; } }); sfx('blast', h.x, h.y, .55); }   // 독일 1: 사방으로 멀리
      else { hitCircle(h.x, h.y, R, o.dmg * (m.mul || 1)); sfx('area', h.x, h.y, .5); }
      G.hitstop = Math.max(G.hitstop || 0, .05);
    },
    barrage(o) { const m = o.mod; G.hero.barrageN = o.n;   // 그 자리를 향해 쏴요 (GDD 0-17)
      if (m.k === 'javelin3') {   // 리투아니아 2: 하늘로 던진 창이 앞 일직선 세 곳에 차례로
        const h = G.hero, f = FIELD.floor; [1 / 3, 2 / 3, 1].forEach((s2, i) => { const x = clamp(h.x + (o.tx - h.x) * s2, f.x0 + 10, f.x1 - 10), y = clamp(h.y + (o.ty - h.y) * s2, f.y0 + 10, f.y1);   // 장수 → 그 자리 일직선 세 곳, 마지막이 그 자리
          sfx('javFall', x, y, .3 + i * .22, { d: .3 + i * .22 }); after(.3 + i * .22, () => { hitCircle(x, y, 38, o.dmg * m.mul); sfx('ringOut', x, y, .3, { r: 38 }); AUDIO.play('impact'); }); });
        h.atkT = .2; return;
      }
      G.hero.barrage = { t: 0, n: 0, N: m.k === 'boomer' || m.k === 'stick' || m.k === 'ricochet' ? 1 : m.n || SKB.BARRAGE_N, base: o.dmg, dmg: o.dmg / (m.div || SKB.BARRAGE_DIV), mod: m, ang: o.ang, tx: o.tx, ty: o.ty }; },
    zone(o) {
      const h = G.hero, f = FIELD.floor, m = o.mod;
      G.zones.push({ x: clamp(o.tx, f.x0 + 40, f.x1 - 40), y: clamp(o.ty, f.y0 + 30, f.y1 - 10), t: 0, tick: SKB.ZONE_TICK / 2,   // 그 자리에 (GDD 0-17) · 첫 틱 0.25초 → 3초에 6번 (balance.md, QA M1)
        base: o.dmg, dmg: o.dmg / (m.div || SKB.ZONE_DIV), mod: m, k: m.k, rings: [], nextRing: .15,
        arrows: o.n === 1 && G.country.ranged === 'arrow', slow: o.n === 2 && G.country.key === 'finland' });   // 한국 화살비 · 핀란드 눈 함정(느리게)
      { const z = G.zones[G.zones.length - 1]; if (m.life) z.life = m.life; if (m.k === 'ring6') { z.inside = new Map(); z.cnt = new Map(); } }
      if (m.k === 'vortex') { const z = G.zones[G.zones.length - 1]; z.t = -.35; z.tick += .35; z.x0 = h.x; z.y0 = h.y; }   // 칠레 2: 검은 바람이 날아가 떨어진 자리에
    },
  };
  // 끌지 않고 쓸 때의 자리: 전장에서 가장 가까운 외계인, 없으면 바라보는 방향 앞 120 (GDD 0-17)
  function autoTarget() {
    const h = G.hero; let best = null, bd = 1e9;
    for (const a of G.aliens) { if (a.dead || a.entering) continue; const d = Math.hypot(a.x - h.x, a.y - h.y); if (d < bd) { bd = d; best = a; } }
    return best ? { x: best.x, y: best.y } : { x: h.x + h.dir.x * 120, y: h.y + h.dir.y * 120 * .8 };
  }
  // 스킬 대표 그림 (13차 60장): 그림 한 장을 코드로 키우기·늘이기·돌리기·사라지기. 판정·조준 표시는 그대로
  // 겹겹이 효과 (디자인 229e0d9 "스킬 이펙트 — 나라 색 + 겹겹이"): 흔들림 끄기·움직임 줄이기면 화면 번쩍·파편 끔
  const layerFx = () => settings.shake && !reduceMotion;
  function skillLayers(sk, m, tx, ty, ang, col) {
    const h = G.hero, k = m.k;
    if (layerFx()) G.skillFlash = .06;   // 쓰는 순간 화면 번쩍 (흰 8%)
    if (sk.type === 'dash') {   // 끝에서 충격 고리 40→120 + 파편 8개 · 지나간 길 바닥 긁힘 1초
      const d = h.dash, T = d ? d.dur * (k === 'returnDash' ? 2 : 1) : .2;
      after(T, () => { const H = G.hero; if (!H) return; sfx('ringFx', H.x, H.y, .25, { r0: 20, r1: 60, col }); if (layerFx()) sfx('debris', H.x, H.y, .6, { n: 8, col, seed: G.t }); if (d && d.path) sfx('scrape', 0, 0, 1, { pts: d.path.filter((_, i) => i % 2 === 0).map(p => [p[0], p[1]]), col }); });
    } else if (sk.type === 'area' && k !== 'orbit') {   // 가운데 섬광 0.08 · 충격 고리 2겹(0.1초 차) · 파편 12개(중력) · 그을림 1.5초
      const cx = ['fear', 'phalanx', 'crack', 'arcs8'].includes(k) ? h.x : tx, cy = ['fear', 'phalanx', 'crack', 'arcs8'].includes(k) ? h.y : ty, R = k === 'cone' ? SKB.AREA_R * 2 : SKB.AREA_R;
      sfx('coreFlash', cx, cy, .08, { col }); sfx('ringFx', cx, cy, .35, { r0: 20, r1: R, col }); after(.1, () => sfx('ringFx', cx, cy, .35, { r0: 20, r1: R * .8, col }));
      if (layerFx()) sfx('debris', cx, cy, .7, { n: 12, col, seed: G.t, grav: 1 });
      sfx('scorch', cx, cy, 1.5, { r: R * .55 });
    }
  }
  function skillArt(sk, n, m, tx, ty, ang, x0, y0) {
    const h = G.hero, k = m.k, img = 'skill/u/' + G.country.key + '-' + n, cc = (SKILL_COL[G.country.key] || [])[n - 1] || ['#FFFFFF', '#E8D9A8'], b = { img, ang, black: k === 'vortex', col: cc }, dist = Math.hypot(tx - x0, ty - y0);
    skillLayers(sk, m, tx, ty, ang, cc);
    if (k === 'orbit') return sfx('art', h.x, h.y, 2, Object.assign(b, { mode: 'orbit' }));   // 튀르키예 1: 장수 둘레를 2초 돌아요
    if (sk.type === 'zone') { const z = G.zones[G.zones.length - 1]; if (z) sfx('art', z.x, z.y, (z.life || SKB.ZONE_TIME) - z.t, Object.assign(b, { mode: 'zone', z })); return; }
    if (sk.type === 'dash') {
      const d = h.dash;
      if (k === 'leap') return sfx('art', tx, ty, (d ? d.dur : .5) + .5, Object.assign(b, { mode: 'drop', delay: Math.max(0, (d ? d.dur : .5) - .08), S: 190 }));   // 멕시코 1: 착지 순간 독수리
      if (k === 'blink') return sfx('art', x0, y0, .5, Object.assign(b, { mode: 'beam', len: Math.max(80, dist), H: 90 }));
      if (k === 'dashInv') return sfx('art', x0, y0, (d ? d.dur : .35) + .25, Object.assign(b, { mode: 'front', S: 110 }));   // 룩셈부르크 1: 앞에 붙어 함께
      return sfx('art', x0, y0, (d ? d.dur * (k === 'returnDash' ? 2 : 1) : .35) + .35, Object.assign(b, { mode: 'trail', H: 86 }));   // 지나간 길을 따라 늘어나요
    }
    if (sk.type === 'area') {
      if (k === 'fear' || k === 'phalanx' || k === 'crack') return sfx('art', h.x, h.y, .6, Object.assign(b, { mode: 'beam', len: k === 'phalanx' ? 200 : k === 'fear' ? SKB.AREA_R * 1.3 : Math.max(240, dist), H: k === 'phalanx' ? 130 : k === 'fear' ? 200 : 90, floor: k !== 'fear' }));
      const rot = k === 'cone' || k === 'gust';
      return sfx('art', k === 'arcs8' ? h.x : tx, k === 'arcs8' ? h.y : ty, .6, Object.assign(b, { mode: 'burst', rot, S: (k === 'cone' ? SKB.AREA_R * 2 : k === 'widen' ? 300 : k === 'chain3' ? 220 : SKB.AREA_R * 2.1) }));
    }
    // 연사
    if (k === 'javelin3') { [1 / 3, 2 / 3, 1].forEach((q, i) => sfx('art', x0 + (tx - x0) * q, y0 + (ty - y0) * q, .3 + i * .22 + .35, Object.assign({}, b, { mode: 'drop', delay: .1 + i * .22, S: 130 }))); return; }   // 리투아니아 2: 같은 그림 3번
    if (k === 'lob') return sfx('art', tx, ty, 1.6, Object.assign(b, { mode: 'drop', delay: 0, S: 150, hold: 1.2 }));
    if (k === 'arcs8') return sfx('art', h.x, h.y, .85, Object.assign(b, { mode: 'burst', S: 200 }));   // 헝가리 1: 사방 8번
    return sfx('art', x0, y0, .6, Object.assign(b, { mode: 'beam', len: Math.min(340, dist + 60), H: 100 }));   // 그 자리를 향해 뻗어요
  }
  function useSkill(n = 1, target) {
    const r = G.run, h = G.hero, f = FIELD.floor;
    if (!r || sLeft(n) <= 0 || h.dead || h.dash || h.barrage) return;
    r.skillsLeft[BAL.SKILL_SHARED ? 1 : n]--;
    const sk = skillOf(G.country, n), dmg = SKB.DMG * r.st.F, m = sk.mod || {};
    const tg = target || autoTarget(), tx = clamp(tg.x, f.x0 + 12, f.x1 - 12), ty = clamp(tg.y, f.y0 + 22, f.y1);   // 전장 밖이면 가장자리에 붙여요
    let ang = Math.atan2(ty - h.y, tx - h.x); if (Math.hypot(tx - h.x, ty - h.y) < 4) ang = Math.atan2(h.dir.y, h.dir.x);
    if (m.k !== 'orbit') h.dir = { x: Math.cos(ang), y: Math.sin(ang) };   // 고른 쪽을 바라봐요 (튀르키예 1은 예외)
    const hx0 = h.x, hy0 = h.y;
    SKILL_FN[sk.type]({ sk, n, dmg, ang, dx: Math.cos(ang), dy: Math.sin(ang), tx, ty, mod: m });
    skillArt(sk, n, m, tx, ty, ang, hx0, hy0);
    if (tg.pc && m.k !== 'orbit') sfx('aimFlash', tx, ty, .35, { r: aimR(sk), type: sk.type });   // PC: 쓰는 순간만 커서 자리에 목표 원
    // 외침: 그 나라에서 유명한 말 (번역 안 함) + 스킬 이름(설정 언어)
    G.msgs = G.msgs.filter(m => !m.shout);
    G.msgs.push({ text: sk.shout, sub: t_((n === 2 ? 'skill2.name.' : 'skill.name.') + String(G.country.rank).padStart(2, '0')), t: n === 2 ? 1.6 : 1.2, life0: n === 2 ? 1.6 : 1.2, shout: true, rtl: G.country.lang === 'he' });   // 2번 외침은 길어서 1.6초
    if (settings.shake) G.shake = Math.max(G.shake, sk.type === 'area' ? 4 : 2);
    AUDIO.play('skill');
  }
  // 스킬 진행 (updatePlay에서 매 프레임)
  function updateSkills(dt) {
    const h = G.hero, f = FIELD.floor;
    for (const tm of G.timers) { tm.t -= dt; if (tm.t <= 0 && !tm.done) { tm.done = true; tm.fn(); } }
    G.timers = G.timers.filter(tm => !tm.done);
    if (h.dash) {   // 돌진: 0.35초에 260 · 길 위 외계인 1번씩
      const d = h.dash, m = d.mod;
      d.t += dt; d.gT -= dt;
      // 시작 → 끝 사이를 시간 비율로 (끝은 언제나 그 자리). 지그재그·곡선은 옆으로 비껴 가다 끝에서 만나요
      const q = Math.min(1, d.t / d.dur), sq = d.k === 'accel' ? .5 * q + .5 * q * q : q;   // 폴란드 1: 달릴수록 빨라져요 (평균 1)
      const ux = (d.ex - d.sx) / (d.L || 1), uy = (d.ey - d.sy) / (d.L || 1);
      const off = d.k === 'zigzag' ? 46 * (q < 1 / 3 ? q * 3 : q < 2 / 3 ? 1 - (q - 1 / 3) * 6 : -1 + (q - 2 / 3) * 3)   // 아일랜드 2: 두 번 꺾기
        : d.k === 'curve' ? Math.sin(Math.PI * q) * Math.min(160, d.L * .3) : 0;   // 튀르키예 2: 둥글게 휘어지며
      const px = h.x, py = h.y;
      h.x = clamp(d.sx + (d.ex - d.sx) * sq - uy * off, f.x0 + 12, f.x1 - 12); h.y = clamp(d.sy + (d.ey - d.sy) * sq + ux * off * .8, f.y0 + 22, f.y1);
      let dx = h.x - px, dy = h.y - py; { const l = Math.hypot(dx, dy); if (l > .01) { dx /= l; dy /= l; } else { dx = ux; dy = uy; } }
      d.dx = dx; d.dy = dy;
      h.moving = true; h.walkT += dt; d.path.push([h.x, h.y]);
      const offs = d.k === 'clones' ? [0, 30, -30] : [0];   // 스웨덴 1: 은빛 분신 2명이 양옆에서
      if (d.gT <= 0) { d.gT = .045; const g = heroLookNow(); for (const o of offs) G.fx.push({ kind: 'ghost', x: h.x - dy * o, y: h.y + dx * o * .8, cell: g.cell, flip: g.flip, folder: g.folder, t: 0, life: o ? .5 : .4, clone: !!o }); }
      for (const o of (d.k === 'leap' ? [] : offs)) for (const a of G.aliens) if (!a.dead && !a.entering && !d.hit.has(a) && Math.hypot(a.x - (h.x - dy * o), a.y - (h.y + dx * o * .8)) < a.r + 24) {
        d.hit.add(a); let dmg = d.dmg;
        if (d.k === 'focus') { if (!d.first) { d.first = a; dmg = d.base * m.first; sfx('cross', a.x, a.y, .4); } else dmg = d.base * m.rest; }   // 스페인 1: 첫 마리에 몰아서
        if (d.k === 'accel') dmg = d.base * (m.from + (m.to - m.from) * Math.min(1, d.t / d.dur));   // 뒤에 맞을수록 세게
        damage(a, dmg, dx, dy, true, { finisher: true, marking: d.k === 'mark' });
        if (d.k === 'mark') { a.mark = m.t; a.markX = m.x; }   // 덴마크 1: 표식 2초
        if (d.k === 'invHit' && d.inv < m.max - 1e-6) { d.inv += m.per; sfx('goldDot', a.x, a.y, .4); }   // 헝가리 2: 맞힐 때마다 무적 +0.2초
        if (d.k === 'seal') control(a, 'seal', 1);            // 핀란드 1: 눈에 덮여 1초 공격 못 함 (보스 0.3초 멈춤)
        if (d.k === 'wallSlam' && a.type !== 'boss') d.carry.push(a);   // 프랑스 2: 앞으로 밀고 가요
      }
      for (const [i, a] of d.carry.entries()) if (!a.dead) { a.x = h.x + dx * (30 + i * 10); a.y = h.y + dy * (30 + i * 10) * .8; a.stun = .2; a.kb = { x: 0, y: 0 }; }
      if (d.k === 'seeds' && d.seeds < 3 && d.t >= d.dur * (.2 + d.seeds * .3)) { d.seeds++; seedEnt(h.x, h.y, d.base * m.seed); }   // 뉴질랜드 2: 씨앗 3개
      if (d.k === 'prints') { d.pT += Math.hypot(h.x - px, h.y - py); if (d.pT > 22) { d.pT = 0; G.marks.push({ x: h.x, y: h.y, a: Math.atan2(dy, dx), t: 0, life: 2, tick: .5, dmg: d.base / m.div }); } }   // 오스트리아 1: 말발굽 자국
      if (d.t >= d.dur && d.k === 'returnDash' && !d.back) { d.back = true; d.t = 0; d.sx = h.x; d.sy = h.y; d.ex = d.x0; d.ey = d.y0; d.L = Math.hypot(d.ex - d.sx, d.ey - d.sy); d.hit = new Set(); }   // 이스라엘 2: 원래 자리로   // 이스라엘 2: 베고 원래 자리로
      else if (d.t >= d.dur) {
        if (d.k === 'wallSlam') for (const a of d.carry) {   // 벽에 부딪히면 더 아파요
          if (a.dead) continue;
          const nearWall = a.x < f.x0 + a.r + 6 || a.x > f.x1 - a.r - 6 || a.y < f.y0 + 16 || a.y > f.y1 - 6;
          a.kb = { x: dx * 200, y: dy * 200 };
          if (nearWall) { damage(a, d.base * m.slam, dx, dy, true); sfx('star', a.x, a.y, .35); AUDIO.play('impact'); }
        }
        if (d.k === 'iai') { const x0 = d.x0, y0 = d.y0, x1 = h.x, y1 = h.y; after(.4, () => { hitSeg(x0, y0, x1, y1, 26, d.base * m.cut); sfx('iai', x0, y0, .35, { x1, y1 }); sfx('art', x0, y0, .35, { img: 'skill/u/' + G.country.key + '-1', mode: 'beam', ang: Math.atan2(y1 - y0, x1 - x0), len: Math.max(80, Math.hypot(x1 - x0, y1 - y0)), H: 130, bright: true }); AUDIO.play('impSlash'); }); }   // 일본 1: 칼을 넣는 순간 지나간 줄 전체
        if (d.k === 'invHit' && d.inv) h.skillT = Math.max(h.skillT, d.inv);
        if (d.k === 'spearEnd') G.shots.push({ kind: 'lance', x: h.x + dx * 16, y: h.y + dy * 16, vx: dx * TEMP.SHOT_SPEED * 1.3, vy: dy * TEMP.SHOT_SPEED * 1.3, dmg: d.base * m.spear, life: .7, age: 0, skill: true, hits: new Set() });   // 그리스 2: 끝에서 창 던지기
        if (d.k === 'leap') { hitCircle(h.x, h.y, 70, d.base * m.mul); sfx('ringOut', h.x, h.y, .4, { r: 70 }); if (settings.shake) G.shake = Math.max(G.shake, 5); AUDIO.play('impSmash'); }   // 착지
        if (d.k === 'echo') { const path = d.path.slice(), look = d.look, dm = d.base * m.clone; after(1, () => echoEnt(path, look, dm)); }   // 콜롬비아 2
        if (d.k === 'endSmash') { hitCircle(h.x, h.y, 60, d.base * m.smash); sfx('crack', h.x, h.y, .6); if (settings.shake) G.shake = Math.max(G.shake, 4); AUDIO.play('impSmash'); }   // 독일 2: 끝에서 내려찍기
        h.dash = null;
      }
    }
    for (const mk of G.marks) {   // 바닥 자국: 밟는 외계인 0.5초마다
      mk.t += dt; mk.tick -= dt;
      if (mk.tick <= 0) { mk.tick += .5; hitCircle(mk.x, mk.y, 16, mk.dmg, { heavy: false, main: false, test: al => G.t - (al.printT == null ? -9 : al.printT) >= .49, each: al => { al.printT = G.t; } }); }   // 같은 외계인은 자국 여러 개에 같이 밟혀도 0.5초에 한 번 (QA M2)
    }
    G.marks = G.marks.filter(mk => mk.t < mk.life);
    G.ents = G.ents.filter(e => e.update(dt) !== false);
    if (h.barrage) {   // 연사: 1.5초 동안 N발, 보는 방향으로
      const b = h.barrage, m = b.mod; b.t += dt;
      const BT = m.time || SKB.BARRAGE_TIME;
      while (b.n < b.N && b.t >= b.n * BT / b.N) {
        const a = b.ang + (b.N > 1 ? ((b.n % 3) - 1) * .06 : 0), dx = Math.cos(a), dy = Math.sin(a);
        if (m.k === 'arcs8') {   // 헝가리 1: 둘레 사방으로 빠르게 여덟 번 베기
          const q = b.ang + b.n * Math.PI / 4;
          hitCircle(h.x, h.y, 78, b.dmg, { test: (al, ex, ey) => { const u = Math.atan2(ey, ex) - q; return Math.abs(Math.atan2(Math.sin(u), Math.cos(u))) < Math.PI / 6; } });
          sfx('arc8', h.x, h.y, .25, { a: q }); h.atkT = .1; b.n++; AUDIO.play('swing'); continue;
        }
        let kind = BARRAGE_SHOT[G.country.ranged] || 'streak', dmg = b.dmg, sp = TEMP.SHOT_SPEED * 1.25;
        const extra = {};
        if (m.k === 'pierce') { kind = 'lance'; extra.hits = new Set(); }                                      // 스위스 2: 꿰뚫기
        else if (m.k === 'bounce') { kind = 'beam'; extra.bounce = 1; }                                        // 미국 1: 벽에 한 번 튕김
        else if (m.k === 'lastHit') { const last = b.n === b.N - 1; kind = last ? 'star' : 'streak'; dmg = last ? b.base * m.last : b.base / m.div; }   // 네덜란드 1: 마지막 3배
        else if (m.k === 'boomer') { kind = 'boomerang'; extra.hits = new Set(); extra.big = 1.1; dmg = b.base * m.out; extra.dmgBack = b.base * m.back; sp = TEMP.SHOT_SPEED; }   // 호주 1: 부메랑 5개 부채꼴 (기획 2026-11-25), 하나당 가고 오며
        else if (m.k === 'stick') { kind = 'axe'; dmg = b.base * m.mul; extra.stick = b.base / m.div; extra.life = .45; sp = TEMP.SHOT_SPEED * .9; }   // 캐나다 1: 바닥에 박혀 2초
        else if (m.k === 'lob') { kind = 'sling'; extra.lob = dmg; dmg = 0; sp = 300; extra.life = clamp(Math.hypot(b.tx - h.x, b.ty - h.y) / sp, .12, 2.5); extra.noHit = true; }   // 그 자리에 떨어져요   // 이스라엘 1: 포물선으로 떨어진 자리
        else if (m.k === 'splash') { kind = 'streak'; extra.onHit = a2 => { hitCircle(a2.x, a2.y, 46, b.base / m.sdiv, { skip: new Set([a2]), heavy: false, main: false }); sfx('drops', a2.x, a2.y, .35, { a }); }; }   // 포르투갈 2: 옆으로 튀는 물방울
        else if (m.k === 'ricochet') { kind = 'axe'; dmg = b.base * m.mul; extra.bounces = m.n; extra.chain = new Set(); extra.onHit = ricochet; sp = TEMP.SHOT_SPEED; }   // 슬로바키아 2
        else if (kind === 'boomerang') extra.hits = new Set();
        if (m.k === 'stepThrust') { const fl = FIELD.floor; h.x = clamp(h.x + dx * 12, fl.x0 + 12, fl.x1 - 12); h.y = clamp(h.y + dy * 10, fl.y0 + 22, fl.y1); kind = 'streak'; }   // 이탈리아 2: 찌를 때마다 한 걸음
        const angs = m.k === 'spread3' ? [a - .26, a, a + .26] : m.k === 'boomer' ? [-2, -1, 0, 1, 2].map(i => a + i * m.fan) : [a];   // 한국 2: 세 갈래 · 호주 1: 다섯 갈래
        if (m.k === 'boomer') extra.hits = null;   // 부메랑마다 따로 (아래에서 새로)
        const volley = angs.length > 1 ? new Set() : null;   // 한국 2: 한 번 쏜 세 갈래는 같은 외계인을 한 번만 (QA M4)
        for (const q of angs) G.shots.push(Object.assign({ volley, kind, x: h.x + Math.cos(q) * 16, y: h.y + Math.sin(q) * 16, vx: Math.cos(q) * sp, vy: Math.sin(q) * sp, dmg, life: 1.4, age: 0, skill: true }, extra, m.k === 'boomer' ? { hits: new Set() } : null));
        G.fx.push({ kind: 'skill', type: 'barrage', x: h.x + dx * 26, y: h.y - 24 + dy * 10, h0: 24 - dy * 10, a, t: 0, life: .22 });
        { const cc = (SKILL_COL[G.country.key] || [])[G.hero.barrageN - 1]; if (cc) { sfx('muzzle', h.x + dx * 22, h.y + dy * 18, .12, { col: cc, a }); for (const sh of G.shots) if (sh.skill && sh.age === 0 && !sh.tailCol) sh.tailCol = cc[1]; } }   // 출발 섬광 + 탄 빛 꼬리 (겹겹이)
        h.rangedT = .2; h.aimShot = a; h.atkT = .12; h.shotT = G.t; b.n++;
        AUDIO.play('attack');
      }
      if (b.t >= BT) h.barrage = null;
    }
    for (const z of G.zones) {   // 설치: 지름 180 구역 3초
      z.t += dt;
      if (z.k === 'rings') {   // 미국 2: 1초마다 퍼지는 고리가 지나가며 맞혀요
        if (z.t >= z.nextRing && z.nextRing < SKB.ZONE_TIME - .5) { z.rings.push({ t0: z.t, hit: new Set() }); z.nextRing += 1; }
        for (const rg of z.rings) { const r = (z.t - rg.t0) / .6 * SKB.ZONE_D / 2; if (r > SKB.ZONE_D / 2 + 10) continue;
          hitCircle(z.x, z.y, r + 8, z.base / z.mod.div, { skip: rg.hit, heavy: false, main: false, test: (a, ex, ey, d) => d > r - 14 }); }
        continue;
      }
      const R2 = SKB.ZONE_D / 2;
      if (z.k === 'trap') {   // 스위스 1: 처음 들어온 외계인에게 창이 한 번 크게 → 구역 사라짐
        if (z.t > .2) { const a = G.aliens.find(a => !a.dead && !a.entering && Math.abs(a.x - z.x) / R2 + Math.abs(a.y - z.y) / (R2 * .7) < 1); if (a) { damage(a, z.base * z.mod.mul, 0, 1, true, { finisher: true }); sfx('spearDown', a.x, a.y, .4); AUDIO.play('impSmash'); z.t = 99; } }
        continue;
      }
      if (z.k === 'ring6') {   // 스웨덴 2: 테두리를 넘나들 때만 베여요 (한 마리 최대 3번)
        for (const a of G.aliens) { if (a.dead || a.entering) continue; const inn = Math.hypot(a.x - z.x, (a.y - z.y) / .8) < R2, was = z.inside.get(a);
          if (was != null && was !== inn && (z.cnt.get(a) || 0) < z.mod.max) { z.cnt.set(a, (z.cnt.get(a) || 0) + 1); damage(a, z.base * z.mod.mul, 0, 0, false); z.flash = .2; AUDIO.play('impSlash'); }
          z.inside.set(a, inn); }
        z.flash = Math.max(0, (z.flash || 0) - dt); continue;
      }
      if (z.k === 'gather') {   // 캐나다 2: 1.5초 동안 가운데로 모았다가 한 번에 터져요
        for (const a of G.aliens) { if (a.dead || a.entering || a.type === 'boss') continue; const ex = z.x - a.x, ey = z.y - a.y, d = Math.hypot(ex, ey); if (d > 8 && d < R2 * 1.4) { a.x += ex / d * Math.min(d, 140 * dt); a.y += ey / d * Math.min(d, 140 * dt); a.stun = .1; } }
        if (z.t >= z.life && !z.boom) { z.boom = true; hitCircle(z.x, z.y, R2, z.base * z.mod.mul); sfx('ringOut', z.x, z.y, .4, { r: R2 }); if (settings.shake) G.shake = Math.max(G.shake, 4); AUDIO.play('impSmash'); }
        continue;
      }
      if (z.k === 'corners') {   // 이탈리아 1: 네 모서리에서 짧은 창이 가운데로 동시에
        if (z.t >= .35 && !z.boom) { z.boom = true; const sk = new Set(); hitCircle(z.x, z.y, 34, z.base * z.mod.mul, { skip: sk }); hitCircle(z.x, z.y, R2 * 1.1, z.base * z.mod.edge, { skip: sk, test: (a, ex, ey) => Math.abs(ex) < R2 && Math.abs(ey) < R2 * .7 }); AUDIO.play('impact'); }
        continue;
      }
      z.tick -= dt;
      if (z.tick <= 0 && z.t <= SKB.ZONE_TIME) { z.tick += SKB.ZONE_TICK; hitCircle(z.x, z.y, SKB.ZONE_D / 2 - 2, z.dmg, { heavy: false, main: false }); }
    }
    G.zones = G.zones.filter(z => z.t < (z.life || SKB.ZONE_TIME) + (z.k === 'gather' ? .05 : 0));
  }
  // 지금 몸 그림 칸 (돌진 잔상용)
  function heroLookNow() {
    const h = G.hero, aim = Math.atan2(h.dir.y, h.dir.x), o = ((Math.round(aim / (Math.PI / 4)) % 8) + 8) % 8, bf = bodyFrame(h, OCT[o][0]);
    return { cell: bf.cell, folder: bf.folder, flip: OCT[o][1] };
  }
  // 스킬 그림 (2D·3D 같이): at(x, 바닥y, fn) 은 3D에서 원근 자리로 옮겨요
  const GK = () => (use3d ? .62 : .35);   // 바닥 원의 납작한 정도 (3D는 카메라가 더 위에서 봐요)
  // 탄 그리기 (s.big = 크게: 호주 1 큰 부메랑)
  function drawShotS(s, lift) {
    const y = s.y - 22 - lift, a = Math.atan2(s.vy, s.vx);
    if (s.tailCol) { const v = Math.hypot(s.vx, s.vy) || 1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.strokeStyle = s.tailCol; ctx.globalAlpha = .55; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(s.x, y); ctx.lineTo(s.x - s.vx / v * 34, y - s.vy / v * 34); ctx.stroke(); ctx.globalAlpha = .9; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }   // 스킬 탄 빛 꼬리 (나라 색)
    if (s.big) { ctx.save(); ctx.translate(s.x, y); ctx.scale(s.big, s.big); ctx.translate(-s.x, -y); FX.drawShot(s.kind, s.x, y, a, s.age, G.country.key); ctx.restore(); }
    else FX.drawShot(s.kind, s.x, y, a, s.age, G.country.key);
    if (s.boost && !reduceMotion) for (const [dt, al] of [[.04, .4], [.08, .2]]) { ctx.save(); ctx.globalAlpha *= al; FX.drawShot(s.kind, s.x - s.vx * dt, y - s.vy * dt, a, s.age, G.country.key); ctx.restore(); }   // 무적 중 쏜 탄: 흰 잔상 2개 (0.04초 간격)
  }
  // ---- 스킬 이펙트 (코드로 그림, 흰 + 은 #C9CED6 / 옅은 금 #E8D9A8) ----
  const SKW = '#FFFFFF', SKS = '#C9CED6', SKG = '#E8D9A8';
  const gEll = (x, y, r, a0 = 0, a1 = Math.PI * 2) => { ctx.beginPath(); ctx.ellipse(x, y, r, r * GK(), 0, a0, a1); };
  // 목표 원 크기 = 실제 범위 (style-guide "조준 표시")
  function aimR(sk) {
    const k = (sk.mod || {}).k;
    if (sk.type === 'zone') return k === 'corners' ? SKB.ZONE_D / 2 * 1.1 : SKB.ZONE_D / 2;
    if (sk.type === 'area') return k === 'cone' ? SKB.AREA_R * 2 : k === 'wings' ? SKB.AREA_R * 1.1 : k === 'roar' ? SKB.AREA_R * 1.1 : k === 'widen' ? 140 : k === 'chain3' ? 30 : SKB.AREA_R;
    if (k === 'javelin3') return 26;
    if (k === 'lob') return 30;
    return 20;
  }
  // 폰 끌기 조준 표시 (바닥 층, 캐릭터 아래)
  function drawAim(at) {
    if (!aim || !aim.drag || !aim.t || G.scene !== 'play') return;
    const h = G.hero, sk = skillOf(G.country, aim.n), k = (sk.mod || {}).k, f = FIELD.floor;
    const tx = clamp(aim.t.x, f.x0 + 12, f.x1 - 12), ty = clamp(aim.t.y, f.y0 + 22, f.y1), R = aimR(sk), ang = Math.atan2(ty - h.y, tx - h.x);
    const dash = (a, b, off) => { ctx.setLineDash([a, b]); ctx.lineDashOffset = off; };
    at(h.x, h.y, () => {
      ctx.save(); ctx.globalAlpha = aim.cancel ? .35 : 1; ctx.lineCap = 'round';
      const link = () => { ctx.strokeStyle = 'rgba(201,206,214,.85)'; ctx.lineWidth = 2; dash(4, 8, -G.t * 60); ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]); };
      const ring = (x, y, r, solid, fillA) => { if (fillA) { ctx.fillStyle = `rgba(255,255,255,${fillA})`; gEll(x, y, r); ctx.fill(); } ctx.strokeStyle = solid ? SKW : SKS; ctx.lineWidth = 2; if (!solid) dash(10, 6, -G.t * Math.PI * r * .5); gEll(x, y, r); ctx.stroke(); ctx.setLineDash([]); };
      if (k === 'orbit') { ring(h.x, h.y, 62, true, .06); ctx.restore(); return; }   // 튀르키예 1: 자리 지정 없음
      if (sk.type === 'zone') { link(); ring(tx, ty, R, false, .06); ctx.strokeStyle = SKG; ctx.lineWidth = 1.5; gEll(tx, ty, R * .7); ctx.stroke(); }
      else if (sk.type === 'area' && k === 'fear') { link(); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = SKW; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x, h.y, R * 1.2, R * 1.2 * GK(), 0, ang - Math.PI / 2, ang + Math.PI / 2); ctx.lineTo(h.x, h.y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (sk.type === 'area' && k === 'phalanx') { const L = 180, W = 46, c = Math.cos(ang), s2 = Math.sin(ang), P = [[0, -W], [L, -W], [L, W], [0, W]].map(([u, v]) => [h.x + c * u - s2 * v, h.y + s2 * u + c * v]);   // 판정과 같은 바닥 좌표
        ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = SKW; ctx.lineWidth = 2; ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (sk.type === 'area' && k === 'crack') { link(); ring(tx, ty, 20, true, 0); }
      else if (sk.type === 'area' && k === 'cone') { link(); ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.strokeStyle = SKW; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.ellipse(tx, ty, R, R * GK(), 0, ang - Math.PI / 3, ang + Math.PI / 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else if (sk.type === 'area') { link(); ring(tx, ty, R, true, .1); ring(tx, ty, R + 8, false, 0); }
      else if (sk.type === 'dash') {   // 몸 폭 30 띠 + 흐르는 › 3개 + 도착 원
        let ex = tx, ey = ty; if (k === 'long') { ex = clamp(h.x + (tx - h.x) * 2, f.x0 + 12, f.x1 - 12); ey = clamp(h.y + (ty - h.y) * 2, f.y0 + 22, f.y1); }
        const band = (x1, y1, a) => { const L = Math.hypot(x1 - h.x, y1 - h.y), c = Math.cos(ang), s2 = Math.sin(ang), g = GK() / .35 * .35, P = [[0, -15], [L, -15], [L, 15], [0, 15]].map(([u, v]) => [h.x + c * u - s2 * v * g, h.y + s2 * u + c * v * g]);   // 길이는 바닥 좌표 그대로(끝 = 도착 원), 폭만 납작하게
          ctx.globalAlpha = (aim.cancel ? .35 : 1) * a; ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = SKS; ctx.lineWidth = 1.5; dash(6, 6, -G.t * 40); for (const [i, j] of [[0, 1], [3, 2]]) { ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke(); } ctx.setLineDash([]); return L; };
        if (k === 'long') band(ex, ey, .4);   // 리투아니아 1: 목표 너머까지 옅게 (40%, 디자인 463e6b5)
        const L = band(tx, ty, 1);
        ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const u = ((G.t * 120 + i * L / 3) % Math.max(1, L)), x = h.x + Math.cos(ang) * u, y = h.y + Math.sin(ang) * u;
          ctx.beginPath(); ctx.moveTo(x - Math.cos(ang - .6) * 7, y - Math.sin(ang - .6) * 7 * .6); ctx.lineTo(x, y); ctx.lineTo(x - Math.cos(ang + .6) * 7, y - Math.sin(ang + .6) * 7 * .6); ctx.stroke(); }
        ring(tx, ty, 20, true, 0);
      }
      else if (k === 'javelin3') { link(); [1 / 3, 2 / 3, 1].forEach((q, i) => { const on = Math.floor(G.t * 3) % 3 === i; ctx.globalAlpha = (aim.cancel ? .35 : 1) * (on || i === 2 ? 1 : .5); ring(h.x + (tx - h.x) * q, h.y + (ty - h.y) * q, 26, i === 2, on ? .12 : .04); }); }
      else if (k === 'lob') { link(); ring(tx, ty, 30, true, .06); }
      else {   // 연사(쏘기): ±12° 부채꼴 + 목표 십자 원
        const L = Math.hypot(tx - h.x, ty - h.y) + 30, sp = 12 * Math.PI / 180; ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.strokeStyle = SKS; ctx.lineWidth = 1.5; dash(6, 6, -G.t * 40);
        ctx.beginPath(); ctx.moveTo(h.x, h.y); ctx.lineTo(h.x + Math.cos(ang - sp) * L, h.y + Math.sin(ang - sp) * L); ctx.lineTo(h.x + Math.cos(ang + sp) * L, h.y + Math.sin(ang + sp) * L); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ring(tx, ty, 20, true, 0); ctx.strokeStyle = SKW; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx - 26, ty); ctx.lineTo(tx + 26, ty); ctx.moveTo(tx, ty - 26 * GK()); ctx.lineTo(tx, ty + 26 * GK()); ctx.stroke();
      }
      ctx.restore();
    });
  }
  function drawSkills(at) {
    const h = G.hero;
    if (!h) return;
    drawAim(at);
    if (moveTo) {   // 톡 이동 목적지 (디자인 47d5870): 톡한 순간 은색 실선 고리 지름 32 → 12, 0.4초 · 가운데 흰 점 · 걷는 동안 흰 점(0.6)만 · 움직임 줄이기면 지름 20 고리 0.3초 깜빡
      const mt = moveTo, age = G.t - mt.t0, T = reduceMotion ? .3 : .4;
      at(mt.x, mt.y, () => {
        ctx.save(); const k = Math.min(1, age / T);
        if (age < T) { const rad = reduceMotion ? 10 : 16 - 10 * k; ctx.globalAlpha = reduceMotion ? (Math.floor(age * 13) % 2 ? .2 : .9) : .9 * (1 - k); ctx.strokeStyle = '#C9CED6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(mt.x, mt.y, rad, rad * .6, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.globalAlpha = age < T ? 1 : .6; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(mt.x, mt.y, 2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
    }
    for (const mk of G.marks) at(mk.x, mk.y, () => {   // 말발굽 자국 (U자)
      ctx.save(); ctx.globalAlpha = .6 * (1 - mk.t / mk.life); ctx.strokeStyle = SKG; ctx.lineWidth = 2; ctx.translate(mk.x, mk.y); ctx.scale(1, GK() * 1.6); ctx.rotate(mk.a + Math.PI / 2);
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI); ctx.stroke(); ctx.restore();
    });
    for (const e of G.ents) e.draw(at);
    for (const a of G.aliens) {   // 제어 상태 표시 (머리 위)
      const top = a.type === 'boss' ? 135 : 46;
      if (a.mark > 0) at(a.x, a.y, () => { ctx.save(); ctx.fillStyle = SKG; ctx.strokeStyle = SKW; ctx.lineWidth = 1.5; const y = a.y - top - 4; ctx.beginPath(); ctx.moveTo(a.x, y - 7); ctx.lineTo(a.x + 5, y); ctx.lineTo(a.x, y + 7); ctx.lineTo(a.x - 5, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); });   // 덴마크 1 표식
      if (a.weak > 0) at(a.x, a.y, () => { ctx.save(); ctx.strokeStyle = SKG; ctx.lineWidth = 1.5; const y = a.y - top + 6; ctx.beginPath(); ctx.arc(a.x + 12, y, 6, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(a.x + 9, y - 5); ctx.lineTo(a.x + 12, y); ctx.lineTo(a.x + 10, y + 4); ctx.stroke(); ctx.restore(); });   // 그리스 1 약화: 금 간 원
      if (a.fear > 0) at(a.x, a.y, () => { ctx.save(); ctx.strokeStyle = SKW; ctx.lineWidth = 1.5; const y = a.y - top; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(a.x + i * 6, y - 6); ctx.quadraticCurveTo(a.x + i * 6 + 3, y, a.x + i * 6, y + 5); ctx.stroke(); } ctx.restore(); });   // 공포: 떨리는 선
      if (a.root > 0) at(a.x, a.y, () => { ctx.save(); ctx.strokeStyle = SKG; ctx.lineWidth = 2; gEll(a.x, a.y - top, 9); ctx.stroke(); ctx.restore(); });
      if (a.seal > 0) at(a.x, a.y, () => { ctx.save(); ctx.fillStyle = SKW; for (let i = 0; i < 5; i++) { ctx.globalAlpha = .8; ctx.fillRect(a.x - 10 + i * 5, a.y - top + Math.sin(G.t * 6 + i) * 3, 2.5, 2.5); } ctx.restore(); });
      if (a.freeze > 0) at(a.x, a.y, () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = SKG; ctx.beginPath(); for (let i = 0; i < 10; i++) { const q = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.5 : 7; ctx.lineTo(a.x + Math.cos(q + G.t * 3) * r, a.y - top + Math.sin(q + G.t * 3) * r); } ctx.fill(); ctx.restore(); });
    }
    for (const z of G.zones) at(z.x, z.y, () => {
      const T = SKB.ZONE_TIME, al = z.t < .2 ? z.t / .2 : z.t > T - .3 ? (T - z.t) / .3 : 1, R = SKB.ZONE_D / 2;
      ctx.save();
      if (z.k === 'vortex') {   // 칠레 2: 초승달 검은 바람(은빛 테두리) → 나선 (60개 중 유일한 검정)
        if (z.t < 0) { const q = 1 + z.t / .35, x = z.x0 + (z.x - z.x0) * q, y = z.y0 + (z.y - z.y0) * q - 24, a = Math.atan2(z.y - z.y0, z.x - z.x0);
          ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.arc(0, 0, 22, -1.3, 1.3); ctx.arc(-9, 0, 18, 1.15, -1.15, true); ctx.closePath(); ctx.fillStyle = 'rgba(8,8,12,.92)'; ctx.fill(); ctx.strokeStyle = SKS; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return; }
        const a2 = z.t < .2 ? z.t / .2 : z.t > SKB.ZONE_TIME - .3 ? (SKB.ZONE_TIME - z.t) / .3 : 1;
        for (let j = 0; j < 3; j++) { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const q = i / 30, r = R * (1 - q * .9), ang = j * 2.1 + q * 6 - z.t * 4; ctx.lineTo(z.x + Math.cos(ang) * r, z.y + Math.sin(ang) * r * GK()); }
          ctx.globalAlpha = .85 * a2; ctx.strokeStyle = 'rgba(8,8,12,.95)'; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = SKS; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.restore(); return;
      }
      if (z.life && ['trap', 'gather', 'corners'].includes(z.k) || z.k === 'ring6') {
        const L = z.life || SKB.ZONE_TIME, a3 = z.t < .15 ? z.t / .15 : z.t > L - .25 ? Math.max(0, (L - z.t) / .25) : 1;
        if (z.k === 'trap') {   // 바닥 마름모
          ctx.globalAlpha = .7 * a3; ctx.strokeStyle = SKS; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(z.x - R, z.y); ctx.lineTo(z.x, z.y - R * .7 * GK() / .35 * .35); ctx.lineTo(z.x + R, z.y); ctx.lineTo(z.x, z.y + R * .7 * GK() / .35 * .35); ctx.closePath(); ctx.stroke();
          ctx.strokeStyle = SKG; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(z.x - 8, z.y); ctx.lineTo(z.x + 8, z.y); ctx.moveTo(z.x, z.y - 5); ctx.lineTo(z.x, z.y + 5); ctx.stroke();
        } else if (z.k === 'ring6') {   // 테두리에 꽂힌 칼 6개 + 테두리 선
          ctx.globalAlpha = (.5 + (z.flash || 0) * 2.5) * a3; ctx.strokeStyle = z.flash > 0 ? SKW : SKS; ctx.lineWidth = z.flash > 0 ? 3.5 : 2; gEll(z.x, z.y, R); ctx.stroke();
          ctx.globalAlpha = .9 * a3; for (let i = 0; i < 6; i++) { const q = i * Math.PI / 3 + .3, x = z.x + Math.cos(q) * R, y = z.y + Math.sin(q) * R * GK(); ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 22); ctx.stroke(); ctx.strokeStyle = SKG; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y - 16); ctx.lineTo(x + 5, y - 16); ctx.stroke(); }
        } else if (z.k === 'gather') {   // 단풍잎 원이 안으로 줄었다가 바깥으로
          const q = Math.min(1, z.t / z.life), rr = z.boom ? R * (1 + (z.t - z.life) * 8) : R * (1 - .7 * q);
          ctx.globalAlpha = (z.boom ? .5 : .75) * a3 + (z.boom ? .3 : 0); ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; ctx.beginPath();
          for (let i = 0; i <= 60; i++) { const th = i / 60 * Math.PI * 2, r2 = rr * (.8 + .2 * Math.pow(Math.abs(Math.sin(th * 2.5)), .6)); ctx.lineTo(z.x + Math.cos(th - Math.PI / 2 + z.t * 2) * r2, z.y + Math.sin(th - Math.PI / 2 + z.t * 2) * r2 * GK()); } ctx.closePath(); ctx.stroke();
        } else {   // 이탈리아 1: 사각 테두리 없이 네 모서리 창 4개 → 가운데로 모이는 선
          const q = clamp((z.t - .1) / .25, 0, 1), w = R, hy = R * .7 * GK() / .35 * .35;
          for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x0 = z.x + sx * w, y0 = z.y + sy * hy, x = x0 + (z.x - x0) * q, y = y0 + (z.y - y0) * q, ang = Math.atan2(z.y - y0, z.x - x0);
            ctx.globalAlpha = .4 * a3; ctx.strokeStyle = SKS; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x0, y0 - 14); ctx.lineTo(z.x, z.y - 14); ctx.stroke();
            ctx.globalAlpha = a3; ctx.strokeStyle = SKW; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * 22, y - 14 - Math.sin(ang) * 22); ctx.lineTo(x, y - 14); ctx.stroke(); ctx.fillStyle = SKG; ctx.beginPath(); ctx.arc(x, y - 14, 3, 0, 7); ctx.fill(); }
          if (z.boom) { ctx.globalAlpha = a3; ctx.strokeStyle = SKG; ctx.lineWidth = 2; gEll(z.x, z.y, 34); ctx.stroke(); }
        }
        ctx.restore(); return;
      }
      if (z.k === 'half') {   // 체코 1: 사각 구역 + 모서리 방패
        const w = R, hy = R * .7 * GK(); ctx.globalAlpha = .6 * al; ctx.strokeStyle = SKS; ctx.lineWidth = 2.5; ctx.strokeRect(z.x - w, z.y - hy, w * 2, hy * 2);
        ctx.fillStyle = SKG; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = z.x + sx * w, y = z.y + sy * hy; ctx.beginPath(); ctx.moveTo(x - 6, y - 12); ctx.lineTo(x + 6, y - 12); ctx.lineTo(x + 6, y - 4); ctx.lineTo(x, y + 2); ctx.lineTo(x - 6, y - 4); ctx.closePath(); ctx.fill(); }
      } else if (z.k === 'speedZone') {   // 뉴질랜드 1: 고사리 잎 소용돌이 무늬 원
        ctx.globalAlpha = .55 * al; ctx.strokeStyle = SKS; ctx.lineWidth = 1.8; gEll(z.x, z.y, R); ctx.stroke(); ctx.strokeStyle = SKW;
        for (let j = 0; j < 4; j++) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const q = i / 24, r = R * .85 * (1 - q), ang = j * Math.PI / 2 + q * 5 + z.t; ctx.lineTo(z.x + Math.cos(ang) * r, z.y + Math.sin(ang) * r * GK()); } ctx.stroke(); }
      } else if (z.k === 'slow') {   // 핀란드 2: 바닥 원 + 눈송이 점 6개
        ctx.globalAlpha = .55 * al; ctx.strokeStyle = SKW; ctx.lineWidth = 2; gEll(z.x, z.y, R); ctx.stroke(); ctx.fillStyle = SKW;
        for (let i = 0; i < 6; i++) { const q = i / 6 * Math.PI * 2 + z.t * .6, r = R * .6, x = z.x + Math.cos(q) * r, y = z.y + Math.sin(q) * r * GK(); for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3; ctx.fillRect(x + Math.cos(b) * 4 - 1, y + Math.sin(b) * 4 - 1, 2, 2); ctx.fillRect(x - Math.cos(b) * 4 - 1, y - Math.sin(b) * 4 - 1, 2, 2); } }
      } else if (z.k === 'sky') {   // 한국 1: 바닥 원 + 위에서 떨어지는 가는 선
        ctx.globalAlpha = .55 * al; ctx.strokeStyle = SKG; ctx.lineWidth = 2; gEll(z.x, z.y, R); ctx.stroke(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = SKW; ctx.lineWidth = 1.2;
        for (let i = 0; i < 9; i++) { const q = (z.t * 2.5 + i * .11) % 1, u = hash(i * 3 + 1), v = hash(i * 5 + 2), x = z.x + (u - .5) * R * 1.5, y = z.y + (v - .5) * R * GK() * 1.5; ctx.globalAlpha = Math.sin(q * Math.PI) * .8 * al; ctx.beginPath(); ctx.moveTo(x, y - 110 * (1 - q) - 20); ctx.lineTo(x, y - 110 * (1 - q)); ctx.stroke(); }
      } else if (z.k === 'rings') {   // 바닥 원 + 커지는 얇은 고리
        ctx.globalAlpha = .45 * al; ctx.strokeStyle = SKG; ctx.lineWidth = 1.5; gEll(z.x, z.y, R); ctx.stroke(); ctx.globalCompositeOperation = 'lighter';
        for (const rg of z.rings) { const k = (z.t - rg.t0) / .6; if (k > 1.1) continue; ctx.globalAlpha = (1 - Math.min(1, k)) * .9; ctx.strokeStyle = k < .5 ? SKW : SKS; ctx.lineWidth = 3; gEll(z.x, z.y, k * R); ctx.stroke(); }
      } else if (z.k === 'cross') {   // 원 안에서 엇갈려 도는 V 3개 (부메랑)
        ctx.globalAlpha = .45 * al; ctx.strokeStyle = SKG; ctx.lineWidth = 1.5; gEll(z.x, z.y, R); ctx.stroke();
        for (let i = 0; i < 3; i++) { const q = z.t * (2.4 + i * .7) * (i % 2 ? -1 : 1) + i * 2.1, rr = R * (.35 + .2 * i);
          ctx.save(); ctx.globalAlpha = al; ctx.translate(z.x + Math.cos(q) * rr, z.y + Math.sin(q) * rr * GK() - 14); ctx.rotate(z.t * 18 + i);
          ctx.strokeStyle = SKW; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(0, 2); ctx.lineTo(8, -6); ctx.stroke(); ctx.restore(); }
      } else {
        const fr = z.t < .25 ? z.t / .25 * 2 : z.t > T - .3 ? 6 + (z.t - (T - .3)) / .3 * 2 : 2 + Math.floor(z.t * 8) % 4;
        ctx.globalAlpha = .55 * al; ctx.strokeStyle = SKG; ctx.lineWidth = 2; gEll(z.x, z.y, R); ctx.stroke(); ctx.globalAlpha = 1;
        FX.cell('skill/fx-zone', 8, fr, z.x, z.y - SKB.ZONE_D * .3, 0, SKB.ZONE_D * 1.15, .85 * al);
      }
      ctx.restore();
      if (z.arrows) for (let i = 0; i < 5; i++) {   // 한국 화살비: 화살이 쏟아져요
        const q = (z.t * 2.2 + i * .2) % 1, u = hash(i * 7 + Math.floor(z.t * 2.2 + i * .2)), v = hash(i * 13 + Math.floor(z.t * 2.2 + i * .2));
        const ax = z.x + (u - .5) * SKB.ZONE_D * .8, ay = z.y + (v - .5) * SKB.ZONE_D * GK() * .8;
        ctx.save(); ctx.globalAlpha = Math.sin(q * Math.PI) * al; FX.drawShot('arrow', ax, ay - 90 * (1 - q), Math.PI / 2, 0); ctx.restore();
      }
    });
    if (h.dash) {
      const d = h.dash, a = Math.atan2(d.dy, d.dx);
      if (!d.k) at(h.x, h.y, () => FX.cell('skill/fx-dash', 6, d.t / d.dur * 6, h.x - d.dx * 34, h.y - 30 - d.dy * 10, a, 120, .9));
      else at(h.x, h.y, () => {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const p = d.path, fade = 1 - d.t / d.dur * .5;
        // 지나간 길: 흰 잔상 선 (지그재그면 꺾인 번개 모양)
        if (d.k === 'leap') {   // 포물선 점선 + 착지 원
          const x1 = d.ex, y1 = d.ey;
          ctx.globalAlpha = .8; ctx.strokeStyle = SKW; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.beginPath();
          for (let i = 0; i <= 20; i++) { const q = i / 20; ctx.lineTo(d.x0 + (x1 - d.x0) * q, d.y0 + (y1 - d.y0) * q - 24 - Math.sin(Math.PI * q) * 70); } ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeStyle = SKG; ctx.lineWidth = 2.5; gEll(x1, y1, 40 + 30 * Math.min(1, d.t / d.dur)); ctx.stroke(); ctx.restore(); return;
        }
        const wide = d.k === 'seal' ? 16 : d.k === 'focus' ? 2 : d.k === 'zigzag' ? 5 : 7;   // 핀란드 1 눈가루 띠 · 스페인 1 아주 가는 선
        ctx.globalAlpha = (d.k === 'seal' ? .3 : .55) * fade; ctx.strokeStyle = d.k === 'seal' ? SKW : SKS; ctx.lineWidth = wide; ctx.beginPath(); p.forEach(([x, y], i) => i ? ctx.lineTo(x, y - 24) : ctx.moveTo(x, y - 24)); ctx.stroke();
        ctx.globalAlpha = .9 * fade; ctx.strokeStyle = SKW; ctx.lineWidth = d.k === 'focus' ? 1.2 : 2; ctx.stroke();
        if (d.k === 'seal') { ctx.fillStyle = SKW; for (let i = 0; i < p.length; i += 2) { const [x, y] = p[i]; ctx.globalAlpha = .7 * fade; ctx.fillRect(x + (hash(i) - .5) * 18, y - 24 + (hash(i + 9) - .5) * 14, 2, 2); } }
        if (d.k === 'long') { const [x, y] = p[p.length - 1], a2 = Math.atan2(d.dy, d.dx); ctx.globalAlpha = .9; ctx.strokeStyle = SKG; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x + Math.cos(a2) * 40, y - 24 + Math.sin(a2) * 32); ctx.stroke(); }   // 리투아니아 1: 아주 긴 창
        if (d.k === 'accel' || d.k === 'invHit') for (let i = 2; i < p.length; i += 3) {   // 폴란드 1: 양옆 깃털 선 (뒤로 갈수록 굵게)
          if (d.k === 'invHit') break;
          const [x, y] = p[i], [px, py] = p[i - 1], u = Math.atan2(y - py, x - px), w = 1 + i / p.length * 3; ctx.globalAlpha = .8 * fade; ctx.strokeStyle = SKG; ctx.lineWidth = w;
          for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y - 24); ctx.lineTo(x + Math.cos(u + s2 * 2.4) * 12, y - 24 + Math.sin(u + s2 * 2.4) * 10); ctx.stroke(); }
        }
        if (d.k === 'dashInv') {   // 앞쪽 은빛 방패 반원
          ctx.globalAlpha = .85; ctx.strokeStyle = SKW; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(h.x + Math.cos(a) * 10, h.y - 26 + Math.sin(a) * 6, 24, a - 1.2, a + 1.2); ctx.stroke();
          ctx.globalAlpha = .3; ctx.fillStyle = SKS; ctx.fill();
        }
        ctx.restore();
      });
    }
  }
  // 점프 예고 원(바닥) · 착지 충격 — 외계인 쪽이라 외계인 보라색 (2D·3D 같이)
  function drawJumps(at) {
    for (const a of G.aliens) {
      if (!a.jump || a.jump.ph === 'land') continue;
      const J = a.jump, C = a.jumpCfg, k = J.ph === 'crouch' ? J.t / C.crouch : 1, fill = J.ph === 'air' ? Math.min(1, J.t / C.air) : 0;
      at(J.tx, J.ty, () => {
        ctx.save(); ctx.globalAlpha = .25 + .45 * k;
        ctx.fillStyle = 'rgba(10,6,16,.45)'; ctx.beginPath(); ctx.ellipse(J.tx, J.ty, C.r, C.r * GK(), 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(202,87,229,.35)'; ctx.beginPath(); ctx.ellipse(J.tx, J.ty, C.r * fill, C.r * fill * GK(), 0, 0, Math.PI * 2); ctx.fill();   // 떨어질 때까지 차오름
        ctx.strokeStyle = '#CA57E5'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(J.tx, J.ty, C.r, C.r * GK(), 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });
    }
  }
  let landGreen = null;   // 사격 외계인용 초록 (hue-rotate −150°, 한 번만 만들어요)
  function drawJumpLand(e, k) {
    let name = 'alien/fx-land';
    if (e.green) { const im = UI.img[name]; if (im && im.naturalWidth && !landGreen) { landGreen = UI.hueRotate(im, -150); UI.img['alien/fx-land-green'] = landGreen; } name = 'alien/fx-land-green'; }
    if (FX.cell(name, 6, k * 6, e.x, e.y, 0, e.r * 2.4, .9)) return;
    ctx.save(); ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = '#E2B6F0'; ctx.lineWidth = 5 * (1 - k) + 1;
    const R = e.r * (.6 + .6 * k); ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R * GK(), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  function drawSkillFx(e, k) {   // G.fx 의 스킬 효과
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const done = () => ctx.restore();
    if (e.type === 'pull') {   // 안으로 감기는 나선 3줄
      for (let j = 0; j < 3; j++) { ctx.globalAlpha = (1 - k) * .85; ctx.strokeStyle = j ? SKS : SKW; ctx.lineWidth = 3 - j * .6; ctx.beginPath();
        for (let i = 0; i <= 30; i++) { const q = i / 30, r = SKB.AREA_R * (1 - q) * (1 - k * .6), ang = j * 2.1 + q * 4 + k * 5; ctx.lineTo(e.x + Math.cos(ang) * r, e.y + Math.sin(ang) * r * GK()); } ctx.stroke(); }
      return done();
    }
    if (e.type === 'grow' || e.type === 'twoRings') {   // 원 두 겹 (두 번째가 더 크게 / 시간차)
      const k2 = e.type === 'twoRings' ? clamp((e.t - .3) / .35, 0, 1) : clamp((e.t - .25) / .35, 0, 1), k1 = clamp(e.t / .3, 0, 1);
      ctx.globalAlpha = (1 - k1) * .9 + .1; ctx.strokeStyle = SKW; ctx.lineWidth = 4 * (1 - k1) + 1; gEll(e.x, e.y, e.r1 * (.5 + .5 * k1)); ctx.stroke();
      if (k2 > 0) { ctx.globalAlpha = (1 - k2) * .9; ctx.strokeStyle = SKG; ctx.lineWidth = 5 * (1 - k2) + 1; gEll(e.x, e.y, e.r2 * (.7 + .3 * k2)); ctx.stroke(); }
      return done();
    }
    if (e.type === 'blast') {   // 두꺼운 원호 한 바퀴 + 바깥으로 짧은 선
      const R = SKB.AREA_R * (.5 + .5 * k); ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 9 * (1 - k) + 2; gEll(e.x, e.y - 10, R, k * 6, k * 6 + Math.PI * 1.9); ctx.stroke();
      ctx.strokeStyle = SKG; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2, r0 = R + 6, r1 = R + 20 + k * 20; ctx.beginPath(); ctx.moveTo(e.x + Math.cos(q) * r0, e.y - 10 + Math.sin(q) * r0 * GK()); ctx.lineTo(e.x + Math.cos(q) * r1, e.y - 10 + Math.sin(q) * r1 * GK()); ctx.stroke(); }
      return done();
    }
    if (e.type === 'blink') {   // 시작·끝 작은 원 + 사이 가는 점선
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 2; for (const [x, y] of [[e.x, e.y], [e.x1, e.y1]]) { gEll(x, y - 24, 10 + k * 10); ctx.stroke(); }
      ctx.setLineDash([4, 6]); ctx.strokeStyle = SKS; ctx.beginPath(); ctx.moveTo(e.x, e.y - 24); ctx.lineTo(e.x1, e.y1 - 24); ctx.stroke(); ctx.setLineDash([]);
      return done();
    }
    if (e.type === 'crack') {   // 끝 내려찍기: 균열 원
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 3; gEll(e.x, e.y, 30 + 30 * k); ctx.stroke(); ctx.strokeStyle = SKS; ctx.lineWidth = 1.6;
      for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2 + .3; ctx.beginPath(); ctx.moveTo(e.x, e.y); let r = 0; for (let s2 = 0; s2 < 3; s2++) { r += 18; ctx.lineTo(e.x + Math.cos(q + (s2 % 2 ? .2 : -.2)) * r, e.y + Math.sin(q + (s2 % 2 ? .2 : -.2)) * r * GK()); } ctx.stroke(); }
      return done();
    }
    if (e.type === 'xslash') {   // 반격 X자 섬광
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 5 * (1 - k) + 1.5; const L = 26;
      for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x - L, e.y - 26 - L * s2 * .7); ctx.lineTo(e.x + L, e.y - 26 + L * s2 * .7); ctx.stroke(); }
      return done();
    }
    if (e.type === 'reflect') {   // 막은 힘을 둘레로 되돌림: 금빛 고리
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKG; ctx.lineWidth = 5 * (1 - k) + 1; gEll(e.x, e.y, 30 + 100 * k); ctx.stroke(); return done();
    }
    if (e.type === 'art') {   // 스킬 대표 그림 (가산 합성, 칠레 2는 검정이라 보통 합성)
      const im = UI.img[e.img]; if (!im || !im.naturalWidth) return done();
      const t = e.t - (e.delay || 0), L = e.life - (e.delay || 0); if (t < 0) return done();
      const q = Math.min(1, t / L), fade = q > .65 ? Math.max(0, (1 - q) / .35) : 1, gk = .6;   // 바닥 타원 세로 0.6
      if (e.black) ctx.globalCompositeOperation = 'source-over';
      const reps = e.bright ? 2 : 1, cc = e.col || ['#FFFFFF', '#E8D9A8'];
      const glow = (x, y, R, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, cc[1]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalCompositeOperation = e.black ? 'source-over' : 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, R, R * .65, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); };
      const motes = (x, y, R, n, tt, a) => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = cc[0]; for (let i = 0; i < n; i++) { const u = hash(i * 7 + (e.seed || 3)), v = hash(i * 13 + 5), px = x + (u - .5) * R, py = y + (v - .5) * R * .5 - tt * 70 * (.6 + v * .6); ctx.globalAlpha = a * Math.max(0, 1 - tt * 2); ctx.fillRect(px - 1.5, py - 1.5, 3, 3); } ctx.restore(); };   // 빛 입자 0.5초 떠오름
      { const ax = e.mode === 'zone' && e.z ? e.z.x : e.mode === 'orbit' || e.mode === 'front' ? G.hero.x : e.mode === 'beam' || e.mode === 'trail' ? (e.x + (e.x1 == null ? e.x + Math.cos(e.ang) * (e.len || 80) * .5 : e.x1)) / 2 : e.x;
        const ay = e.mode === 'zone' && e.z ? e.z.y : e.mode === 'orbit' || e.mode === 'front' ? G.hero.y - 20 : e.mode === 'beam' || e.mode === 'trail' ? (e.y + (e.y1 == null ? e.y + Math.sin(e.ang) * (e.len || 80) * .5 : e.y1)) / 2 - 20 : e.y - (e.mode === 'drop' ? e.S * .3 : 6);
        const RR = (e.mode === 'zone' ? SKB.ZONE_D * 1.45 : e.S || e.len || e.H || 150) * .65;   // 그림 뒤 번짐 1.3배 (반지름 = 크기의 0.65)
        if (!(e.z && e.z.t < 0)) glow(ax, ay, RR, .35 * fade);
        if (t < .5 && !e.bright) motes(ax, ay, RR, 10, t, 1); }
      if (e.mode === 'trail' && !reduceMotion) for (const [off, al] of [[22, .5], [44, .3], [66, .15]]) {   // 돌진 잔상 3겹 (그림을 뒤로 밀어 옅게)
        const x1 = e.x1 == null ? e.x : e.x1, y1 = e.y1 == null ? e.y : e.y1, L0 = Math.max(70, Math.hypot(x1 - e.x, y1 - e.y)), an = L0 > 72 ? Math.atan2(y1 - e.y, x1 - e.x) : e.ang;
        ctx.save(); ctx.globalAlpha = al * fade; ctx.translate(e.x - Math.cos(an) * off, e.y - 24 - Math.sin(an) * off * .6); ctx.rotate(an); ctx.drawImage(im, 0, -e.H / 2, L0, e.H); ctx.restore();
      }
      if (e.mode === 'zone' && e.z && e.z.t >= 0) {   // 설치: 빛 기둥 입자가 위로 · 사라질 때 바깥으로 흩어짐
        const z = e.z, Rz = SKB.ZONE_D / 2; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = cc[0];
        for (let i = 0; i < 10; i++) { const u = hash(i * 3 + 1), ph = (G.t * .8 + u) % 1, px = z.x + (hash(i * 5 + 2) - .5) * Rz * 1.6, py = z.y + (hash(i * 7 + 3) - .5) * Rz * .9; ctx.globalAlpha = Math.sin(ph * Math.PI) * .7 * fade; ctx.fillRect(px - 1, py - ph * 60, 2, 10); }
        if (q > .85) for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2, rr = Rz * (.6 + (q - .85) / .15 * .9); ctx.globalAlpha = (1 - q) / .15; ctx.fillRect(z.x + Math.cos(an) * rr - 1.5, z.y + Math.sin(an) * rr * .6 - 1.5, 3, 3); }
        ctx.restore();
      }
      for (let rr = 0; rr < reps; rr++) {
        ctx.save();
        if (e.mode === 'burst') { const S = e.S * (reduceMotion ? 1 : .7 + .4 * Math.min(1, t / .25)); ctx.globalAlpha = .95 * fade; ctx.translate(e.x, e.y - 6); if (e.rot) ctx.rotate(e.ang); ctx.drawImage(im, -S / 2, -S / 2 * (e.rot ? .8 : 1), S, S * (e.rot ? .8 : 1)); }
        else if (e.mode === 'zone') { const z = e.z; if (z && z.t < 0) { ctx.restore(); continue; } const zx = z ? z.x : e.x, zy = z ? z.y : e.y, S = SKB.ZONE_D * 1.45, br = reduceMotion ? 1 : 1 + .04 * Math.sin(G.t * 3);
          ctx.globalAlpha = .9 * Math.min(1, t / .2) * fade * (reduceMotion ? 1 : .75 + .25 * Math.sin(G.t * Math.PI * 2)); ctx.translate(zx, zy); ctx.drawImage(im, -S * br / 2, -S * br / 2, S * br, S * br);   // 1초 주기로 숨쉬듯
          if (e.black) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .5 * fade; ctx.strokeStyle = '#8FA6C2'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, S * .42, S * .42 * .6, 0, 0, Math.PI * 2); ctx.stroke(); } }   // 칠레 2: 회청 테두리 빛
        else if (e.mode === 'beam' || e.mode === 'trail') {
          let x1, y1, ang = e.ang, len = e.len;
          if (e.mode === 'trail') { const h = G.hero; if (h && h.dash) { e.x1 = h.x; e.y1 = h.y; } x1 = e.x1 == null ? e.x : e.x1; y1 = e.y1 == null ? e.y : e.y1; len = Math.max(70, Math.hypot(x1 - e.x, y1 - e.y)); if (len > 72) ang = Math.atan2(y1 - e.y, x1 - e.x); }
          const grow = e.mode === 'beam' && !reduceMotion ? Math.min(1, t / .18) : 1, H = e.H;
          ctx.globalAlpha = fade; ctx.translate(e.x, e.y - (e.floor ? 4 : 24)); ctx.rotate(ang); ctx.drawImage(im, 0, -H / 2, len * grow, H);
        }
        else if (e.mode === 'front') { const h = G.hero, S = e.S; ctx.globalAlpha = fade; ctx.translate(h.x + Math.cos(e.ang) * 34, h.y - 26 + Math.sin(e.ang) * 20); ctx.rotate(e.ang); ctx.drawImage(im, -S * .6, -S / 2, S, S); }
        else if (e.mode === 'orbit') { const h = G.hero, S = 180; ctx.globalAlpha = fade * .95; ctx.translate(h.x, h.y - 14); ctx.scale(1, gk); ctx.rotate(reduceMotion ? 0 : G.t * 5); ctx.drawImage(im, -S / 2, -S / 2, S, S); }
        else if (e.mode === 'drop') { const pop = reduceMotion ? 1 : 1.25 - .25 * Math.min(1, t / .15), S = e.S * pop, hold = e.hold || 0; ctx.globalAlpha = t < hold ? 1 : fade; ctx.translate(e.x, e.y - S * .3); ctx.drawImage(im, -S / 2, -S / 2, S, S); }
        ctx.restore();
      }
      return done();
    }
    if (e.type === 'ringFx') { const r0 = e.r0 + (e.r1 - e.r0) * k; ctx.globalAlpha = (1 - k) * .9; ctx.strokeStyle = e.col[1]; ctx.lineWidth = 6 * (1 - k) + 2; gEll(e.x, e.y, r0); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke(); return done(); }   // 충격 고리
    if (e.type === 'coreFlash') { const g = ctx.createRadialGradient(e.x, e.y - 20, 0, e.x, e.y - 20, 70); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.4, e.col[0]); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = 1 - k; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x, e.y - 20, 70, 0, Math.PI * 2); ctx.fill(); return done(); }   // 가운데 섬광
    if (e.type === 'debris') { const T = k * e.life; ctx.fillStyle = e.col[0]; for (let i = 0; i < e.n; i++) { const an = hash(i * 11 + (e.seed * 7 | 0)) * Math.PI * 2, sp = 120 + hash(i * 17 + 3) * 160, vy = -140 - hash(i * 5) * 120;
        const x = e.x + Math.cos(an) * sp * T, y = e.y - 10 + Math.sin(an) * sp * T * .5 + (e.grav ? vy * T + 420 * T * T : 0); ctx.globalAlpha = 1 - k; ctx.fillRect(x - 2, y - 2, 4, 4); } return done(); }   // 파편 (범위는 중력)
    if (e.type === 'scorch') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .32 * (1 - k); ctx.fillStyle = '#0A0A0E'; gEll(e.x, e.y, e.r); ctx.fill(); return done(); }   // 그을림 자국 1.5초
    if (e.type === 'scrape') { ctx.globalAlpha = .6 * (1 - k); ctx.strokeStyle = e.col[1]; ctx.lineWidth = 3; ctx.beginPath(); e.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); return done(); }   // 바닥 긁힘 1초
    if (e.type === 'muzzle') { ctx.globalAlpha = 1 - k; ctx.fillStyle = e.col[0]; ctx.beginPath(); ctx.arc(e.x, e.y - 24, 9 * (1 - k * .5), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(e.x, e.y - 24, 4, 0, Math.PI * 2); ctx.fill(); return done(); }   // 출발 섬광
    if (e.type === 'pop') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = e.col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(e.x, e.y - 22, 4 + 8 * k, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(e.x, e.y - 22, 3 * (1 - k), 0, Math.PI * 2); ctx.fill(); return done(); }   // 맞은 곳 작은 폭발 (지름 24)
    if (e.type === 'boostSlash') { ctx.globalAlpha = e.al * (1 - k); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(e.x, e.y - 24, 44, 44 * .7, 0, e.a - 1.1, e.a + 1.1); ctx.stroke(); return done(); }   // 무적 중 치기 잔상
    if (e.type === 'aimFlash') {   // PC: 커서 자리에 목표 원이 1.25배 → 1배로 줄며 0.35초 동안 사라져요 (움직임 줄이기면 깜빡임만)
      const sc = reduceMotion ? 1 : 1.25 - .25 * Math.min(1, k * 2); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = reduceMotion ? (Math.floor(k * 4) % 2 ? 0 : .9) : 1 - k;
      ctx.strokeStyle = SKW; ctx.lineWidth = 2; gEll(e.x, e.y, e.r * sc); ctx.stroke(); ctx.strokeStyle = SKS; ctx.setLineDash([10, 6]); gEll(e.x, e.y, (e.r + 8) * sc); ctx.stroke(); ctx.setLineDash([]); return done();
    }
    if (e.type === 'mane') {   // 룩셈부르크 2: 앞 반원에 퍼지는 금빛 갈기 물결 3겹
      for (let j = 0; j < 3; j++) { const q = clamp((k - j * .15) / .7, 0, 1); if (q <= 0) continue; ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = j === 1 ? SKW : SKG; ctx.lineWidth = 3;
        ctx.beginPath(); for (let i = 0; i <= 24; i++) { const th = e.a - Math.PI / 2 + Math.PI * i / 24, r = SKB.AREA_R * 1.2 * q * (1 + .06 * Math.sin(i * 1.7 + j)); ctx.lineTo(e.x + Math.cos(th) * r, e.y - 12 + Math.sin(th) * r * GK()); } ctx.stroke(); }
      return done();
    }
    if (e.type === 'phalanx') {   // 그리스 1: 앞 직사각형에 나란히 뻗는 창끝 5개
      const ca = Math.cos(e.a), sa = Math.sin(e.a), ext = Math.min(1, k * 3) * e.L; ctx.globalAlpha = 1 - Math.max(0, k - .5) * 2;
      for (let i = -2; i <= 2; i++) { const ox = -sa * i * e.W / 2, oy = ca * i * e.W / 2 * GK() / .35 * .35, x0 = e.x + ox, y0 = e.y - 20 + oy, x1 = x0 + ca * ext, y1 = y0 + sa * ext * GK() / .35 * .35;
        ctx.strokeStyle = SKS; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.fillStyle = SKW; ctx.beginPath(); ctx.moveTo(x1 + ca * 10, y1 + sa * 8); ctx.lineTo(x1 - sa * 4, y1 + ca * 4); ctx.lineTo(x1 + sa * 4, y1 - ca * 4); ctx.closePath(); ctx.fill(); }
      return done();
    }
    if (e.type === 'wing') {   // 멕시코 2: 좌·우 반원호
      const R = SKB.AREA_R * 1.1 * (.5 + .5 * Math.min(1, k * 2)); ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 6 * (1 - k) + 1.5;
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 14, R, R * GK(), 0, e.side < 0 ? e.a - Math.PI * .8 : e.a, e.side < 0 ? e.a : e.a + Math.PI * .8); ctx.stroke(); return done();
    }
    if (e.type === 'javFall') {   // 리투아니아 2: 떨어질 자리 작은 원 + 위에서 내려오는 창
      const q = k; ctx.globalAlpha = .4 + .6 * q; ctx.strokeStyle = SKS; ctx.lineWidth = 1.5; gEll(e.x, e.y, 38 * (.4 + .6 * q)); ctx.stroke();
      ctx.globalAlpha = q > .5 ? 1 : q * 2; ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; const top = e.y - 24 - 120 * (1 - q); ctx.beginPath(); ctx.moveTo(e.x, top - 26); ctx.lineTo(e.x, top); ctx.stroke(); return done();
    }
    if (e.type === 'spearDown') {   // 스위스 1: 위에서 꽂히는 굵은 선
      const q = Math.min(1, k * 4); ctx.globalAlpha = 1 - Math.max(0, k - .4) / .6; ctx.strokeStyle = SKW; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(e.x, e.y - 160 + 140 * q); ctx.lineTo(e.x, e.y - 20 - 0 * q + (q < 1 ? -140 * (1 - q) + 0 : 0)); ctx.stroke();
      ctx.strokeStyle = SKG; ctx.lineWidth = 2; gEll(e.x, e.y, 18 + 20 * k); ctx.stroke(); return done();
    }
    if (e.type === 'markPop') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKG; ctx.lineWidth = 3; const y = e.y - (e.boss ? 135 : 46) - 4, s2 = 7 + 14 * k; ctx.beginPath(); ctx.moveTo(e.x, y - s2); ctx.lineTo(e.x + s2 * .7, y); ctx.lineTo(e.x, y + s2); ctx.lineTo(e.x - s2 * .7, y); ctx.closePath(); ctx.stroke(); return done(); }   // 표식 터짐
    if (e.type === 'iai') {   // 일본 1: 0.4초 뒤 굵은 선 섬광
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 10 * (1 - k) + 2; ctx.beginPath(); ctx.moveTo(e.x, e.y - 24); ctx.lineTo(e.x1, e.y1 - 24); ctx.stroke();
      ctx.strokeStyle = SKG; ctx.lineWidth = 2; ctx.stroke(); return done();
    }
    if (e.type === 'chain' || e.type === 'crackLine') {   // 일본 2 꺾인 선 · 슬로바키아 1 지그재그 균열 (앞으로 자라요)
      const n = e.type === 'crackLine' ? Math.min(e.pts.length, 1 + Math.floor(k * 3.5 * e.pts.length)) : e.pts.length, up = e.type === 'chain' ? 24 : 0;
      ctx.globalAlpha = e.type === 'crackLine' ? Math.min(1, (1 - k) * 2) : 1 - k; ctx.strokeStyle = e.type === 'chain' ? SKW : SKS; ctx.lineWidth = e.type === 'chain' ? 3 : 4; ctx.lineJoin = 'miter';
      ctx.beginPath(); e.pts.slice(0, n).forEach(([x, y], i) => i ? ctx.lineTo(x, y - up) : ctx.moveTo(x, y - up)); ctx.stroke(); ctx.strokeStyle = SKW; ctx.lineWidth = 1.2; ctx.stroke();
      return done();
    }
    if (e.type === 'gust') {   // 포르투갈 1: 한쪽으로 쏠린 곡선 바람 줄 5개
      const ca = Math.cos(e.a), sa = Math.sin(e.a); ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 2.2;
      for (let i = 0; i < 5; i++) { const o2 = (i - 2) * 22, sx = e.x - sa * o2 - ca * 40 + ca * k * 120, sy = e.y - 20 + (ca * o2 + sa * k * 120) * GK() * 1.4; ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx + ca * 40 - sa * 14, sy + (sa * 40 + ca * 14) * GK() * 1.4, sx + ca * 80, sy + sa * 80 * GK() * 1.4); ctx.stroke(); }
      return done();
    }
    if (e.type === 'arc8') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 4 * (1 - k) + 1.5; gEll(e.x, e.y - 18, 62, e.a - .45, e.a + .45); ctx.stroke(); return done(); }   // 헝가리 1: 짧은 원호
    if (e.type === 'drops') { ctx.globalAlpha = 1 - k; ctx.fillStyle = SKW; for (const s2 of [-1, 1]) for (let i = 0; i < 3; i++) { const q = e.a + s2 * (Math.PI / 2) + (i - 1) * .3, r = 10 + 34 * k; ctx.beginPath(); ctx.arc(e.x + Math.cos(q) * r, e.y - 22 + Math.sin(q) * r * GK() - 8 * Math.sin(k * Math.PI), 2.2, 0, 7); ctx.fill(); } return done(); }   // 포르투갈 2
    if (e.type === 'chainLink') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKS; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(e.x, e.y - 22); ctx.lineTo(e.x1, e.y1 - 22); ctx.stroke(); ctx.setLineDash([]); return done(); }   // 슬로바키아 2: 외계인을 잇는 선
    if (e.type === 'goldDot') { ctx.globalAlpha = 1 - k; ctx.fillStyle = SKG; ctx.beginPath(); ctx.arc(e.x, e.y - 40 - 10 * k, 4, 0, 7); ctx.fill(); return done(); }   // 헝가리 2
    if (e.type === 'liftUp') {   // 칠레 1: 위로 솟는 짧은 선 여러 개
      ctx.strokeStyle = SKW; ctx.lineWidth = 2; for (let i = 0; i < 12; i++) { const q = i / 12 * Math.PI * 2, r = SKB.AREA_R * (.3 + .6 * hash(i)), x = e.x + Math.cos(q) * r, y = e.y + Math.sin(q) * r * GK(), up = 70 * k;
        ctx.globalAlpha = (1 - k) * .9; ctx.beginPath(); ctx.moveTo(x, y - up); ctx.lineTo(x, y - up - 16); ctx.stroke(); }
      ctx.globalAlpha = (1 - k) * .4; ctx.strokeStyle = SKS; gEll(e.x, e.y, SKB.AREA_R); ctx.stroke(); return done();
    }
    if (e.type === 'roar') { for (const [i, d] of [[0, 0], [1, .25]]) { const q = clamp((k - d) / .75, 0, 1); if (q <= 0) continue; ctx.globalAlpha = 1 - q; ctx.strokeStyle = i ? SKG : SKW; ctx.lineWidth = 4 * (1 - q) + 1; gEll(e.x, e.y - 10, e.r * q); ctx.stroke(); } return done(); }   // 콜롬비아 1: 퍼지는 고리 2개
    if (e.type === 'tossArc') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i <= 16; i++) { const q = i / 16; ctx.lineTo(e.x + (e.x1 - e.x) * q, e.y + (e.y1 - e.y) * q - 24 - Math.sin(Math.PI * q) * 60); } ctx.stroke(); return done(); }   // 멕시코 2
    if (e.type === 'cross' || e.type === 'star') {   // 스페인 1 십자 섬광 · 프랑스 2 벽 충돌 별
      const R = (e.type === 'star' ? 14 : 18) * (1 - k * .4), n = e.type === 'star' ? 5 : 4, cy = e.y - 24; ctx.globalAlpha = 1 - k; ctx.fillStyle = SKW; ctx.beginPath();
      for (let i = 0; i < n * 2; i++) { const q = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? R * .22 : R; ctx.lineTo(e.x + Math.cos(q) * r, cy + Math.sin(q) * r); } ctx.fill(); return done();
    }
    if (e.type === 'cone') {   // 프랑스 1: 앞 120° 부채꼴 원호
      ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 6 * (1 - k) + 1.5; const R = SKB.AREA_R * 2 * (.4 + .6 * k);
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 10, R, R * GK(), 0, e.a - Math.PI / 3, e.a + Math.PI / 3); ctx.stroke();
      ctx.strokeStyle = SKG; ctx.lineWidth = 1.5; for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(e.x, e.y - 10); ctx.lineTo(e.x + Math.cos(e.a + s2 * Math.PI / 3) * R, e.y - 10 + Math.sin(e.a + s2 * Math.PI / 3) * R * GK()); ctx.stroke(); }
      return done();
    }
    if (e.type === 'ringOut') { ctx.globalAlpha = 1 - k; ctx.strokeStyle = SKW; ctx.lineWidth = 4 * (1 - k) + 1; gEll(e.x, e.y, e.r * (.6 + .4 * k)); ctx.stroke(); ctx.strokeStyle = SKG; ctx.lineWidth = 1.2; gEll(e.x, e.y, e.r * (.3 + .7 * k)); ctx.stroke(); return done(); }
    if (e.type === 'spikeHit') { ctx.globalAlpha = 1 - k; ctx.fillStyle = SKW; ctx.beginPath(); ctx.arc(e.x, e.y - 17, 6 * (1 - k) + 2, 0, 7); ctx.fill(); return done(); }
    done();
    if (e.type === 'area') {
      FX.cell('skill/fx-area', 6, k * 6, e.x, e.y, 0, SKB.AREA_R * 2.2, .72);
      ctx.save(); for (const [s, col] of [[1, '#FFFFFF'], [.72, '#E8D9A8']]) { const R = (20 + k * (SKB.AREA_R - 20)) * s; ctx.globalAlpha = (1 - k) * .8; ctx.strokeStyle = col; ctx.lineWidth = 4 * (1 - k) + 1; ctx.beginPath(); ctx.ellipse(e.x, e.y, R, R * GK(), 0, 0, Math.PI * 2); ctx.stroke(); } ctx.restore();
    } else if (e.type === 'barrage') FX.cell('skill/fx-barrage', 6, k * 6, e.x, e.y, e.a, 72, .8);
  }
  function drawGhost(e, k) {
    UI.dirBody(G.country.key, e.cell, e.x, e.y, 60, { flip: e.flip, white: true, alpha: (e.clone ? .5 : .22) * (1 - k) + .05 }, e.folder);   // 스웨덴 분신은 진하게
  }
  const alienCol = a => a.type === 'shooter' ? '#B8D727' : '#CA57E5';   // 그 외계인 몸 색 한 가지: 보라 외계인·보스 = 보라, 사격 외계인 = 초록 (style-guide d2c56fb)
  function damage(a, dmg, nx, ny, heavy, o = {}) {
    const main = o.main !== false;
    if (a.weak > 0) dmg *= 1 + BAL_WEAK;                                          // 그리스 1: 약화 +30%
    if (a.mark > 0 && !o.marking) { dmg *= a.markX || 2; a.mark = 0; G.fx.push({ kind: 'skill', type: 'markPop', x: a.x, y: a.y, t: 0, life: .35, boss: a.type === 'boss' }); }   // 덴마크 1: 표식 → 다음 한 번 2배
    a.hp -= dmg;
    // 피격 실루엣 (리뷰 4): 흰 0.025초 → 몸 색 외곽선 0.07초 · 공격축으로 눌렸다 복원 0.1초
    a.flash = 0.025; a.edgeT = 0.095; a.hitT = 0.1; a.hitAx = Math.abs(nx) >= Math.abs(ny) ? 'x' : 'y';
    // 넉백 (리뷰 2): 처음 0.04초는 쫓아오기를 15%로 눌러 실제로 밀려나요 → 35ms에 약 5px, 이후 3~4px 더
    const kb = a.type === 'boss' ? 60 : heavy ? 200 : 120;
    a.kb = { x: nx * kb, y: ny * kb }; a.stun = a.type === 'boss' ? 0.02 : 0.04;
    // 접촉점 (리뷰 3): 몸 가운데에서 공격이 들어온 쪽으로 6~10px
    const cy = a.y - (a.type === 'boss' ? 50 : 20), off = Math.min(10, a.r * .5 + 2);
    const cx = a.x - nx * off, cyy = cy - ny * off * .6;
    const h0 = a.y - cyy;   // 3D: 바닥에서 높이
    if (main) G.fx.push({ kind: 'core', x: cx, y: cyy, h0, t: 0, life: .1 });   // 흰 코어 0.025초 + 옅은 금 꼬리
    G.fx.push({ kind: 'hit', x: cx, y: cyy, h0, dir: Math.atan2(ny, nx), big: !!heavy, green: a.type === 'shooter', col: alienCol(a), alpha: main ? 1 : .5, t: 0, life: heavy ? 0.14 : 0.12 });
    // 방향성 파편 (리뷰 8): 몸 색 2~4개, 공격 방향 ±35°
    shardBurst(cx, cyy, Math.atan2(ny, nx), alienCol(a), main ? 3 : 2, o.finisher ? 1.2 : 1, 0, h0);
    if (!heavy) AUDIO.play('hit');
    if (a.hp <= 0 && !a.dead) {
      a.dead = true; G.run.kills++; G.run.killsRound++;
      // 처치 (리뷰 10): 몸이 0.08초 동안 0.65배로 접히며 사라진 뒤 파편 6개 + 처치 잔광
      const hgt = a.type === 'boss' ? 140 : a.type === 'shooter' ? 46 : 48;
      { const L = alienLook(a); G.fx.push({ kind: 'corpse', img: L.name, cell: L.cell ? L.cell.i : null, x: a.x, y: a.y, hgt: L.hgt, flip: L.mo.flip, t: 0, life: .08 }); }
      shardBurst(a.x, a.y - 20, Math.atan2(ny, nx), alienCol(a), 6, o.finisher ? 1.3 : 1.1, .07, 20);
      G.fx.push({ kind: 'death', x: a.x, y: a.y - (a.type === 'boss' ? 60 : 22), h0: a.type === 'boss' ? 60 : 22, size: a.type === 'boss' ? 140 : 60, green: a.type === 'shooter', t: -.07, life: 0.2 });
      later(() => AUDIO.play('kill'), 30);
    }
  }
  // 공격 방향으로 튀는 파편 (delay초 뒤 시작)
  function shardBurst(x, y, dir, color, n, speedMul = 1, delay = 0, h0 = 20) {
    for (let i = 0; i < n && G.parts.length < 150; i++) {
      const a = dir + (Math.random() - .5) * 1.2, v = (90 + Math.random() * 70) * speedMul;
      G.parts.push({ x, y, h0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .08 + Math.random() * .06, t: -delay, color, s: 1.5 + Math.random() });
    }
  }
  function hurt(dmg, fromX, fromY) {
    const h = G.hero;
    if (h.dead || h.inv > 0 || h.skillT > 0 || h.dash) return;   // 돌진 중(0.35초)은 안 맞아요 [제안]
    dmg *= heroDmgMul();
    h.hp -= dmg; h.inv = TEMP.HURT_INVULN; h.hitT = 0.15;
    const dx = h.x - fromX, dy = h.y - fromY, d = Math.hypot(dx, dy) || 1;
    h.x += dx / d * 5; h.y += dy / d * 5;
    G.hurtFlash = 0.15; if (settings.shake) G.shake = Math.max(G.shake, 4);
    AUDIO.play('hurt');
    if (h.hp <= 0) { h.hp = 0; h.dead = true; h.deadT = 0; AUDIO.play('fail'); Platform.gameplayStop(); }
  }
  function burst(x, y, color, n, sp) {
    for (let i = 0; i < n && G.parts.length < 150; i++) {
      const a = Math.random() * Math.PI * 2, v = sp * (.4 + Math.random() * .8);
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .25 + Math.random() * .1, t: 0, color, s: 1.5 + Math.random() * 1.2 });
    }
  }
  const inFloor = a => { const f = FIELD.floor; return a.x > f.x0 + 4 && a.x < f.x1 - 4 && a.y > f.y0 + 4 && a.y < f.y1 - 4; };

  // ---------- 업데이트 ----------
  function updatePlay(dt) {
    const r = G.run, h = G.hero, f = FIELD.floor;
    r.roundT += dt;
    if (h.dead) {
      h.deadT += dt;
      if (h.deadT > 0.9) showResult('fail');
      return;
    }
    // 장수
    readMove();
    h.moving = !!(input.mx || input.my);
    if (h.moving && !h.dash) {
      const spd = r.st.speed * heroSpd(), hx0 = h.x, hy0 = h.y; h.x += input.mx * spd * dt; h.y += input.my * spd * dt; h.walkT += dt;
      const d = Math.hypot(input.mx, input.my); h.dir = { x: input.mx / d, y: input.my / d };
      h.x = clamp(h.x, f.x0 + 12, f.x1 - 12); h.y = clamp(h.y, f.y0 + 22, f.y1);
      if (moveTo) { if (Math.hypot(h.x - hx0, h.y - hy0) < spd * dt * .2) { if ((moveTo.stuck += dt) > .15) moveTo = null; } else moveTo.stuck = 0; }   // 벽에 막히면 멈춰요
    }
    h.x = clamp(h.x, f.x0 + 12, f.x1 - 12); h.y = clamp(h.y, f.y0 + 22, f.y1);
    if (rstick.id != null && Math.hypot(rstick.x, rstick.y) > .3) { const l = Math.hypot(rstick.x, rstick.y); h.dir = { x: rstick.x / l, y: rstick.y / l }; }   // 오른쪽 손잡이를 밀면 조준 쪽을 봐요
    if (h.rangedT > 0) h.rangedT -= dt;
    // 마우스로 하면 몸이 커서 쪽을 봐요 (폰·키보드만 쓰면 가는 방향)
    if (mouse.on) { const dx = mouse.x - h.x, dy = mouse.y - (h.y - 24), d = Math.hypot(dx, dy); if (d > 6) h.dir = { x: dx / d, y: dy / d }; }
    h.inv = Math.max(0, h.inv - dt); h.skillT = Math.max(0, h.skillT - dt); h.boostT = Math.max(0, (h.boostT || 0) - dt); h.atkT = Math.max(0, h.atkT - dt); h.hitT = Math.max(0, h.hitT - dt);
    h.meleeCd -= dt; h.rangedCd -= dt;
    if (h.swing) {
      h.swing.t += dt;
      if (!h.swing.hit && h.swing.t >= SWING.wind + SWING.strike * wp().hitK) { h.swing.hit = true; meleeStrike(); }
      if (h.swing.t >= SWING.wind + SWING.strike + SWING.follow) h.swing = null;
    }
    if (aim && !aim.drag && performance.now() / 1000 - aim.t0 >= AIM_HOLD) { aim.drag = true; aim.t = aimPoint(aim); }   // 0.2초 꾹 누르면 조준 모드
    const stickOn = rstick.id != null && Math.hypot(rstick.x, rstick.y) > .3 && !arrowHeld();   // 손잡이를 밀면 계속 쏘기, 화살표를 누르는 동안은 멈춤 (GDD 0-18)
    const mel = input.melee || input.mMelee || keys.has('KeyJ') || buf.melee > 0, rng = input.ranged || input.mRanged || keys.has('KeyK') || buf.ranged > 0 || stickOn;
    if (mel && h.meleeCd <= 0) { melee(); buf.melee = 0; } else if (rng && h.rangedCd <= 0) { ranged(); buf.ranged = 0; }
    if (h.buff && (h.buff.t -= dt) <= 0) h.buff = null;
    updateSkills(dt);

    if (r.clearT < 0) updateSpawns(dt);

    // 외계인
    for (const a of G.aliens) {
      if (a.dead) continue;
      a.flash = Math.max(0, a.flash - dt); a.recoil = Math.max(0, a.recoil - dt);
      a.edgeT = Math.max(0, (a.edgeT || 0) - dt); a.hitT = Math.max(0, (a.hitT || 0) - dt); a.stun = Math.max(0, (a.stun || 0) - dt);
      const dx = h.x - a.x, dy = h.y - a.y, d = Math.hypot(dx, dy) || 1;
      // 점프: 웅크림(바닥 원 예고) → 공중(포물선) → 착지 충격 (원 안이면 피해, 무적이면 안 맞음)
      if (a.jump) {
        const J = a.jump, C = a.jumpCfg; J.t += dt;
        if (J.ph === 'crouch') { if (J.t >= C.crouch) { J.ph = 'air'; J.t = 0; J.sx = a.x; J.sy = a.y; } }
        else if (J.ph === 'land') { if (J.t >= .15) a.jump = null; }
        else {
          const q = Math.min(1, J.t / C.air), e = q * q * (3 - 2 * q);
          a.x = J.sx + (J.tx - J.sx) * e; a.y = J.sy + (J.ty - J.sy) * e; a.lift = Math.sin(Math.PI * q) * C.lift;
          if (q >= 1) {
            a.lift = 0; a.jump = { ph: 'land', t: 0, tx: J.tx, ty: J.ty }; a.jumpT = a.type === 'boss' ? C.gap : C.gap[G.run.round - 1];   // 착지 칸 0.15초 뒤 서기
            if (Math.hypot(h.x - J.tx, h.y - J.ty) < C.r + h.r * .5) hurt(C.dmg, J.tx, J.ty);
            G.fx.push({ kind: 'jumpLand', x: J.tx, y: J.ty, r: C.r, green: a.type === 'shooter', t: 0, life: .35 });
            for (let i = 0; i < 8 && G.parts.length < 150; i++) { const an = i / 8 * Math.PI * 2; G.parts.push({ x: J.tx, y: J.ty, h0: 2, vx: Math.cos(an) * 90, vy: Math.sin(an) * 40, life: .3, t: 0, color: '#8E8679', s: 2.5 }); }
            if (settings.shake) G.shake = Math.max(G.shake, a.type === 'boss' ? 3 : 1);   // 흔들림 1px, 보스 3px (디자인팀 12차)
            AUDIO.play('impact');
          }
        }
        continue;   // 점프 중엔 쫓기·쏘기·닿기 없음
      }
      // 스킬 제어 상태: freeze 멈춤(아무것도 못 함) · seal 공격 봉인 · root 묶기 · lift 띄우기
      for (const k of ['freeze', 'seal', 'root', 'air', 'fear', 'mark', 'weak']) if (a[k] > 0) a[k] = Math.max(0, a[k] - dt);
      if (a.fear > 0) {   // 룩셈부르크 2: 공포 — 장수 반대쪽으로 도망, 공격 못 함
        const ex = a.x - h.x, ey = a.y - h.y, d = Math.hypot(ex, ey) || 1; a.x += ex / d * 120 * dt; a.y += ey / d * 120 * dt; a.vx = ex / d;
        a.x = clamp(a.x, f.x0 + a.r * .6, f.x1 - a.r * .6); a.y = clamp(a.y, f.y0 + 10, f.y1); continue;
      }
      if (a.airH) { a.lift = a.air > 0 ? Math.sin(Math.PI * Math.min(1, (a.airH - a.air) / a.airH)) * 34 : 0; if (!(a.air > 0)) a.airH = 0; }   // 칠레 1: 공중에 떠요
      if (a.freeze > 0 || a.air > 0) {
        if (a.kb) { a.x += a.kb.x * dt; a.y += a.kb.y * dt; const k = Math.exp(-18 * dt); a.kb.x *= k; a.kb.y *= k; }
        a.x = clamp(a.x, f.x0 + a.r * .6, f.x1 - a.r * .6); a.y = clamp(a.y, f.y0 + 10, f.y1);
        continue;
      }
      if (a.jumpCfg && !a.entering && !(a.stun > 0)) {
        a.jumpT -= dt;
        if (a.jumpT <= 0) { a.jump = { ph: 'crouch', t: 0, tx: clamp(h.x, f.x0 + 20, f.x1 - 20), ty: clamp(h.y, f.y0 + 20, f.y1) }; continue; }   // 그 순간 장수가 있는 곳으로
      }
      let mx = 0, my = 0;
      if (a.entering) { mx = a.dx; my = a.dy; if (inFloor(a)) a.entering = false; }
      else if (a.type === 'shooter') {
        if (d > 170) { mx = dx / d; my = dy / d; } else if (d < 120) { mx = -dx / d; my = -dy / d; } else { mx = -dy / d * .6; my = dx / d * .6; }
        if (!(a.seal > 0)) a.shootT -= dt;   // 봉인되면 못 쏴요
        if (a.shootT <= 0) { a.shootT = TEMP.SHOOTER_GAP; a.recoil = .12; G.eshots.push({ x: a.x, y: a.y, vx: dx / d * TEMP.ENEMY_SHOT_SPEED, vy: dy / d * TEMP.ENEMY_SHOT_SPEED, dmg: TEMP.ENEMY_SHOT_DMG, life: 3, col: '#B8D727' }); }
      } else {
        mx = dx / d; my = dy / d;
        if (a.type === 'boss') {
          if (!(a.seal > 0)) a.shootT -= dt;
          if (a.shootT <= 0) {
            a.shootT = TEMP.BOSS_RING_GAP;
            for (let i = 0; i < TEMP.BOSS_RING_N; i++) { const an = i / TEMP.BOSS_RING_N * Math.PI * 2 + a.seed; G.eshots.push({ x: a.x, y: a.y - 30, vx: Math.cos(an) * TEMP.ENEMY_SHOT_SPEED * .8, vy: Math.sin(an) * TEMP.ENEMY_SHOT_SPEED * .8, dmg: TEMP.BOSS_SHOT_DMG, life: 3.5, col: '#CA57E5' }); }
          }
        }
      }
      // 서로 겹치지 않게
      for (const b of G.aliens) { if (b === a) continue; const ex = a.x - b.x, ey = a.y - b.y, ed = Math.hypot(ex, ey); const mn = a.r + b.r; if (ed > 0 && ed < mn) { mx += ex / ed * .8; my += ey / ed * .8; } }
      let chase = a.stun > 0 ? .15 : 1;   // 넉백 첫 0.04초는 쫓아오기 15%
      if (a.root > 0) chase = 0;          // 리투아니아 2: 그 자리에 묶임
      for (const z of G.zones) if (z.slow && Math.hypot(a.x - z.x, a.y - z.y) < SKB.ZONE_D / 2) chase *= a.type === 'boss' ? .8 : .5;   // 핀란드 눈 함정: 느리게 (보스는 80%)
      a.x += mx * a.speed * dt * chase; a.y += my * a.speed * dt * chase; if (chase > .2) a.vx = mx;
      { const ml = Math.hypot(mx, my) || 1, kk = Math.min(1, dt * 8); a.fx = (a.fx || 0) + (mx / ml - (a.fx || 0)) * kk; a.fy = (a.fy || 0) + (my / ml - (a.fy || 0)) * kk; a.step = (a.step || 0) + dt * a.speed / 9; if (chase > .2 && (mx || my)) a.walkT = (a.walkT || 0) + dt; }   // 보는 방향(부드럽게)·걸음
      if (a.kb) { a.x += a.kb.x * dt; a.y += a.kb.y * dt; const k = Math.exp(-18 * dt); a.kb.x *= k; a.kb.y *= k; }
      if (!a.entering) { a.x = clamp(a.x, f.x0 + a.r * .6, f.x1 - a.r * .6); a.y = clamp(a.y, f.y0 + 10, f.y1); }
      if (d < a.r + h.r && !(a.seal > 0)) hurt(a.type === 'boss' ? BAL.BOSS_CONTACT_DMG : BAL.CONTACT_DMG, a.x, a.y);   // 봉인되면 닿아도 안 아파요
      if (h.dead) break;
    }
    G.aliens = G.aliens.filter(a => !a.dead);
    if (h.dead) return;   // 쓰러짐이 클리어보다 먼저예요

    // 우리 탄
    for (const s of G.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.age += dt;
      if (s.kind === 'boomerang') {   // 호주 (사용자 확정): 던지고 돌아와요 — 갈 때·올 때 모두 맞히고 같은 외계인은 왕복에서 최대 2번
        const out = s.x < f.x0 || s.x > f.x1 || s.y < f.y0 || s.y > f.y1;
        if (!s.back && (s.age > .42 || out)) { s.back = true; s.hits = new Set(); if (s.dmgBack != null) s.dmg = s.dmgBack; }
        if (s.back) {
          const ex = h.x - s.x, ey = h.y - s.y, d = Math.hypot(ex, ey) || 1, sp = TEMP.SHOT_SPEED * 1.05;
          s.vx += (ex / d * sp - s.vx) * Math.min(1, dt * 9); s.vy += (ey / d * sp - s.vy) * Math.min(1, dt * 9);
          if (d < 20 || s.age > 3) s.life = 0; else s.life = Math.max(s.life, .1);
        }
        s.x = clamp(s.x, f.x0 - 10, f.x1 + 10); s.y = clamp(s.y, f.y0 - 10, f.y1 + 10);
      }
      else if (s.x < f.x0 - 10 || s.x > f.x1 + 10 || s.y < f.y0 - 10 || s.y > f.y1 + 10) {
        if (s.bounce > 0) {   // 미국 1: 방 벽에 한 번 튕겨요
          s.bounce--; if (s.x < f.x0 - 10 || s.x > f.x1 + 10) s.vx = -s.vx; if (s.y < f.y0 - 10 || s.y > f.y1 + 10) s.vy = -s.vy;
          s.x = clamp(s.x, f.x0 - 9, f.x1 + 9); s.y = clamp(s.y, f.y0 - 9, f.y1 + 9);
          G.fx.push({ kind: 'hit', x: s.x, y: s.y - 22, h0: 22, dir: Math.atan2(s.vy, s.vx), big: false, col: '#C9CED6', alpha: .6, t: 0, life: .1 });
        } else s.life = 0;
      }
      if (s.life <= 0 && s.lob != null) { hitCircle(s.x, s.y, 30, s.lob, { heavy: false }); sfx('ringOut', s.x, s.y, .3, { r: 30 }); }   // 떨어진 자리 작은 원
      if (s.stick != null && (s.life <= 0) && !s.stuck) { s.stuck = true; axeEnt(s.x, s.y, s.stick); }
      if (s.noHit) continue;
      if (s.hits) {   // 꿰뚫는 탄(부메랑·충격파): 지나가며 맞히고, 한 번 지날 때 같은 외계인은 한 번만
        for (const a of G.aliens) if (s.life > 0 && !a.dead && !s.hits.has(a) && (s.x - a.x) ** 2 + (s.y - a.y) ** 2 < (a.r + (s.kind === 'quake' ? 16 : 8)) ** 2) {
          s.hits.add(a); const v = Math.hypot(s.vx, s.vy) || 1; damage(a, s.dmg, s.vx / v, s.vy / v, s.kind === 'quake'); if (s.tailCol) sfx('pop', a.x, a.y, .15, { col: s.tailCol });
        }
        continue;
      }
      if (s.life <= 0 && s.kind === 'water') G.fx.push({ kind: 'splash', x: s.x, y: s.y - 22, t: 0, life: 0.4 });
      for (const a of G.aliens) if (s.life > 0 && !a.dead && !(s.chain && s.chain.has(a)) && !(s.volley && s.volley.has(a)) && (s.x - a.x) ** 2 + (s.y - a.y) ** 2 < (a.r + 6) ** 2) { damage(a, s.dmg, s.vx / TEMP.SHOT_SPEED, s.vy / TEMP.SHOT_SPEED); if (s.tailCol) sfx('pop', a.x, a.y, .15, { col: s.tailCol }); s.life = 0; if (s.chain) s.chain.add(a); if (s.volley) s.volley.add(a); if (s.onHit) s.onHit(a, s); if (s.stick != null && !s.stuck) { s.stuck = true; axeEnt(s.x, s.y, s.stick); } if (s.kind === 'water') G.fx.push({ kind: 'splash', x: s.x, y: s.y - 22, t: 0, life: 0.4 }); }
    }
    G.shots = G.shots.filter(s => s.life > 0);
    G.aliens = G.aliens.filter(a => !a.dead);
    // 외계인 탄
    for (const s of G.eshots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (!h.dead && (s.x - h.x) ** 2 + (s.y - h.y) ** 2 < (h.r + 5) ** 2) { hurt(s.dmg, s.x, s.y); s.life = 0; }
    }
    if (h.dead) return;
    G.eshots = G.eshots.filter(s => s.life > 0 && s.x > -20 && s.x < FIELD.W + 20 && s.y > -20 && s.y < FIELD.H + 20);
    // 화폐
    for (const it of G.items) {
      it.life -= dt;
      if (dist2(it, h) < 26 * 26) {
        it.life = 0; h.buff = { cur: it.cur, mul: CURRENCY_MUL[it.cur], t: BAL.ITEM_TIME, max: BAL.ITEM_TIME };
        AUDIO.play('pickup'); burst(h.x, h.y - 20, COL.glow, 6, 80);
      }
    }
    G.items = G.items.filter(it => it.life > 0);

    // 라운드 클리어
    if (r.clearT < 0 && remaining() <= 0) r.clearT = 0;
    if (r.clearT >= 0 && (r.clearT += dt) > 0.7) roundCleared();
  }

  function roundCleared() {
    const r = G.run;
    Platform.gameplayStop();
    r.maxRound = Math.max(r.maxRound, r.round);
    if (r.round >= BAL.ROUNDS) {
      // 파산 이어하기로 온 판은 6라운드를 깨도 또 파산이에요 ("다음 라운드를 깨면 또 파산") [개발팀 해석 · 기획팀 확인 필요]
      if (r.bankrupts > 0) return bankrupt(true);
      return startEnding();
    }
    const old = r.money; r.money = +(r.money - BAL.D).toFixed(2);
    if (r.money <= 0) return bankrupt(false);
    G.scene = 'roundPanel';
    G.panel = { t: 0, old, now: r.money, line: t_(rnd(['round.clear.1', 'round.clear.2'])), round: r.round };
    AUDIO.play('roundClear'); later(() => AUDIO.coins(4), 450);
  }
  function bankrupt(final) {
    const r = G.run;
    r.bankrupts++;
    const line = r.bankrupts === 1 ? t_('bankrupt.first.' + String(1 + Math.floor(Math.random() * 10)).padStart(2, '0'))
      : t_('bankrupt.again.0' + (1 + Math.floor(Math.random() * 3)));
    AUDIO.coins(3);
    showResult('bankrupt', { line, final });
  }
  function startEnding() {
    G.scene = 'ending';
    G.ending = { t: 0, line: t_(rnd(['round.clear.1', 'round.clear.2'])), fell: false };
    AUDIO.play('gameClear');
  }
  function updateEnding(dt) {
    const e = G.ending; e.t += dt;
    if (e.t < 2.2 && Math.random() < .5) burst(FIELD.W / 2 + (Math.random() - .5) * 300, FIELD.H * .2 + Math.random() * 200, COL.glow, 1, 40);
    if (e.t > 3.6 && !e.fell) { e.fell = true; AUDIO.play('hurt'); }
    if (e.t > 5.4) showResult('clear', { line: t_('end.after.' + String(1 + Math.floor(Math.random() * 10)).padStart(2, '0')) });
  }
  function showResult(kind, o = {}) {
    const r = G.run, c = G.country;
    Platform.gameplayStop();
    const rounds = kind === 'clear' ? 6 : kind === 'bankrupt' ? r.round : r.round - 1;
    const prev = best[c.key], isNew = !prev || rounds > prev.rounds || (rounds === prev.rounds && r.kills > prev.kills);
    if (isNew) { best[c.key] = { rounds, kills: r.kills }; store.set('best', best); later(() => AUDIO.play('best'), 700); }
    G.result = { kind, rounds, kills: r.kills, isNew, line: o.line || '', final: !!o.final, t: 0 };
    G.scene = 'result';
  }

  let wasPortrait = false;
  function update(dt) {
    G.t += dt;
    const pt = portrait();
    if (pt !== wasPortrait) { wasPortrait = pt; clearInput(); if (pt && G.scene === 'play' && !G.paused) setPause(true); }
    G.shake = Math.max(0, G.shake - dt * 20); G.hurtFlash = Math.max(0, G.hurtFlash - dt); G.skillFlash = Math.max(0, (G.skillFlash || 0) - dt);
    for (const m of G.msgs) m.t -= dt; G.msgs = G.msgs.filter(m => m.t > 0);
    for (const p of G.parts) { p.t += dt; if (p.t > 0) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; } } G.parts = G.parts.filter(p => p.t < p.life);
    if (G.kick) { G.kick.t += dt; if (G.kick.t > .1) G.kick = null; }
    buf.melee = Math.max(0, buf.melee - dt); buf.ranged = Math.max(0, buf.ranged - dt);
    if (G.scene === 'play' && !G.paused) mousePending();
    for (const e of G.fx) e.t += dt; G.fx = G.fx.filter(e => e.t < e.life);
    if (portrait()) return;                     // 세로: 라운드 패널·엔딩도 멈춰요
    if (G.scene === 'play' && !G.paused) {
      if (G.hitstop > 0) G.hitstop -= dt;
      else { let gdt = dt; if (G.slow > 0) { G.slow -= dt; gdt = dt * .7; } updatePlay(gdt); }   // 보스 결정타는 0.12초 동안 0.7배속
    }
    else if (G.scene === 'roundPanel') { G.panel.t += dt; if (G.panel.t > 2.8) { G.run.round++; startRound(); } }
    else if (G.scene === 'ending') updateEnding(dt);
    else if (G.scene === 'result') G.result.t += dt;
  }

  // ---------- 그리기 ----------
  const FIELD_SCENES = new Set(['play', 'roundPanel', 'ending', 'ad']);
  const BACK3D = new Set(['select', 'result']);
  function draw() {
    FX.flat = use3d ? .62 : .35;
    ctx.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
    UI.hits = [];
    if (use3d && R3D.lost) { use3d = false; R3D.show(false); }   // 3D가 죽으면(메모리 등) 그 자리에서 2D로
    const f3 = use3d && FIELD_SCENES.has(G.scene) && !portrait();
    // 나라 고르기·결과 화면: 3D 빈 방을 천천히 도는 배경 (2.5D 맞춤) · 시작 화면은 디자인 배경 그림 그대로
    const bg3 = use3d && !f3 && BACK3D.has(G.scene) && !portrait() && R3D.backdrop(G.t, W, H, reduceMotion);
    if (use3d) R3D.show(f3 || !!bg3);
    if (f3) ctx.clearRect(0, 0, VW, VH);
    else if (bg3) { ctx.clearRect(0, 0, VW, VH); ctx.fillStyle = 'rgba(15,17,22,.78)'; ctx.fillRect(0, 0, VW, VH); }
    else { ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, VW, VH); }
    if (portrait()) return drawRotate();
    switch (G.scene) {
      case 'loading': return drawLoading();
      case 'title': return drawTitle();
      case 'select': return drawSelect();
      case 'play': drawField(); drawHUD(); if (G.touchUI) drawControls(); drawMsgs(); if (G.paused && !G.hold) drawPause(); return;
      case 'roundPanel': drawField(); drawHUD(); drawRoundPanel(); return;
      case 'ending': drawField(); drawEnding(); return;
      case 'result': return drawResult();
      case 'ad': drawField(); ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillRect(0, 0, VW, VH); return;
    }
  }

  function drawLoading() {
    UI.stars(G.t);
    UI.bar(VW / 2 - 120, VH * .6, 240, 10, G.load, COL.gold);
    UI.txt(t_('x.loading'), VW / 2, VH * .5, 14, COL.muted, 'center', 600);
  }
  function drawRotate() {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, VW, VH);
    UI.I.phone(VW / 2, VH / 2, Math.min(VW, VH) * .5, COL.fg, reduceMotion ? 0.95 : G.t);
  }

  // 시작 화면 돈더미 (ui.md · 시안 코드). 동전이 수천 개라 한 번만 그려 두고 다시 써요
  const hash = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  function coinShape(x, cx, cy, r, tilt = .45, shade = 0) {
    const g = x.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    g.addColorStop(0, shade ? '#B8862E' : '#FFE08A'); g.addColorStop(.5, shade ? '#9A6A1E' : '#E0A93A'); g.addColorStop(1, '#7A4E14');
    x.fillStyle = '#6B4410'; x.beginPath(); x.ellipse(cx, cy + r * tilt * .35, r, r * tilt, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, r, r * tilt, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(255,240,190,.55)'; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, r * .72, r * tilt * .72, 0, 0, Math.PI * 2); x.stroke();
  }
  const pileTop = (u, base, hgt) => base - hgt * Math.pow(1 - Math.abs(u), 1.6);
  function drawPile(x, cx, base, wid, hgt, seed) {
    const n = Math.floor(wid * hgt / 30), items = [], curs = Object.keys(CURRENCY_MUL);
    for (let i = 0; i < n; i++) { const u = hash(seed + i) * 2 - 1, v = hash(seed + i * 7.3), top = pileTop(u, base, hgt); items.push([cx + u * wid / 2, top + v * (base - top), i]); }
    items.sort((a, b) => a[1] - b[1]);
    for (const [px, py, i] of items) {
      const k = hash(seed + i * 3.1), im = UI.img['item/' + curs[i % curs.length]];
      if (k < .045 && im && im.naturalWidth) { x.save(); x.translate(px, py); x.rotate((hash(i) - .5) * 1.2); const w = 34, h = w * im.naturalHeight / im.naturalWidth; x.drawImage(im, -w / 2, -h / 2, w, h); x.restore(); }
      else coinShape(x, px, py, 8 + k * 8, .42 + hash(i * 5) * .2, py > base - hgt * .25 ? 1 : 0);
    }
  }
  let pileCache = null;
  function titlePiles() {
    const key = `${W}x${H}x${DPR}`;
    if (pileCache && pileCache.key === key) return pileCache.cv;
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const x = c.getContext('2d'); x.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
    drawPile(x, VW * .17, VH * 1.02, 380, 230, 1); drawPile(x, VW * .83, VH * 1.02, 380, 230, 500); drawPile(x, VW / 2, VH * 1.1, 520, 70, 900);
    pileCache = { key, cv: c }; return c;
  }
  const TITLE_CURS = [['USD', .1, .2, 0], ['EUR', .27, .12, 1.3], ['GBP', .36, .42, 2.1], ['JPY', .64, .42, .7], ['KRW', .73, .12, 1.9], ['CNY', .9, .2, 2.6]];

  function drawTitle() {
    const t = G.t;
    const bg = UI.img['title-bg'], hasBg = !!(bg && bg.naturalWidth);
    if (hasBg) { // 최종 배경 그림 (디자인팀 6차) — 화면을 꽉 채우게(cover)
      const k = VW / bg.naturalWidth, h = bg.naturalHeight * k;   // 폭에 맞추고 아래 정렬 (위쪽 벽은 잘려요)
      ctx.drawImage(bg, 0, VH - h, VW, h);
    } else {
    ctx.globalAlpha = .55; UI.draw('room', 0, 0, VW, VH); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(10,8,6,.45)'; ctx.fillRect(0, 0, VW, VH);
    const gl = ctx.createRadialGradient(VW / 2, VH * 1.05, 40, VW / 2, VH * 1.05, 520); gl.addColorStop(0, 'rgba(255,190,80,.45)'); gl.addColorStop(1, 'rgba(255,190,80,0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, VW, VH);
    // 떨어지는 동전
    if (!reduceMotion) for (let i = 0; i < 22; i++) { const sp = 40 + hash(i) * 50, y = ((t * sp + hash(i * 3) * VH * 1.4) % (VH * 1.4)) - 40; coinShape(ctx, hash(i * 9) * VW, y, 4 + hash(i * 2) * 4, .25 + .2 * Math.abs(Math.sin(t * 4 + i))); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(titlePiles(), 0, 0); ctx.restore();
    if (!reduceMotion) for (const [cx, seed] of [[VW * .17, 1], [VW * .83, 500]]) for (let i = 0; i < 6; i++) {
      const ph = (t * .8 + hash(seed + i * 11)) % 1, u = hash(seed + i * 13) * 2 - 1;
      ctx.globalAlpha = Math.sin(ph * Math.PI); UI.I.star(cx + u * 190 * .8, pileTop(u, VH * 1.02, 230 * (.6 + hash(i) * .4)), 12, '#FFF6D6'); ctx.globalAlpha = 1;
    }
    }
    // 떠 있는 화폐 6개 (사용자 승인)
    for (const [c, u, v, ph] of TITLE_CURS) {
      const im = UI.img['item/' + c]; if (!im || !im.naturalWidth) continue;
      const bob = reduceMotion ? 0 : Math.sin(t * 1.6 + ph) * 6, rot = reduceMotion ? 0 : Math.sin(t * 1.1 + ph) * .08, w = 64, h = w * im.naturalHeight / im.naturalWidth, cx = VW * u, cy = VH * v + bob;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 52); g.addColorStop(0, 'rgba(255,209,102,.35)'); g.addColorStop(1, 'rgba(255,209,102,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 56, cy - 56, 112, 112);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
      if (!reduceMotion) { const q = (t * .7 + ph) % 1; ctx.globalAlpha = Math.sin(q * Math.PI); UI.I.star(cx + w * .35, cy - h * .4, 12, '#FFF6D6'); ctx.globalAlpha = 1; }
    }
    const sh = ctx.createRadialGradient(VW / 2, VH * .26, 20, VW / 2, VH * .26, 300); sh.addColorStop(0, 'rgba(10,8,6,.55)'); sh.addColorStop(1, 'rgba(10,8,6,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, VW, VH * .6);
    // 장수 4명: 더미 위에 서요 (판마다 무작위)
    if (!G.titleHeroes.length) { const pool = COUNTRIES.map(c => c.key).sort(() => Math.random() - .5); G.titleHeroes = pool.slice(0, 4); }
    (hasBg ? [[.09, .86], [.23, .80], [.77, .80], [.91, .86]] : [[.1, .93], [.24, .86], [.76, .86], [.9, .93]]).forEach(([u, f], i) => UI.hero(G.titleHeroes[i], VW * u, VH * f, 150, { flip: i >= 2, sy: reduceMotion ? 1 : 1 + Math.sin(t * 2.2 + i * 1.7) * .015 }));
    // 제목: 나라를 고르기 전엔 영어
    const title = lastCountry == null ? I18N.t.call({ lang: 'en' }, 'title') : t_('title');
    ctx.save(); ctx.shadowColor = 'rgba(217,174,79,.7)'; ctx.shadowBlur = 14;
    UI.para(title, VW / 2, VH * .25, 30, COL.fg, Math.min(420, VW * .45), 36, 800); ctx.restore();
    const pr = 44 * (1 + (reduceMotion ? 0 : Math.sin(G.t * 3) * .03));
    UI.btnMain('start', VW / 2, VH * .66, pr, 'play');
    if (lastCountry != null && best[COUNTRIES[lastCountry].key]) {
      const b = best[COUNTRIES[lastCountry].key];
      UI.I.trophy(VW / 2 - 40, VH * .88, 18, COL.gold); UI.flag(COUNTRIES[lastCountry].iso, VW / 2 - 24, VH * .88 - 6, 17, 12);
      UI.txt(`${b.rounds}/6 · ${b.kills}`, VW / 2 + 22, VH * .88, 14, COL.muted, 'center', 700);
    }
    UI.btnSub('sound', VW * .93, VH * .1, 44, 'speaker', !settings.sound);
  }

  // 나라 고르기
  const CARD = { w: 76, h: 64, gap: 14, cols: 5 };
  const selArea = () => ({ x: VW * .06, y: VH * .2, w: VW * .54, h: VH * .75 });
  const selMaxScroll = () => Math.max(0, Math.ceil(COUNTRIES.length / CARD.cols) * (CARD.h + CARD.gap) - CARD.gap - selArea().h + 6);
  function scrollToSel() {
    const row = Math.floor(G.sel / CARD.cols), top = row * (CARD.h + CARD.gap), a = selArea();
    if (top < G.selScroll) G.selScroll = top;
    if (top + CARD.h > G.selScroll + a.h) G.selScroll = top + CARD.h - a.h + 4;
    G.selScroll = clamp(G.selScroll, 0, selMaxScroll());
  }
  function drawSelect() {
    if (!use3d) UI.stars(G.t * .3);
    UI.btnSub('back', VW * .08, VH * .11, 44, 'back');
    UI.txt(t_('ui.02'), VW * .14, VH * .11, 18, COL.fg, 'left', 800);
    const a = selArea(), gx = (a.w - CARD.cols * CARD.w) / (CARD.cols - 1);
    ctx.save(); ctx.beginPath(); ctx.rect(a.x - 4, a.y - 4, a.w + 8, a.h + 8); ctx.clip();
    COUNTRIES.forEach((c, i) => {
      const col = i % CARD.cols, row = Math.floor(i / CARD.cols);
      const x = a.x + col * (CARD.w + gx), y = a.y + row * (CARD.h + CARD.gap) - G.selScroll;
      if (y > a.y + a.h || y + CARD.h < a.y) return;
      UI.rr(x, y, CARD.w, CARD.h, 8, '#1E1C1F', i === G.sel ? COL.glow : COL.frame, i === G.sel ? 3 : 1.5);
      // 장수 위쪽 절반(투구·상체)을 같은 비율로 잘라 넣어요
      const im = UI.img['hero/' + c.key];
      if (im && im.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.roundRect(x + 2, y + 2, CARD.w - 4, CARD.h - 4, 6); ctx.clip(); const s = (CARD.w - 4) / (im.naturalWidth * .62); ctx.drawImage(im, im.naturalWidth * .19, 0, im.naturalWidth * .62, im.naturalHeight * .52, x + 2, y + 2, CARD.w - 4, im.naturalHeight * .52 * s); ctx.restore(); }
      UI.flag(c.iso, x + 5, y + CARD.h - 15, 14, 10);
      UI.rr(x + CARD.w - 30, y + CARD.h - 17, 26, 13, 4, 'rgba(15,17,22,.8)');
      UI.txt('#' + c.rank, x + CARD.w - 17, y + CARD.h - 10.5, 9.5, COL.fg, 'center', 700);
      if (y + CARD.h > a.y && y < a.y + a.h) UI.hit('card:' + i, x, Math.max(y, a.y), CARD.w, Math.min(y + CARD.h, a.y + a.h) - Math.max(y, a.y));
    });
    ctx.restore();
    // 스크롤 막대
    const ms = selMaxScroll(); if (ms > 0) { const th = a.h * a.h / (a.h + ms); UI.rr(a.x + a.w + 8, a.y + (a.h - th) * G.selScroll / ms, 4, th, 2, 'rgba(242,227,198,.3)'); }

    // 정보 패널
    const c = COUNTRIES[G.sel], st = stats(c.money), px = VW * .63, pw = VW * .31, cx = px + pw / 2;
    UI.panel(px, VH * .05, pw, VH * .9);
    ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = 'rgba(255,209,102,.4)'; ctx.beginPath(); ctx.ellipse(cx, VH * .05 + 118, 34, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    UI.hero(c.key, cx, VH * .05 + 118, 108, { sy: reduceMotion ? 1 : 1 + Math.sin(G.t * 2.2) * .015 });
    UI.flag(c.iso, cx - 70, VH * .05 + 130, 22, 15);
    UI.txt(c.native, cx + 12, VH * .05 + 138, 20, COL.fg, 'center', 800, pw - 70);
    UI.txt(`??? · #${c.rank}`, cx, VH * .05 + 162, 17, COL.gold, 'center', 800);   // 시작 돈 가림 (GDD 0-13)
    // 능력치는 숫자·막대 모두 "???" (GDD 0-13 사용자 "그냥??? 이렇게 해버려") · 스킬 횟수는 모든 나라 같은 규칙이라 그대로
    const bars = [['heart', '???', 0, COL.red], ['sword', '???', 0, COL.fg], ['speed', '???', 0, COL.fg], ['bolt', BAL.SKILL_PER_RUN, 1, COL.glow]];
    bars.forEach(([ic, v, f, icc], i) => {
      const y = VH * .05 + 186 + i * 17;
      UI.I[ic](px + 22, y, 14, icc); UI.bar(px + 36, y - 4, pw - 84, 8, f, COL.glow); UI.txt(String(v), px + pw - 14, y, 11, COL.fg, 'right', 700);
    });
    UI.txt('???', cx, VH * .05 + 260, 10.5, COL.muted, 'center', 600, pw - 16);   // 출처 가림 (GDD 0-13)
    UI.btnWide('confirm', cx, VH * .95 - 32, Math.min(160, pw - 20), 44, 'play', t_('ui.01'), 'main');
  }

  // 전장
  function drawField() {
    if (use3d) return drawField3D();
    const fb = fieldBox;
    ctx.fillStyle = COL.side; ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    let sx = 0, sy = 0;
    if (settings.shake) {   // 흔들림 끄기는 흔들림·카메라 킥 모두에 그릴 때 바로 적용
      if (G.shake > 0) { sx = (Math.random() - .5) * G.shake; sy = (Math.random() - .5) * G.shake; }
      if (G.kick) { const k = G.kick.t < .018 ? G.kick.t / .018 : Math.max(0, 1 - (G.kick.t - .018) / .08); sx += G.kick.x * 2 * k; sy += G.kick.y * 2 * k; }
    }
    ctx.translate(fb.x + sx, fb.y + sy); ctx.scale(fb.s, fb.s);
    UI.draw('room', 0, 0, FIELD.W, FIELD.H);
    drawRoomLight();
    const h = G.hero, r = G.run, t = G.t;
    // 바닥 화폐
    for (const it of G.items) {
      const blink = it.life < 3 && Math.floor(it.life * 6) % 2 === 0;
      ctx.save(); ctx.globalAlpha = blink ? .35 : 1;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 2, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COL.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(it.x, it.y, 22, 8, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * it.life / BAL.ITEM_LIFE); ctx.stroke();
      UI.sprite('item/' + it.cur, it.x, it.y + 4, 34);
      ctx.restore();
    }
    // 그림자·깊이 순서
    const ents = [...G.aliens.map(a => ({ y: a.y, x: a.x, a })), { y: h.y, x: h.x, h }].sort((p, q) => p.y - q.y);
    const drawEnt = e => {
      // 원근: 위(먼 쪽)는 0.92배, 아래(가까운 쪽)는 1.08배 — 발을 기준으로 키워요
      const ps = perspective(e.y);
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(ps, ps); ctx.translate(-e.x, -e.y);
      if (e.h) drawHero(); else drawAlien(e.a);
      ctx.restore();
    };
    const fl = FIELD.floor;
    // 캐릭터 모양 그림자: 모든 캐릭터 그림자를 먼저 바닥에 깔아요 (다른 캐릭터 위로 그림자가 올라가지 않게)
    ents.filter(e => e.y >= fl.y0 - 4).forEach(e => {
      const ps = perspective(e.y); ctx.save(); ctx.translate(e.x, e.y); ctx.scale(ps, ps); ctx.translate(-e.x, -e.y);
      if (e.h) castHero(); else castAlien(e.a);
      ctx.restore();
    });
    ents.filter(e => e.y < fl.y0 - 4).forEach(drawEnt);    // 위쪽 벽 너머(들어오는 중)
    drawWallStrip('top');                                   // 위쪽 벽이 그 앞을 가려요
    ents.filter(e => e.y >= fl.y0 - 4).forEach(drawEnt);
    drawWallStrip('sides');                                 // 양옆·아래 벽은 문으로 들어오는 외계인 앞에
    // 효과
    for (const e of G.fx) {
      const k = e.t / e.life;
      if (e.t < 0) continue;   // 늦게 시작하는 효과
      if (e.kind === 'melee') FX.drawMeleeAny(e.m, e.x, e.y, e.a, k);
      else if (e.kind === 'death') { if (settings.flash) FX.sheet('death', k, e.x, e.y, 0, e.size, .8, e.green); }   // 번쩍임 끄면 처치 잔광 없이 파편만
      else if (e.kind === 'core') { if (settings.flash) drawCore(e); }
      else if (e.kind === 'corpse') { const q = Math.min(1, k), mo = { flip: e.flip, sx: 1 - .35 * q, sy: 1 - .35 * q, alpha: 1 - q }; if (e.cell != null) UI.cellSprite(e.img, 15, e.cell, e.x, e.y + 2, e.hgt, mo); else UI.sprite(e.img, e.x, e.y + 2, e.hgt, mo); }
      else if (e.kind === 'groundRing') { ctx.save(); ctx.globalAlpha = .25 * (1 - k); ctx.strokeStyle = '#E8D9A8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 8 + 16 * k, (8 + 16 * k) * .35, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      else if (e.kind === 'muzzle') FX.muzzle(ctx, e.x, e.y, e.a, e.t);
      else if (e.kind === 'hit') { if (settings.flash) FX.drawHitAny(e.x, e.y, k, e.col, e.dir || 0, e.big, e.green, e.alpha); }   // 번쩍임 끄면 외곽선·파편으로만
      else if (e.kind === 'splash') FX.splash(ctx, e.x, e.y, k);
      else if (e.kind === 'ring') { ctx.globalAlpha = 1 - k; UI.circ(e.x, e.y, 14 + k * 60, null, COL.glow, 4); ctx.globalAlpha = 1; }
      else if (e.kind === 'skill') drawSkillFx(e, k);
      else if (e.kind === 'ghost') drawGhost(e, k);
      else if (e.kind === 'jumpLand') drawJumpLand(e, k);
    }
    drawSkills((x, y, fn) => fn()); drawJumps((x, y, fn) => fn());
    for (const s of G.shots) {
      const lift = s.kind === 'sling' ? Math.sin(Math.min(1, s.age / .5) * Math.PI) * 22 : s.kind === 'quake' ? -22 : 0;   // 충격파는 바닥에   // 투석은 포물선
      softShadow(s.x, s.y, 7, 2.5, .28);   // 날아가는 것 아래 바닥 그림자 (높이가 보여요)
      drawShotS(s, lift);
    }
    for (const s of G.eshots) { softShadow(s.x, s.y, 5, 2, .25); ctx.save(); ctx.translate(s.x, s.y - 18); ctx.rotate(G.t * 8); ctx.fillStyle = s.col || '#CA57E5'; ctx.fillRect(-4, -4, 8, 8); ctx.strokeStyle = 'rgba(15,17,22,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(-4, -4, 8, 8); ctx.restore(); }
    for (const p of G.parts) { if (p.t < 0) continue; ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } ctx.globalAlpha = 1;
    ctx.restore();
    // 맞음: 화면 테두리 빨강 (번쩍임 끄면 장수 테두리만)
    if (G.hurtFlash > 0 && settings.flash) { ctx.strokeStyle = `rgba(255,90,95,${G.hurtFlash / .15 * .8})`; ctx.lineWidth = 10; ctx.strokeRect(fb.x + 5, fb.y + 5, FIELD.W * fb.s - 10, FIELD.H * fb.s - 10); }
  }

  // ---- 2.5D (B안, 사용자 "b안"): 바닥·벽·문은 3D, 장수·외계인·화폐는 판(빌보드), 효과·HUD는 2D를 원근에 맞춰 위에 겹쳐요 ----
  const HERO_BOX = { l: 80, t: 104, w: 160, h: 144, k: 2 };          // 장수 판: 발 기준 왼쪽 80 · 위 104 (무기 포함) · 2배 해상도
  const GROUND_BOX = { w: 76, h: 30, k: 2, stretch: 2.1 };           // 발밑 빛·화폐 고리 (2D 납작 타원을 바닥에 맞게 세로로 늘려요)
  const FX_H0 = { melee: 26, death: 22, core: 20, hit: 20, muzzle: 24, splash: 24, ring: 20, groundRing: 0, ghost: 0, skill: 0, jumpLand: 0 };   // 효과가 뜨는 높이 (바닥에서)
  let heroCv = null, heroTex = null, groundCv = null, groundTex = null;
  const itemCv = [], itemTex = [], jumpCv = [], jumpTex = [];
  const mkCv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  // 캔버스를 비우고 (cx, cy) 가 가운데 오게 해서 그려요
  function paintBox(cv2, k, ox, oy, cx, cy, fn) {
    const c = cv2.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv2.width, cv2.height);
    c.setTransform(k, 0, 0, k, ox * k, oy * k); c.translate(-cx, -cy);
    paintTo(c, fn);
  }
  function shakeOffset() {
    let sx = 0, sy = 0;
    if (settings.shake) {
      if (G.shake > 0) { sx = (Math.random() - .5) * G.shake; sy = (Math.random() - .5) * G.shake; }
      if (G.kick) { const k = G.kick.t < .018 ? G.kick.t / .018 : Math.max(0, 1 - (G.kick.t - .018) / .08); sx += G.kick.x * 2 * k; sy += G.kick.y * 2 * k; }
    }
    return [sx, sy];
  }
  function drawField3D() {
    const fb = fieldBox, h = G.hero, [sx, sy] = shakeOffset();
    if (!R3D.begin()) { ctx.fillStyle = COL.side; ctx.fillRect(0, 0, VW, VH); return; }
    const GB = GROUND_BOX;
    // 바닥 화폐: 시간 고리는 바닥에, 화폐는 서 있는 판
    G.items.forEach((it, i) => {
      const al = it.life < 3 && Math.floor(it.life * 6) % 2 === 0 ? .35 : 1;
      if (!itemCv[i]) { itemCv[i] = mkCv(GB.w * GB.k, GB.h * GB.k); itemTex[i] = R3D.canvasTex(itemCv[i]); }
      paintBox(itemCv[i], GB.k, GB.w / 2, GB.h / 2, it.x, it.y, () => {
        ctx.strokeStyle = COL.glow; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(it.x, it.y, 22, 8, 0, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * it.life / BAL.ITEM_LIFE); ctx.stroke();
      });
      itemTex[i].needsUpdate = true;
      R3D.decal(itemTex[i], it.x, it.y, GB.w, GB.h * GB.stretch, { alpha: al });
      R3D.blob(it.x, it.y, 15, .45 * al);
      R3D.sprite(R3D.tex('item/' + it.cur), it.x, it.y + 4, 34, { alpha: al });
    });
    // 장수: 발밑 빛은 바닥에, 몸·무기는 판 하나 (기존 2D 그리기를 그대로 판에 그려요)
    if (h) {
      if (!heroCv) { heroCv = mkCv(HERO_BOX.w * HERO_BOX.k, HERO_BOX.h * HERO_BOX.k); heroTex = R3D.canvasTex(heroCv); groundCv = mkCv(GB.w * GB.k, GB.h * GB.k); groundTex = R3D.canvasTex(groundCv); }
      paintBox(groundCv, GB.k, GB.w / 2, GB.h / 2, h.x, h.y, () => heroGround(false));
      groundTex.needsUpdate = true;
      R3D.decal(groundTex, h.x, h.y, GB.w, GB.h * GB.stretch, { order: 45 });
      R3D.blob(h.x, h.y, 17, .6);
      paintBox(heroCv, HERO_BOX.k, HERO_BOX.l, HERO_BOX.t, h.x, h.y, heroBody);
      heroTex.needsUpdate = true;
      R3D.sprite(heroTex, h.x, h.y, HERO_BOX.h, {}, { aspect: HERO_BOX.w / HERO_BOX.h, below: HERO_BOX.h - HERO_BOX.t, shadow: !(h.dead && G.scene !== 'ending') });
    }
    // 외계인
    for (const a of G.aliens) {
      const L = alienLook(a), mo = Object.assign({}, L.mo), v = mo.white ? 'white' : mo.edge || 'lit';
      delete mo.white; delete mo.edge;
      R3D.sprite(L.cell ? R3D.cellTex(L.name, v, 15, L.cell.i) : R3D.tex(L.name, v), a.x, a.y + 2, L.hgt * 1.04, mo, { upright: 40 });   // 카메라를 똑바로 보는 판(56° 기움)보다 16° 덜 눕혀 원근이 판에 걸리게 — 키는 1.04배로 보정
      const lk = 1 - Math.min(.55, (a.lift || 0) / 160); R3D.blob(a.x, a.y, a.r * 1.3 * (1 - L.hop * .03) * lk, .78 * lk);   // 뛰면 그림자가 작고 옅어져요
    }
    // 처치 직후 접히는 몸
    for (const e of G.fx) if (e.kind === 'corpse' && e.t >= 0) { const q = Math.min(1, e.t / e.life); R3D.sprite(e.cell != null ? R3D.cellTex(e.img, 'lit', 15, e.cell) : R3D.tex(e.img), e.x, e.y + 2, e.hgt, { flip: e.flip, sx: 1 - .35 * q, sy: 1 - .35 * q, alpha: 1 - q }, { shadow: false }); }
    // 점프 예고 원: 3D에선 진짜 바닥 무늬로 (공중의 외계인을 덮지 않게)
    let ji = 0;
    for (const a of G.aliens) {
      if (!a.jump || a.jump.ph === 'land') continue;
      const J = a.jump, C = a.jumpCfg, k = J.ph === 'crouch' ? J.t / C.crouch : 1, fill = J.ph === 'air' ? Math.min(1, J.t / C.air) : 0;
      if (!jumpCv[ji]) { jumpCv[ji] = mkCv(128, 128); jumpTex[ji] = R3D.canvasTex(jumpCv[ji]); }
      const x = jumpCv[ji].getContext('2d'); x.clearRect(0, 0, 128, 128);
      x.globalAlpha = .3 + .5 * k; x.fillStyle = 'rgba(10,6,16,.5)'; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(202,87,229,.45)'; x.beginPath(); x.arc(64, 64, 60 * fill, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#CA57E5'; x.lineWidth = 4; x.beginPath(); x.arc(64, 64, 60, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
      jumpTex[ji].needsUpdate = true;
      R3D.decal(jumpTex[ji], J.tx, J.ty, C.r * 2 * 64 / 60, C.r * 2 * 64 / 60, { order: 44 }); ji++;
    }
    for (const s of G.shots) R3D.blob(s.x, s.y, 7, .3);
    for (const s of G.eshots) R3D.blob(s.x, s.y, 5, .28);
    R3D.render((fb.x + sx) * U, (fb.y + sy) * U, FIELD.W * fb.s * U, FIELD.H * fb.s * U);

    // 2D 겹치기: 바닥 점(x, fy)의 원근 자리·크기에 맞춰 기존 2D 그리기를 그대로 써요
    ctx.save(); ctx.translate(fb.x + sx, fb.y + sy); ctx.scale(fb.s, fb.s);
    const at = (x, fy, fn) => { const p = R3D.proj(x, fy); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, p.s); ctx.translate(-x, -fy); fn(); ctx.restore(); };
    for (const a of G.aliens) if (a.type === 'boss') at(a.x, a.y, () => bossBar(a, 140));
    for (const e of G.fx) {
      const k = e.t / e.life;
      if (e.t < 0 || e.kind === 'corpse') continue;
      const h0 = e.h0 != null ? e.h0 : (FX_H0[e.kind] || 0);
      at(e.x, e.y + h0, () => {
        if (e.kind === 'melee') FX.drawMeleeAny(e.m, e.x, e.y, e.a, k);
        else if (e.kind === 'death') { if (settings.flash) FX.sheet('death', k, e.x, e.y, 0, e.size, .8, e.green); }
        else if (e.kind === 'core') { if (settings.flash) drawCore(e); }
        else if (e.kind === 'groundRing') { ctx.globalAlpha = .25 * (1 - k); ctx.strokeStyle = '#E8D9A8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y, 8 + 16 * k, (8 + 16 * k) * .35, 0, 0, Math.PI * 2); ctx.stroke(); }
        else if (e.kind === 'muzzle') FX.muzzle(ctx, e.x, e.y, e.a, e.t);
        else if (e.kind === 'hit') { if (settings.flash) FX.drawHitAny(e.x, e.y, k, e.col, e.dir || 0, e.big, e.green, e.alpha); }
        else if (e.kind === 'splash') FX.splash(ctx, e.x, e.y, k);
        else if (e.kind === 'ring') { ctx.globalAlpha = 1 - k; UI.circ(e.x, e.y, 14 + k * 60, null, COL.glow, 4); }
        else if (e.kind === 'skill') drawSkillFx(e, k);
        else if (e.kind === 'ghost') drawGhost(e, k);
        else if (e.kind === 'jumpLand') drawJumpLand(e, k);
      });
    }
    drawSkills(at);   // 점프 예고 원은 위에서 바닥 무늬로 그렸어요
    for (const s of G.shots) {
      const lift = s.kind === 'sling' ? Math.sin(Math.min(1, s.age / .5) * Math.PI) * 22 : s.kind === 'quake' ? -22 : 0;   // 충격파는 바닥에
      at(s.x, s.y, () => drawShotS(s, lift));
    }
    for (const s of G.eshots) at(s.x, s.y, () => { ctx.translate(s.x, s.y - 18); ctx.rotate(G.t * 8); ctx.fillStyle = s.col || '#CA57E5'; ctx.fillRect(-4, -4, 8, 8); ctx.strokeStyle = 'rgba(15,17,22,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(-4, -4, 8, 8); });
    for (const p of G.parts) { if (p.t < 0) continue; const h0 = p.h0 != null ? p.h0 : 14; at(p.x, p.y + h0, () => { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }); }
    ctx.restore();
    if (G.hurtFlash > 0 && settings.flash) { ctx.strokeStyle = `rgba(255,90,95,${G.hurtFlash / .15 * .8})`; ctx.lineWidth = 10; ctx.strokeRect(fb.x + 5, fb.y + 5, FIELD.W * fb.s - 10, FIELD.H * fb.s - 10); }
  }

  // ---- 입체감 (사용자 "입체감이 전혀없어" → A안: 2D에 그림자·조명·원근·높이) ----
  const perspective = y => { const f = FIELD.floor; return .86 + .26 * clamp((y - f.y0) / (f.y1 - f.y0), 0, 1); };   // 먼 쪽 0.86배 ~ 가까운 쪽 1.12배
  function castAlien(a) {
    const hgt = a.type === 'boss' ? 140 : a.type === 'shooter' ? 46 : 48;
    const L = alienLook(a), mo = { flip: L.mo.flip, shadow: a.entering ? .15 : .3 };
    if (L.cell) UI.cellSprite(L.name, 15, L.cell.i, a.x, a.y + 2, L.hgt, mo); else UI.sprite(L.name, a.x, a.y + 2, L.hgt, mo);
  }
  function castHero() {
    const h = G.hero, c = G.country; if (!h || (h.dead && G.scene !== 'ending')) return;
    const im = UI.img['dir/' + c.key]; if (!im || !im.naturalWidth) return;
    const aim = h.swing ? h.swing.ang : Math.atan2(h.dir.y, h.dir.x), o = ((Math.round(aim / (Math.PI / 4)) % 8) + 8) % 8;
    const bf = bodyFrame(h, OCT[o][0]);
    UI.dirBody(c.key, bf.cell, h.x, h.y, 60, { flip: OCT[o][1], shadow: .3 }, bf.folder);
  }
  // 부드러운 타원 그림자 (가운데 진하고 가장자리로 사라져요)
  function softShadow(x, y, rx, ry, a) {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(.6, `rgba(0,0,0,${a * .5})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // 방 조명: 위 왼쪽 따뜻한 빛 + 가장자리·구석 어둠 (한 번 그려 두고 다시 써요)
  let roomLight = null;
  function drawRoomLight() {
    if (!roomLight) {
      const c = document.createElement('canvas'), k = 2; c.width = Math.ceil(FIELD.W * k); c.height = Math.ceil(FIELD.H * k);
      const x = c.getContext('2d'); x.scale(k, k);
      const v = x.createRadialGradient(FIELD.W * .45, FIELD.H * .42, 60, FIELD.W * .5, FIELD.H * .5, FIELD.W * .62);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.65, 'rgba(8,6,12,.22)'); v.addColorStop(1, 'rgba(8,6,12,.6)');
      x.fillStyle = v; x.fillRect(0, 0, FIELD.W, FIELD.H);
      const far = x.createLinearGradient(0, 0, 0, FIELD.H); far.addColorStop(0, 'rgba(10,8,16,.22)'); far.addColorStop(.55, 'rgba(10,8,16,0)');   // 먼 쪽(위)이 조금 어두워요
      x.fillStyle = far; x.fillRect(0, 0, FIELD.W, FIELD.H);
      const l = x.createRadialGradient(FIELD.W * .32, FIELD.H * .28, 10, FIELD.W * .32, FIELD.H * .28, FIELD.W * .45);
      l.addColorStop(0, 'rgba(255,226,180,.10)'); l.addColorStop(1, 'rgba(255,226,180,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = l; x.fillRect(0, 0, FIELD.W, FIELD.H);
      // 벽 바로 아래 바닥에 벽 그림자 (위쪽 벽이 빛을 가려요)
      x.globalCompositeOperation = 'source-over';
      const w = x.createLinearGradient(0, FIELD.floor.y0 - 8, 0, FIELD.floor.y0 + 22); w.addColorStop(0, 'rgba(0,0,0,.35)'); w.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = w; x.fillRect(0, FIELD.floor.y0 - 8, FIELD.W, 30);
      const lw = x.createLinearGradient(FIELD.floor.x0 - 6, 0, FIELD.floor.x0 + 18, 0); lw.addColorStop(0, 'rgba(0,0,0,.28)'); lw.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = lw; x.fillRect(FIELD.floor.x0 - 6, 0, 24, FIELD.H);
      roomLight = c;
    }
    ctx.drawImage(roomLight, 0, 0, FIELD.W, FIELD.H);
  }
  // 벽 띠를 캐릭터 위에 다시 그려 앞뒤 겹침을 만들어요 (room 그림의 같은 부분)
  const WALL = { top: 44, side: 40, bottom: 358 };
  function drawWallStrip(which) {
    const im = UI.img.room; if (!im || !im.naturalWidth) return;
    const kx = im.naturalWidth / FIELD.W, ky = im.naturalHeight / FIELD.H;
    const lk = roomLight ? roomLight.width / FIELD.W : 1;
    const part = (x, y, w, h) => { ctx.drawImage(im, x * kx, y * ky, w * kx, h * ky, x, y, w, h); if (roomLight) ctx.drawImage(roomLight, x * lk, y * lk, w * lk, h * lk, x, y, w, h); };   // 같은 조명도 입혀요
    if (which === 'top') part(0, 0, FIELD.W, WALL.top);
    else { part(0, WALL.top, WALL.side, FIELD.H - WALL.top); part(FIELD.W - WALL.side, WALL.top, WALL.side, FIELD.H - WALL.top); part(WALL.side, WALL.bottom, FIELD.W - WALL.side * 2, FIELD.H - WALL.bottom); }
  }

  function drawHero() { if (!G.hero) return; heroGround(); heroBody(); }
  function heroGround(blob = true) {
    const h = G.hero, r = G.run;
    const money = r ? Math.max(0, r.money) : 50;
    // 발밑: 그림자 + 금빛(돈 비율, 0.25~0.9) + 보는 방향 금빛 호
    if (blob) { softShadow(h.x + 3, h.y + 1, 22, 7.5, .55); softShadow(h.x, h.y, 10, 3.5, .45); }
    if (h.boostT > 0 && !reduceMotion) { const sp = G.t * 2.5 * 2; ctx.save(); ctx.strokeStyle = '#C9CED6'; ctx.lineWidth = 2; ctx.globalAlpha = h.boostT > .6 || Math.floor(h.boostT / .1) % 2 === 0 ? .85 : .2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(h.x, h.y, 22, 22 * .35, 0, sp + i * 2.09, sp + i * 2.09 + 1.3); ctx.stroke(); } ctx.restore(); }   // 무적 중: 발밑 은 고리(지름 44)가 평소의 2.5배 속도로 돌아요   // 넓은 그림자 + 발밑 진한 그림자
    { const ga = .25 + .65 * Math.min(1, money / 100);   // 돈 비율만큼 발밑 금빛 (납작한 판 대신 퍼지는 빛)
      ctx.save(); ctx.translate(h.x, h.y); ctx.scale(1, .32); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 30); g.addColorStop(0, `rgba(255,209,102,${ga * .75})`); g.addColorStop(.55, `rgba(255,209,102,${ga * .35})`); g.addColorStop(1, 'rgba(255,209,102,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    if (h.buff) { ctx.strokeStyle = 'rgba(255,209,102,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x, h.y, 26, 9, 0, 0, Math.PI * 2); ctx.stroke(); if (Math.random() < .15) G.parts.push({ x: h.x + (Math.random() - .5) * 30, y: h.y - Math.random() * 10, vx: 0, vy: -50, life: .35, t: 0, color: '#FFD166', s: 2 }); }
    const da = Math.atan2(h.dir.y, h.dir.x);
    ctx.strokeStyle = 'rgba(255,209,102,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(h.x, h.y, 26, 9, 0, da - .35, da + .35); ctx.stroke();   // 보는 방향 호: 옅게·짧게 (디자인팀)
  }
  function heroBody() {
    const h = G.hero, c = G.country, t = G.t;
    if (h.skillT > 0 && !(h.boostT > 0)) UI.circ(h.x, h.y - 28, 30, 'rgba(255,209,102,.18)', COL.glow, 2);   // 돌진 무적 등 (무적 스킬은 아래 은빛 테두리)
    // 몸
    let mo = { flip: h.dir.x < -0.05 };
    if (h.boostT > 0 && (h.boostT > .6 || Math.floor(h.boostT / .1) % 2 === 0)) mo.edge = 'rgba(201,206,214,.7)';   // 무적 3초: 몸 은빛 테두리, 끝나기 0.6초 전 3번 깜빡
    let frame = 0;
    if (h.dead && G.scene !== 'ending') { const k = Math.min(1, h.deadT / .6); mo.alpha = 1 - k * .5; mo.sy = 1 - k * .35; }
    else if (h.swing) {
      const s = h.swing, t1 = SWING.wind, t2 = t1 + SWING.strike, ca = Math.cos(s.ang), sa = Math.sin(s.ang);
      let lunge;
      if (s.t < t1) { frame = 5; lunge = -3 * (s.t / t1); }
      else if (s.t < t2) { frame = 6; const k = (s.t - t1) / SWING.strike; lunge = -3 + 9 * (1 - Math.pow(1 - k, 3)); }
      else { frame = 6; lunge = 6 * (1 - (s.t - t2) / SWING.follow); }
      if (!reduceMotion) {
        mo.ox = ca * lunge; mo.oy = sa * lunge * .6;
        const squash = s.t >= t1 && s.t < t2 ? 1 : 0;
        mo.sx = 1 + .08 * squash; mo.sy = 1 - .06 * squash;
        mo.rot = (mo.flip ? -1 : 1) * (s.t < t1 ? -.1 : .14 * Math.max(0, lunge) / 6);
      }
    }
    else if (h.atkT > 0) { frame = h.atkT > .14 ? 5 : 6; if (!reduceMotion) { mo.rot = (mo.flip ? -1 : 1) * .16 * Math.sin((1 - h.atkT / .22) * Math.PI); mo.sx = 1.04; mo.sy = 1.04; } }
    else if (h.moving) { frame = reduceMotion ? 0 : 1 + Math.floor(h.walkT * 8) % 4; if (!reduceMotion) { const p = Math.abs(Math.sin(h.walkT * 11)); mo.oy = -p * 2; mo.rot = clamp(h.dir.x * .1, -.12, .12); } }
    else if (!reduceMotion) mo.sy = 1 + Math.sin(t * 2.2) * .015;
    if (h.dash && h.dash.k === 'leap') mo.oy = (mo.oy || 0) - Math.sin(Math.PI * Math.min(1, h.dash.t / h.dash.dur)) * 70;   // 멕시코 1: 높이 뛰어올라요
    if (G.scene === 'ending' && G.ending.fell) { const k = Math.min(1, (G.ending.t - 3.6) / .18); mo.rot = (mo.flip ? -1 : 1) * k * Math.PI / 2; mo.oy = -k * 6; }
    if (h.inv > 0 && !h.dead && Math.floor(h.inv * 12) % 2 === 0) mo.alpha = .45;
    if (h.hitT > 0 && settings.flash) mo.white = true;
    if (!drawHero8(h, c, mo)) UI.frame(c.key, frame, h.x, h.y, 60, mo);   // 8방향 그림이 없으면 예전 동작 시트
    if (h.hitT > 0 && !settings.flash) { ctx.strokeStyle = COL.red; ctx.lineWidth = 2; ctx.strokeRect(h.x - 16, h.y - 60, 32, 60); }
  }

  // ---- 8방향 몸 + 무기 360도 (7차 그림, 사용자 결정 "8방향 그림 + 무기 360도") ----
  // 몸: 조준 각도를 8방향으로 나눠 5칸 중 하나(왼쪽은 뒤집기). 무기: 손 위치에서 조준 각도대로 돌려요
  const OCT = [[2, false], [1, false], [0, false], [1, true], [2, true], [3, true], [4, false], [3, false]]; // 오른쪽부터 시계 방향
  // 무기 길이 = 장수 키 × 0.68, 창류(창·할버드·기병창)만 × 0.85
  const wLen = c => (c.ranged === 'polearm' ? 0.85 : 0.68);   // 사용자 "ㅇㅇ 줄여": 한손 무기 0.65~0.7, 창·할버드·장창 0.85
  // 손 위치 (칸 128×128 좌표, 발 = (64,124)) · 칸마다 무기를 몸 앞/뒤 어디에 그릴지 (디자인팀 c8ed6d9)
  const HAND = [[47, 86, false], [86, 85, false], [64, 86, false], [82, 86, true], [88, 84, true]];   // ①아래 ②오른쪽아래 ③오른쪽 ④오른쪽위(뒤) ⑤위(뒤)
  const REST = 0.52;      // 쉴 때 무기 각도 = 보는 방향 + 아래로 30°
  const GUN_REST = 0.175; // 총은 쉴 때 아래로 10°만 (style-guide "총 모션", 사용자 "총검술 몰라?")
  const THROWN = k => FX.THROWN(k) || k === 'boomerang';
  function weaponAngle(h, a) {
    // 치기: 예비동작(뒤로) → 스윙(반대쪽까지) → 마무리(돌아옴). 찌르기는 각도 대신 앞뒤로 밀어요
    const s = h.swing;
    if (FX.GUN[G.country.key]) {   // 미국·핀란드 총: 쏘기↔쉬기 각도를 0.15초 동안 부드럽게, 연사 중엔 쉬기로 안 돌아가요
      const tgt = s || h.rangedT > 0 || h.barrage ? 0 : 1, dtd = Math.min(.1, Math.max(0, G.t - (h.gunLast == null ? G.t : h.gunLast))); h.gunLast = G.t;
      h.gunK = h.gunK == null ? tgt : h.gunK + Math.sign(tgt - h.gunK) * Math.min(Math.abs(tgt - h.gunK), dtd / .15);
      if (!s) { const e = G.t - (h.shotT == null ? -9 : h.shotT); return { a: a + (Math.cos(a) >= 0 ? GUN_REST : -GUN_REST) * h.gunK, push: e < .06 ? -3 * (1 - e / .06) : 0 }; }   // 반동: 총 축 뒤로 3px, 0.06초
    }
    if (!s) return { a: h.rangedT > 0 ? a : a + (Math.cos(a) >= 0 ? REST : -REST), push: 0 };   // 쉴 때는 30° 아래로
    const mk = G.country.melee, side = Math.cos(s.ang) >= 0 ? 1 : -1, t1 = SWING.wind, t2 = t1 + SWING.strike;
    const ease = k => 1 - Math.pow(1 - k, 3);
    if (mk === 'thrust' || mk === 'rapid') {
      const push = s.t < t1 ? -6 * s.t / t1 : s.t < t2 ? -6 + 20 * ease((s.t - t1) / SWING.strike) : 14 * (1 - (s.t - t2) / SWING.follow);
      return { a: s.ang, push };
    }
    const from = mk === 'smash' ? -1.7 : -1.15, to = mk === 'bigslash' ? 1.4 : mk === 'smash' ? .7 : 1.2;
    let off;
    if (s.t < t1) off = from * (s.t / t1);
    else if (s.t < t2) off = from + (to - from) * ease((s.t - t1) / SWING.strike);
    else off = to * (1 - (s.t - t2) / SWING.follow);
    if (mk === 'spin') off = s.t < t1 ? 0 : Math.min(1, (s.t - t1) / (SWING.strike + SWING.follow)) * Math.PI * 2;
    return { a: s.ang + off * side, push: 0 };
  }
  function drawWeapon(h, c, px, py, a, alpha) {
    const ranged = c.ranged, rangedImg = ranged === 'arrow' ? 'korea-ranged' : ranged === 'sling' ? 'israel-ranged' : null;
    const len = 60 * wLen(c);
    ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
    // 활·투석기: 쏜 직후 잠깐 그 장비를 들어요
    if (rangedImg && h.rangedT > 0) {
      const im = UI.img['weapon/' + rangedImg];
      if (im && im.naturalWidth) {
        const sc = (ranged === 'arrow' ? 56 : len) / 188;
        ctx.translate(px + (ranged === 'arrow' ? Math.cos(h.aimShot) * 8 : 0), py + (ranged === 'arrow' ? Math.sin(h.aimShot) * 6 : 0));   // 활은 몸 앞으로 내밀어 들어요
        if (ranged === 'arrow') { ctx.rotate(h.aimShot + Math.PI / 2); ctx.drawImage(im, -96 * sc, -80 * sc, 192 * sc, 160 * sc); }   // 활: 가운데가 중심, 시위가 장수 쪽
        else { ctx.rotate(h.aimShot); if (Math.cos(h.aimShot) < 0) ctx.scale(1, -1); ctx.drawImage(im, -4 * sc, -80 * sc, 192 * sc, 160 * sc); }
        ctx.restore(); return;
      }
    }
    // 던진 직후엔 손이 비어요 (무기가 날아가는 중)
    if (THROWN(ranged) && h.rangedT > 0.12) { ctx.restore(); return; }
    if (FX.GUN[c.key]) { FX.drawGun(c.key, px - Math.cos(a) * 4, py, a, Math.cos(a) < 0, .65); ctx.restore(); return; }   // 미국·핀란드: 코드 총 (장수 키의 약 0.5배)
    const im = UI.img['weapon/' + c.key];
    if (im && im.naturalWidth) {
      const sc = len / 192;   // 그림 폭 192 → len
      ctx.translate(px, py); ctx.rotate(a); if (Math.cos(a) < 0) ctx.scale(1, -1);
      ctx.drawImage(im, -4 * sc, -80 * sc, 192 * sc, 160 * sc);   // 회전 중심 = 손잡이 끝 = 폭×0.0208, 높이×0.5 (192×160 기준 (4,80), 288×240이면 (6,120)) · 그리는 크기는 그림 크기와 무관
    }
    ctx.restore();
  }
  // 걷기 (9차 그림): 서기 → A → 서기 → B, 초당 8칸. 걷기 칸 = 방향×2 + (A 0, B 1)
  function bodyFrame(h, cell) {
    const wi = UI.img['walk/' + G.country.key];
    if (!h.moving || h.swing || h.dead || reduceMotion || !wi || !wi.naturalWidth) return { folder: 'dir', cell };
    const ph = Math.floor(h.walkT * 8) % 4;
    return ph === 1 ? { folder: 'walk', cell: cell * 2 } : ph === 3 ? { folder: 'walk', cell: cell * 2 + 1 } : { folder: 'dir', cell };
  }
  function drawHero8(h, c, mo) {
    if (!UI.img['dir/' + c.key] || !UI.img['dir/' + c.key].naturalWidth) return false;
    const aim = h.swing ? h.swing.ang : Math.atan2(h.dir.y, h.dir.x);
    const o = ((Math.round(aim / (Math.PI / 4)) % 8) + 8) % 8, [cell, flip] = OCT[o];
    const bm = Object.assign({}, mo, { flip });
    if (bm.rot && flip !== mo.flip) bm.rot = -bm.rot;
    const dead = h.dead || (G.scene === 'ending' && G.ending.fell);
    const w = weaponAngle(h, aim);
    // 손 위치: 128칸 기준 좌표를 게임 크기로 (그림이 192칸이어도 비율이 같아요 · 왼쪽 방향은 x → 128 − x)
    const kk = 60 / 112, hd = HAND[cell], hdx = (hd[0] - 64) * kk * (flip ? -1 : 1), hdy = (hd[1] - 124) * kk;
    const hx = h.x + (mo.ox || 0) + hdx + Math.cos(w.a) * w.push, hy = h.y + (mo.oy || 0) + hdy + Math.sin(w.a) * w.push * .8;
    const behind = hd[2];   // 오른쪽위·위를 볼 때는 몸 뒤에
    if (!dead && behind) drawWeapon(h, c, hx, hy, w.a, mo.alpha);
    const bf = bodyFrame(h, cell);
    UI.dirBody(c.key, bf.cell, h.x, h.y, 60, bm, bf.folder);
    if (!dead && !behind) drawWeapon(h, c, hx, hy, w.a, mo.alpha);
    return true;
  }

  // 명중 코어: 흰 점 6~10px 0.025초 → 옅은 금 꼬리 0.075초 감쇠
  function drawCore(e) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (e.t < .025) { UI.circ(e.x, e.y, 6, 'rgba(232,217,168,.45)'); UI.circ(e.x, e.y, 4, '#FFFFFF'); }   // 코어 지름 8px
    else { const q = (e.t - .025) / .075; ctx.globalAlpha = .45 * (1 - q); UI.circ(e.x, e.y, 5 + 4 * q, 'rgba(232,217,168,.35)'); }   // 옅은 금 꼬리 (고리 대신 번지는 빛)
    ctx.restore();
  }
  function drawAlien(a) {
    const L = alienLook(a);
    const lk = 1 - Math.min(.55, (a.lift || 0) / 160);   // 뛰면 그림자가 작고 옅어져요
    softShadow(a.x + 3, a.y + 1, a.r * 1.5 * (1 - L.hop * .03) * lk, a.r * .5 * lk, .5 * lk); softShadow(a.x, a.y, a.r * .7 * lk, a.r * .25 * lk, .4 * lk);
    if (L.cell) UI.cellSprite(L.name, 15, L.cell.i, a.x, a.y + 2, L.hgt, L.mo); else UI.sprite(L.name, a.x, a.y + 2, L.hgt, L.mo);
    if (a.type === 'boss') bossBar(a, 140);
  }
  const bossBar = (a, hgt) => { const w = 90; UI.rr(a.x - w / 2, a.y - hgt - 12, w, 6, 3, 'rgba(0,0,0,.6)'); UI.rr(a.x - w / 2, a.y - hgt - 12, w * Math.max(0, a.hp / a.max), 6, 3, COL.green); };   // 보스 체력
  // 외계인 모양: 그림 이름·키·움직임 (2D·3D가 같이 써요)
  // 외계인 8방향 (11차 그림 alien/<종류>-dir: 15칸 = 방향 5 × 서기·A·B, 왼쪽은 뒤집기 · 걸을 때 서기→A→서기→B)
  // 칸 높이: 예전 정면 그림과 보이는 키가 같게 (그림 속 키 ≈ 칸 × 0.8)
  const ALIEN_CELL = { grunt: 55, shooter: 56, boss: 183 }, ALIEN_FPS = { grunt: 10, shooter: 8, boss: 5 };
  function alienCell(a) {
    let fx = a.fx || 0, fy = a.fy || 0;
    if (Math.hypot(fx, fy) < .3) { fx = G.hero.x - a.x; fy = G.hero.y - a.y; }   // 멈춰 있으면 장수 쪽
    const o = ((Math.round(Math.atan2(fy, fx) / (Math.PI / 4)) % 8) + 8) % 8, [dir, flip] = OCT[o];
    const moving = !reduceMotion && (a.walkT || 0) > 0 && !a.jump && a.speed > 0, ph = moving ? Math.floor(a.walkT * ALIEN_FPS[a.type]) % 4 : 0;
    return { i: dir * 3 + (ph === 1 ? 1 : ph === 3 ? 2 : 0), flip };
  }
  function alienLook(a) {
    const t = G.t, sheet = 'alien/' + a.type + '-dir', im = UI.img[sheet], hasDir = !!(im && im.naturalWidth);
    const name = hasDir ? sheet : 'alien/alien-' + a.type, hgt = hasDir ? ALIEN_CELL[a.type] : a.type === 'boss' ? 140 : a.type === 'shooter' ? 46 : 48;
    const hop = a.hitT > 0 && !reduceMotion ? Math.sin(Math.PI * (1 - a.hitT / .1)) * 5 : 0;   // 맞으면 살짝 떠올랐다 떨어져요
    const cell = hasDir ? alienCell(a) : null;
    let mo = { flip: cell ? cell.flip : a.vx < 0 };
    if (!reduceMotion) {   // 꿈틀거림은 그림이 걸어서 ±3%로 줄였어요 (디자인팀)
      if (a.type === 'grunt') { const p = Math.sin(t * 14 + a.seed); mo.sy = 1 + p * .03; mo.sx = 1 - p * .02; }
      else if (a.type === 'shooter') { mo.ox = a.recoil > 0 ? (mo.flip ? 3 : -3) : 0; }
      else { mo.sy = 1 + Math.sin(t * 2) * .015; }
    }
    // 가는 방향으로 몸 돌리기 (8방향 그림 오기 전 코드 흉내): 위·아래로 가면 몸 폭을 줄여 돌아선 느낌, 위로 가면(등) 조금 어둡게,
    // 가는 쪽으로 기울기 + 걸음마다 좌우 흔들림·위아래 튀기 · 넉백 방향으로 몸이 젖혀져요
    if (!reduceMotion && !a.entering) {
      const fx = a.fx || 0, fy = a.fy || 0, st = a.step || 0;
      if (!cell) {   // 8방향 그림이 없을 때만 코드로 몸 돌리기 흉내
        mo.sx = (mo.sx || 1) * (1 - .14 * Math.abs(fy)); if (fy < -.35) mo.tint = .8 + .2 * (1 + fy);
        mo.oy = (mo.oy || 0) - Math.abs(Math.sin(st)) * (a.type === 'boss' ? 4 : 2.5); mo.rot = (mo.rot || 0) + Math.sin(st) * .06;
      }
      mo.rot = (mo.rot || 0) + fx * .05;                                         // 가는 쪽으로 살짝 기울기
      const kb = a.kb ? a.kb.x : 0; if (Math.abs(kb) > 15) mo.rot += clamp(kb / 700, -.28, .28);   // 넉백 방향으로 젖힘
    }
    const jIm = a.jump && UI.img['alien/' + a.type + '-jump'];
    if (a.jump && jIm && jIm.naturalWidth && cell) {   // 점프 그림 (12차): 웅크림·공중·착지 칸, 높이는 코드로 올려요
      const ph = a.jump.ph, J = a.jump;
      const o = ((Math.round(Math.atan2(J.ty - a.y, J.tx - a.x) / (Math.PI / 4)) % 8) + 8) % 8, [dir, flip] = Math.hypot(J.tx - a.x, J.ty - a.y) > 4 ? OCT[o] : [Math.floor(cell.i / 3), mo.flip];
      return { name: 'alien/' + a.type + '-jump', hgt, hop, lift: a.lift || 0, cell: { i: dir * 3 + (ph === 'crouch' ? 0 : ph === 'air' ? 1 : 2), flip },
        mo: { flip, oy: -(a.lift || 0), ox: ph === 'crouch' && !reduceMotion ? Math.sin(t * 70) * 1.2 : 0, white: mo.white, edge: mo.edge } };
    }
    if (a.jump) {   // 점프 그림이 없을 때: 웅크리며 떨기 → 공중에서 늘어나며 떠오름
      if (a.jump.ph === 'crouch') { const q = Math.min(1, a.jump.t / a.jumpCfg.crouch); mo.sy = 1 - .22 * q; mo.sx = 1 + .12 * q; mo.rot = 0; mo.ox = reduceMotion ? 0 : Math.sin(t * 70) * 1.6 * q; mo.oy = 0; }
      else { mo.sy = 1.1; mo.sx = .92; mo.oy = -(a.lift || 0); mo.rot = (a.vx < 0 ? -1 : 1) * .15; }
    }
    if (a.hitT > 0) {   // 발 고정, 공격축 0.88배 · 직각 1.08배로 눌렸다가 0.1초에 복원 (기어가기 변형은 잠깐 멈춤)
      const q = a.hitT > .07 ? 1 : a.hitT / .07, along = 1 - .12 * q, across = 1 + .08 * q;
      mo.sx = a.hitAx === 'x' ? along : across; mo.sy = a.hitAx === 'x' ? across : along; mo.rot = 0; mo.ox = 0; mo.oy = 0;
    }
    if (a.flash > 0 && settings.flash) mo.white = true;
    else if (a.edgeT > 0) mo.edge = alienCol(a);   // 몸 색 외곽선 (번쩍임을 꺼도 보여요)
    if (a.entering) mo.alpha = .85;
    if (hop) mo.oy = (mo.oy || 0) - hop;
    return { name, hgt, mo, hop, cell };
  }

  // 위 표시: HP · 돈 · 라운드 · 남은 외계인 · 일시정지
  function drawHUD() {
    const r = G.run, h = G.hero, c = G.country;
    if (G.skillFlash > 0) { ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 0, VW, VH); }   // 스킬 쓰는 순간 화면 번쩍 0.06초
    const x0 = Math.max(VW * .08, fieldBox.x + 12, safeArea().l + 8);   // 안전 영역 안 (QA M15)
    UI.rr(x0 - 8, VH * .04, 236, 64, 10, 'rgba(10,11,15,.55)');
    const low = h.hp / h.maxHp <= .25;
    UI.I.heart(x0 + 8, VH * .09, 18 * (low && !reduceMotion ? 1 + Math.abs(Math.sin(G.t * 6)) * .15 : 1), low ? COL.red : COL.hp);
    UI.bar(x0 + 22, VH * .09 - 7, 150, 14, h.hp / h.maxHp, low ? COL.red : COL.hp);
    // 체력 숫자는 안 보여요 — 최대 체력으로 나라 세기를 짐작할 수 있어서 (사용자 "나라 순위만 일부러 보여준거야", 막대만 남김)
    UI.txt(UI.money(c, r.money), x0, VH * .17 + 2, 18, COL.glow, 'left', 800);
    // 남은 스킬(한 판 5번) · 무적(라운드마다 2번)
    { const sy = VH * .17 + 2, ic = (n, x) => {   // 1번 ×5 · 2번 ×5 · 무적 ×2
        const im = UI.img['skill/icon-' + skillOf(c, n).type]; ctx.globalAlpha = sLeft(n) > 0 ? 1 : .4;
        if (im && im.naturalWidth) ctx.drawImage(im, x, sy - 10, 20, 20); else UI.I.bolt(x + 10, sy, 16, COL.gold);
        UI.txt(n + '', x - 2, sy + 7, 8, COL.gold, 'center', 900); UI.txt('×' + sLeft(n), x + 22, sy, 13, COL.fg, 'left', 800); };
      ic(1, x0 + 96); if (!BAL.SKILL_SHARED) ic(2, x0 + 142);
      ctx.globalAlpha = r.invuln > 0 ? 1 : .4; UI.I.shield(x0 + 196, sy, 16, COL.fg); UI.txt('×' + r.invuln, x0 + 206, sy, 13, COL.fg, 'left', 800); ctx.globalAlpha = 1; }
    // 화폐 효과 중
    if (h.buff) {
      const bx = x0 + 16, by = VH * .28 + 4;
      UI.circ(bx, by, 16, 'rgba(10,11,15,.7)'); UI.sprite('item/' + h.buff.cur, bx, by + 11, 22);
      ctx.strokeStyle = COL.glow; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bx, by, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * h.buff.t / h.buff.max); ctx.stroke();
      UI.txt(`×${h.buff.mul.toFixed(2)} · ${Math.ceil(h.buff.t)}`, bx + 22, by, 13, COL.glow, 'left', 800);
    }
    // 라운드 점 6개
    const cx = VW / 2;
    UI.rr(cx - 82, VH * .04, 164, 54, 10, 'rgba(10,11,15,.55)');
    for (let i = 0; i < 6; i++) {
      const dx = cx - 54 + i * 18, y = VH * .09;
      if (i + 1 < r.round) UI.circ(dx, y, 5, COL.gold); else if (i + 1 === r.round) UI.circ(dx, y, 5, null, '#FFFFFF', 2); else UI.circ(dx, y, 5, COL.empty);
    }
    UI.txt(`${r.round}/6`, cx + 62, VH * .09, 12, COL.fg, 'center', 700);
    UI.I.alien(cx - 46, VH * .17 + 1, 18, '#CA57E5');
    UI.txt(t_('ui.04', { n: Math.max(0, remaining()) }), cx + 6, VH * .17 + 1, 14, COL.fg, 'center', 700, 120);
    if (G.scene === 'play' && G.touchUI) { const SA = safeArea(); UI.btnSub('pause', Math.min(VW * .93, VW - SA.r - 26), Math.max(VH * .1, SA.t + 26), 44, 'pause'); }   // 폰만 (PC는 ESC) — 마우스로 치다가 잘못 눌리지 않게
  }

  function drawControls() {
    const B = btnPos();
    // 조이스틱: 왼쪽 절반 아무 데나 누르면 그 자리에 생겨요
    const SA = safeArea(), jx = joy.id != null ? joy.ox : Math.max(VW * .15, SA.l + 70), jy = joy.id != null ? joy.oy : Math.min(VH * .72, VH - SA.b - 70);   // 안전 영역 안 (QA M15)
    UI.circ(jx, jy, 64, 'rgba(255,255,255,.08)', 'rgba(0,0,0,.45)', 4);
    UI.circ(jx, jy, 62, null, 'rgba(255,255,255,.35)', 1.5);
    UI.circ(jx + joy.x * 52, jy + joy.y * 52, 28, 'rgba(255,255,255,.5)', 'rgba(0,0,0,.35)', 2);
    // 오른쪽: 큰 원 + 손잡이 + 화살표 4개 (GDD 0-18 · style-guide "폰 오른쪽 조작")
    const h = G.hero, r = G.run, drag = aim && aim.drag, dim = drag ? .35 : 1;
    ctx.globalAlpha = dim; UI.circ(B.stick.x, B.stick.y, STICK_R, 'rgba(255,255,255,.12)', 'rgba(255,255,255,.35)', 2);
    UI.circ(B.stick.x + rstick.x * (STICK_R - 26), B.stick.y + rstick.y * (STICK_R - 26), 26, rstick.id != null ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.5)', null, 0); ctx.globalAlpha = 1;
    const arrow = (b, me, gold, glow) => {   // 바깥쪽 끝이 뾰족한 진한 판
      const R = b.r; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
      ctx.beginPath(); ctx.moveTo(-R, -R); ctx.lineTo(R * .45, -R); ctx.lineTo(R, 0); ctx.lineTo(R * .45, R); ctx.lineTo(-R, R); ctx.closePath();
      ctx.fillStyle = glow ? 'rgba(201,206,214,.55)' : 'rgba(20,22,34,.82)'; ctx.fill();
      ctx.strokeStyle = me ? '#E8D9A8' : gold ? '#E8D9A8' : 'rgba(255,255,255,.7)'; ctx.lineWidth = me ? 3 : 2; ctx.stroke(); ctx.restore();
    };
    const badge = (b, n) => { const bx = b.x + b.r * .62, by = b.y - b.r * .62; UI.circ(bx, by, 10, '#D9AE4F'); UI.txt(String(n), bx, by, 12, COL.icon, 'center', 800); };
    const meDown = mArrow.id != null;
    ctx.globalAlpha = dim; arrow(B.melee, meDown, true, false); UI.I.sword(B.melee.x, B.melee.y, B.melee.r * 1.1, COL.fg); ctx.globalAlpha = 1;
    for (const [n, b] of [[1, B.skill], [2, B.skill2]]) {
      const me = drag && aim.n === n; ctx.globalAlpha = (sLeft(n) > 0 ? 1 : .4) * (drag && !me ? dim : 1);
      arrow(b, me, false, false); UI.txt(String(n), b.x, b.y + 1, 26, COL.fg, 'center', 900); badge(b, sLeft(n)); ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = (r.invuln > 0 || h.skillT > 0 ? 1 : .4) * dim; arrow(B.invuln, false, false, h.skillT > 0); UI.I.shield(B.invuln.x, B.invuln.y, B.invuln.r * 1.05, COL.fg); badge(B.invuln, r.invuln); ctx.globalAlpha = 1;   // 무적 3초 동안 은빛
    if (aim && aim.drag) {   // 취소 원: 버튼 둘레 (반지름 + 14) · 들어오면 밝아져요
      const b = aim.b, cr = b.r + 14, on = aim.cancel;
      ctx.save(); ctx.fillStyle = on ? 'rgba(255,255,255,.28)' : 'rgba(15,17,22,.6)'; ctx.beginPath(); ctx.arc(b.x, b.y, cr, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = on ? 3 : 2; if (!on) ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x - 9, b.y - 9); ctx.lineTo(b.x + 9, b.y + 9); ctx.moveTo(b.x + 9, b.y - 9); ctx.lineTo(b.x - 9, b.y + 9); ctx.stroke(); ctx.restore();
      UI.txt(t_('x.cancel'), b.x, b.y - cr - 9, 12, '#FFFFFF', 'center', 800);
    }
    badge(B.skill, sLeft(1)); badge(B.skill2, sLeft(2)); badge(B.invuln, r.invuln);
  }

  // 장수 머리 위 화면 좌표 (2D·3D)
  function heroHead() {
    const h = G.hero, fb = fieldBox; if (!h) return { x: VW / 2, y: VH * .3 };
    if (use3d && R3D.built) { const p = R3D.proj(h.x, h.y); return { x: fb.x + p.x * fb.s, y: fb.y + (p.y - 70 * p.s) * fb.s }; }
    return { x: fb.x + h.x * fb.s, y: fb.y + (h.y - 70) * fb.s };
  }
  function drawMsgs() {
    for (const m of G.msgs) {
      const a = Math.min(1, m.t / .3);
      ctx.globalAlpha = a;
      if (m.big) { UI.rr(VW / 2 - 110, VH * .42 - 26, 220, 52, 12, 'rgba(10,11,15,.6)'); UI.txt(m.text, VW / 2, VH * .42, 30, COL.fg, 'center', 800, 200); }
      else if (m.hint) UI.txt(m.text, VW / 2, VH * .84, 12, COL.muted, 'center', 600);
      else if (m.shout) {   // 외침: 장수 머리 위 1.2초, 양피지색 글자 + 어두운 반투명 띠 (style-guide)
        const hd = heroHead(), p = 1 + (1 - Math.min(1, ((m.life0 || 1.2) - m.t) / .15)) * .18;   // 처음 0.15초 살짝 커졌다 줄어요
        UI.x.font = `900 ${20 * p}px system-ui, sans-serif`; const w = Math.min(VW * .8, Math.max(140, UI.x.measureText(m.text).width + 36));
        const HUD_B = VH * .17 + 16, x = clamp(hd.x, w / 2 + 8, VW - w / 2 - 8), y = clamp(hd.y - 22 - 18 * p < HUD_B ? hd.y + 80 : hd.y - 22, HUD_B + 18 * p, VH - 40);   // 위 HUD(체력·남은 외계인·일시정지)를 가리면 장수 발밑으로
        UI.rr(x - w / 2, y - 18 * p, w, (m.sub ? 50 : 36) * p, 10, 'rgba(10,11,15,.62)');
        if (m.rtl) ctx.direction = 'rtl';
        UI.txt(m.text, x, y, 20 * p, '#F2E3C6', 'center', 900, w - 28);
        ctx.direction = 'ltr';
        if (m.sub) UI.txt(m.sub, x, y + 20 * p, 11 * p, COL.gold, 'center', 700, VW * .6);
      }
      else { UI.rr(VW / 2 - 200, VH * .56 - 18, 400, 36, 10, 'rgba(10,11,15,.6)'); UI.txt(m.text, VW / 2, VH * .56, 15, COL.fg, 'center', 700, 380); }
    }
    ctx.globalAlpha = 1;
  }

  function drawPause() {
    ctx.fillStyle = 'rgba(0,0,0,.66)'; ctx.fillRect(0, 0, VW, VH);
    const px = VW * .07, pw = VW * .4, py = VH * .07, ph = VH * .86;
    UI.panel(px, py, pw, ph);
    UI.txt(t_('ui.09'), px + pw / 2, py + 24, 18, COL.fg, 'center', 800);
    // Language (모든 언어에서 영어 "Language" + 지구 아이콘)
    let y = py + 60;
    UI.rr(px + 14, y - 18, pw - 28, 36, 10, 'rgba(255,255,255,.04)', COL.gold, 1.5);
    UI.I.globe(px + 34, y, 20, COL.gold); UI.txt('Language', px + 52, y, 14, COL.fg, 'left', 700);
    UI.txt(I18N.LANG_NAMES[I18N.lang] + ' ▾', px + pw - 26, y, 14, COL.gold, 'right', 700);
    UI.hit('lang', px + 14, y - 18, pw - 28, 36);
    const rows = [['sound', 'speaker', t_('x.sound'), settings.sound], ['shake', 'wave', '', settings.shake], ['flash', 'star', '', settings.flash]];
    rows.forEach(([id, ic, label, on], i) => {
      const ry = y + 50 + i * 40;
      UI.I[ic](px + 34, ry, 20, COL.fg); if (label) UI.txt(label, px + 52, ry, 13, COL.muted, 'left', 600);
      UI.toggle(id, px + pw - 70, ry - 12, on);
    });
    UI.btnSub('exit', px + pw * .3, py + ph - 40, 52, 'back');
    UI.btnMain('resume', px + pw * .68, py + ph - 40, 32, 'play');
    if (G.langOpen) {
      // 언어 20개: 2열 × 10줄, 자기 표기 (ui.md)
      const langs = I18N.available(), lx = VW * .5, lw = VW * .44, top = VH * .07, rowH = Math.min(31, (VH * .86 - 20) / 10);
      UI.panel(lx, top - 8, lw, rowH * 10 + 16);
      langs.forEach((l, i) => {
        const col = i % 2, row = Math.floor(i / 2), tx = lx + 16 + col * lw / 2, ty = top + rowH / 2 + row * rowH, on = l === I18N.lang, rtl = l === 'he';
        if (on) UI.rr(tx - 8, ty - 13, lw / 2 - 16, 26, 8, 'rgba(217,174,79,.22)', COL.gold, 1.5);
        UI.txt(I18N.LANG_NAMES[l], rtl ? tx + lw / 2 - 30 : tx, ty, 14, on ? COL.gold : COL.fg, rtl ? 'right' : 'left', on ? 700 : 500);
        UI.hit('lang:' + l, tx - 8, ty - 13, lw / 2 - 16, 26);
      });
    }
  }

  function drawRoundPanel() {
    const p = G.panel, c = G.country, w = 360, hh = 230, x = VW / 2 - w / 2, y = VH / 2 - hh / 2;
    ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, VW, VH);
    UI.panel(x, y, w, hh);
    UI.I.check(x + 34, y + 30, 22, COL.hp);
    UI.txt(t_('x.roundClear', { n: p.round }), VW / 2 + 10, y + 30, 22, COL.fg, 'center', 800, w - 80);
    UI.txt(p.line, VW / 2, y + 60, 14, COL.glow, 'center', 700, w - 30);
    // 장수 (왼쪽) — 금빛이 새 돈 비율로 줄어요
    const k = Math.min(1, Math.max(0, (p.t - .5) / 1)), m = p.old + (p.now - p.old) * k;
    ctx.fillStyle = `rgba(255,209,102,${.25 + .65 * m / 100})`; ctx.beginPath(); ctx.ellipse(x + 50, y + 170, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    UI.hero(c.key, x + 50, y + 170, 90);
    UI.I.coin(x + 108, y + 94, 22, c.sym);
    UI.txt(`${UI.money(c, p.old)} → ${UI.money(c, m)}`, x + 124, y + 94, 16, COL.gold, 'left', 800);
    UI.txt(`−${BAL.D}`, x + w - 20, y + 94, 16, COL.amber, 'right', 800);
    [['heart', COL.red], ['sword', COL.fg], ['speed', COL.fg]].forEach(([ic, icc], i) => {   // 능력치 "???" (GDD 0-13)
      const by = y + 122 + i * 17;
      UI.I[ic](x + 112, by, 13, icc); UI.txt('???', x + 128, by, 12, COL.muted, 'left', 700);
    });
    for (let i = 0; i < 6; i++) {
      const dx = VW / 2 - 45 + i * 18, dy = y + hh - 16;
      if (i < p.round) UI.circ(dx, dy, 5, COL.gold);
      else if (i === p.round) { if (Math.floor(G.t * 4) % 2) UI.circ(dx, dy, 5, null, '#FFFFFF', 2); else UI.circ(dx, dy, 5, COL.empty); }
      else UI.circ(dx, dy, 5, COL.empty);
    }
  }

  function drawEnding() {
    const e = G.ending;
    if (e.t < 3.6) {
      const a = Math.min(1, e.t / .3);
      ctx.globalAlpha = a;
      UI.rr(VW / 2 - 220, VH * .2 - 30, 440, 92, 14, 'rgba(10,11,15,.6)');
      UI.I.trophy(VW / 2 - 70, VH * .2, 30, COL.gold);
      UI.txt(t_('x.clear'), VW / 2 + 10, VH * .2, 30, COL.glow, 'center', 900);
      UI.txt(e.line, VW / 2, VH * .2 + 40, 15, COL.fg, 'center', 700, 420);
      ctx.globalAlpha = 1;
    }
    if (e.t > 2.2) {
      ctx.globalAlpha = Math.min(1, (e.t - 2.2) / .4);
      UI.rr(VW / 2 - 200, VH * .78 - 20, 400, 40, 10, 'rgba(10,11,15,.7)');
      UI.txt(t_('end.unfair'), VW / 2, VH * .78, 17, COL.fg, 'center', 700, 380);
      ctx.globalAlpha = 1;
    }
  }

  function drawResult() {
    const R = G.result, c = G.country, r = G.run;
    if (!use3d) { UI.draw('room', 0, 0, VW, VH); ctx.fillStyle = 'rgba(15,17,22,.85)'; ctx.fillRect(0, 0, VW, VH); }
    // 장수: 결과가 어떻든 같은 그림
    UI.hero(c.key, VW * .15, VH - 6, Math.min(190, VH * .5), { sy: reduceMotion ? 1 : 1 + Math.sin(G.t * 2.2) * .015 });
    const cx = VW / 2;
    if (R.kind === 'clear') UI.I.trophy(cx, VH * .13, 50, COL.gold);
    else if (R.kind === 'fail') UI.I.flag(cx, VH * .13, 50, COL.fg);
    else UI.I.coin(cx, VH * .13, 50, c.sym, true);
    const title = R.kind === 'clear' ? t_('x.clear') : R.kind === 'fail' ? t_('x.fail') : t_('ui.07');
    UI.txt(title, cx, VH * .29, 28, COL.fg, 'center', 800);
    let ly = VH * .37;
    if (R.kind === 'bankrupt') { UI.txt(c.sym + '0', cx, ly, 16, COL.amber, 'center', 800); ly += 20; }
    if (R.line) UI.para(R.line, cx, ly + 4, 13, COL.muted, Math.min(420, VW * .5), 17);
    const iy = VH * .5;
    UI.flag(c.iso, cx - 90, iy - 8, 24, 16); UI.txt(I18N.countryName(c), cx - 58, iy, 15, COL.fg, 'left', 700, 150);
    for (let i = 0; i < 6; i++) UI.circ(cx - 45 + i * 18, VH * .59, 5, i < R.rounds ? COL.gold : COL.empty);
    UI.I.alien(cx + 76, VH * .59, 16, '#CA57E5'); UI.txt(String(R.kills), cx + 90, VH * .59, 14, COL.fg, 'left', 800);
    const b = best[c.key];
    if (b) { UI.I.trophy(cx - 30, VH * .67, 14, COL.gold); UI.txt(`${b.rounds}/6 · ${b.kills}`, cx + 6, VH * .67, 13, COL.muted, 'center', 700); }
    if (R.isNew) { UI.I.star(cx + 56, VH * .67, 16 + (reduceMotion ? 0 : Math.sin(G.t * 8) * 2), COL.glow); UI.txt('NEW', cx + 80, VH * .67, 11, COL.glow, 'left', 900); }
    // 버튼 3개 (사용자 결정): 종료 · 다시하기 · 광고보기 — 모두 같은 크기
    // 광고보기는 실패(한 판 1회)·파산(무제한)에서만, 광고 SDK가 준비됐을 때만 보여요
    const by = VH * .82, bw = 146, bh = 50, gap = 14;
    const canAd = !R.adFailed && (Platform.adsReady ? Platform.adsReady() : Platform.name !== 'web');
    const adId = R.kind === 'fail' && !r.reviveUsed && canAd ? 'revive' : R.kind === 'bankrupt' && !R.final && canAd ? 'bankruptGo' : null;
    const btns = [['quit', 'back', t_('x.quit'), 'sub'], ['restart', 'retry', t_('ui.05'), 'main']];
    if (adId) btns.push([adId, 'video', t_('ui.06'), 'ad']);
    const x0 = cx - (btns.length * bw + (btns.length - 1) * gap) / 2 + bw / 2 + (btns.length === 3 ? 30 : 0);
    btns.forEach(([id, ic, label, kind], i) => UI.btnWide(id, x0 + i * (bw + gap), by, bw, bh, ic, label, kind));   // 출처 줄은 뺐어요 (GDD 0-13)
  }

  // ---------- 루프 ----------
  let lastT = 0, slowT = 0;
  // 진단 표시 (?debug=1 또는 미리보기 window.__DEBUG): 렌더러·기기 정보 + 오류를 화면 왼쪽 아래에 — 아이폰에서 캡처해 보낼 수 있게
  const diag = {
    on: (() => { try { return /[?&]debug=1/.test(location.search) || !!window.__DEBUG; } catch { return false; } })(), errs: [], el: null,
    err(m) { const s = String(m).split('\n').slice(0, 2).join(' | ').slice(0, 220); if (this.errs[this.errs.length - 1] !== s) this.errs.push(s); if (this.errs.length > 6) this.errs.shift(); },
    draw() {
      if (!this.el) { this.el = document.createElement('div'); this.el.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:9;max-width:70vw;font:10px/1.35 monospace;color:#F2E3C6;background:rgba(0,0,0,.72);padding:4px 6px;border-radius:6px;pointer-events:none;white-space:pre-wrap;word-break:break-all'; document.body.appendChild(this.el); }
      const i = use3d && R3D.built ? R3D.info() : null;
      const t = `${use3d ? '3D' : '2D'}${R3D.lost ? '(lost)' : ''} · maxTex ${i ? i.maxTex : '-'} · filter ${UI.FILTER_OK ? 'O' : 'X'} · dpr ${(window.devicePixelRatio || 1).toFixed(1)} · ${innerWidth}×${innerHeight}${i && i.low ? ' · low' : ''}\n${navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 110)}` + (this.errs.length ? '\n⚠ ' + this.errs.join('\n⚠ ') : '');
      if (t !== this.last) { this.el.textContent = t; this.last = t; }
    },
  };
  window.addEventListener('error', e => diag.err((e.message || 'error') + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => diag.err('promise: ' + (e.reason && (e.reason.message || e.reason))));
  function loop(t) {
    let left = Math.min((t - lastT) / 1000 || 0, 0.25);
    lastT = t;
    // 3D가 버거운 기기면 화질을 한 번 낮춰요 (3초 넘게 40fps 아래)
    if (use3d && !R3D.low && G.scene === 'play' && !G.paused && left > 0) { slowT = left > 1 / 40 ? slowT + left : Math.max(0, slowT - left * .5); if (slowT > 3) R3D.lowQuality(); }
    try {
      while (left > 0) { const step = Math.min(left, 1 / 30); update(step); left -= step; }
      draw();
    } catch (err) { console.error(err); diag.err(err && (err.stack || err.message) || String(err)); }
    if (diag.on) diag.draw();
    requestAnimationFrame(loop);
  }

  // 시작 순서: SDK 초기화 → 에셋 로딩 → 로딩 끝 알림 → 시작 화면
  requestAnimationFrame(loop);
  const sdkInit = Promise.race([
    Promise.resolve().then(() => Platform.init()).catch(err => console.warn('[Platform] init 실패 → 광고 없이 진행', err)),
    new Promise(r => setTimeout(r, 5000)),
  ]);
  sdkInit.then(loadAssets).then(() => {
    try { Platform.loadingFinished(); } catch (err) { console.warn('[Platform] loadingFinished 실패', err); }
    G.scene = 'title';
  });
})();
