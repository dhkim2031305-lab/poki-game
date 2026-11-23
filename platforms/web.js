// 광고 SDK 없는 일반 웹용 (itch.io, 개인 사이트, 데모 등)
window.Platform = {
  name: 'web',
  init: () => Promise.resolve(),
  loadingFinished() {}, gameplayStart() {}, gameplayStop() {},
  commercialBreak: () => Promise.resolve(),
  rewardedBreak: () => Promise.resolve(false), // 광고가 없으니 보상 없음 → 게임에서 버튼 숨기기
};
