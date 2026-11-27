// 효과음·배경음악·외침 목소리 — teams/2-디자인/sound.md (효과음은 Web Audio 합성, 배경음악은 src/assets/sound/bgm/)
// 첫 탭 전엔 소리가 안 나요(브라우저 정책). 광고 중·소리 끔이면 아무 소리도 안 내요.
(() => {
  let ac = null, master = null, music = null;
  const playing = {};          // 같은 소리 동시 최대 4개
  const A = { enabled: true, adMute: false };

  function ctx() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
        music = ac.createGain(); music.gain.value = 1; music.connect(master);   // 배경음악 자리 (덕킹은 이 노드만)
      } catch { ac = null; }
    }
    return ac;
  }
  A.unlock = () => {
    const a = ctx();
    if (!a || a.state === 'closed') return;
    if (cur?.failed) stopCur(0);
    if (a.state === 'running') return;
    try {
      Promise.resolve(a.resume()).catch(() => {});
    } catch {}
  };
  A.setAdMute = m => { A.adMute = m; if (master) master.gain.value = m ? 0 : 1; if (m) { try { voiceSrc && voiceSrc.stop(); } catch {} } };

  function tone(type, f0, f1, dur, vol, at = 0, filter) {
    const a = ac, t = a.currentTime + at;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (filter) { const fl = a.createBiquadFilter(); fl.type = filter[0]; fl.frequency.value = filter[1]; o.connect(fl); node = fl; }
    node.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  let noiseBuf = null;
  function noise(dur, vol, at = 0, filter = ['highpass', 2000]) {
    const a = ac, t = a.currentTime + at;
    if (!noiseBuf) {
      noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf; fl.type = filter[0]; fl.frequency.value = filter[1];
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.02);
  }
  const N = { C5: 523.25, E5: 659.25, G5: 783.99, C6: 1046.5, G4: 392, E4: 329.63, C4: 261.63, E6: 1318.5, B6: 1975.5 };

  const SFX = {
    attack: [0.06, () => tone('square', 880, 660, 0.06, 0.12)],
    hit: [0.04, () => noise(0.04, 0.15)],
    impSlash: [0.05, () => { noise(0.016, 0.22, 0, ['bandpass', 3000]); tone('sine', 150, 70, 0.05, 0.16); }],             // 베기: 2~4kHz 날카로운 어택
    impThrust: [0.04, () => { noise(0.012, 0.2, 0, ['bandpass', 2200]); tone('square', 1800, 1200, 0.01, 0.05); }],        // 찌르기: 짧은 클릭
    impSmash: [0.1, () => { tone('sine', 120, 65, 0.09, 0.34); noise(0.045, 0.14, 0, ['bandpass', 750]); }],              // 내려찍기: 몸통음 + 바닥음
    tink: [0.06, () => tone('triangle', 2600, 2200, 0.05, 0.08)],                                                        // 연속타 금속 꼬리
    swing: [0.09, () => noise(0.09, 0.1, 0, ['bandpass', 1400])],                                        // 휘두르기 "휙"
    impact: [0.12, () => { tone('sine', 170, 55, 0.12, 0.32); noise(0.06, 0.2, 0, ['lowpass', 900]); noise(0.03, 0.12); }], // 치기 맞음 "쿵"
    kill: [0.14, () => { tone('triangle', 520, 120, 0.14, 0.25); noise(0.08, 0.12, 0, ['bandpass', 1500]); }],
    hurt: [0.2, () => tone('sawtooth', 180, 70, 0.2, 0.35, 0, ['lowpass', 800])],
    skill: [0.3, () => { tone('sine', 200, 900, 0.3, 0.3); noise(0.3, 0.08, 0, ['bandpass', 1200]); }],
    roundClear: [0.42, () => [N.C5, N.E5, N.G5].forEach((f, i) => tone('triangle', f, f, 0.14, 0.3, i * 0.12))],
    coin: [0.09, () => tone('sine', 1320, 990, 0.09, 0.2)],
    gameClear: [1, () => [N.C5, N.E5, N.G5, N.C6].forEach((f, i) => { tone('square', f, f, 0.25, 0.12, i * 0.15); tone('triangle', f, f, 0.4, 0.23, i * 0.15); })],
    fail: [0.7, () => [N.G4, N.E4, N.C4].forEach((f, i) => tone('sine', f, f, 0.3, 0.25 - i * 0.06, i * 0.2))],
    best: [0.3, () => { tone('sine', N.E6, N.E6, 0.12, 0.25); tone('sine', N.B6, N.B6, 0.18, 0.25, 0.12); }],
    pickup: [0.16, () => { tone('sine', 660, 1320, 0.16, 0.25); tone('sine', 990, 990, 0.16, 0.12); }],
    button: [0.02, () => tone('sine', 1000, 1000, 0.02, 0.1)],
    revive: [0.5, () => tone('triangle', 300, 800, 0.5, 0.3)],
  };

  A.play = name => {
    if (!A.enabled || A.adMute) return;
    const a = ctx(); if (!a || a.state !== 'running') return;
    const s = SFX[name]; if (!s) return;
    const now = a.currentTime;
    const list = (playing[name] = (playing[name] || []).filter(e => e > now));
    if (list.length >= 4) return;
    list.push(now + s[0]);
    try { s[1](); } catch {}
    if (name === 'skill' || name === 'roundClear') A.duck();   // 큰 효과음만 덕킹 (치기·처치마다 하면 배경음이 계속 출렁여요)
  };
  // 덕킹 (sound.md): 외침·효과음이 날 때 배경음을 0.15초 동안 70%로 → 0.4초에 되돌려요
  A.duck = () => {
    if (!music || !ac) return; const t = ac.currentTime, g = music.gain;
    try { g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(.7, t + .15); g.setValueAtTime(.7, t + .15); g.linearRampToValueAtTime(1, t + .55); } catch {}
  };
  // 녹음 파일 (외침 목소리 등): 처음 부를 때 받아서 기억 · 파일이 없거나 못 읽으면 조용히 넘어가요 (다시 받지 않음)
  const bufs = {};
  function load(path) {
    if (path in bufs) return bufs[path];
    const a = ctx(); if (!a) return Promise.resolve(null);
    const url = (window.__A && window.__A[path]) || path;   // 한 파일 미리보기는 data URI
    return (bufs[path] = fetch(url).then(r => r.ok ? r.arrayBuffer() : null)
      .then(b => b && new Promise(res => {
        const decoded = a.decodeAudioData(b, res, () => res(null));
        decoded?.catch(() => res(null));
      }))
      .catch(() => null).then(b => (bufs[path] = Promise.resolve(b || null), b || null)));
  }
  A.load = load;
  let voiceSrc = null;
  A.voice = (path, vol = 1) => {   // 외침 목소리: 한 번에 하나 (새 외침이 오면 앞 것을 끊어요)
    if (!A.enabled || A.adMute) return Promise.resolve(false);
    const a = ctx(); if (!a) return Promise.resolve(false);
    const t0 = performance.now();
    return load(path).then(b => {
      if (!b || !A.enabled || A.adMute || a.state !== 'running' || performance.now() - t0 > 400) return false;   // 늦게 받아졌으면 안 틀어요 (외침 글자와 어긋나지 않게)
      try { if (voiceSrc) voiceSrc.stop(); } catch {}
      const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(master); s.start();
      voiceSrc = s; s.onended = () => { if (voiceSrc === s) voiceSrc = null; }; A.duck(); return true;
    }).catch(() => false);
  };
  // 효과음 파일 한 번 (보스 천둥 등)
  A.sfxFile = (path, vol = 1) => {
    if (!A.enabled || A.adMute) return; const a = ctx(); if (!a || a.state !== 'running') return;
    load(path).then(b => { if (!b || !A.enabled || A.adMute) return; const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol; s.connect(g); g.connect(master); s.start(); A.duck(); }).catch(() => {});
  };
  // ---------- 배경음악 (sound.md "배경음악", 디자인 883755e) ----------
  // WebAudio loop (loopStart 0 · loopEnd = 반복 구간) — MP3 끝 빈 소리 때문에 <audio loop>는 안 써요
  // 전투는 세 층을 같은 순간에 시작하고 층 2(3라운드~)·층 3(5라운드~)은 볼륨 0 → 1을 1초에 걸쳐 올려요
  const BGM_DIR = 'assets/sound/bgm/';
  const BGM = {
    menu: { f: ['bgm-menu'], loop: 21.333, vol: .55 },
    battle: { f: ['bgm-battle', 'bgm-battle-perc', 'bgm-battle-brass'], loop: 29.0909, vol: .8 },
    boss: { f: ['bgm-boss'], loop: 12.8, vol: .6 },
    win: { f: ['bgm-win'], vol: .7 },
    lose: { f: ['bgm-lose'], vol: .7 },
  };
  A.BGM = BGM;
  let cur = null, wantKey = null, wantLv = 1;   // cur = { key, bus, srcs, gains, lv }
  A.preload = key => { const m = BGM[key]; if (m && ctx()) m.f.forEach(f => load(BGM_DIR + f + '.mp3')); };
  function stopCur(fade = .4) {
    if (!cur) return; const c = cur, t = ac.currentTime; cur = null;
    if (c.failed) return;
    try { c.bus.gain.cancelScheduledValues(t); c.bus.gain.setValueAtTime(c.bus.gain.value, t); c.bus.gain.linearRampToValueAtTime(0, t + fade); } catch {}
    c.srcs.forEach(s => { try { s.stop(t + fade + .05); } catch {} });
  }
  function startKey(key, lv) {
    const m = BGM[key], a = ac; if (!m) return;
    const token = (cur = { key, bus: a.createGain(), srcs: [], gains: [], lv, ready: false });
    token.bus.gain.value = 0; token.bus.connect(music);
    Promise.all(m.f.map(f => load(BGM_DIR + f + '.mp3'))).then(bs => {
      if (cur !== token || bs.some(b => !b)) return;   // 그사이 다른 곡으로 바뀌었거나 파일이 없으면 조용히
      const t = a.currentTime + .05;
      bs.forEach((b, i) => {
        const s = a.createBufferSource(), g = a.createGain(); s.buffer = b;
        if (m.loop) { s.loop = true; s.loopStart = 0; s.loopEnd = Math.min(m.loop, b.duration); }
        g.gain.value = i < token.lv ? 1 : 0; s.connect(g); g.connect(token.bus); s.start(t);
        token.srcs.push(s); token.gains.push(g);
      });
      token.bus.gain.setValueAtTime(0, t); token.bus.gain.linearRampToValueAtTime(busVol(m), t + .3); token.ready = true;
    }).catch(() => {
      if (cur !== token) return;
      stopCur(0);
      cur = { key, failed: true };
    });
  }
  const busVol = m => (A.enabled && !A.adMute ? m.vol : 0);
  // 매 프레임 불러요: 지금 나와야 할 곡 (null = 조용히) · lv = 전투 층 수 (1~3)
  A.music = (key, lv = 1) => {
    wantKey = key; wantLv = lv;
    if (!ac || ac.state !== 'running') return;   // 첫 터치 전엔 기다려요 (폰)
    if (!key) { stopCur(); return; }
    if (!cur || cur.key !== key) { stopCur(); try { startKey(key, lv); } catch { cur = { key, failed: true }; } return; }
    if (!cur.ready) { cur.lv = lv; return; }
    const t = ac.currentTime, m = BGM[key], v = busVol(m), bg = cur.bus.gain;
    if (Math.abs(bg.value - v) > .01 && !cur.vRamp) { cur.vRamp = true; bg.cancelScheduledValues(t); bg.setValueAtTime(bg.value, t); bg.linearRampToValueAtTime(v, t + .2); setTimeout(() => { if (cur) cur.vRamp = false; }, 250); }   // 소리 끔·켬
    if (cur.lv !== lv) { cur.gains.forEach((g, i) => { const to = i < lv ? 1 : 0; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(to, t + 1); }); cur.lv = lv; }   // 층 올리기 1초
  };
  A.musicKey = () => (cur && cur.ready ? cur.key + ':' + cur.lv : null);   // 테스트용
  // 탭을 벗어나면 소리를 멈췄다가 돌아오면 이어요 (사이트 규칙)
  document.addEventListener('visibilitychange', () => {
    if (!ac) return;
    if (!document.hidden) { A.unlock(); return; }
    try { Promise.resolve(ac.suspend()).catch(() => {}); } catch {}
  });
  // Safari는 터치가 끝날 때 다시 사용자 활성화를 받을 수 있어요.
  window.addEventListener('touchend', A.unlock, { passive: true });
  // 돈 감소: 동전 짤랑 n번, 담담하게
  let pend = [];
  A.coins = n => { for (let i = 0; i < n; i++) pend.push(setTimeout(() => A.play('coin'), i * 110)); };
  A.cancelPending = () => { pend.forEach(clearTimeout); pend = []; };

  window.AUDIO = A;
})();
