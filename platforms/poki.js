// Poki SDK v2 — https://sdk.poki.com
(function () {
  const sdk = () => window.PokiSDK;
  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  let ready = false, playing = false;
  window.Platform = {
    name: 'poki',
    async init() {
      if (!sdk()) return console.warn('[Platform:poki] SDK 없음 → 광고 없이 진행');
      try { await sdk().init(); ready = true; if (local) sdk().setDebug(true); }
      catch (e) { console.warn('[Platform:poki] init 실패 → 광고 없이 진행', e); }
    },
    loadingFinished() { if (ready) sdk().gameLoadingFinished(); },
    gameplayStart() { if (ready && !playing) { playing = true; sdk().gameplayStart(); } },
    gameplayStop() { if (ready && playing) { playing = false; sdk().gameplayStop(); } },
    commercialBreak(onStart) { return ready ? sdk().commercialBreak(onStart).catch(() => {}) : Promise.resolve(); },
    rewardedBreak(onStart) { return ready ? sdk().rewardedBreak(onStart).then(Boolean).catch(() => false) : Promise.resolve(false); },
  };
})();
