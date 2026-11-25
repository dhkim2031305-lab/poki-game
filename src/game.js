// 강한 놈만 살아남는 세상 — 게임 본체 (1차)
// 기준: teams/1-기획/GDD.md · balance.md · monetization.md · texts.md / teams/2-디자인/ui.md · style-guide.md · sound.md
// 광고·SDK는 window.Platform 만 불러요.
(() => {
  const { COUNTRIES, CURRENCY_MUL, CURRENCY_SYM, BAL, TEMP, FIELD } = window.DATA;
  const UI = window.UI, I18N = window.I18N, AUDIO = window.AUDIO, COL = UI.COL;
  const t_ = (k, v) => I18N.t(k, v);
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  UI.x = ctx;

  // ---------- 저장 (막혀 있어도 안 터지게) ----------
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem('aw.' + k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aw.' + k, JSON.stringify(v)); } catch {} },
  };
  const reduceMotion = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } })();
  const settings = Object.assign({ sound: true, shake: !reduceMotion, flash: !reduceMotion }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
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
  }
  window.addEventListener('resize', resize); resize();
  const portrait = () => G.touchUI && H > W;

  // ---------- 상태 ----------
  // scene: loading · title · select · play · roundPanel · ending · result · ad
  const G = window.G = {
    t: 0, scene: 'loading', paused: false, sel: 0, selScroll: 0, country: null, run: null, hero: null,
    aliens: [], shots: [], eshots: [], items: [], fx: [], parts: [], msgs: [], shake: 0, hurtFlash: 0,
    touchUI: false, load: 0, titleHeroes: [], result: null, panel: null, ending: null,
  };
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  // 같은 맵 규칙: 라운드마다 같은 순서가 나오게 고정 시드
  const seeded = s => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // 돈 → 능력치 (balance.md)
  const stats = m => {
    const M = Math.max(0, m), F = 0.4 + 0.6 * M / 100, S = 0.7 + 0.3 * M / 100;
    return { hp: Math.round(BAL.BASE.hp * F), melee: BAL.BASE.melee * F, ranged: BAL.BASE.ranged * F, speed: BAL.BASE.speed * S, F, S };
  };

  // ---------- 에셋 ----------
  function loadAssets() {
    const list = [];
    COUNTRIES.forEach(c => { list.push('hero/' + c.key, 'sheet/' + c.key); list.push('flag/' + c.iso); });
    list.push('alien/alien-grunt', 'alien/alien-shooter', 'alien/alien-boss', 'room');
    Object.keys(CURRENCY_MUL).forEach(c => list.push('item/' + c));
    let done = 0;
    return new Promise(res => {
      list.forEach(n => {
        const im = new Image();
        const fin = () => { G.load = ++done / list.length; if (done === list.length) res(); };
        im.onload = fin; im.onerror = fin;
        im.src = 'assets/' + n + (n.startsWith('flag/') ? '.svg' : '.webp');
        UI.img[n] = im;
      });
    });
  }

  // ---------- 판 · 라운드 ----------
  function newRun(ci) {
    G.country = COUNTRIES[ci];
    G.run = { round: 1, money: G.country.money, kills: 0, reviveUsed: false, rewardedSeen: false, bankrupts: 0, maxRound: 0 };
    startRound(true);
  }
  function startRound(first) {
    const r = G.run, c = G.country, wave = BAL.WAVES[r.round - 1], st = stats(r.money);
    r.wave = wave; r.st = st; r.roundT = 0; r.spawned = 0; r.spawnT = 0.8; r.killsRound = 0; r.bossSpawned = false;
    r.itemIdx = 0; r.skills = BAL.SKILL_PER_ROUND; r.clearT = -1; r.rng = seeded(r.round * 7919 + 13);
    G.hero = {
      x: FIELD.W / 2, y: FIELD.H / 2 + 30, r: 14, hp: st.hp, maxHp: st.hp, dir: { x: 1, y: 0 }, moving: false, walkT: 0,
      inv: 0, skillT: 0, meleeCd: 0, rangedCd: 0, atkT: 0, buff: null, dead: false, deadT: 0, hitT: 0,
    };
    G.aliens = []; G.shots = []; G.eshots = []; G.items = []; G.fx = []; G.parts = [];
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
  const input = { mx: 0, my: 0, melee: false, ranged: false };
  const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
  const held = {};   // 'melee'/'ranged' → pointerId
  const btnPos = () => ({
    melee: { x: VW * .87, y: VH * .72, r: 48 }, ranged: { x: VW * .73, y: VH * .84, r: 34 }, skill: { x: VW * .75, y: VH * .56, r: 28 },
  });
  const toV = e => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) / U, y: (e.clientY - b.top) / U }; };
  let drag = null;

  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); AUDIO.unlock();
    if (e.pointerType !== 'mouse') G.touchUI = true;
    const p = toV(e);
    if (G.scene === 'ad') return;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    const id = UI.hitAt(p.x, p.y);
    if (id) { if (id.startsWith('card:')) { drag = { id: e.pointerId, y0: p.y, s0: G.selScroll, moved: false, card: id }; return; } AUDIO.play('button'); return action(id); }
    if (G.scene === 'select' && p.x < VW * .6 && p.y > VH * .18) { drag = { id: e.pointerId, y0: p.y, s0: G.selScroll, moved: false }; return; }
    if (G.scene !== 'play' || G.paused) return;
    if (e.pointerType === 'mouse') { input.melee = true; held.melee = e.pointerId; return; }
    const B = btnPos();
    for (const k of ['melee', 'ranged', 'skill']) {
      const b = B[k];
      if ((p.x - b.x) ** 2 + (p.y - b.y) ** 2 < (b.r * 1.3) ** 2) { if (k === 'skill') useSkill(); else { input[k] = true; held[k] = e.pointerId; } return; }
    }
    if (p.x < VW / 2 && joy.id == null) { joy.id = e.pointerId; joy.ox = p.x; joy.oy = p.y; joy.x = 0; joy.y = 0; }
  });
  cv.addEventListener('pointermove', e => {
    const p = toV(e);
    if (drag && drag.id === e.pointerId) {
      if (Math.abs(p.y - drag.y0) > 6) drag.moved = true;
      if (drag.moved) G.selScroll = clamp(drag.s0 - (p.y - drag.y0), 0, selMaxScroll());
      return;
    }
    if (joy.id === e.pointerId) {
      let dx = p.x - joy.ox, dy = p.y - joy.oy; const d = Math.hypot(dx, dy), R = 52;
      if (d > R) { joy.ox = p.x - dx / d * R; joy.oy = p.y - dy / d * R; dx = dx / d * R; dy = dy / d * R; } // 손잡이를 따라 기준점도 끌려와요
      joy.x = dx / R; joy.y = dy / R;
    }
  });
  const release = e => {
    if (drag && drag.id === e.pointerId) { if (!drag.moved && drag.card) { AUDIO.play('button'); action(drag.card); } drag = null; }
    if (joy.id === e.pointerId) { joy.id = null; joy.x = joy.y = 0; }
    for (const k of ['melee', 'ranged']) if (held[k] === e.pointerId) { held[k] = null; input[k] = false; }
  };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  cv.addEventListener('wheel', e => { if (G.scene === 'select') { G.selScroll = clamp(G.selScroll + e.deltaY * .5, 0, selMaxScroll()); e.preventDefault(); } }, { passive: false });
  cv.addEventListener('contextmenu', e => e.preventDefault());

  const GAME_KEYS = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyK', 'KeyL', 'Escape', 'Enter'];
  window.addEventListener('keydown', e => {
    if (GAME_KEYS.includes(e.code)) e.preventDefault();   // 페이지 스크롤 막기
    AUDIO.unlock();
    if (G.scene === 'ad') return;
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (G.scene === 'play') return setPause(!G.paused);
      if (G.scene === 'select') return action('back');
    }
    const ok = e.code === 'Enter' || e.code === 'Space';
    // 한 번 누른 키가 다음 화면까지 이어서 눌리지 않게 화면마다 하나만 처리해요
    if (G.scene === 'play') { if (!G.paused && e.code === 'KeyL') useSkill(); }
    else if (G.scene === 'title') { if (ok) action('start'); }
    else if (G.scene === 'select') {
      const mv = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -5, ArrowDown: 5, KeyA: -1, KeyD: 1, KeyW: -5, KeyS: 5 }[e.code];
      if (mv) { G.sel = clamp(G.sel + mv, 0, COUNTRIES.length - 1); scrollToSel(); }
      if (ok) action('confirm');
    } else if (G.scene === 'result') { if (ok && G.result.t > 0.6) action('restart'); }
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { keys.clear(); if (G.scene === 'play' && !G.paused) setPause(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.scene === 'play' && !G.paused) setPause(true); });

  function readMove() {
    let x = 0, y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x--; if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y--; if (keys.has('KeyS') || keys.has('ArrowDown')) y++;
    if (joy.id != null) { x = joy.x; y = joy.y; }
    const d = Math.hypot(x, y);
    if (d > 1) { x /= d; y /= d; }
    input.mx = Math.abs(x) < .12 ? 0 : x; input.my = Math.abs(y) < .12 ? 0 : y;
  }

  function setPause(p) {
    if (G.scene !== 'play') return;
    G.paused = p; G.langOpen = false;
    if (p) { Platform.gameplayStop(); joy.id = null; input.melee = input.ranged = false; held.melee = held.ranged = null; }
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
          newRun(G.sel);
        }
        break;
      case 'play':
        if (id === 'pause') setPause(!G.paused);
        if (id === 'resume') setPause(false);
        if (id === 'exit') { setPause(false); Platform.gameplayStop(); G.scene = 'select'; }
        break;
      case 'result':
        if (id === 'restart') restartWithAd();
        if (id === 'country') { G.scene = 'select'; G.sel = lastCountry ?? 0; scrollToSel(); }   // 나라 바꾸기: 광고 없음
        if (id === 'revive') rewardedRevive();
        if (id === 'bankruptGo') rewardedBankrupt();
        break;
    }
  }

  // ---------- 광고 (monetization.md) ----------
  async function restartWithAd() {
    const skip = G.run.rewardedSeen;     // 보상형을 본 판이면 판 사이 광고를 한 번 건너뛰어요
    G.scene = 'ad';
    if (!skip) await Platform.commercialBreak(() => AUDIO.setAdMute(true));
    AUDIO.setAdMute(false);
    newRun(G.country.rank - 1);
  }
  async function rewarded() {
    G.scene = 'ad';
    const ok = await Platform.rewardedBreak(() => AUDIO.setAdMute(true));
    AUDIO.setAdMute(false);
    return ok;
  }
  async function rewardedRevive() {
    const ok = await rewarded();
    if (!ok) { G.scene = 'result'; return; }   // 끝까지 안 봤거나 못 불러오면 보상 없음
    const r = G.run, h = G.hero;
    r.reviveUsed = true; r.rewardedSeen = true;
    h.dead = false; h.deadT = 0; h.hp = h.maxHp; h.inv = BAL.REVIVE_INVULN;
    G.eshots = []; G.aliens.forEach(a => { const d = Math.hypot(a.x - h.x, a.y - h.y) || 1; if (d < 90) { a.x += (a.x - h.x) / d * 40; a.y += (a.y - h.y) / d * 40; } });
    G.scene = 'play'; G.paused = false; AUDIO.play('revive');
    Platform.gameplayStart();
  }
  async function rewardedBankrupt() {
    const ok = await rewarded();
    if (!ok) { G.scene = 'result'; return; }
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
  function melee() {
    const h = G.hero, st = G.run.st;
    const near = aimAt(Math.PI);                    // 가까운 적 쪽으로 몸을 돌려 쳐요
    if (near && Math.hypot(near.x - h.x, near.y - h.y) < TEMP.MELEE_RANGE + 40) { const d = Math.hypot(near.x - h.x, near.y - h.y) || 1; h.dir = { x: (near.x - h.x) / d, y: (near.y - h.y) / d }; }
    h.meleeCd = BAL.MELEE_CD; h.atkT = 0.22;
    const dmg = st.melee * atkMul(), ang0 = Math.atan2(h.dir.y, h.dir.x);
    G.fx.push({ kind: 'arc', x: h.x, y: h.y - 18, a: ang0, t: 0, life: 0.25 });
    AUDIO.play('attack');
    for (const a of G.aliens) {
      const dx = a.x - h.x, dy = a.y - h.y, d = Math.hypot(dx, dy);
      if (d > TEMP.MELEE_RANGE + a.r) continue;
      let da = Math.abs(Math.atan2(dy, dx) - ang0); if (da > Math.PI) da = Math.PI * 2 - da;
      if (d < a.r + 10 || da <= TEMP.MELEE_ARC / 2) damage(a, dmg, dx / (d || 1), dy / (d || 1));
    }
  }
  function ranged() {
    const h = G.hero, st = G.run.st;
    const tgt = aimAt(Math.PI * 75 / 180);
    let dx = h.dir.x, dy = h.dir.y;
    if (tgt) { const d = Math.hypot(tgt.x - h.x, tgt.y - h.y) || 1; dx = (tgt.x - h.x) / d; dy = (tgt.y - h.y) / d; if (Math.abs(dx) > .2) h.dir = { x: dx, y: dy }; }
    h.rangedCd = BAL.RANGED_CD; h.atkT = 0.18;
    G.shots.push({ x: h.x + dx * 16, y: h.y + dy * 16, vx: dx * TEMP.SHOT_SPEED, vy: dy * TEMP.SHOT_SPEED, dmg: st.ranged * atkMul(), life: 1.6 });
    AUDIO.play('attack');
  }
  function useSkill() {
    const r = G.run, h = G.hero;
    if (!r || r.skills <= 0 || h.dead || h.skillT > 0) return;
    r.skills--; h.skillT = BAL.SKILL_TIME;
    G.fx.push({ kind: 'ring', x: h.x, y: h.y - 20, t: 0, life: 0.3 });
    if (settings.shake) G.shake = Math.max(G.shake, 2);
    G.msgs.push({ text: t_('skill.shout', { country: I18N.countryName(G.country) }), t: 1.2, shout: true });
    AUDIO.play('skill');
  }
  function damage(a, dmg, nx, ny) {
    a.hp -= dmg; a.flash = 0.1;
    if (a.type !== 'boss') { a.x += nx * 4; a.y += ny * 4; }
    burst(a.x, a.y - (a.type === 'boss' ? 50 : 18), '#FFFFFF', 3, 60);
    AUDIO.play('hit');
    if (a.hp <= 0 && !a.dead) {
      a.dead = true; G.run.kills++; G.run.killsRound++;
      burst(a.x, a.y - 20, a.type === 'grunt' ? '#CA57E5' : a.type === 'shooter' ? '#B8D727' : '#8EBB2E', a.type === 'boss' ? 30 : 10, 140);
      AUDIO.play('kill');
      if (a.type === 'boss' && settings.shake) G.shake = 5;
    }
  }
  function hurt(dmg, fromX, fromY) {
    const h = G.hero;
    if (h.dead || h.inv > 0 || h.skillT > 0) return;
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
      G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: .4 + Math.random() * .2, t: 0, color, s: 2 + Math.random() * 2 });
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
    if (h.moving) {
      h.x += input.mx * r.st.speed * dt; h.y += input.my * r.st.speed * dt; h.walkT += dt;
      const d = Math.hypot(input.mx, input.my); h.dir = { x: input.mx / d, y: input.my / d };
    }
    h.x = clamp(h.x, f.x0 + 12, f.x1 - 12); h.y = clamp(h.y, f.y0 + 22, f.y1);
    h.inv = Math.max(0, h.inv - dt); h.skillT = Math.max(0, h.skillT - dt); h.atkT = Math.max(0, h.atkT - dt); h.hitT = Math.max(0, h.hitT - dt);
    h.meleeCd -= dt; h.rangedCd -= dt;
    const mel = input.melee || keys.has('KeyJ'), rng = input.ranged || keys.has('KeyK');
    if (mel && h.meleeCd <= 0) melee(); else if (rng && h.rangedCd <= 0) ranged();
    if (h.buff && (h.buff.t -= dt) <= 0) h.buff = null;

    if (r.clearT < 0) updateSpawns(dt);

    // 외계인
    for (const a of G.aliens) {
      a.flash = Math.max(0, a.flash - dt); a.recoil = Math.max(0, a.recoil - dt);
      const dx = h.x - a.x, dy = h.y - a.y, d = Math.hypot(dx, dy) || 1;
      let mx = 0, my = 0;
      if (a.entering) { mx = a.dx; my = a.dy; if (inFloor(a)) a.entering = false; }
      else if (a.type === 'shooter') {
        if (d > 170) { mx = dx / d; my = dy / d; } else if (d < 120) { mx = -dx / d; my = -dy / d; } else { mx = -dy / d * .6; my = dx / d * .6; }
        a.shootT -= dt;
        if (a.shootT <= 0) { a.shootT = TEMP.SHOOTER_GAP; a.recoil = .12; G.eshots.push({ x: a.x, y: a.y, vx: dx / d * TEMP.ENEMY_SHOT_SPEED, vy: dy / d * TEMP.ENEMY_SHOT_SPEED, dmg: TEMP.ENEMY_SHOT_DMG, life: 3 }); }
      } else {
        mx = dx / d; my = dy / d;
        if (a.type === 'boss') {
          a.shootT -= dt;
          if (a.shootT <= 0) {
            a.shootT = TEMP.BOSS_RING_GAP;
            for (let i = 0; i < TEMP.BOSS_RING_N; i++) { const an = i / TEMP.BOSS_RING_N * Math.PI * 2 + a.seed; G.eshots.push({ x: a.x, y: a.y - 30, vx: Math.cos(an) * TEMP.ENEMY_SHOT_SPEED * .8, vy: Math.sin(an) * TEMP.ENEMY_SHOT_SPEED * .8, dmg: TEMP.BOSS_SHOT_DMG, life: 3.5 }); }
          }
        }
      }
      // 서로 겹치지 않게
      for (const b of G.aliens) { if (b === a) continue; const ex = a.x - b.x, ey = a.y - b.y, ed = Math.hypot(ex, ey); const mn = a.r + b.r; if (ed > 0 && ed < mn) { mx += ex / ed * .8; my += ey / ed * .8; } }
      a.x += mx * a.speed * dt; a.y += my * a.speed * dt; a.vx = mx;
      if (!a.entering) { a.x = clamp(a.x, f.x0 + a.r * .6, f.x1 - a.r * .6); a.y = clamp(a.y, f.y0 + 10, f.y1); }
      if (d < a.r + h.r) hurt(a.type === 'boss' ? BAL.BOSS_CONTACT_DMG : BAL.CONTACT_DMG, a.x, a.y);
    }
    G.aliens = G.aliens.filter(a => !a.dead);

    // 우리 탄
    for (const s of G.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if (s.x < f.x0 - 10 || s.x > f.x1 + 10 || s.y < f.y0 - 10 || s.y > f.y1 + 10) s.life = 0;
      for (const a of G.aliens) if (s.life > 0 && !a.dead && (s.x - a.x) ** 2 + (s.y - a.y) ** 2 < (a.r + 6) ** 2) { damage(a, s.dmg, s.vx / TEMP.SHOT_SPEED, s.vy / TEMP.SHOT_SPEED); s.life = 0; }
    }
    G.shots = G.shots.filter(s => s.life > 0);
    G.aliens = G.aliens.filter(a => !a.dead);
    // 외계인 탄
    for (const s of G.eshots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
      if ((s.x - h.x) ** 2 + (s.y - h.y) ** 2 < (h.r + 5) ** 2) { hurt(s.dmg, s.x, s.y); s.life = 0; }
    }
    G.eshots = G.eshots.filter(s => s.life > 0 && s.x > -20 && s.x < FIELD.W + 20 && s.y > -20 && s.y < FIELD.H + 20);
    // 화폐
    for (const it of G.items) {
      it.life -= dt;
      if (dist2(it, h) < 26 * 26) {
        it.life = 0; h.buff = { cur: it.cur, mul: CURRENCY_MUL[it.cur], t: BAL.ITEM_TIME, max: BAL.ITEM_TIME };
        AUDIO.play('pickup'); burst(h.x, h.y - 20, COL.glow, 12, 90);
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
    AUDIO.play('roundClear'); setTimeout(() => AUDIO.coins(4), 450);
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
    if (isNew) { best[c.key] = { rounds, kills: r.kills }; store.set('best', best); setTimeout(() => AUDIO.play('best'), 700); }
    G.result = { kind, rounds, kills: r.kills, isNew, line: o.line || '', final: !!o.final, t: 0 };
    G.scene = 'result';
  }

  function update(dt) {
    G.t += dt;
    G.shake = Math.max(0, G.shake - dt * 20); G.hurtFlash = Math.max(0, G.hurtFlash - dt);
    for (const m of G.msgs) m.t -= dt; G.msgs = G.msgs.filter(m => m.t > 0);
    for (const p of G.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; } G.parts = G.parts.filter(p => p.t < p.life);
    for (const e of G.fx) e.t += dt; G.fx = G.fx.filter(e => e.t < e.life);
    if (G.scene === 'play' && !G.paused && !portrait()) updatePlay(dt);
    else if (G.scene === 'roundPanel') { G.panel.t += dt; if (G.panel.t > 2.8) { G.run.round++; startRound(); } }
    else if (G.scene === 'ending') updateEnding(dt);
    else if (G.scene === 'result') G.result.t += dt;
  }

  // ---------- 그리기 ----------
  function draw() {
    ctx.setTransform(DPR * U, 0, 0, DPR * U, 0, 0);
    UI.hits = [];
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, VW, VH);
    if (portrait()) return drawRotate();
    switch (G.scene) {
      case 'loading': return drawLoading();
      case 'title': return drawTitle();
      case 'select': return drawSelect();
      case 'play': drawField(); drawHUD(); if (G.touchUI) drawControls(); drawMsgs(); if (G.paused) drawPause(); return;
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
    UI.I.phone(VW / 2, VH / 2, Math.min(VW, VH) * .5, COL.fg, G.t);
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
    [[.1, .93], [.24, .86], [.76, .86], [.9, .93]].forEach(([u, f], i) => UI.hero(G.titleHeroes[i], VW * u, VH * f, 150, { flip: i >= 2, sy: reduceMotion ? 1 : 1 + Math.sin(t * 2.2 + i * 1.7) * .015 }));
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
    UI.stars(G.t * .3);
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
    ctx.save(); ctx.globalAlpha = .9; ctx.fillStyle = `rgba(255,209,102,${.15 + .5 * c.money / 100})`; ctx.beginPath(); ctx.ellipse(cx, VH * .05 + 118, 34, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    UI.hero(c.key, cx, VH * .05 + 118, 108, { sy: reduceMotion ? 1 : 1 + Math.sin(G.t * 2.2) * .015 });
    UI.flag(c.iso, cx - 70, VH * .05 + 130, 22, 15);
    UI.txt(c.native, cx + 12, VH * .05 + 138, 20, COL.fg, 'center', 800, pw - 70);
    UI.txt(`${UI.money(c, c.money)} · #${c.rank}`, cx, VH * .05 + 162, 17, COL.gold, 'center', 800);
    const bars = [['heart', st.hp, st.F, COL.red], ['sword', st.melee.toFixed(1), st.F, COL.fg], ['speed', Math.round(st.speed), st.S, COL.fg], ['bolt', BAL.SKILL_PER_ROUND, 1, COL.glow]];
    bars.forEach(([ic, v, f, icc], i) => {
      const y = VH * .05 + 186 + i * 17;
      UI.I[ic](px + 22, y, 14, icc); UI.bar(px + 36, y - 4, pw - 84, 8, f, COL.glow); UI.txt(String(v), px + pw - 14, y, 11, COL.fg, 'right', 700);
    });
    UI.txt(t_('ui.08'), cx, VH * .05 + 260, 10.5, COL.muted, 'center', 600, pw - 16);
    UI.btnWide('confirm', cx, VH * .95 - 32, Math.min(160, pw - 20), 44, 'play', t_('ui.01'), 'main');
  }

  // 전장
  function drawField() {
    const fb = fieldBox;
    ctx.fillStyle = COL.side; ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    let sx = 0, sy = 0; if (G.shake > 0) { sx = (Math.random() - .5) * G.shake; sy = (Math.random() - .5) * G.shake; }
    ctx.translate(fb.x + sx, fb.y + sy); ctx.scale(fb.s, fb.s);
    UI.draw('room', 0, 0, FIELD.W, FIELD.H);
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
    const ents = [...G.aliens.map(a => ({ y: a.y, a })), { y: h.y, h }].sort((p, q) => p.y - q.y);
    for (const e of ents) {
      if (e.h) drawHero(); else drawAlien(e.a);
    }
    // 효과
    for (const e of G.fx) {
      const k = e.t / e.life;
      if (e.kind === 'arc') {
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.a);
        ctx.globalAlpha = 1 - k; ctx.lineCap = 'round';
        const sw = -TEMP.MELEE_ARC / 2 + TEMP.MELEE_ARC * Math.min(1, k * 2.2);
        ctx.strokeStyle = COL.glow; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, TEMP.MELEE_RANGE * .8, -TEMP.MELEE_ARC / 2, sw); ctx.stroke();
        ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, TEMP.MELEE_RANGE * .8, -TEMP.MELEE_ARC / 2, sw); ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'ring') { ctx.globalAlpha = 1 - k; UI.circ(e.x, e.y, 14 + k * 60, null, COL.glow, 4); ctx.globalAlpha = 1; }
    }
    for (const s of G.shots) {
      const a = Math.atan2(s.vy, s.vx);
      ctx.save(); ctx.translate(s.x, s.y - 20); ctx.rotate(a);
      const g = ctx.createLinearGradient(-26, 0, 0, 0); g.addColorStop(0, 'rgba(255,224,138,0)'); g.addColorStop(1, 'rgba(255,224,138,.8)');
      ctx.fillStyle = g; ctx.fillRect(-26, -2, 26, 4); UI.circ(0, 0, 4, COL.shot); UI.circ(0, 0, 2, '#FFFFFF'); ctx.restore();
    }
    for (const s of G.eshots) { ctx.save(); ctx.translate(s.x, s.y - 18); ctx.rotate(G.t * 8); ctx.fillStyle = COL.pink; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
    for (const p of G.parts) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); } ctx.globalAlpha = 1;
    ctx.restore();
    // 맞음: 화면 테두리 빨강 (번쩍임 끄면 장수 테두리만)
    if (G.hurtFlash > 0 && settings.flash) { ctx.strokeStyle = `rgba(255,90,95,${G.hurtFlash / .15 * .8})`; ctx.lineWidth = 10; ctx.strokeRect(fb.x + 5, fb.y + 5, FIELD.W * fb.s - 10, FIELD.H * fb.s - 10); }
  }

  function drawHero() {
    const h = G.hero, r = G.run, c = G.country, t = G.t;
    if (!h) return;
    const money = r ? Math.max(0, r.money) : 50;
    // 발밑: 그림자 + 금빛(돈 비율, 0.25~0.9) + 보는 방향 금빛 호
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(h.x, h.y, 18, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255,209,102,${.25 + .65 * Math.min(1, money / 100)})`; ctx.beginPath(); ctx.ellipse(h.x, h.y, 22, 7, 0, 0, Math.PI * 2); ctx.fill();
    if (h.buff) { ctx.strokeStyle = 'rgba(255,150,60,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(h.x, h.y, 26, 9, 0, 0, Math.PI * 2); ctx.stroke(); if (Math.random() < .3) G.parts.push({ x: h.x + (Math.random() - .5) * 30, y: h.y - Math.random() * 10, vx: 0, vy: -50, life: .5, t: 0, color: '#FFB347', s: 2.5 }); }
    const da = Math.atan2(h.dir.y, h.dir.x);
    ctx.strokeStyle = 'rgba(255,209,102,.8)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(h.x, h.y, 26, 9, 0, da - .5, da + .5); ctx.stroke();
    if (h.skillT > 0) UI.circ(h.x, h.y - 28, 30, 'rgba(255,209,102,.18)', COL.glow, 2);
    // 몸
    let mo = { flip: h.dir.x < -0.05 };
    let frame = 0;
    if (h.dead && G.scene !== 'ending') { const k = Math.min(1, h.deadT / .6); mo.alpha = 1 - k * .5; mo.sy = 1 - k * .35; }
    else if (h.atkT > 0) { frame = h.atkT > .14 ? 5 : 6; if (!reduceMotion) { mo.rot = (mo.flip ? -1 : 1) * .16 * Math.sin((1 - h.atkT / .22) * Math.PI); mo.sx = 1.04; mo.sy = 1.04; } }
    else if (h.moving) { frame = reduceMotion ? 0 : 1 + Math.floor(h.walkT * 8) % 4; if (!reduceMotion) { const p = Math.abs(Math.sin(h.walkT * 11)); mo.oy = -p * 2; mo.rot = clamp(h.dir.x * .1, -.12, .12); } }
    else if (!reduceMotion) mo.sy = 1 + Math.sin(t * 2.2) * .015;
    if (G.scene === 'ending' && G.ending.fell) { const k = Math.min(1, (G.ending.t - 3.6) / .18); mo.rot = (mo.flip ? -1 : 1) * k * Math.PI / 2; mo.oy = -k * 6; }
    if (h.inv > 0 && !h.dead && Math.floor(h.inv * 12) % 2 === 0) mo.alpha = .45;
    if (h.hitT > 0 && settings.flash) mo.white = true;
    UI.frame(c.key, frame, h.x, h.y, 60, mo);
    if (h.hitT > 0 && !settings.flash) { ctx.strokeStyle = COL.red; ctx.lineWidth = 2; ctx.strokeRect(h.x - 16, h.y - 60, 32, 60); }
  }

  function drawAlien(a) {
    const t = G.t, name = 'alien/alien-' + a.type, hgt = a.type === 'boss' ? 140 : a.type === 'shooter' ? 46 : 48;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(a.x, a.y, a.r * 1.1, a.r * .35, 0, 0, Math.PI * 2); ctx.fill();
    let mo = { flip: a.vx < 0 };
    if (!reduceMotion) {
      if (a.type === 'grunt') { const p = Math.sin(t * 14 + a.seed); mo.sy = 1 + p * .08; mo.sx = 1 - p * .05; mo.rot = Math.sin(t * 7 + a.seed) * .08; }
      else if (a.type === 'shooter') { const p = Math.abs(Math.sin(t * 9 + a.seed)); mo.oy = -p * 3; mo.ox = a.recoil > 0 ? (a.vx < 0 ? 3 : -3) : 0; }
      else { mo.sy = 1 + Math.sin(t * 2) * .025; }
    }
    if (a.flash > 0) mo.white = true;
    if (a.entering) mo.alpha = .85;
    UI.sprite(name, a.x, a.y + 2, hgt, mo);
    if (a.type === 'boss') { // 보스 체력
      const w = 90; UI.rr(a.x - w / 2, a.y - hgt - 12, w, 6, 3, 'rgba(0,0,0,.6)'); UI.rr(a.x - w / 2, a.y - hgt - 12, w * Math.max(0, a.hp / a.max), 6, 3, COL.green);
    }
  }

  // 위 표시: HP · 돈 · 라운드 · 남은 외계인 · 일시정지
  function drawHUD() {
    const r = G.run, h = G.hero, c = G.country;
    const x0 = Math.max(VW * .08, fieldBox.x + 12);
    UI.rr(x0 - 8, VH * .04, 236, 64, 10, 'rgba(10,11,15,.55)');
    const low = h.hp / h.maxHp <= .25;
    UI.I.heart(x0 + 8, VH * .09, 18 * (low && !reduceMotion ? 1 + Math.abs(Math.sin(G.t * 6)) * .15 : 1), low ? COL.red : COL.hp);
    UI.bar(x0 + 22, VH * .09 - 7, 150, 14, h.hp / h.maxHp, low ? COL.red : COL.hp);
    UI.txt(`${Math.ceil(h.hp)}/${h.maxHp}`, x0 + 178, VH * .09, 12, COL.fg, 'left', 700);
    UI.txt(UI.money(c, r.money), x0, VH * .17 + 2, 18, COL.glow, 'left', 800);
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
    if (G.scene === 'play') UI.btnSub('pause', VW * .93, VH * .1, 44, 'pause');
  }

  function drawControls() {
    const B = btnPos();
    // 조이스틱: 왼쪽 절반 아무 데나 누르면 그 자리에 생겨요
    const jx = joy.id != null ? joy.ox : VW * .15, jy = joy.id != null ? joy.oy : VH * .72;
    UI.circ(jx, jy, 64, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.15)', 2);
    UI.circ(jx + joy.x * 52, jy + joy.y * 52, 28, 'rgba(255,255,255,.5)');
    const btn = (b, ic, on) => { UI.circ(b.x, b.y, b.r, on ? 'rgba(217,174,79,.45)' : 'rgba(255,255,255,.22)', COL.gold, 3); UI.I[ic](b.x, b.y, b.r * 1.05, COL.fg); };
    btn(B.melee, 'sword', input.melee); btn(B.ranged, 'arrow', input.ranged);
    ctx.globalAlpha = G.run.skills > 0 ? 1 : .4; btn(B.skill, 'shield', G.hero.skillT > 0); ctx.globalAlpha = 1;
    UI.circ(B.skill.x + 20, B.skill.y - 20, 10, COL.gold); UI.txt(String(G.run.skills), B.skill.x + 20, B.skill.y - 20, 12, COL.icon, 'center', 800);
  }

  function drawMsgs() {
    for (const m of G.msgs) {
      const a = Math.min(1, m.t / .3);
      ctx.globalAlpha = a;
      if (m.big) { UI.rr(VW / 2 - 110, VH * .42 - 26, 220, 52, 12, 'rgba(10,11,15,.6)'); UI.txt(m.text, VW / 2, VH * .42, 30, COL.fg, 'center', 800, 200); }
      else if (m.hint) UI.txt(m.text, VW / 2, VH * .84, 12, COL.muted, 'center', 600);
      else if (m.shout) { const p = 1 + (1 - Math.min(1, (1.2 - m.t) / .15)) * .3; UI.txt(m.text, VW / 2, VH * .3, 22 * p, COL.glow, 'center', 900, VW * .7); }
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
      const langs = I18N.available(), lx = VW * .5, lw = VW * .44;
      UI.panel(lx, py, lw, 20 + langs.length * 36);
      langs.forEach((l, i) => {
        const ly = py + 28 + i * 36, on = l === I18N.lang;
        UI.rr(lx + 10, ly - 15, lw - 20, 30, 8, on ? 'rgba(217,174,79,.2)' : null, on ? COL.gold : null, 1.5);
        UI.txt(I18N.LANG_NAMES[l], lx + 24, ly, 14, on ? COL.gold : COL.fg, 'left', 700);
        UI.hit('lang:' + l, lx + 10, ly - 15, lw - 20, 30);
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
    const s0 = stats(p.old), s1 = stats(m);
    [['heart', s1.F, s0.F, COL.red], ['sword', s1.F, s0.F, COL.fg], ['speed', s1.S, s0.S, COL.fg], ['bolt', 1, 1, COL.glow]].forEach(([ic, v, pv, icc], i) => {
      const by = y + 122 + i * 17;
      UI.I[ic](x + 112, by, 13, icc); UI.bar(x + 126, by - 4, 140, 8, v, COL.glow, pv);
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
    UI.draw('room', 0, 0, VW, VH); ctx.fillStyle = 'rgba(15,17,22,.85)'; ctx.fillRect(0, 0, VW, VH);
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
    // 버튼: 나라 바꾸기 · 다시하기 · (보상형) — 다시하기와 이어하기는 같은 크기
    const by = VH * .82, bw = 150, bh = 52;
    const canAd = Platform.name !== 'web';
    const showRevive = R.kind === 'fail' && !r.reviveUsed && canAd;
    const showBank = R.kind === 'bankrupt' && !R.final && canAd;
    if (showRevive || showBank) {
      UI.btnSub('country', cx - bw - 30, by, 52, 'flags2');
      UI.btnWide('restart', cx - bw / 2 + 20, by, bw, bh, 'retry', t_('ui.05'), 'main');
      UI.btnWide(showRevive ? 'revive' : 'bankruptGo', cx + bw / 2 + 30, by, bw, bh, 'video', showRevive ? t_('x.here') : t_('x.nextRound'), 'ad');
    } else {
      UI.btnSub('country', cx - bw / 2 - 40, by, 52, 'flags2');
      UI.btnWide('restart', cx + 20, by, bw, bh, 'retry', t_('ui.05'), 'main');
    }
    UI.txt(t_('ui.08'), cx, VH * .96, 10.5, COL.muted, 'center', 600);
  }

  // ---------- 루프 ----------
  let lastT = 0;
  function loop(t) {
    const dt = Math.min((t - lastT) / 1000 || 0, 1 / 30);
    lastT = t;
    try { update(dt); draw(); } catch (err) { console.error(err); }
    requestAnimationFrame(loop);
  }

  // 시작 순서: SDK 초기화 → 에셋 로딩 → 로딩 끝 알림 → 시작 화면
  requestAnimationFrame(loop);
  Platform.init().then(loadAssets).then(() => {
    Platform.loadingFinished();
    G.scene = 'title';
  });
})();
