// Poki SDK 어댑터: 게임 코드는 window.Poki만 사용해요.
// SDK가 광고 차단 등으로 안 불려와도 게임이 멈추지 않게 빈 함수로 대신해요.
(function () {
  const sdk = window.PokiSDK;
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let ready = false, playing = false;

  const Poki = {
    async init() {
      if (!sdk) { console.warn('[Poki] SDK 없음 → 오프라인 모드'); return; }
      try {
        await sdk.init();
        ready = true;
        if (local) sdk.setDebug(true); // 로컬에선 가짜 광고로 흐름만 확인
      } catch (e) { console.warn('[Poki] init 실패 (광고 차단 가능성) → 계속 진행', e); }
    },
    loadingFinished() { if (ready) sdk.gameLoadingFinished(); },
    gameplayStart() { if (ready && !playing) { playing = true; sdk.gameplayStart(); } },
    gameplayStop() { if (ready && playing) { playing = false; sdk.gameplayStop(); } },
    // 판과 판 사이 광고. onStart에서 소리 끄고 입력 막기, 끝나면 resolve.
    commercialBreak(onStart) {
      if (!ready) return Promise.resolve();
      return sdk.commercialBreak(onStart).catch(() => {});
    },
    // 보상형 광고: 끝까지 보면 true
    rewardedBreak(onStart) {
      if (!ready) return Promise.resolve(false);
      return sdk.rewardedBreak(onStart).catch(() => false);
    },
  };
  window.Poki = Poki;
})();
