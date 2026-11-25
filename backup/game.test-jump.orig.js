// 테스트용 한 손 게임: 탭/클릭/스페이스로 점프해서 장애물을 피해요.
// 목적은 "포키 SDK 흐름이 제대로 도는지" 확인하는 것. 실제 게임은 이 파일을 바꿔 끼우면 돼요.
(() => {
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- 저장 (막혀 있어도 안 터지게) ----
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---- 소리 (광고 중엔 꺼요) ----
  let audio = null, muted = false;
  function beep(freq, dur = 0.08) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq; g.gain.value = 0.08;
      o.connect(g); g.connect(audio.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur); o.stop(audio.currentTime + dur);
    } catch {}
  }

  // ---- 게임 상태 ----
  // title: 첫 화면 / play: 진행 중 / dead: 끝 / ad: 광고 중(입력 막음)
  let state = 'title';
  let best = store.get('best', 0);
  let score, player, obstacles, speed, spawnIn, lastT = 0;

  const ground = () => H * 0.75;
  const size = () => Math.max(28, Math.min(W, H) * 0.06);

  function reset() {
    const s = size();
    player = { x: W * 0.2, y: ground() - s, vy: 0, s, onGround: true };
    obstacles = []; score = 0; speed = W * 0.45; spawnIn = 1.0;
  }

  function startRun() {
    reset();
    state = 'play';
    Platform.gameplayStart();
  }

  function die() {
    state = 'dead';
    beep(160, 0.3);
    Platform.gameplayStop();
    if (score > best) { best = score; store.set('best', best); }
  }

  async function restart() {
    state = 'ad';
    // 판 사이 광고. 광고가 없거나 차단되면 바로 넘어가요.
    await Platform.commercialBreak(() => { muted = true; });
    muted = false;
    startRun();
  }

  function press() {
    if (state === 'title') return startRun();
    if (state === 'dead') return restart();
    if (state === 'play' && player.onGround) {
      player.vy = -H * 1.35; player.onGround = false; beep(620);
    }
  }

  cv.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
  window.addEventListener('keydown', e => {
    // 포키 페이지가 스크롤되지 않게 게임 키는 기본 동작을 막아요.
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!e.repeat && (e.code === 'Space' || e.code === 'ArrowUp')) press();
  });

  // ---- 업데이트 & 그리기 ----
  function update(dt) {
    if (state !== 'play') return;
    const g = H * 3.6;
    player.vy += g * dt; player.y += player.vy * dt;
    if (player.y >= ground() - player.s) { player.y = ground() - player.s; player.vy = 0; player.onGround = true; }

    speed += W * 0.012 * dt;
    spawnIn -= dt;
    if (spawnIn <= 0) {
      const s = size();
      const h = s * (0.8 + Math.random() * 0.9);
      obstacles.push({ x: W + s, w: s * 0.8, h });
      spawnIn = 0.8 + Math.random() * 0.9;
    }
    for (const o of obstacles) o.x -= speed * dt;
    obstacles = obstacles.filter(o => o.x + o.w > -10);

    score += dt * 10;
    const p = player, pad = p.s * 0.15;
    for (const o of obstacles) {
      if (p.x + p.s - pad > o.x && p.x + pad < o.x + o.w && p.y + p.s - pad > ground() - o.h) return die();
    }
  }

  function text(t, x, y, px, color = '#fff') {
    ctx.fillStyle = color; ctx.font = `700 ${px}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.fillText(t, x, y);
  }

  function draw() {
    ctx.fillStyle = '#14161f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a2e3f'; ctx.fillRect(0, ground(), W, H - ground());

    if (player) {
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(player.x, player.y, player.s, player.s);
      ctx.fillStyle = '#ff5d73';
      for (const o of obstacles) ctx.fillRect(o.x, ground() - o.h, o.w, o.h);
    }

    const u = Math.min(W, H) / 20;
    if (state === 'play') text(Math.floor(score), W / 2, u * 2.2, u * 1.6);
    if (state === 'title') {
      text('탭해서 시작', W / 2, H * 0.4, u * 1.6);
      text(`최고 ${Math.floor(best)}`, W / 2, H * 0.4 + u * 2, u * 0.9, '#9aa0b8');
    }
    if (state === 'dead') {
      text(`${Math.floor(score)}점`, W / 2, H * 0.36, u * 2);
      text(`최고 ${Math.floor(best)}`, W / 2, H * 0.36 + u * 1.8, u * 0.9, '#9aa0b8');
      text('탭해서 다시', W / 2, H * 0.36 + u * 3.6, u * 1.1);
    }
    if (state === 'ad') text('잠시만요…', W / 2, H * 0.4, u * 1.2, '#9aa0b8');
  }

  function loop(t) {
    const dt = Math.min((t - lastT) / 1000 || 0, 1 / 30);
    lastT = t;
    update(dt); draw();
    requestAnimationFrame(loop);
  }

  // ---- 시작 순서: SDK 초기화 → (에셋 로딩) → 로딩 완료 알림 → 루프 ----
  Platform.init().then(() => {
    reset();
    Platform.loadingFinished();
    requestAnimationFrame(loop);
  });
})();
