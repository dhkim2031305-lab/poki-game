// GameDistribution HTML5 SDK — https://github.com/GameDistribution/GD-HTML5
// GD_OPTIONS(gameId 포함)는 빌드 때 index.html에 자동으로 들어가요.
(function () {
  const sdk = () => window.gdsdk;
  let ready = false, onStartCb = null;
  // 광고가 시작되면 GD가 SDK_GAME_PAUSE 이벤트를 보내요 → 소리 끄기 콜백 실행
  window.__gdEvent = e => {
    if (e.name === 'SDK_READY') ready = true;
    if (e.name === 'SDK_GAME_PAUSE' && onStartCb) { onStartCb(); onStartCb = null; }
  };
  (window.__gdQ || []).forEach(window.__gdEvent); // 어댑터보다 먼저 온 이벤트 처리
  function show(type, onStart) {
    if (!ready || !sdk()) return Promise.resolve(false);
    onStartCb = onStart;
    return sdk().showAd(type).then(() => true).catch(() => false).finally(() => { onStartCb = null; });
  }
  window.Platform = {
    name: 'gamedistribution',
    adsReady: () => ready && !!sdk(),
    init() {
      // SDK_READY를 최대 1.5초 기다리고 (QA M7: 막히면 첫 화면 3.4초 → 약 1.9초), 안 오면 광고 없이 진행
      return new Promise(resolve => {
        const t0 = Date.now();
        (function wait() { if (ready || Date.now() - t0 > 1500) { if (!ready) console.warn('[Platform:gamedistribution] 준비 안 됨 → 광고 없이 진행'); else { try { const pr = sdk().preloadAd && sdk().preloadAd('rewarded'); pr && pr.catch && pr.catch(() => {}); } catch {} } resolve(); } else setTimeout(wait, 100); })();
      });
    },
    loadingFinished() {},
    gameplayStart() {},
    gameplayStop() {},
    commercialBreak(onStart) { return show(undefined, onStart).then(() => {}); },
    rewardedBreak(onStart) { return show('rewarded', onStart); },
  };
})();
