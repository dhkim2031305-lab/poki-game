// 효과음 — teams/2-디자인/sound.md (Web Audio, 파일 0KB)
// 첫 탭 전엔 소리가 안 나요(브라우저 정책). 광고 중·소리 끔이면 아무 소리도 안 내요.
(() => {
  let ac = null, master = null;
  const playing = {};          // 같은 소리 동시 최대 4개
  const A = { enabled: true, adMute: false };

  function ctx() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
      } catch { ac = null; }
    }
    return ac;
  }
  A.unlock = () => { const a = ctx(); if (a && a.state === 'suspended') a.resume().catch(() => {}); };
  A.setAdMute = m => { A.adMute = m; if (master) master.gain.value = m ? 0 : 1; };

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
  };
  // 돈 감소: 동전 짤랑 n번, 담담하게
  let pend = [];
  A.coins = n => { for (let i = 0; i < n; i++) pend.push(setTimeout(() => A.play('coin'), i * 110)); };
  A.cancelPending = () => { pend.forEach(clearTimeout); pend = []; };

  window.AUDIO = A;
})();
