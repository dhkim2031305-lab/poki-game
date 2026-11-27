# 진행도 저장 · 영구 성장 + 보상형 광고 규칙 (출시팀 조사 · 2026-11-27)

> 요청: 팀장(사용자 결정 2026-11-27 "국가 금고" = 판 사이에 저장되는 영구 성장)
> 확인 방법: 출처 페이지를 직접 내려받아 원문 대조 (Claude). Gemini는 안 씀.

## ① 진행도 저장 규칙

| 사이트 | localStorage만으로 되나 | SDK 저장 | 저장 키 규칙 · 한도 | 근거 |
|---|---|---|---|---|
| **CrazyGames** | ❌ **안 돼요.** "You need to fully rely on the Data Module save (for both guest and logged-in users on CrazyGames) and avoid relying on local saves" | **Data 모듈 필수에 가까워요.** "Unless progress is not applicable for your game, we require you to implement one of these methods. Preferably you use the CrazyGames Data module". 사용법은 localStorage와 같아요: `CrazyGames.SDK.data.setItem/getItem/removeItem/clear`. 로그인 안 한 사람은 SDK가 알아서 localStorage에 두고, 로그인하면 계정으로 옮겨요. 대안은 "Automatic Progress Save"(로컬을 자동으로 클라우드에 올림, 인앱 결제 게임은 금지) | 한도 **1MB** ("The data won't be backed up anymore if it exceeds 1MB"). 저장은 1초~30초 몰아서 해요. **제출 화면에서 "Progress Save" 토글을 켜야** 해요 ("The data module will be disabled otherwise") · 키 이름 규칙은 없음 | [C7] [C8] |
| **Poki** (참고, 대상 아님) | ✅ 돼요. 로그인 사용자는 SDK가 **localStorage·IndexedDB를 자동으로 클라우드에 동기화**해요 ("no extra SDK calls or setup are required") | 따로 없음 (자동) | 클라우드에 안 올릴 키는 **`poki_ignore`로 시작**. 한도 **1MB**(gzip 후). 시크릿 모드에선 localStorage가 막히니 **try/catch로 감싸기** 필수. "implement progress saving where appropriate, or clearly inform players when progress won't be saved" | [P8] [P2] |
| **GameDistribution** | 규칙 없음 → localStorage로 해요 | 저장용 SDK 기능은 **확인 안 됨** (SDK 위키·가이드에 저장 항목 없음) | 확인 안 됨. GD는 여러 제휴 사이트 주소에서 게임이 열려서, 다른 사이트에서 하면 진행도가 따로일 수 있어요 (추정 — 확인 안 됨) | [G1] [G4] |
| **itch.io** | 규칙 없음 → localStorage로 해요 | 없음 | 확인 안 됨 | [I1] |

### 그래서 개발은 [제안]
- 저장을 **한 곳(저장 함수 하나)**으로 모아요: CrazyGames 빌드는 `CrazyGames.SDK.data`, 나머지는 `localStorage`. 둘 다 같은 `getItem/setItem` 모양이라 갈아 끼우기 쉬워요.
- 키는 게임 이름을 앞에 붙여요 (예: `awwotss.vault.v1`). 같은 주소의 다른 게임과 안 섞이고, 나중에 형식이 바뀌면 `v2`로 옮겨요.
- 저장 내용은 작게(숫자 몇 개, JSON 하나) — 1MB 한도보다 훨씬 작게.
- 모든 저장·읽기는 **try/catch** (시크릿 모드·저장 막힘에도 게임은 돌아가야 해요).
- CrazyGames 제출 때 **"Progress Save" 토글 켜기** → `release-log.md` 체크리스트에 추가.

## ② 영구 성장 + 보상형 광고 ("결과 2배", "카드 다시 뽑기")

| 사이트 | 허용? | 조건 (원문) |
|---|---|---|
| CrazyGames | ✅ 보상 종류로는 괜찮아요 | "occasionally give the user the option to watch a rewarded ad that gives them a cool bonus" · 금지: "Poorly designed levels that can only be completed by a rewarded ad" · "Do not offer a rewarded ad too often" · 보상은 `adFinished`에서만, 광고 연달아 금지 [C6] |
| Poki (참고) | ✅ 예시에 그대로 있어요 | 보상형 종류: "revives, level skips, hints, stat boost, speed-ups, or a special ability" · "Multipliers on earnings" · 규칙: "The natural, non-rewarded option always sits in the primary position" · "Rewarded videos are an optional extra, never a gate" [P9] [P7] |
| GameDistribution | ✅ 보상형은 선택 기능 | "users can only be given a reward when an impression is completed" · 개발자 패널에서 rewarded 체크 [G1] [G4] |
| AdMob (앱) | ✅ | 미리 알리기: "clear, accurate and conspicuous disclosure of the action(s) required and reward(s) offered prior to each instance" · 고를 때만, 안 봐도 정상 이용 · **무작위 보상**("카드 다시 뽑기"가 무작위면): "Random rewards are allowed, provided that: The chance of random rewards is disclosed to the user prior to Rewarded Ads being presented" · "The chance for receiving a reward must be greater than 0" [AM6] |

### 우리 설계에 주의할 점
- **"결과 2배"**: 광고 없는 기본 버튼("받기")이 **같은 크기 이상, 위나 앞자리**에 있어야 해요 (Poki 원칙, CrazyGames도 "optional").
- **"카드 다시 뽑기"**: 뽑기가 무작위면 앱(AdMob)에선 **확률을 광고 전에 보여 줘야** 해요. 웹 사이트 쪽은 확률 공개 조항은 확인 안 됨.
- **영구 성장이 광고로만 빨라지는 구조**는 괜찮지만, **광고 없이는 영구 성장을 못 얻는 구조**면 "never a gate"·"only be completed by a rewarded ad"에 걸려요 → 광고 없이도 금고는 쌓여야 해요.
- 파산 이어하기(무제한) + 결과 2배 + 다시 뽑기까지 한 판에 보상형 버튼이 많아지면 CrazyGames "too often"에 더 가까워져요 → 한 화면에 보상형 버튼 1개 [제안].

## ③ Gemini가 말한 것 사실 확인

| 말 | 사실? | 원문 |
|---|---|---|
| "Poki 보상형 버튼 초록색 금지" | ✅ **사실** | "rewarded buttons cannot use green color; all reward buttons include prominent 🎬 icons" [P2] |
| "Poki 초기 다운로드 8MB 권장" | ⚠️ **반만 맞아요.** 숫자가 달라요 | "for a good web game the initial download should not exceed **5MB** and **8MB in total**" [P10] → 첫 다운로드 **5MB**, 전체 **8MB**. 이건 엔진 고르기 안내 글의 권장이고, 품질 요구사항(P2)에는 "Small file size… loading takes more than 10 seconds"만 있고 MB 숫자는 없어요. (Poki는 대상 사이트가 아니에요. 참고로 지금 ZIP은 약 9.4MB) |

## 출처 (모두 2026-11-27 확인)
- **C6** https://docs.crazygames.com/requirements/ads/
- **C7** https://docs.crazygames.com/sdk/data/
- **C8** https://docs.crazygames.com/requirements/account-integration/ ("Progress save")
- **P2** https://developers.poki.com/guide/requirements-quality
- **P7** https://developers.poki.com/guide/how-monetization-works
- **P8** https://developers.poki.com/guide/accounts ("Cloud gamesaves")
- **P9** https://developers.poki.com/guide/monetization
- **P10** https://developers.poki.com/guide/web-engine
- **G1** https://static.gamedistribution.com/developer/developers-guidelines.html
- **G4** https://github.com/GameDistribution/GD-HTML5/wiki
- **I1** https://itch.io/docs/creators/html5
- **AM6** https://support.google.com/admob/answer/7313578
