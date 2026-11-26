# 사이트별 전체화면·화면 방향 규칙

> 확인 날짜: 2026-11-25 (2026-11-26 GDD 0-16에 맞춰 정리) · 출처 페이지를 직접 내려받아 원문 대조 (Claude). Gemini는 안 씀.

## 사이트별

| 사이트 | 게임이 직접 전체화면 버튼·requestFullscreen | 사이트가 주는 전체화면 | 가로 고정 규칙 | 출처 |
|---|---|---|---|---|
| **CrazyGames** | ❌ **금지**: "Custom in-game fullscreen buttons are prohibited, as they can interfere with other features (e.g. monetization)." | ✅ "Fullscreen mode is automatically provided by CrazyGames." 앱에서는 전체화면으로 열리고, 안전 영역(노치)을 고려해야 해요 | 제출할 때 방향을 고르면 사이트가 "기기를 돌리세요"를 띄워요. "you don't need to implement any orientation lock" | [C1] gameplay · [C3] technical |
| **GameDistribution** | 금지 조항은 없음. 단 "Please avoid the use of the Unity WebGL logo accompanied by a fullscreen option. This can cause scaling and advertisement issues in fullscreen mode." | 확인 안 됨. "Fullscreen and iframe modes should avoid any cuts or malfunctions" → 전체화면에서 잘림 없이 맞춰져야 해요 | "Games with a preferred orientation should lock the user in that orientation or include a screen to instruct the user to turn the device." → **게임이 직접** 고정하거나 "돌리세요" 화면을 넣어야 해요 | [G1] 3.3 · 3.4 |
| **itch.io** | 금지 조항 없음 (엔진이 버튼을 안 주면 itch.io가 만들어 준다고 해요) | ✅ "We can automatically generate a fullscreen button for your project" · 폰에서는 "Mobile Friendly"를 켜면 **항상 전체화면으로 실행** | 폰에서는 "lock orientation based on the dimension of the game" (2017 공지) → 임베드 크기를 가로로 설정 | [I1] html5 · [I5] |
| Poki (참고, 대상 아님) | 확인 안 됨 | 게임마다 Poki가 정해요: "fullscreen won't be enabled" (멀티플레이·오픈월드·숨은그림 위주). "No action needed on your side" | 모바일에서 세로나 가로, 둘 다 중 하나로 화면을 꽉 채우기 | [P5] your-game-page · [P2] |

## 아이폰·안드로이드 브라우저 (MDN 호환성 데이터 8.1.10, 2026-11-19판)

| 기능 | 아이폰 사파리 | 안드로이드 크롬 | 뜻 |
|---|---|---|---|
| 요소 전체화면 `requestFullscreen` | ❌ **아이폰은 안 돼요.** "Only available on iPad, not on iPhone." 아이패드도 "Swiping down exits fullscreen mode, making it unsuitable for some use cases like games." | ✅ 71부터 | **아이폰에선 게임 안 전체화면 버튼이 동작하지 않아요** |
| 화면 방향 고정 `screen.orientation.lock` | ❌ 지원 안 함 | ✅ 38부터 (전체화면일 때) | 아이폰은 "돌리세요" 화면이 유일한 방법 |
| 홈 화면에 추가 (`display` 매니페스트) | `standalone`만 됨 (11.3부터), `fullscreen` 값은 안 됨 | 됨 | 아이폰은 주소창 없이 열 수 있지만 상태 표시줄은 남아요. 단, 게임 사이트에서는 **사이트 페이지**가 추가되는 거라 우리가 정할 수 없어요 |

출처: https://developer.mozilla.org/docs/Web/API/Element/requestFullscreen · https://developer.mozilla.org/docs/Web/API/ScreenOrientation/lock · https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/display (데이터: npm `@mdn/browser-compat-data` 8.1.10)

## 그래서 우리 게임은 — GDD 0-16 답

> **사용자 결정 (2026-11-26): "아니 놔둬"** → 우리 전체화면 버튼은 **넣지 않아요**(지금 코드처럼). 전체화면은 각 사이트가 주는 걸 써요. 아래 표는 참고로 남겨요.

| 빌드 | 우리 전체화면 버튼 | 이유 |
|---|---|---|
| `crazygames` | **숨김** | 게임 안 버튼 금지. 사이트가 전체화면을 줘요 |
| `gamedistribution` | **숨김** [제안] | 금지는 아니지만 "scaling and advertisement issues in fullscreen mode" 경고가 있어요. 사이트 틀에 맡기는 게 안전해요 |
| `web` (itch.io) | **숨김** [제안] | itch.io가 버튼을 만들어 주고, 폰에서는 Mobile Friendly면 항상 전체화면이에요 |
| `web` (우리가 직접 여는 주소, 앱 포장 전 시험용) | 안드로이드만 **보임** | 크롬은 `requestFullscreen` + 가로 고정 가능 |
| 아이폰 (모든 빌드) | **숨김**, "홈 화면에 추가" 안내는 우리 주소에서만 | 아이폰은 요소 전체화면이 안 되고 방향 고정도 안 돼요. 게임 사이트에서 홈 화면에 추가하면 **사이트 페이지**가 추가돼요 |

- **"기기를 가로로 돌리세요" 화면은 모든 빌드에 넣어요** (GD 필수, 아이폰은 방향 고정 불가). CrazyGames는 사이트도 띄우지만 겹쳐도 문제없어요.
- 화면 크기가 바뀌면(주소창이 숨거나 나타날 때) 캔버스를 다시 맞추고, 노치(안전 영역)를 피해 버튼을 둬요.
- 휴대폰 앱(`app-stores.md`)으로 내면 앱이 처음부터 전체화면이라 이 문제가 없어요.

## 함께 찾은 새 위험

- GameDistribution 가이드 4.1: **"the default game language should always be English."** 우리는 "기본은 고른 나라 언어"예요. 시작 화면(나라 고르기 전)을 영어로 보여 주면 맞출 수 있을지 기획팀 확인이 필요해요. [G1] 4.1
- (확인 완료) 앞서 직접 대조하지 못했던 GD "Political bias" 문구를 원문에서 확인했어요: "Games are prohibited from including Political bias or offensive religious content". [G1]
