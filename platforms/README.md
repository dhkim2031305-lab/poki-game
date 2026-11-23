# 플랫폼 어댑터

모든 어댑터는 똑같은 `window.Platform` 함수를 제공해요. 게임 코드(`src/game.js`)는 이것만 불러요.

| 함수 | 뜻 |
|---|---|
| `init()` | SDK 초기화 (Promise) |
| `loadingFinished()` | 로딩 끝 알림 |
| `gameplayStart()` / `gameplayStop()` | 플레이 시작/멈춤 알림 |
| `commercialBreak(onStart)` | 판 사이 광고. onStart에서 소리 끄기. 끝나면 resolve |
| `rewardedBreak(onStart)` | 보상형 광고. 끝까지 보면 true |
| `name` | 플랫폼 이름 문자열 |

SDK가 막히거나 실패해도 게임은 계속 돼야 해요 → 모든 함수는 실패 시 조용히 넘어가요.
새 사이트 추가: 이 폴더에 `사이트.js` 만들고 `tools/platforms.js`에 한 줄 등록.
