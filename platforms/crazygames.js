// CrazyGames HTML5 SDK v3 — https://docs.crazygames.com
(function () {
  const sdk = () => window.CrazyGames && window.CrazyGames.SDK;
  let ready = false, playing = false;
  function ad(type, onStart) {
    if (!ready) return Promise.resolve(false);
    return new Promise(resolve => {
      try {
        sdk().ad.requestAd(type, {
          adStarted: () => onStart && onStart(),
          adFinished: () => resolve(true),
          adError: () => resolve(false),
        });
      } catch { resolve(false); }
    });
  }
  window.Platform = {
    name: 'crazygames',
    adsReady: () => ready,
    async init() {
      if (!sdk()) return console.warn('[Platform:crazygames] SDK 없음 → 광고 없이 진행');
      try { await sdk().init(); ready = true; sdk().game.loadingStart(); }
      catch (e) { console.warn('[Platform:crazygames] init 실패 → 광고 없이 진행', e); }
    },
    loadingFinished() { if (ready) sdk().game.loadingStop(); },
    gameplayStart() { if (ready && !playing) { playing = true; sdk().game.gameplayStart(); } },
    gameplayStop() { if (ready && playing) { playing = false; sdk().game.gameplayStop(); } },
    commercialBreak(onStart) { return ad('midgame', onStart).then(() => {}); },
    rewardedBreak(onStart) { return ad('rewarded', onStart); },
  };
})();
